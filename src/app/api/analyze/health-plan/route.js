import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { gender, weight, height, age, activity, goal, bmi, bmiLabel, bmr, tdee } = await request.json();

        if (!gender || !weight || !height || !age || !activity || !goal) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server Configuration Error: API key is missing." }, { status: 500 });
        }

        const safeTdee = (tdee != null && !isNaN(tdee)) ? tdee : 2000;

        let calorieTarget;
        let calorieNote;
        if (goal === 'Lose weight') {
            calorieTarget = Math.round(safeTdee - 500);
            calorieNote = `${calorieTarget} kcal/day (500 kcal deficit from TDEE of ${safeTdee})`;
        } else if (goal === 'Build muscle') {
            calorieTarget = Math.round(safeTdee + 300);
            calorieNote = `${calorieTarget} kcal/day (300 kcal surplus from TDEE of ${safeTdee})`;
        } else {
            calorieTarget = safeTdee;
            calorieNote = `${calorieTarget} kcal/day (maintenance)`;
        }

        const systemPrompt = `You are a certified sports nutritionist and personal trainer. Return ONLY the structured health plan below — no preamble, no closing remarks, no markdown code fences, no disclaimers.

Use exactly this format, filling in the bracketed placeholders with specific, actionable values tailored to the user's metrics:

### 📊 Metabolic Profile
* BMI: ${bmi} (${bmiLabel})
* Basal Metabolic Rate: ${bmr} kcal/day
* Total Daily Energy Expenditure: ${tdee} kcal/day
* Daily Calorie Target: ${calorieNote}

### 🥗 Nutrition
* Protein target: [X g/day — calculate as bodyweight × multiplier appropriate for goal]
* Carbohydrates: [X g/day]
* Fats: [X g/day]
* Hydration: [X litres/day — adjust for weight and activity]
* Meal timing: [brief recommendation, e.g. 3 main meals + 1–2 snacks]

### 🏃 Weekly Training Plan
* [Day 1 – Day type]: [Specific workout, duration, intensity]
* [Day 2 – Day type]: [Specific workout, duration, intensity]
* [Day 3 – Day type]: [Rest or active recovery detail]
* [Day 4 – Day type]: [Specific workout]
* [Day 5 – Day type]: [Specific workout]
* [Day 6 – Day type]: [Specific workout or light activity]
* [Day 7 – Day type]: [Rest]

### 🛌 Recovery & Lifestyle
* Sleep: [X–X hours/night recommendation]
* Stress management: [1 specific practical tip]
* Key supplement (optional): [only if genuinely relevant — otherwise state "None required"]

### 📅 12-Week Milestone
* Week 4: [Realistic, measurable checkpoint]
* Week 8: [Realistic, measurable checkpoint]
* Week 12: [Realistic, measurable end-goal]

Rules:
- All numbers must be specific integers or simple decimals — no vague ranges like "X–Y g" for targets, pick the midpoint.
- Training plan must be tailored to the activity level: sedentary users start with 3 sessions/week, very active users can handle 6.
- Do not add any text outside the five sections above.`;

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
                        content: `Client profile: ${gender}, ${age} years old, ${weight} kg, ${height} cm tall. Activity level: ${activity}. Primary goal: ${goal}.`
                    }
                ],
                max_tokens: 900
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

        const plan = rawText
            .replace(/```[a-z]*/gi, '')
            .replace(/```/g, '')
            .trim();

        return NextResponse.json({ plan });

    } catch (error) {
        return NextResponse.json({ error: `Internal Server Exception: ${error.message}` }, { status: 500 });
    }
}
