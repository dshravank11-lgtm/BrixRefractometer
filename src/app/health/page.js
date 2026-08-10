'use client';
import React, { useState } from 'react';
import Marquee from 'react-fast-marquee';

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very: 'Very active',
};

function PlanOutput({ text, loading }) {
  if (loading) {
    return (
      <div className="panel-inset">
        <div className="result-pill">Generating nutrition plan...</div>
      </div>
    );
  }
  if (!text) {
    return (
      <div className="panel-inset">
        <div className="result-pill">Fill in your details and generate your plan.</div>
      </div>
    );
  }
  const lines = text.split('\n').filter(Boolean);
  return (
    <div className="panel-inset">
      {lines.map((raw, index) => {
        if (/^###/.test(raw)) {
          return (
            <div key={index} className="feature-card"><h3>{raw.replace(/^#+\s*/, '')}</h3></div>
          );
        }
        if (/^\*\s/.test(raw)) {
          return (
            <div key={index} className="result-pill">{raw.replace(/^\*\s*/, '- ')}</div>
          );
        }
        return <div key={index} className="result-pill">{raw}</div>;
      })}
    </div>
  );
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
  return { bmi: bmi.toFixed(1), bmiLabel, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

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

  const valid = gender && weight && height && age && activity && goal && parseFloat(weight) > 0 && parseFloat(height) > 0 && parseFloat(age) > 0;

  const generate = async () => {
    if (!valid) return;
    setError('');
    const v = computeVitals(gender, weight, height, age, activity);
    setVitals(v);
    setSubmitted(true);
    setLoading(true);
    setPlan('');
    try {
      const res = await fetch('/api/analyze/health-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, weight, height, age, activity, goal, ...v })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPlan(data.plan || 'No plan returned.');
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
    <main className="retro-page">
      <div className="retro-container">
        <section className="hero-window panel-outset">
          <div className="title-bar"><span>Health Planner</span><span>Personal metrics</span></div>
          <div className="panel-content">
            <div className="hero-headline">Build your wellness plan</div>
            <p className="hero-copy">Calculate BMI and TDEE, then get a daily plan tailored to your goals.</p>
            <Marquee gradient={false} speed={46} pauseOnHover>
              <span className="hero-copy">Personalized nutrition guidance and daily planning</span>
            </Marquee>
          </div>
        </section>

        <section className="form-window panel-outset">
          <div className="title-bar"><span>Input</span><span>Track your body</span></div>
          <div className="panel-content">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Biological sex</label>
                <div className="toggle-group">
                  {['male', 'female'].map((value) => (
                    <button key={value} type="button" className={`toggle-button ${gender === value ? 'active' : ''}`} onClick={() => setGender(value)}>{value}</button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Activity</label>
                <select className="retro-select" value={activity} onChange={(e) => setActivity(e.target.value)}>
                  <option value="">Choose</option>
                  {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Age (years)</label>
                <input className="retro-input" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" />
              </div>
              <div className="form-field">
                <label className="form-label">Weight (kg)</label>
                <input className="retro-input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Height (cm)</label>
                <input className="retro-input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
              </div>
              <div className="form-field">
                <label className="form-label">Goal</label>
                <select className="retro-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option value="">Choose goal</option>
                  {['Lose weight', 'Build muscle', 'Maintain', 'Improve fitness'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hit-counter-row">
              <button className="retro-btn primary" onClick={generate} disabled={!valid}>Generate my plan</button>
              <button className="retro-btn" onClick={reset} type="button">Reset</button>
            </div>
          </div>
        </section>

        {submitted && (
          <section className="stats-window panel-outset">
            <div className="title-bar"><span>Results</span><span>Vitals</span></div>
            <div className="panel-content">
              <div className="stats-grid">
                <div className="result-card"><h3>BMI</h3><p>{vitals?.bmi} — {vitals?.bmiLabel}</p></div>
                <div className="result-card"><h3>BMR</h3><p>{vitals?.bmr} kcal/day</p></div>
                <div className="result-card"><h3>TDEE</h3><p>{vitals?.tdee} kcal/day</p></div>
              </div>
              {error && <div className="result-pill" style={{ borderColor: '#ff5555' }}>{error}</div>}
              <PlanOutput text={plan} loading={loading} />
            </div>
          </section>
        )}

        <section className="feature-window panel-outset bg-construction">
          <div className="title-bar"><span>Decorative Grid</span><span>Color burst</span></div>
          <div className="panel-content">
            <div className="color-grid">
              <div className="color-square red" />
              <div className="color-square green" />
              <div className="color-square blue" />
              <div className="color-square yellow" />
              <div className="color-square magenta" />
              <div className="color-square cyan" />
            </div>
          </div>
        </section>

        <section className="cta-window panel-outset">
          <div className="title-bar"><span>Navigation</span><span>Switch tools</span></div>
          <div className="panel-content">
            <div className="hit-counter-row">
              <a className="retro-btn retro-link" href="/">Back to Refractometer</a>
              <a className="retro-btn success" href="/">Start again</a>
            </div>
          </div>
        </section>  
      </div>
    </main>
  );
}
