import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { angle, brix } = await request.json();

        if (angle === undefined || brix === undefined) {
            return NextResponse.json({ error: "Missing required calibration dataset values." }, { status: 400 });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key missing." }, { status: 500 });
        }


        const angleRadians = angle * Math.PI / 180;

        const D = 50;
        const lengthCm = Math.abs(D * Math.tan(angleRadians)).toFixed(2);

        const refractiveIndex = (Math.sin(((60 + angle) / 2) * Math.PI / 180) / Math.sin(30 * Math.PI / 180)).toFixed(4);
        let brixFromRI = ((parseFloat(refractiveIndex) - 1.3330) / 0.00192);
        brixFromRI = Math.min(100, Math.max(0, brixFromRI));
        const derivedBrix = parseFloat(brixFromRI.toFixed(2));
        const specificGravity = (1 + derivedBrix * 0.004).toFixed(4);

        let gradeBadge;
        if (derivedBrix <= 1.0) {
            gradeBadge = "### 🟢 NUTRI-GRADE A (Excellent, Low Sugar)";
        } else if (derivedBrix <= 5.0) {
            gradeBadge = "### 🟡 NUTRI-GRADE B (Moderate)";
        } else if (derivedBrix <= 10.0) {
            gradeBadge = "### 🟠 NUTRI-GRADE C (High Sugar)";
        } else {
            gradeBadge = "### 🔴 NUTRI-GRADE D (Very High Sugar)";
        }

        const systemPrompt = `You are a precision laboratory analyzer. Return ONLY the structured report below — no preamble, no closing remarks, no markdown code fences.

Use exactly this format, substituting the bracketed placeholders with calculated values:

${gradeBadge}

### 📊 Physical Fluid Dynamics

* Refraction Turning Angle: [angle]°
* Length Displacement: [lengthCm] cm
* Refractive Index (n): [n = sin((60 + angle)/2 * π/180) / sin(30 * π/180)]
* Brix (derived from RI): [brixFromRI]%
* Approximated Specific Gravity: [value]

### 🧪 Chemical Concentration

* Solute Concentration: [brix]%
* Estimated Caloric Load: [brix * 3.87 rounded to 1 decimal] kcal per 100 ml
* Composition Class: [one of: Pure Water | Light Juice | Medium Juice | Nectar | Light Syrup | Heavy Syrup]

### 🗓️ Intake Frequency Guidance

* Maximum Daily Intake: [value] times per day
* Maximum Weekly Intake: [value] times per week

Rules:
- All numeric values to 2 decimal places unless specified otherwise.
- Specific Gravity ≈ 1 + (brix * 0.004) as a working approximation.
- Do not add any text outside the four sections above.`;

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `Sample metrics: Refraction Angle = ${angle.toFixed(2)}°, Brix = ${brix.toFixed(2)}%.`
                    }
                ],

                max_tokens: 600
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            return NextResponse.json({ error: `DeepSeek Gateway Error: ${errorData}` }, { status: response.status });
        }

        const data = await response.json();
        const rawText = data.choices[0].message.content;

        const polishedAnalysis = rawText
            .replace(/```[a-z]*/gi, '')
            .replace(/```/g, '')
            .trim();


        return NextResponse.json({
            analysis: polishedAnalysis,
            metrics: {
                angle: parseFloat(angle.toFixed(2)),
                lengthCm: parseFloat(lengthCm),
                refractiveIndex: parseFloat(refractiveIndex)
            }
        });

    } catch (error) {
        return NextResponse.json({ error: `Internal Server Pipeline Exception: ${error.message}` }, { status: 500 });
    }
}