import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const {
            angle,
            brix,
            lengthCm,
            refractiveIndex
        } = await request.json();

        if (angle === undefined || brix === undefined) {
            return NextResponse.json({ error: "Missing required measurement values." }, { status: 400 });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key missing." }, { status: 500 });
        }

        const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

        const systemPrompt = [
            'You are a world-class analytical chemist and optical physicist acting as a verification engine for a DIY laser Brix refractometer.',
            '',
            'PROJECT CONTEXT:',
            '- The device is a DIY Brix refractometer using a laser and a 60\u00B0 glass equilateral prism.',
            '- A laser beam passes through a liquid sample placed against the prism. The emergent beam is deviated by an angle \u03B8_d due to refraction by the liquid.',
            '- The deviated laser dot lands on a projection screen, tracked by a smartphone camera.',
            '- Displacement (in pixels) is converted to mm using the device\'s calibrated mm/pixel ratio.',
            '- Angle of deviation: tan(\u03B8_d) = displacement_mm / prism_to_screen_distance_mm',
            '- Refractive index: n = sin((60\u00B0 + \u03B8_d) / 2) / sin(30\u00B0), via Snell\'s law at minimum deviation',
            '- Brix estimation: n \u2248 1.33299 + 0.00192\u00B7Bx + 0.0000004\u00B7Bx\u00B2  (quadratic calibration)',
            '- Pure water has n \u2248 1.3330 and 0 \u00B0Bx. Liquids measured are typically aqueous solutions.',
            '- Possible error sources: camera parallax, pixel threshold sensitivity, prism alignment, screen flatness.',
            '',
            'IMPORTANT: The provided measurements are RAW and UNVERIFIED. They may contain significant errors.',
            'Cross-check with physics and known liquid databases, and OUTPUT VERIFIED VALUES with your best scientific judgment.',
            '',
            'Your response must follow EXACTLY this format \u2014 no preamble, no code fences:',
            '',
            '### VERIFIED MEASUREMENTS',
            '* Verified Length: [value] cm',
            '* Verified Refractive Index: [value]',
            '* Verified Brix: [value] \u00B0Bx',
            '',
            '### \uD83C\uDFC5 NUTRI-GRADE STATUS: [A/B/C/D] \u2014 GRADE [A/B/C/D]',
            '',
            '### \uD83E\uDDEA Identified Liquid',
            '* [Specific liquid or beverage name]',
            '',
            '### \uD83D\uDCCA Confidence',
            '* [High / Medium / Low] \u2014 [one-line reasoning]',
            '',
            '### \uD83E\uDD64 Composition',
            '* Key components and estimated breakdown',
            '',
            '### \uD83D\uDCA1 Notes',
            '* One-liner practical takeaway or nutritional note',
            '',
            '### \u26A0\uFE0F Measurement Verification Notes',
            '* [Brief explanation of why raw values were accepted or corrected, referencing physics/optics]',
            '',
            'Rules:',
            '- NUTRI-GRADE uses Singapore\'s sugar grading: A (\u22641g/100ml), B (>1\u20135g/100ml), C (>5\u201310g/100ml), D (>10g/100ml). Base grade on VERIFIED Brix (1 \u00B0Bx \u2248 1g sugar/100ml).',
            '- Refractive index for aqueous liquids must be \u2265 1.3330. If reported n < 1.3330, flag and correct it.',
            '- Be specific \u2014 pick the single most likely liquid.',
            '- Keep each section short and precise.'
        ].join('\n');

        const userTextContent = 'Raw optical measurements from DIY laser refractometer:\n' +
            '- Refraction Angle (\u03B8_d): ' + angle.toFixed(4) + '\u00B0\n' +
            '- Displacement (Length): ' + (lengthCm !== undefined && lengthCm !== null ? lengthCm.toFixed(4) + ' cm' : 'N/A') + '\n' +
            '- Raw Refractive Index (n): ' + (refractiveIndex !== undefined && refractiveIndex !== null ? refractiveIndex.toFixed(6) : 'N/A') + '\n' +
            '- Raw Brix: ' + brix.toFixed(4) + ' \u00B0Bx\n' +
            '\n' +
            'Please verify these measurements and determine the liquid based on the physics and optics principles provided.';

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userTextContent }
                ],
                max_tokens: 1200
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            return NextResponse.json({ error: `DeepSeek Gateway Error: ${errorData}` }, { status: response.status });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return NextResponse.json({ error: 'Unexpected response format from DeepSeek API.' }, { status: 500 });
        }

        const rawText = data.choices[0].message.content;
        const polished = rawText.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim();
        const parsed = parseAnalysisText(polished);

        return NextResponse.json({
            analysis: parsed.fullText,
            verified: parsed.verified,
            metrics: {
                angle: parseFloat(angle.toFixed(4)),
                lengthCm: lengthCm != null ? parseFloat(lengthCm) : null,
                refractiveIndex: refractiveIndex != null ? parseFloat(refractiveIndex) : null
            }
        });

    } catch (error) {
        return NextResponse.json({ error: `Internal Server Pipeline Exception: ${error.message}` }, { status: 500 });
    }
}

function parseAnalysisText(text) {
    const verified = {
        length: null,
        refractiveIndex: null,
        brix: null
    };

    const lenMatch = text.match(/Verified\s+Length\s*:\s*([\d.]+)/i);
    if (lenMatch) verified.length = parseFloat(lenMatch[1]);

    const riMatch = text.match(/Verified\s+Refractive\s+Index\s*:\s*([\d.]+)/i);
    if (riMatch) verified.refractiveIndex = parseFloat(riMatch[1]);

    const brixMatch = text.match(/Verified\s+Brix\s*:\s*([\d.]+)/i);
    if (brixMatch) verified.brix = parseFloat(brixMatch[1]);

    return { verified, fullText: text };
}
