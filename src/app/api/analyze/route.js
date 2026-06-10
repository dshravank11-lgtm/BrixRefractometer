import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { angle, brix } = await request.json();
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Server Configuration Error: API key missing." }, { status: 500 });
        }

        const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an analytical laboratory AI. The user has calculated the sugar concentration of an unknown fluid using an optical laser refractometer. Provide a 3-point bulleted analysis: 1. Confirm the Brix percentage. 2. Provide a likely commercial drink equivalent (e.g., Coke, pure water, fruit juice) that matches this sugar density. 3. Assign the official Singapore Nutri-Grade (A: <=1%, B: 1-5%, C: 5-10%, D: >10%)."
                    },
                    {
                        role: "user",
                        content: `DATASET:\n- Tracked Minimum Angle: ${Number(angle).toFixed(2)}°\n- Fluid Density: ${Number(brix).toFixed(2)}% Brix`
                    }
                ],
                temperature: 0.1
            })
        });

        const data = await deepseekResponse.json();
        return NextResponse.json({ analysis: data.choices[0].message.content });

    } catch (error) {
        return NextResponse.json({ error: `Serverless breakdown: ${error.message}` }, { status: 500 });
    }
}