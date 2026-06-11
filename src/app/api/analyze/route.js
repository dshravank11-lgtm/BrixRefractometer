import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const {
            angle,
            brix,
            lengthCm,
            refractiveIndex,
            measurementImageBase64,
            calibrationImageBase64
        } = await request.json();

        if (angle === undefined || brix === undefined) {
            return NextResponse.json({ error: "Missing required measurement values." }, { status: 400 });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key missing." }, { status: 500 });
        }

        // ── Project context ──────────────────────────────────────────────────
        // This is a DIY Brix Refractometer built using a laser and prism.
        // The laser passes through a liquid sample held against a 60° glass prism.
        // The deviated laser dot is tracked on a screen via a smartphone camera.
        // The angle of deviation (θ_d) is computed from:
        //   tan(θ_d) = displacement_mm / prism_to_screen_distance_mm
        // The refractive index (n) is derived by Snell's law at minimum deviation:
        //   n = sin((A + θ_d) / 2) / sin(A / 2), where A = 60° (prism apex angle)
        // Brix (°Bx) is estimated from n using a quadratic calibration curve:
        //   n ≈ 1.33299 + 0.00192·Bx + 0.0000004·Bx²
        // Displacement is measured in pixels via the camera canvas, converted to mm
        // using the device's FOV and known distance. The measurements may contain
        // systematic or random errors from: camera distortion, prism alignment,
        // screen reflection, threshold sensitivity, or parallax.

        const systemPrompt = `You are a world-class analytical chemist and optical physicist acting as a verification engine for a DIY laser Brix refractometer.

PROJECT CONTEXT:
- The device is a DIY Brix refractometer using a laser and a 60° glass equilateral prism.
- A laser beam passes through a liquid sample placed against the prism. The emergent beam is deviated by an angle θ_d due to refraction by the liquid.
- The deviated laser dot lands on a projection screen, tracked by a smartphone camera.
- Displacement (in pixels) is converted to mm using the device's calibrated mm/pixel ratio.
- Angle of deviation: tan(θ_d) = displacement_mm / prism_to_screen_distance_mm
- Refractive index: n = sin((60° + θ_d) / 2) / sin(30°), via Snell's law at minimum deviation
- Brix estimation: n ≈ 1.33299 + 0.00192·Bx + 0.0000004·Bx²  (quadratic calibration)
- Pure water has n ≈ 1.3330 and 0 °Bx. Liquids measured are typically aqueous solutions.
- Possible error sources: camera parallax, pixel threshold sensitivity, prism alignment, screen flatness.

IMPORTANT: The provided measurements are RAW and UNVERIFIED. They may contain significant errors.
You must examine the camera image(s) provided (if any), cross-check with physics and known liquid databases, and OUTPUT VERIFIED VALUES with your best scientific judgment.

Your response must follow EXACTLY this format — no preamble, no code fences:

### VERIFIED MEASUREMENTS
* Verified Length: [value] cm
* Verified Refractive Index: [value]
* Verified Brix: [value] °Bx

### 🏅 NUTRI-GRADE STATUS: [A/B/C/D] — GRADE [A/B/C/D]

### 🧪 Identified Liquid
* [Specific liquid or beverage name]

### 📊 Confidence
* [High / Medium / Low] — [one-line reasoning]

### 🥤 Composition
* Key components and estimated breakdown

### 💡 Notes
* One-liner practical takeaway or nutritional note

### ⚠️ Measurement Verification Notes
* [Brief explanation of why raw values were accepted or corrected, referencing physics/optics]

Rules:
- NUTRI-GRADE uses Singapore's sugar grading: A (≤1g/100ml), B (>1–5g/100ml), C (>5–10g/100ml), D (>10g/100ml). Base grade on VERIFIED Brix (1 °Bx ≈ 1g sugar/100ml).
- Refractive index for aqueous liquids must be ≥ 1.3330. If reported n < 1.3330, flag and correct it.
- Be specific — pick the single most likely liquid.
- Keep each section short and precise.`;

        // ── Build message content with optional images ────────────────────────
        const userTextContent = `Raw optical measurements from DIY laser refractometer:
- Refraction Angle (θ_d): ${angle.toFixed(4)}°
- Displacement (Length): ${lengthCm !== undefined && lengthCm !== null ? lengthCm.toFixed(4) + ' cm' : 'N/A'}
- Raw Refractive Index (n): ${refractiveIndex !== undefined && refractiveIndex !== null ? refractiveIndex.toFixed(6) : 'N/A'}
- Raw Brix: ${brix.toFixed(4)} °Bx

Please verify these measurements and determine the liquid. Use the images below to corroborate or correct the raw readings.`;

        const userContentParts = [
            { type: "text", text: userTextContent }
        ];

        // Attach calibration (zero) snapshot if available
        if (calibrationImageBase64) {
            userContentParts.push({
                type: "text",
                text: "Image 1 — Calibration/Zero frame (laser position with pure water or zero reference):"
            });
            userContentParts.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${calibrationImageBase64}` }
            });
        }

        // Attach measurement snapshot if available
        if (measurementImageBase64) {
            userContentParts.push({
                type: "text",
                text: "Image 2 — Measurement frame (laser position with sample liquid):"
            });
            userContentParts.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${measurementImageBase64}` }
            });
        }

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-v4-flash",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContentParts }
                ],
                max_tokens: 1200
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            // If vision not supported, retry with text only
            if (response.status === 400 && (measurementImageBase64 || calibrationImageBase64)) {
                const textOnlyResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-v4-flash",
                        messages: [
                            { role: "system", content: systemPrompt },
                            {
                                role: "user",
                                content: userTextContent + "\n\n[Note: Camera images were captured but could not be transmitted to this model — analysis is based on numeric measurements only.]"
                            }
                        ],
                        max_tokens: 1200
                    })
                });
                if (!textOnlyResponse.ok) {
                    const textErrData = await textOnlyResponse.text();
                    return NextResponse.json({ error: `DeepSeek Error: ${textErrData}` }, { status: textOnlyResponse.status });
                }
                const textData = await textOnlyResponse.json();
                const rawText = textData.choices[0].message.content;
                const parsed = parseAnalysisText(rawText.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim());
                return NextResponse.json({ analysis: parsed.fullText, verified: parsed.verified, visionUsed: false });
            }
            return NextResponse.json({ error: `DeepSeek Gateway Error: ${errorData}` }, { status: response.status });
        }

        const data = await response.json();
        const rawText = data.choices[0].message.content;
        const polished = rawText.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim();
        const parsed = parseAnalysisText(polished);

        return NextResponse.json({
            analysis: parsed.fullText,
            verified: parsed.verified,
            visionUsed: !!(measurementImageBase64 || calibrationImageBase64),
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

/**
 * Extracts verified measurement values from the model's structured response.
 * Returns { verified: { length, refractiveIndex, brix }, fullText }
 */
function parseAnalysisText(text) {
    const verified = {
        length: null,
        refractiveIndex: null,
        brix: null
    };

    // Extract: "* Verified Length: X.XX cm"
    const lenMatch = text.match(/Verified\s+Length\s*:\s*([\d.]+)/i);
    if (lenMatch) verified.length = parseFloat(lenMatch[1]);

    // Extract: "* Verified Refractive Index: X.XXXX"
    const riMatch = text.match(/Verified\s+Refractive\s+Index\s*:\s*([\d.]+)/i);
    if (riMatch) verified.refractiveIndex = parseFloat(riMatch[1]);

    // Extract: "* Verified Brix: X.X °Bx"
    const brixMatch = text.match(/Verified\s+Brix\s*:\s*([\d.]+)/i);
    if (brixMatch) verified.brix = parseFloat(brixMatch[1]);

    return { verified, fullText: text };
}
