'use client';
import React, { useState } from 'react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,300&family=IBM+Plex+Serif:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .hp-root {
    min-height: 100vh;
    background: #0b0b0c;
    font-family: 'IBM Plex Mono', monospace;
    color: #e8e4dc;
    padding: 40px 20px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hp-inner {
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
  }

  .hp-header {
    padding: 0 0 20px;
    border-bottom: 1px solid #2c2c30;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 0;
  }

  .hp-title {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #e8e4dc;
  }

  .hp-subtitle {
    font-size: 0.6rem;
    color: #9a9790;
    letter-spacing: 0.1em;
    margin-top: 4px;
    font-weight: 300;
  }

  .hp-section {
    padding: 32px 0;
    border-bottom: 1px solid #2c2c30;
    animation: hp-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes hp-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .hp-label {
    display: block;
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9a9790;
    margin-bottom: 14px;
    font-weight: 400;
  }

  .hp-input {
    font-family: 'IBM Plex Mono', monospace;
    background: #111113;
    border: 1px solid #2c2c30;
    border-radius: 0;
    color: #e8e4dc;
    padding: 16px 18px;
    font-size: 1.1rem;
    font-weight: 300;
    outline: none;
    width: 100%;
    transition: border-color 0.2s;
    letter-spacing: 0.05em;
    -moz-appearance: textfield;
  }

  .hp-input:focus { border-color: #b8955a; }
  .hp-input::-webkit-outer-spin-button,
  .hp-input::-webkit-inner-spin-button { -webkit-appearance: none; }

  .hp-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .hp-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .hp-field { display: flex; flex-direction: column; }
  .hp-field .hp-label { margin-bottom: 10px; }

  /* Gender / Activity toggle buttons */
  .hp-toggle-group {
    display: flex;
    gap: 0;
    border: 1px solid #2c2c30;
    margin-bottom: 20px;
  }

  .hp-toggle {
    font-family: 'IBM Plex Mono', monospace;
    flex: 1;
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: transparent;
    color: #9a9790;
    border: none;
    border-right: 1px solid #2c2c30;
    padding: 14px 10px;
    cursor: pointer;
    transition: all 0.18s;
    line-height: 1;
    font-weight: 400;
  }

  .hp-toggle:last-child { border-right: none; }

  .hp-toggle.active {
    background: #b8955a;
    color: #0b0b0c;
    font-weight: 500;
  }

  .hp-toggle:not(.active):hover { color: #e8e4dc; background: #1a1a1d; }

  .hp-btn-primary {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 500;
    background: #b8955a;
    color: #0b0b0c;
    border: none;
    padding: 18px 24px;
    cursor: pointer;
    width: 100%;
    transition: background 0.2s;
    border-radius: 0;
  }

  .hp-btn-primary:hover:not(:disabled) { background: #c9a86e; }
  .hp-btn-primary:disabled {
    background: #1f1f22;
    color: #4a4a4f;
    cursor: not-allowed;
  }

  .hp-btn-ghost {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.575rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: transparent;
    color: #9a9790;
    border: 1px solid #2c2c30;
    padding: 9px 16px;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 0;
    line-height: 1;
  }

  .hp-btn-ghost:hover { border-color: #9a9790; color: #e8e4dc; }

  /* Metric cards */
  .hp-vitals {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid #2c2c30;
    margin-bottom: 24px;
  }

  .hp-vital {
    padding: 20px 16px 16px;
    border-right: 1px solid #2c2c30;
  }

  .hp-vital:last-child { border-right: none; }

  .hp-vital-num {
    font-size: 1.9rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-top: 8px;
    color: #b8955a;
    font-variant-numeric: tabular-nums;
  }

  .hp-vital-unit {
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    color: #9a9790;
    margin-top: 6px;
    text-transform: uppercase;
  }

  .hp-rule {
    display: block;
    width: 22px;
    height: 1px;
    background: #b8955a;
    margin-top: 14px;
  }

  /* Analysis output */
  .hp-report-output {
    background: #111113;
    border: 1px solid #2c2c30;
    padding: 22px;
    min-height: 110px;
    font-family: 'IBM Plex Serif', serif;
    font-size: 0.85rem;
    font-weight: 300;
    line-height: 1.9;
    color: #c8c4bb;
  }

  .hp-report-empty {
    color: #706e6b;
    font-style: italic;
  }

  .hp-md-h3 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b8955a;
    margin: 20px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #2c2c3088;
  }

  .hp-md-h3:first-child { margin-top: 0; }

  .hp-md-bullet {
    display: flex;
    gap: 10px;
    margin: 4px 0;
    font-size: 0.83rem;
    color: #c8c4bb;
    line-height: 1.7;
  }

  .hp-md-bullet-dot {
    color: #b8955a;
    flex-shrink: 0;
    margin-top: 2px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
  }

  .hp-md-bullet-key {
    color: #e8e4dc;
    font-weight: 400;
  }

  .hp-md-para {
    margin: 6px 0;
    color: #c8c4bb;
    font-size: 0.83rem;
  }

  .hp-loading-row {
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #9a9790;
    padding: 6px 0;
  }

  .hp-spinner {
    width: 14px;
    height: 14px;
    border: 1px solid #2c2c30;
    border-top-color: #b8955a;
    border-radius: 50%;
    animation: hp-spin 0.75s linear infinite;
    flex-shrink: 0;
  }

  @keyframes hp-spin { to { transform: rotate(360deg); } }

  .hp-callout {
    border-left: 2px solid #b8955a;
    padding: 12px 18px;
    background: #111113;
    font-size: 0.72rem;
    color: #c8c4bb;
    line-height: 1.8;
    letter-spacing: 0.04em;
    margin-bottom: 24px;
    font-weight: 300;
  }

  .hp-error {
    border-left: 2px solid #8b3a3a;
    padding: 10px 16px;
    background: #111113;
    font-size: 0.65rem;
    color: #c47a7a;
    margin-bottom: 16px;
    letter-spacing: 0.06em;
  }

  @media (max-width: 520px) {
    .hp-vitals { grid-template-columns: 1fr 1fr; }
    .hp-vital:nth-child(2) { border-right: none; }
    .hp-vital:nth-child(3) { border-top: 1px solid #2c2c30; }
    .hp-row-3 { grid-template-columns: 1fr 1fr; }
    .hp-root { padding: 28px 16px 64px; }
    .hp-vital-num { font-size: 1.5rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hp-section { animation: none; }
    .hp-spinner { animation: none; }
  }
`;

function PlanOutput({ text, loading }) {
    if (loading) {
        return (
            <div className="hp-report-output">
                <div className="hp-loading-row">
                    <div className="hp-spinner" />
                    Generating plan
                </div>
            </div>
        );
    }

    if (!text) {
        return (
            <div className="hp-report-output">
                <span className="hp-report-empty">Fill in your details and generate your plan.</span>
            </div>
        );
    }

    const lines = text.split('\n');
    const elements = [];
    let key = 0;

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (/^###/.test(line)) {
            const clean = line.replace(/^#+\s*/, '');
            elements.push(<div key={key++} className="hp-md-h3">{clean}</div>);
            continue;
        }

        if (/^\*\s/.test(line)) {
            const content = line.replace(/^\*\s*/, '').replace(/\*\*/g, '');
            const colonIdx = content.indexOf(':');
            if (colonIdx !== -1) {
                elements.push(
                    <div key={key++} className="hp-md-bullet">
                        <span className="hp-md-bullet-dot">▸</span>
                        <span>
                            <span className="hp-md-bullet-key">{content.slice(0, colonIdx)}</span>
                            {content.slice(colonIdx)}
                        </span>
                    </div>
                );
            } else {
                elements.push(
                    <div key={key++} className="hp-md-bullet">
                        <span className="hp-md-bullet-dot">▸</span>
                        <span>{content}</span>
                    </div>
                );
            }
            continue;
        }

        elements.push(<div key={key++} className="hp-md-para">{line.replace(/\*\*/g, '')}</div>);
    }

    return <div className="hp-report-output">{elements}</div>;
}

function computeVitals(gender, weight, height, age, activity) {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    const bmi = w / ((h / 100) ** 2);

    let bmr = gender === 'male'
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;

    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9 };
    const tdee = bmr * (multipliers[activity] || 1.55);

    let bmiLabel = 'Underweight';
    if (bmi >= 18.5 && bmi < 25) bmiLabel = 'Healthy';
    else if (bmi >= 25 && bmi < 30) bmiLabel = 'Overweight';
    else if (bmi >= 30) bmiLabel = 'Obese';

    return {
        bmi: bmi.toFixed(1),
        bmiLabel,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
    };
}

const ACTIVITY_LABELS = {
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    active: 'Active',
    very: 'Very active',
};

export default function HealthPlanner() {
    const [gender, setGender] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [activity, setActivity] = useState('');
    const [goal, setGoal] = useState('');

    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [vitals, setVitals] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const valid = gender && weight && height && age && activity && goal
        && parseFloat(weight) > 0 && parseFloat(height) > 0 && parseFloat(age) > 0;

    const generate = async () => {
        if (!valid) return;
        setError('');
        const v = computeVitals(gender, weight, height, age, activity);
        setVitals(v);
        setSubmitted(true);
        setLoading(true);
        setPlan('');

        try {
            const res = await fetch('/api/health-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gender, weight, height, age, activity, goal, ...v }),
            });
            const data = await res.json();
            if (data.error) setError(data.error);
            else setPlan(data.plan || '');
        } catch (err) {
            setError(`Connection error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSubmitted(false);
        setPlan('');
        setVitals(null);
        setError('');
        setGender('');
        setWeight('');
        setHeight('');
        setAge('');
        setActivity('');
        setGoal('');
    };

    return (
        <main className="hp-root">
            <style>{STYLES}</style>
            <div className="hp-inner">

                <header className="hp-header">
                    <div>
                        <div className="hp-title">Health Planner</div>
                        <div className="hp-subtitle">BMI · TDEE · Personalised daily plan</div>
                    </div>
                    {submitted && (
                        <button className="hp-btn-ghost" onClick={reset}>Reset</button>
                    )}
                </header>

                {/* ── Input form ── */}
                {!submitted && (
                    <>
                        <section className="hp-section">
                            <span className="hp-label">Biological sex</span>
                            <div className="hp-toggle-group">
                                {['male', 'female'].map(g => (
                                    <button
                                        key={g}
                                        className={`hp-toggle ${gender === g ? 'active' : ''}`}
                                        onClick={() => setGender(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>

                            <div className="hp-row">
                                <div className="hp-field">
                                    <span className="hp-label">Age (years)</span>
                                    <input
                                        type="number"
                                        className="hp-input"
                                        value={age}
                                        onChange={e => setAge(e.target.value)}
                                        placeholder="28"
                                        min="10"
                                        max="110"
                                    />
                                </div>
                                <div className="hp-field">
                                    <span className="hp-label">Weight (kg)</span>
                                    <input
                                        type="number"
                                        className="hp-input"
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        placeholder="70"
                                        min="20"
                                    />
                                </div>
                            </div>

                            <div className="hp-field" style={{ marginBottom: '20px' }}>
                                <span className="hp-label">Height (cm)</span>
                                <input
                                    type="number"
                                    className="hp-input"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    placeholder="170"
                                    min="100"
                                />
                            </div>
                        </section>

                        <section className="hp-section">
                            <span className="hp-label">Activity level</span>
                            <div className="hp-toggle-group" style={{ flexWrap: 'wrap' }}>
                                {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                                    <button
                                        key={val}
                                        className={`hp-toggle ${activity === val ? 'active' : ''}`}
                                        style={{ minWidth: '80px' }}
                                        onClick={() => setActivity(val)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <span className="hp-label">Primary goal</span>
                            <div className="hp-toggle-group">
                                {['Lose weight', 'Build muscle', 'Maintain', 'Improve fitness'].map(g => (
                                    <button
                                        key={g}
                                        className={`hp-toggle ${goal === g ? 'active' : ''}`}
                                        onClick={() => setGoal(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="hp-section" style={{ borderBottom: 'none' }}>
                            <button
                                className="hp-btn-primary"
                                onClick={generate}
                                disabled={!valid}
                            >
                                Generate my plan
                            </button>
                        </section>
                    </>
                )}

                {/* ── Results ── */}
                {submitted && (
                    <>
                        <section className="hp-section">
                            {vitals && (
                                <div className="hp-vitals">
                                    <div className="hp-vital">
                                        <span className="hp-label">BMI</span>
                                        <div className="hp-vital-num">{vitals.bmi}</div>
                                        <div className="hp-vital-unit">{vitals.bmiLabel}</div>
                                        <span className="hp-rule" />
                                    </div>
                                    <div className="hp-vital">
                                        <span className="hp-label">BMR</span>
                                        <div className="hp-vital-num">{vitals.bmr}</div>
                                        <div className="hp-vital-unit">kcal / day</div>
                                    </div>
                                    <div className="hp-vital">
                                        <span className="hp-label">TDEE</span>
                                        <div className="hp-vital-num">{vitals.tdee}</div>
                                        <div className="hp-vital-unit">kcal / day</div>
                                    </div>
                                    <div className="hp-vital">
                                        <span className="hp-label">Goal</span>
                                        <div className="hp-vital-num" style={{ fontSize: '0.85rem', marginTop: '12px', color: '#e8e4dc', letterSpacing: '0' }}>
                                            {goal}
                                        </div>
                                        <div className="hp-vital-unit">{ACTIVITY_LABELS[activity]}</div>
                                    </div>
                                </div>
                            )}

                            <span className="hp-label">Your plan</span>
                            {error && <div className="hp-error">{error}</div>}
                            <PlanOutput text={plan} loading={loading} />

                            {plan && !loading && (
                                <button
                                    className="hp-btn-primary"
                                    style={{ marginTop: '16px' }}
                                    onClick={generate}
                                >
                                    Regenerate plan
                                </button>
                            )}
                        </section>
                    </>
                )}

            </div>
        </main>
    );
}