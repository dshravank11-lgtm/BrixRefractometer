'use client';
import React, { useState, useEffect, useRef } from 'react';

const DEVICES = {
  'ipad-10th': { name: 'iPad 10th Gen', fov: 63.8, sensorWidth: 5.76 },
  'iphone-15-plus': { name: 'iPhone 15 Plus', fov: 77.5, sensorWidth: 6.73 },
  'samsung-a54': { name: 'Samsung A54', fov: 85.0, sensorWidth: 6.4 },
  'samsung-a56': { name: 'Samsung A56', fov: 85.3, sensorWidth: 7.5 }
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,300&family=IBM+Plex+Serif:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .rfr-root {
    min-height: 100vh;
    background: #0b0b0c;
    font-family: 'IBM Plex Mono', monospace;
    color: #e8e4dc;
    padding: 40px 20px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .rfr-inner {
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
  }

  .rfr-header {
    padding: 0 0 20px;
    border-bottom: 1px solid #2c2c30;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 0;
  }

  .rfr-title {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #e8e4dc;
  }

  .rfr-subtitle {
    font-size: 0.6rem;
    color: #9a9790;
    letter-spacing: 0.1em;
    margin-top: 4px;
    font-weight: 300;
  }

  .rfr-section {
    padding: 32px 0;
    border-bottom: 1px solid #2c2c30;
    animation: rfr-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes rfr-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rfr-label {
    display: block;
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9a9790;
    margin-bottom: 14px;
    font-weight: 400;
  }

  .rfr-input {
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
    margin-bottom: 20px;
    letter-spacing: 0.05em;
    -moz-appearance: textfield;
  }

  .rfr-input:focus { border-color: #b8955a; }
  .rfr-input::-webkit-outer-spin-button,
  .rfr-input::-webkit-inner-spin-button { -webkit-appearance: none; }

  .rfr-btn-primary {
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

  .rfr-btn-primary:hover:not(:disabled) { background: #c9a86e; }

  .rfr-btn-primary:disabled {
    background: #1f1f22;
    color: #4a4a4f;
    cursor: not-allowed;
  }

  .rfr-btn-ghost {
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

  .rfr-btn-ghost:hover { border-color: #9a9790; color: #e8e4dc; }

  .rfr-btn-action {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.625rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 14px 20px;
    cursor: pointer;
    width: 100%;
    transition: all 0.2s;
    border-radius: 0;
    margin-top: 20px;
    line-height: 1;
  }

  .rfr-btn-action.capture {
    background: transparent;
    color: #b8955a;
    border: 1px solid #b8955a;
  }

  .rfr-btn-action.capture:hover { background: #b8955a14; }

  .rfr-btn-action.release {
    background: #b8955a;
    color: #0b0b0c;
    border: 1px solid transparent;
    font-weight: 500;
  }

  .rfr-btn-action.release:hover { background: #c9a86e; }

  .rfr-callout {
    border-left: 2px solid #b8955a;
    padding: 12px 18px;
    background: #111113;
    font-size: 0.72rem;
    color: #c8c4bb;
    line-height: 1.8;
    letter-spacing: 0.04em;
    margin-bottom: 20px;
    font-weight: 300;
  }

  .rfr-camera-wrap {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: #000;
    border: 1px solid #2c2c30;
    overflow: hidden;
    position: relative;
    display: block;
  }

  .rfr-camera-wrap canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: crosshair;
  }

  .rfr-lock-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #0b0b0c;
    border: 1px solid #b8955a44;
    color: #b8955a;
    font-size: 0.55rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 6px 12px;
    animation: rfr-blink 2.4s ease-in-out infinite;
  }

  @keyframes rfr-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }

  .rfr-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #2c2c30;
  }

  .rfr-metric {
    padding: 26px 22px 22px;
    position: relative;
  }

  .rfr-metric + .rfr-metric {
    border-left: 1px solid #2c2c30;
  }

  .rfr-metric-num {
    font-size: 3.4rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-top: 10px;
    transition: color 0.4s ease, opacity 0.4s ease;
    font-variant-numeric: tabular-nums;
  }

  .rfr-metric-num.live   { color: #e8e4dc; }
  .rfr-metric-num.locked { color: #b8955a; }
  .rfr-metric-num.dim    { color: #2c2c30; }

  .rfr-metric-unit {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    color: #9a9790;
    margin-top: 8px;
    text-transform: uppercase;
  }

  .rfr-rule {
    display: block;
    width: 28px;
    height: 1px;
    background: #b8955a;
    margin-top: 18px;
    transition: width 0.5s ease;
  }

  .rfr-slider-row {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .rfr-slider {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 1px;
    background: #2c2c30;
    outline: none;
    cursor: pointer;
    border-radius: 0;
  }

  .rfr-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 13px;
    height: 13px;
    background: #b8955a;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .rfr-slider::-webkit-slider-thumb:hover { transform: scale(1.35); }

  .rfr-slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    background: #b8955a;
    border-radius: 50%;
    border: none;
    cursor: pointer;
  }

  .rfr-slider-val {
    font-size: 0.72rem;
    color: #9a9790;
    min-width: 30px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Verified results (very large, above nutri-grade) ── */
  .rfr-verified-block {
    background: #0d1117;
    border: 1px solid #b8955a44;
    border-left: 3px solid #b8955a;
    padding: 22px 24px 18px;
    margin-bottom: 20px;
    animation: rfr-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .rfr-verified-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #b8955a;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .rfr-verified-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #b8955a33;
  }

  .rfr-verified-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border: 1px solid #2c2c30;
  }

  .rfr-verified-item {
    padding: 20px 18px 16px;
    position: relative;
  }

  .rfr-verified-item + .rfr-verified-item {
    border-left: 1px solid #2c2c30;
  }

  .rfr-verified-key {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.54rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9a9790;
    margin-bottom: 10px;
  }

  .rfr-verified-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 2.8rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #e8e4dc;
    font-variant-numeric: tabular-nums;
  }

  .rfr-verified-unit {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    color: #b8955a;
    margin-top: 6px;
    text-transform: uppercase;
    font-family: 'IBM Plex Mono', monospace;
  }

  .rfr-verified-accent {
    display: block;
    width: 22px;
    height: 2px;
    background: #b8955a;
    margin-top: 14px;
  }

  .rfr-vision-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.5rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #5dba7f;
    border: 1px solid #5dba7f44;
    padding: 3px 8px;
    margin-bottom: 14px;
  }

  .rfr-vision-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #5dba7f;
    animation: rfr-blink 1.8s ease-in-out infinite;
  }

  /* ── Analysis output: rich markdown rendering ── */
  .rfr-report-output {
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

  .rfr-report-empty {
    color: #706e6b;
    font-style: italic;
  }

  .rfr-md-h3 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b8955a;
    margin: 18px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #2c2c3088;
  }

  .rfr-md-h3:first-child { margin-top: 0; }

  .rfr-md-grade {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 10px 14px;
    margin-bottom: 18px;
    border-left: 3px solid;
  }

  .rfr-md-grade.grade-a { color: #5dba7f; border-color: #5dba7f; background: #5dba7f0d; }
  .rfr-md-grade.grade-b { color: #c9b850; border-color: #c9b850; background: #c9b8500d; }
  .rfr-md-grade.grade-c { color: #c97e3a; border-color: #c97e3a; background: #c97e3a0d; }
  .rfr-md-grade.grade-d { color: #c94a3a; border-color: #c94a3a; background: #c94a3a0d; }
  .rfr-md-grade.grade-u { color: #9a9790; border-color: #9a9790; background: #9a97900d; }

  .rfr-md-bullet {
    display: flex;
    gap: 10px;
    margin: 4px 0;
    font-size: 0.83rem;
    color: #c8c4bb;
    line-height: 1.7;
  }

  .rfr-md-bullet-dot {
    color: #b8955a;
    flex-shrink: 0;
    margin-top: 2px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
  }

  .rfr-md-bullet-key {
    color: #e8e4dc;
    font-weight: 400;
  }

  .rfr-md-para {
    margin: 6px 0;
    color: #c8c4bb;
    font-size: 0.83rem;
  }

  .rfr-loading-row {
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

  .rfr-spinner {
    width: 14px;
    height: 14px;
    border: 1px solid #2c2c30;
    border-top-color: #b8955a;
    border-radius: 50%;
    animation: rfr-spin 0.75s linear infinite;
    flex-shrink: 0;
  }

  @keyframes rfr-spin { to { transform: rotate(360deg); } }

  .rfr-point-status {
    font-size: 0.64rem;
    letter-spacing: 0.14em;
    color: #9a9790;
    text-align: center;
    padding: 10px 0 0;
    font-variant-numeric: tabular-nums;
  }

  .rfr-point-status b { color: #b8955a; font-weight: 400; }

  /* Hide the video — only the canvas is ever shown */
  .rfr-hidden-video { display: none !important; }

  /* Canvas visibility toggling via class rather than conditional render */
  .rfr-camera-wrap.rfr-cam-inactive canvas { cursor: default; }

  @media (max-width: 480px) {
    .rfr-metric-num { font-size: 2.6rem; }
    .rfr-root { padding: 28px 16px 64px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rfr-section, .rfr-lock-badge, .rfr-spinner { animation: none; }
    .rfr-metric-num, .rfr-rule { transition: none; }
  }

  .rfr-device-select {
    font-family: 'IBM Plex Mono', monospace;
    background: #111113;
    border: 1px solid #2c2c30;
    border-radius: 0;
    color: #e8e4dc;
    padding: 16px 18px;
    font-size: 0.85rem;
    font-weight: 300;
    outline: none;
    width: 100%;
    margin-bottom: 16px;
    cursor: pointer;
    letter-spacing: 0.05em;
  }

  .rfr-device-select:focus { border-color: #b8955a; }

  .rfr-alt-method {
    font-size: 0.65rem;
    color: #9a9790;
    text-align: center;
    margin-top: 16px;
    letter-spacing: 0.1em;
  }

  .rfr-alt-method button {
    background: none;
    border: none;
    color: #b8955a;
    cursor: pointer;
    text-decoration: underline;
    font-family: inherit;
    font-size: inherit;
  }

  .rfr-buffer-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0b0b0c;
    border: 1px solid #b8955a;
    color: #b8955a;
    padding: 20px 40px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    z-index: 10;
  }

  .rfr-zero-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.575rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: transparent;
    color: #e8e4dc;
    border: 1px solid #b8955a;
    padding: 10px 18px;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 0;
    margin-left: 10px;
  }

  .rfr-zero-btn:hover {
    background: #b8955a;
    color: #0b0b0c;
  }
`;


function parseGradeClass(text) {
  if (/GRADE A/i.test(text)) return 'grade-a';
  if (/GRADE B/i.test(text)) return 'grade-b';
  if (/GRADE C/i.test(text)) return 'grade-c';
  if (/GRADE D/i.test(text)) return 'grade-d';
  return 'grade-u';
}

function VerifiedResults({ verified, visionUsed }) {
  if (!verified || (verified.length === null && verified.refractiveIndex === null && verified.brix === null)) {
    return null;
  }
  return (
    <div className="rfr-verified-block">
      <div className="rfr-verified-label">AI-Verified Measurements</div>
      {visionUsed && (
        <div className="rfr-vision-badge">
          <span className="rfr-vision-dot" />
          Vision Analysis Active
        </div>
      )}
      <div className="rfr-verified-grid">
        <div className="rfr-verified-item">
          <div className="rfr-verified-key">Verified Length</div>
          <div className="rfr-verified-val">
            {verified.length !== null ? verified.length.toFixed(2) : '—'}
          </div>
          <div className="rfr-verified-unit">cm</div>
          <span className="rfr-verified-accent" />
        </div>
        <div className="rfr-verified-item">
          <div className="rfr-verified-key">Verified Refractive Index</div>
          <div className="rfr-verified-val" style={{ fontSize: '2.1rem' }}>
            {verified.refractiveIndex !== null ? verified.refractiveIndex.toFixed(4) : '—'}
          </div>
          <div className="rfr-verified-unit">n</div>
          <span className="rfr-verified-accent" />
        </div>
        <div className="rfr-verified-item">
          <div className="rfr-verified-key">Verified Brix</div>
          <div className="rfr-verified-val">
            {verified.brix !== null ? verified.brix.toFixed(1) : '—'}
          </div>
          <div className="rfr-verified-unit">° Brix</div>
          <span className="rfr-verified-accent" />
        </div>
      </div>
    </div>
  );
}

function AnalysisOutput({ text, loading, verified, visionUsed }) {
  if (loading) {
    return (
      <>
        <div className="rfr-report-output">
          <div className="rfr-loading-row">
            <div className="rfr-spinner" />
            Analyzing with DeepSeek Vision…
          </div>
        </div>
      </>
    );
  }

  if (!text) {
    return (
      <div className="rfr-report-output">
        <span className="rfr-report-empty">Capture a reading, then run analysis.</span>
      </div>
    );
  }

  const lines = text.split('\n');
  const elements = [];
  let key = 0;
  let skipVerifiedSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    
    
    if (/VERIFIED MEASUREMENTS/i.test(line)) {
      skipVerifiedSection = true;
      continue;
    }
    if (skipVerifiedSection) {
      if (/^###/.test(line) && !/VERIFIED/i.test(line)) {
        skipVerifiedSection = false;
      } else {
        continue;
      }
    }

    if (/NUTRI.GRADE STATUS/i.test(line)) {
      const gradeClass = parseGradeClass(line);
      const clean = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      elements.push(
        <div key={key++} className={`rfr-md-grade ${gradeClass}`}>{clean}</div>
      );
      continue;
    }

    if (/^###/.test(line)) {
      const clean = line.replace(/^#+\s*/, '');
      elements.push(
        <div key={key++} className="rfr-md-h3">{clean}</div>
      );
      continue;
    }

    if (/^\*\s/.test(line)) {
      const content = line.replace(/^\*\s*/, '');
      const colonIdx = content.indexOf(':');
      if (colonIdx !== -1) {
        const keyPart = content.slice(0, colonIdx);
        const valPart = content.slice(colonIdx);
        elements.push(
          <div key={key++} className="rfr-md-bullet">
            <span className="rfr-md-bullet-dot">▸</span>
            <span>
              <span className="rfr-md-bullet-key">{keyPart}</span>
              {valPart}
            </span>
          </div>
        );
      } else {
        elements.push(
          <div key={key++} className="rfr-md-bullet">
            <span className="rfr-md-bullet-dot">▸</span>
            <span>{content}</span>
          </div>
        );
      }
      continue;
    }

    elements.push(
      <div key={key++} className="rfr-md-para">{line.replace(/\*\*/g, '')}</div>
    );
  }

  return (
    <>
      <VerifiedResults verified={verified} visionUsed={visionUsed} />
      <div className="rfr-report-output">{elements}</div>
    </>
  );
}

export default function SmartRefractometer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [setupStep, setSetupStep] = useState('input_distance');
  const [isLocked, setIsLocked] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState('');
  const [deviceDistance, setDeviceDistance] = useState('100');
  const [prismDistance, setPrismDistance] = useState('2500');
  const [useAltMethod, setUseAltMethod] = useState(false);

  const [clickPoints, setClickPoints] = useState([]);
  const [mmPerPixel, setMmPerPixel] = useState(0.55);
  const [baseXWater, setBaseXWater] = useState(320);
  const [calibrationOffset, setCalibrationOffset] = useState(null);
  const [zeroOffset, setZeroOffset] = useState(0);
  const [zeroPressed, setZeroPressed] = useState(false);
  const currentLaserPos = useRef(null);
  const [threshold, setThreshold] = useState(190);
  const [liveAngle, setLiveAngle] = useState(23.6);
  const [liveBrix, setLiveBrix] = useState(0.0);
  const [liveRI, setLiveRI] = useState(1.333);
  const [liveLength, setLiveLength] = useState(0.0);

  const [savedBrix, setSavedBrix] = useState(0.0);
  const [savedAngle, setSavedAngle] = useState(23.6);
  const [savedRI, setSavedRI] = useState(1.333);
  const [savedLength, setSavedLength] = useState(0.0);

  
  const [calibrationSnapshot, setCalibrationSnapshot] = useState(null); 
  const [measurementSnapshot, setMeasurementSnapshot] = useState(null); 

  const [apiResponse, setApiResponse] = useState('');
  const [verifiedResults, setVerifiedResults] = useState(null);
  const [visionUsed, setVisionUsed] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Captures the current canvas frame as a base64 JPEG string (no data-URL prefix). */
  const captureCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      // Draw to a smaller offscreen canvas to keep payload manageable (~320×240)
      const offscreen = document.createElement('canvas');
      offscreen.width = 320;
      offscreen.height = 240;
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 320, 240);
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.7);
      
      return dataUrl.split(',')[1];
    } catch {
      return null;
    }
  };

  const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s, v];
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
        });
        await videoRef.current.play();
      }
      setSetupStep('click_paper_edges');
    } catch (err) {
      alert('Camera access denied or unavailable. Check browser permissions.');
      console.error(err);
    }
  };

  const handleCanvasClick = (e) => {
    if (setupStep !== 'click_paper_edges' || clickPoints.length >= 2) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const updated = [...clickPoints, x];
    setClickPoints(updated);
    if (updated.length === 2) {
      const deltaPx = Math.abs(updated[1] - updated[0]);
      const A4_WIDTH_MM = 297;
      const mmPerPixelCalculated = A4_WIDTH_MM / deltaPx;
      setMmPerPixel(mmPerPixelCalculated);
      const paperCenter = (updated[0] + updated[1]) / 2;
      setBaseXWater(paperCenter);
      setIsBuffering(true);
      setTimeout(() => {
        setIsBuffering(false);
        setSetupStep('active_run');
      }, 1000);
    }
  };

  const startDeviceCalibration = async () => {
    if (!selectedDevice || !deviceDistance || !prismDistance) {
      alert('Please select a device and enter distances.');
      return;
    }
    const device = DEVICES[selectedDevice];

    const distanceM = parseFloat(deviceDistance) / 1000;
    const fovRad = (device.fov * Math.PI) / 180;
    const visibleWidthM = 2 * distanceM * Math.tan(fovRad / 2);
    const visibleWidthMm = visibleWidthM * 1000;
    const sensorWidthMm = device.sensorWidth;
    const focalLengthMm = (sensorWidthMm / 2) / Math.tan(fovRad / 2);
    const imageHeightPx = 480;
    const mmPerPixelCalculated = visibleWidthMm / 640;

    setMmPerPixel(mmPerPixelCalculated);
    setBaseXWater(320);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
        });
        await videoRef.current.play();
      }
      setIsBuffering(true);
      setTimeout(() => {
        setIsBuffering(false);
        setSetupStep('active_run');
      }, 1000);
    } catch (err) {
      alert('Camera access denied or unavailable.');
      console.error(err);
    }
  };
  useEffect(() => {
    if (setupStep === 'input_distance') return;
    if (!streamRef.current) return;

    let stopped = false;

    const loop = () => {
      if (stopped) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c && v.readyState >= v.HAVE_CURRENT_DATA) {
        const ctx = c.getContext('2d');
        ctx.drawImage(v, 0, 0, c.width, c.height);

        if (setupStep === 'click_paper_edges') {
          ctx.fillStyle = '#b8955a';
          clickPoints.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt, c.height / 2, 9, 0, 2 * Math.PI);
            ctx.fill();
          });
        }

        if (setupStep === 'active_run' && !isLocked) {
          const frame = ctx.getImageData(0, 0, c.width, c.height);
          const d = frame.data;
          let tx = -1, ty = -1, best = 0;
          const isRedLaser = (r, g, b) => {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const redDominance = r - Math.max(g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            return r > 180 && redDominance > 80 && saturation > 0.5 && r > g * 1.5;
          };
          const isWhiteLaser = (r, g, b) => {
            const avg = (r + g + b) / 3;
            const rDominant = r > g && r > b;
            return avg > threshold && avg < 250 && rDominant && r - b > 40;
          };

          for (let i = 0; i < d.length; i += 16) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            if (isRedLaser(r, g, b) || isWhiteLaser(r, g, b)) {
              const score = r * 2 - g - b;
              if (score > best) {
                best = score;
                tx = (i / 4) % c.width;
                ty = Math.floor((i / 4) / c.width);
              }
            }
          }
          if (tx !== -1) {
            
            if (calibrationOffset === null && !isBuffering) {
              setCalibrationOffset(tx);
            }

            ctx.strokeStyle = '#b8955a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(tx, ty, 14, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#b8955a';
            ctx.fill();

            
            const originX = calibrationOffset !== null ? calibrationOffset : baseXWater;
            const zeroRefX = originX + zeroOffset;

            if (Math.abs(tx - zeroRefX) > 2) {
              const dx = tx - zeroRefX;
              const dy = ty - c.height / 2;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len;
              const uy = dy / len;

              ctx.strokeStyle = '#b8955a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(zeroRefX, c.height / 2);
              ctx.lineTo(tx, ty);
              ctx.stroke();

              const headLen = 12;
              ctx.beginPath();
              ctx.moveTo(tx, ty);
              ctx.lineTo(tx - headLen * ux + 5 * uy, ty - headLen * uy - 5 * ux);
              ctx.moveTo(tx, ty);
              ctx.lineTo(tx - headLen * ux - 5 * uy, ty - headLen * uy + 5 * ux);
              ctx.stroke();
            }

            const D = parseFloat(prismDistance) || 2500;
            let referenceX = calibrationOffset !== null ? calibrationOffset : baseXWater;
            let displacementPx = tx - referenceX - zeroOffset;

            const displacementMm = displacementPx * mmPerPixel;
            const deflectionDistance = Math.abs(displacementMm);

            
            
            const deviationAngleRad = Math.atan2(deflectionDistance, D);
            const deviationAngle = deviationAngleRad * (180 / Math.PI);

            const prismAngle = 60;
            const prismAngleRad = prismAngle * Math.PI / 180;
            
            
            
            const n = Math.sin((prismAngleRad + deviationAngleRad) / 2) / Math.sin(prismAngleRad / 2);

            
            
            const totalPathMm = Math.sqrt(D * D + deflectionDistance * deflectionDistance);
            const totalPathCm = totalPathMm / 10;

            let brix = 0;
            if (n >= 1.33299) {
              const a = 0.0000004;
              const b = 0.00192;
              const c = 1.33299 - n;
              brix = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
            }
            if (brix < 0) brix = 0;
            if (brix > 100) brix = 100;

            if (process.env.NODE_ENV === 'development') {
              console.log({
                mmPerPixel,
                displacementPx,
                displacementMm,
                deflectionDistance,
                deviationAngle,
                refractiveIndex: n,
                brix,
                totalPathCm
              });
            }

            setLiveAngle(deviationAngle);
            setLiveRI(n);
            setLiveLength(totalPathCm);
            setLiveBrix(brix);
            currentLaserPos.current = tx;
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setupStep, threshold, prismDistance, mmPerPixel, baseXWater, clickPoints, isLocked, zeroOffset, calibrationOffset]);

  const toggleLock = () => {
    if (!isLocked) {
      setSavedBrix(liveBrix);
      setSavedAngle(liveAngle);
      setSavedRI(liveRI);
      setSavedLength(liveLength);
      
      const snap = captureCanvasSnapshot();
      if (snap) setMeasurementSnapshot(snap);
    }
    setIsLocked(prev => !prev);
  };

  const runAnalysis = async () => {
    const brix = isLocked ? savedBrix : liveBrix;
    const angle = isLocked ? savedAngle : liveAngle;
    const lengthCm = isLocked ? savedLength : liveLength;
    const refractiveIndex = isLocked ? savedRI : liveRI;
    setLoading(true);
    setApiResponse('');
    setVerifiedResults(null);
    setVisionUsed(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle,
          brix,
          lengthCm,
          refractiveIndex,
          measurementImageBase64: measurementSnapshot || null,
          calibrationImageBase64: calibrationSnapshot || null
        })
      });
      const data = await res.json();
      setApiResponse(data.analysis || data.error);
      if (data.verified) setVerifiedResults(data.verified);
      if (data.visionUsed !== undefined) setVisionUsed(data.visionUsed);
    } catch (err) {
      setApiResponse(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const zeroDisplacement = () => {
    if (calibrationOffset !== null && currentLaserPos.current !== null) {
      const currentPx = currentLaserPos.current;
      const calOffset = calibrationOffset;
      setZeroOffset(currentPx - calOffset);
      
      const snap = captureCanvasSnapshot();
      if (snap) setCalibrationSnapshot(snap);
      
      setZeroPressed(p => !p);
    }
  };

  const reset = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setSetupStep('input_distance');
    setClickPoints([]);
    setIsLocked(false);
    setIsBuffering(false);
    setCalibrationOffset(null);
    setZeroOffset(0);
    setApiResponse('');
    setVerifiedResults(null);
    setVisionUsed(false);
    setCalibrationSnapshot(null);
    setMeasurementSnapshot(null);
    setLiveBrix(0.0);
    setLiveAngle(23.6);
  };

  return (
    <main className="rfr-root">
      <style>{STYLES}</style>
      <div className="rfr-inner">

        <header className="rfr-header">
          <div>
            <div className="rfr-title">Refractometer</div>
            <div className="rfr-subtitle">Brix · Refractive index · Laser tracking</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="rfr-btn-ghost" onClick={() => window.location.href = '/health'}>
              Health Planner →
            </button>
            {setupStep === 'active_run' && (
              <button className="rfr-btn-ghost" onClick={reset}>Reset</button>
            )}
          </div>
        </header>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="rfr-hidden-video"
        />

        {!useAltMethod && setupStep === 'input_distance' && (
          <section className="rfr-section">
            <label className="rfr-label">Select your device</label>
            <select
              className="rfr-device-select"
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
            >
              <option value="">— Choose device —</option>
              {Object.entries(DEVICES).map(([key, dev]) => (
                <option key={key} value={key}>{dev.name}</option>
              ))}
            </select>

            <label className="rfr-label">Device distance from wall (mm)</label>
            <input
              type="number"
              className="rfr-input"
              value={deviceDistance}
              onChange={e => setDeviceDistance(e.target.value)}
              placeholder="100"
            />

            <label className="rfr-label">Prism-to-screen distance (mm)</label>
            <input
              type="number"
              className="rfr-input"
              value={prismDistance}
              onChange={e => setPrismDistance(e.target.value)}
              placeholder="2500"
            />

            <button
              className="rfr-btn-primary"
              onClick={startDeviceCalibration}
            >
              Start Camera
            </button>

            <div className="rfr-alt-method">
              Or use <button onClick={() => setUseAltMethod(true)}>A4 paper calibration</button>
            </div>
          </section>
        )}

        {useAltMethod && setupStep === 'input_distance' && (
          <section className="rfr-section">
            <label className="rfr-label">Prism-to-screen distance (mm)</label>
            <input
              type="number"
              className="rfr-input"
              value={prismDistance}
              onChange={e => setPrismDistance(e.target.value)}
              placeholder="2500"
            />
            <button
              className="rfr-btn-primary"
              onClick={() => {
                if (prismDistance) startCamera();
                else alert('Enter a distance first.');
              }}
            >
              Start Camera
            </button>
            <div className="rfr-alt-method">
              Or use <button onClick={() => setUseAltMethod(false)}>device calibration</button>
            </div>
          </section>
        )}

        {setupStep === 'click_paper_edges' && (
          <section className="rfr-section">
            <div className="rfr-callout">
              Place an A4 sheet horizontally on the wall behind your setup.
              Click its left edge in the frame below, then its right edge.
            </div>
            <div className="rfr-camera-wrap">
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                onClick={handleCanvasClick}
              />
            </div>
            <div className="rfr-point-status">
              {clickPoints.length === 2
                ? <b>Calibrated —</b>
                : <>{clickPoints.length} <span style={{ color: '#2c2c30' }}>/</span> 2 points</>
              }
            </div>
          </section>
        )}

        {setupStep === 'active_run' && (
          <>
            <section className="rfr-section" style={{ paddingBottom: 0 }}>
              <div className="rfr-camera-wrap">
                <canvas ref={canvasRef} width="640" height="480" />
                {isLocked && <div className="rfr-lock-badge">Locked</div>}
                {isBuffering && (
                  <div className="rfr-buffer-indicator">
                    Calibrating...
                  </div>
                )}
              </div>
              <button
                className="rfr-zero-btn"
                onClick={zeroDisplacement}
                disabled={calibrationOffset === null}
                title="Set current position as zero"
                style={{ width: '100%', marginTop: '10px', marginLeft: 0 }}
              >
                Zero
              </button>
            </section>

            <section className="rfr-section">
              <div className="rfr-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="rfr-metric">
                  <div className="rfr-label">Length</div>
                  <div className={`rfr-metric-num ${isLocked ? 'dim' : 'live'}`}>
                    {liveLength.toFixed(1)}
                  </div>
                  <div className="rfr-metric-unit">cm</div>
                  <span className="rfr-rule" />
                </div>
                <div className="rfr-metric">
                  <div className="rfr-label">Refractive Index</div>
                  <div className={`rfr-metric-num ${isLocked ? 'dim' : 'live'}`}>
                    {liveRI.toFixed(4)}
                  </div>
                  <div className="rfr-metric-unit">n</div>
                  <span className="rfr-rule" />
                </div>
                <div className="rfr-metric">
                  <div className="rfr-label">Brix</div>
                  <div className={`rfr-metric-num ${isLocked ? 'dim' : 'live'}`}>
                    {liveBrix.toFixed(1)}
                  </div>
                  <div className="rfr-metric-unit">° Brix</div>
                  <span className="rfr-rule" />
                </div>
              </div>
              <div className="rfr-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
                <div className="rfr-metric">
                  <div className="rfr-label">Locked</div>
                  <div className={`rfr-metric-num ${isLocked ? 'locked' : 'dim'}`}>
                    {savedLength.toFixed(1)}
                  </div>
                  <div className="rfr-metric-unit">cm</div>
                </div>
                <div className="rfr-metric">
                  <div className="rfr-label">Locked</div>
                  <div className={`rfr-metric-num ${isLocked ? 'locked' : 'dim'}`}>
                    {savedRI.toFixed(4)}
                  </div>
                  <div className="rfr-metric-unit">n</div>
                </div>
                <div className="rfr-metric">
                  <div className="rfr-label">Locked</div>
                  <div className={`rfr-metric-num ${isLocked ? 'locked' : 'dim'}`}>
                    {savedBrix.toFixed(1)}
                  </div>
                  <div className="rfr-metric-unit">° Brix</div>
                </div>
              </div>
              <button
                className={`rfr-btn-action ${isLocked ? 'release' : 'capture'}`}
                onClick={toggleLock}
                style={{ marginTop: '10px' }}
              >
                {isLocked ? 'Release' : 'Capture Reading'}
              </button>
            </section>

            {process.env.NODE_ENV === 'development' && (
              <div className="rfr-callout" style={{ marginTop: '16px', fontSize: '0.65rem' }}>
                <strong>Debug Info:</strong><br />
                mm/pixel: {mmPerPixel.toFixed(4)}<br />
                Ref point: {(calibrationOffset !== null ? calibrationOffset : baseXWater).toFixed(1)}px<br />
                Laser pos: {currentLaserPos.current?.toFixed(1) || 'none'}px<br />
                Offset: {zeroOffset.toFixed(1)}px<br />
                D: {prismDistance}mm
              </div>
            )}

            <section className="rfr-section">
              <label className="rfr-label">Detection sensitivity</label>
              <div className="rfr-slider-row">
                <input
                  type="range"
                  min="150"
                  max="245"
                  value={threshold}
                  onChange={e => setThreshold(Number(e.target.value))}
                  className="rfr-slider"
                />
                <span className="rfr-slider-val">{threshold}</span>
              </div>
            </section>

            <section className="rfr-section">
              <label className="rfr-label">Analysis</label>
              {(calibrationSnapshot || measurementSnapshot) && !apiResponse && !loading && (
                <div className="rfr-callout" style={{ marginBottom: '14px', fontSize: '0.6rem' }}>
                  📷 {[calibrationSnapshot && 'Zero frame', measurementSnapshot && 'Measurement frame'].filter(Boolean).join(' + ')} captured — ready for vision analysis
                </div>
              )}
              <AnalysisOutput
                text={apiResponse}
                loading={loading}
                verified={verifiedResults}
                visionUsed={visionUsed}
              />
              <button
                className="rfr-btn-primary"
                style={{ marginTop: '16px' }}
                onClick={runAnalysis}
                disabled={loading}
              >
                {measurementSnapshot ? 'Run Vision Analysis' : 'Run Analysis'}
              </button>
            </section>
          </>
        )}

      </div>
    </main>
  );
}