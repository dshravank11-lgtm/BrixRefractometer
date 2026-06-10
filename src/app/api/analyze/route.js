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

        let gradeBadge;
        if (brix <= 1.0) {
            gradeBadge = "### 🟢 NUTRI-GRADE A (Excellent, Low Sugar)";
        } else if (brix <= 5.0) {
            gradeBadge = "### 🟡 NUTRI-GRADE B (Moderate)";
        } else if (brix <= 10.0) {
            gradeBadge = "### 🟠 NUTRI-GRADE C (High Sugar)";
        } else {
            gradeBadge = "### 🔴 NUTRI-GRADE D (Very High Sugar)";
        }

        const systemPrompt = `You are a precision laboratory analyzer. Return ONLY the structured report below — no preamble, no closing remarks, no markdown code fences.

Use exactly this format, substituting the bracketed placeholders with calculated values:

${gradeBadge}

### 📊 Physical Fluid Dynamics
* Refraction Turning Angle: [angle]°
* Refractive Index (n): [n = sin((60 + angle)/2 * π/180) / sin(30 * π/180)]
* Approximated Specific Gravity: [value]

### 🧪 Chemical Concentration
* Solute Concentration: [brix]%
* Estimated Caloric Load: [brix * 3.87 rounded to 1 decimal] kcal per 100 ml
* Composition Class: [one of: Pure Water | Light Juice | Medium Juice | Nectar | Light Syrup | Heavy Syrup]

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
                temperature: 0.1,
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

        return NextResponse.json({ analysis: polishedAnalysis });

    } catch (error) {
        return NextResponse.json({ error: `Internal Server Pipeline Exception: ${error.message}` }, { status: 500 });
    }
}