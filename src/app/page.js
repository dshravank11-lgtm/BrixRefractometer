'use client';
import React, { useState, useEffect, useRef } from 'react';
import Marquee from 'react-fast-marquee';

const DEVICES = {
  'ipad-10th': { name: 'iPad 10th Gen', fov: 63.8, sensorWidth: 5.76 },
  'iphone-15-plus': { name: 'iPhone 15 Plus', fov: 77.5, sensorWidth: 6.73 },
  'samsung-a54': { name: 'Samsung A54', fov: 85.0, sensorWidth: 6.4 },
  'samsung-a56': { name: 'Samsung A56', fov: 85.3, sensorWidth: 7.5 }
};

function AnalysisOutput({ text, loading, verified }) {
  if (loading) {
    return (
      <div className="panel-inset">
        <div className="result-pill">Analysis in progress...</div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="panel-inset">
        <div className="result-pill">Capture a reading and run analysis</div>
      </div>
    );
  }

  const lines = text.split('\n').filter(Boolean);

  return (
    <div className="panel-inset">
      {lines.map((raw, index) => {
        if (/^###/.test(raw)) {
          return (
            <div key={index} className="feature-card">
              <h3>{raw.replace(/^#+\s*/, '')}</h3>
            </div>
          );
        }

        if (/^\*\s/.test(raw)) {
          return (
            <div key={index} className="result-pill">{raw.replace(/^\*\s*/, '- ')}</div>
          );
        }

        return (
          <div key={index} className="result-pill">{raw}</div>
        );
      })}
    </div>
  );
}

function VerifiedResults({ verified }) {
  if (!verified) return null;
  return (
    <div className="panel-inset">
      <div className="feature-card">
        <h3>Measurements</h3>
        <div className="stats-grid">
          <div className="result-pill">Length: {verified.length?.toFixed(2) ?? '—'} cm</div>
          <div className="result-pill">Refractive Index: {verified.refractiveIndex?.toFixed(4) ?? '—'}</div>
          <div className="result-pill">Brix: {verified.brix?.toFixed(1) ?? '—'}</div>
        </div>
      </div>
    </div>
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
  const [apiResponse, setApiResponse] = useState('');
  const [verifiedResults, setVerifiedResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('Ready to start the camera.');
  const [cameraError, setCameraError] = useState('');

  const captureCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
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

  const attachCameraStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Your browser does not support camera access.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'environment' }
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = resolve;
        videoRef.current.onerror = reject;
      });
      await videoRef.current.play();
    }

    return stream;
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      await attachCameraStream();
      setCameraStatus('Camera ready. Click the paper edges to calibrate.');
      setSetupStep('click_paper_edges');
    } catch (err) {
      const message = err?.message || 'Camera access denied or unavailable. Check browser permissions.';
      setCameraError(message);
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
    const mmPerPixelCalculated = visibleWidthMm / 640;
    setMmPerPixel(mmPerPixelCalculated);
    setBaseXWater(320);

    setCameraError('');
    try {
      await attachCameraStream();
      setCameraStatus('Camera ready. Tracking is active.');
      setIsBuffering(true);
      setTimeout(() => {
        setIsBuffering(false);
        setSetupStep('active_run');
      }, 1000);
    } catch (err) {
      const message = err?.message || 'Camera access denied or unavailable.';
      setCameraError(message);
      console.error(err);
    }
  };

  useEffect(() => {
    if (setupStep === 'input_distance') return;
    if (!streamRef.current) return;
    const v = videoRef.current;
    if (v && v.srcObject !== streamRef.current) {
      v.srcObject = streamRef.current;
      v.play().catch(() => {});
    }
  }, [setupStep]);

  useEffect(() => {
    if (setupStep === 'input_distance') return;
    if (!streamRef.current) return;

    let stopped = false;
    const loop = () => {
      if (stopped) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c && v.readyState >= 2) {
        const ctx = c.getContext('2d');
        if (c.width !== 640 || c.height !== 480) {
          c.width = 640;
          c.height = 480;
        }
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(v, 0, 0, c.width, c.height);

        if (setupStep === 'click_paper_edges') {
          ctx.fillStyle = '#0000ff';
          clickPoints.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt, c.height / 2, 9, 0, 2 * Math.PI);
            ctx.fill();
          });
        }

        if (setupStep === 'active_run' && !isLocked) {
          const frame = ctx.getImageData(0, 0, c.width, c.height);
          const d = frame.data;
          let tx = -1;
          let ty = -1;
          let best = 0;
          const isRedLaser = (r, g, b) => {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const redDominance = r - Math.max(g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            return r > 180 && redDominance > 80 && saturation > 0.5 && r > g * 1.5;
          };
          const isWhiteLaser = (r, g, b) => {
            const avg = (r + g + b) / 3;
            return avg > threshold && avg < 250 && r > g && r > b && r - b > 40;
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
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(tx, ty, 14, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff0000';
            ctx.fill();

            const originX = calibrationOffset !== null ? calibrationOffset : baseXWater;
            const zeroRefX = originX + zeroOffset;
            if (Math.abs(tx - zeroRefX) > 2) {
              const dx = tx - zeroRefX;
              const dy = ty - c.height / 2;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len;
              const uy = dy / len;
              ctx.strokeStyle = '#ff0000';
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
            let brix = 0;
            if (n >= 1.33299) {
              const a = 0.0000004;
              const b = 0.00192;
              const c = 1.33299 - n;
              brix = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
            }
            if (brix < 0) brix = 0;
            if (brix > 100) brix = 100;
            setLiveAngle(deviationAngle);
            setLiveRI(n);
            setLiveLength(Math.sqrt(D * D + deflectionDistance * deflectionDistance) / 10);
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
  }, [setupStep, threshold, prismDistance, mmPerPixel, baseXWater, clickPoints, isLocked, zeroOffset, calibrationOffset, isBuffering]);

  const toggleLock = () => {
    if (!isLocked) {
      setSavedBrix(liveBrix);
      setSavedAngle(liveAngle);
      setSavedRI(liveRI);
      setSavedLength(liveLength);
      const snap = captureCanvasSnapshot();
      if (snap) setVerifiedResults(prev => prev);
    }
    setIsLocked((prev) => !prev);
  };

  const runAnalysis = async () => {
    const brix = isLocked ? savedBrix : liveBrix;
    const angle = isLocked ? savedAngle : liveAngle;
    const lengthCm = isLocked ? savedLength : liveLength;
    const refractiveIndex = isLocked ? savedRI : liveRI;
    setLoading(true);
    setApiResponse('');
    setVerifiedResults(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ angle, brix, lengthCm, refractiveIndex })
      });
      const data = await res.json();
      setApiResponse(data.analysis || data.error || 'No analysis returned.');
      if (data.verified) setVerifiedResults(data.verified);
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
      setZeroPressed((p) => !p);
    }
  };

  const reset = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setSetupStep('input_distance');
    setClickPoints([]);
    setIsLocked(false);
    setIsBuffering(false);
    setCalibrationOffset(null);
    setZeroOffset(0);
    setZeroPressed(false);
    setApiResponse('');
    setVerifiedResults(null);
    setCameraStatus('Ready to start the camera.');
    setCameraError('');
    setLiveBrix(0.0);
    setLiveAngle(23.6);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <main className="retro-page">
      <div className="retro-container">
        <section className="hero-window panel-outset">
          <div className="title-bar">
            <span>Refractometer</span>
            <div className="title-bar-controls">
              <span className="title-bar-button">_</span>
              
              <span className="title-bar-button">X</span>
            </div>
          </div>
          <div className="panel-content">
            <div className="hero-headline">refractometer</div>
            <p className="hero-copy">Measure brix using a diy refractometer</p>
            <Marquee gradient={false} speed={48} pauseOnHover>
              <span className="hero-copy">E</span>
            </Marquee>
          </div>
        </section>

        <section className="form-window panel-outset">
          <div className="title-bar"><span>Camera Setup</span><span>feed</span></div>
          <div className="panel-content">
            {!useAltMethod ? (
              <div className="form-shell">
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Device</label>
                    <select className="retro-select" value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
                      <option value="">— Choose device —</option>
                      {Object.entries(DEVICES).map(([key, device]) => (
                        <option key={key} value={key}>{device.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Distance (mm)</label>
                    <input className="retro-input" type="number" value={deviceDistance} onChange={(e) => setDeviceDistance(e.target.value)} placeholder="100" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Prism distance</label>
                    <input className="retro-input" type="number" value={prismDistance} onChange={(e) => setPrismDistance(e.target.value)} placeholder="2500" />
                  </div>
                </div>
                <div className="hit-counter-row">
                  <button className="retro-btn primary" onClick={startDeviceCalibration}>Start camera</button>
                  <button className="retro-btn" onClick={() => setUseAltMethod(true)}>Paper Calibration</button>
                </div>
              </div>
            ) : (
              <div className="form-shell">
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Prism distance</label>
                    <input className="retro-input" type="number" value={prismDistance} onChange={(e) => setPrismDistance(e.target.value)} placeholder="2500" />
                  </div>
                </div>
                <div className="hit-counter-row">
                  <button className="retro-btn primary" onClick={startCamera}>Start Camera</button>
                  <button className="retro-btn" onClick={()=> setUseAltMethod(false)}>Device mode</button>
                </div>
              </div>
            )}
            {cameraError && <div className="result-pill" style={{ borderColor: '#ff5555' }}>{cameraError}</div>}
            {!cameraError && <div className="result-pill">{cameraStatus}</div>}
          </div>
        </section>

        {setupStep === 'click_paper_edges' && (
          <section className="feature-window panel-outset">
            <div className="title-bar"><span>Calibration</span><span>Click edges</span></div>
            <div className="panel-content">
              <div className="result-pill">Click the left and right edges of the A4 sheet's longer side. The paper should be in landscape orientation</div>
              <div className="panel-inset camera-panel" style={{ position: 'relative' }}>
                <canvas ref={canvasRef} width="640" height="480" onClick={handleCanvasClick} />
                <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }} />
              </div>
              <div className="hit-counter-row">
                <div className="result-pill">Points: {clickPoints.length} / 2</div>
              </div>
            </div>
          </section>
        )}

        {setupStep === 'active_run' && (
          <section className="stats-window panel-outset">
            <div className="title-bar"><span>Tracker</span><span>{isLocked ? 'Locked' : 'Tracking'}</span></div>
            <div className="panel-content">
              <div className="panel-inset camera-panel" style={{ position: 'relative' }}>
                <canvas ref={canvasRef} width="640" height="480" />
                <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }} />
              </div>
              <div className="hit-counter-row">
                <button className="retro-btn" onClick={zeroDisplacement} disabled={calibrationOffset === null}>Zero</button>
                <button className={`retro-btn ${isLocked ? 'danger' : 'primary'}`} onClick={toggleLock}>{isLocked ? 'Release' : 'Capture Reading'}</button>
                <button className="retro-btn" onClick={reset}>Reset</button>
              </div>
              <div className="stats-grid">
                <div className="result-card"><h3>Length</h3><p>{liveLength.toFixed(1)} cm</p></div>
                <div className="result-card"><h3>Index</h3><p>{liveRI.toFixed(4)}</p></div>
                <div className="result-card"><h3>Brix</h3><p>{liveBrix.toFixed(1)}</p></div>
              </div>
              <div className="stats-grid">
                <div className="result-card"><h3>Locked Length</h3><p>{isLocked ? savedLength.toFixed(1) : '—'}</p></div>
                <div className="result-card"><h3>Locked Index</h3><p>{isLocked ? savedRI.toFixed(4) : '—'}</p></div>
                <div className="result-card"><h3>Locked Brix</h3><p>{isLocked ? savedBrix.toFixed(1) : '—'}</p></div>
              </div>
              <div className="hit-counter-row">
                <div className="result-pill">Sensitivity: {threshold}</div>
                <input className="retro-input" type="range" min="150" max="245" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
              </div>
            </div>  
          </section>
        )}

        <section className="cta-window panel-outset bg-construction">
          <div className="title-bar"><span>Analysis</span></div>
          <div className="panel-content">
            <VerifiedResults verified={verifiedResults} />
            <AnalysisOutput text={apiResponse} loading={loading} />
            <div className="hit-counter-row">
              <button className="retro-btn primary" onClick={runAnalysis} disabled={loading}>Run Analysis</button>
              <a className="retro-btn retro-link" href="/health">Health Planner</a>
            </div>
          </div>
        </section>
      </div>

      <a className="retro-btn retro-link" href="/instructions">Click here for instructions</a>
    </main>
  );
}
