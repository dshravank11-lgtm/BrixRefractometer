'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Layers, CheckCircle2, Sliders } from 'lucide-react';

export default function SmartRefractometer() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Application Flow Control
    const [setupStep, setSetupStep] = useState('input_distance'); // input_distance -> click_paper_edges -> active_run
    const [hasStream, setHasStream] = useState(false);

    // Clean Calibration Constants
    const [prismDistance, setPrismDistance] = useState('2500');
    const [clickPoints, setClickPoints] = useState([]); // Stores the two X coordinates of the paper edges
    const [mmPerPixel, setMmPerPixel] = useState(0.55);
    const [baseXWater, setBaseXWater] = useState(320);

    // Live Laser Telemetry
    const [threshold, setThreshold] = useState(190);
    const [liveX, setLiveX] = useState(320);
    const [liveAngle, setLiveAngle] = useState(23.6);
    const [liveBrix, setLiveBrix] = useState(0.0);
    const [lockedAngle, setLockedAngle] = useState(23.6);
    const [minBrixObserved, setMinBrixObserved] = useState(99.0);

    const [apiResponse, setApiResponse] = useState("Slowly turn your prism until the sugar concentration hits its lowest turning point...");
    const [loading, setLoading] = useState(false);

    // High-contrast HSV isolation converter
    const rgbToHsv = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
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

    const startCameraInput = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "environment" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setHasStream(true);
                setSetupStep('click_paper_edges');
            }
        } catch (err) {
            alert("Camera access denied. Please allow camera permissions in your browser address bar.");
        }
    };

    // Click handler to register left/right paper boundaries
    const handleCanvasClick = (e) => {
        if (setupStep !== 'click_paper_edges') return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Translate click coordinate to native 640x480 resolution space
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;

        if (clickPoints.length < 2) {
            const updatedPoints = [...clickPoints, x];
            setClickPoints(updatedPoints);

            // When both edges are registered, resolve pixel scaling factor instantly
            if (updatedPoints.length === 2) {
                const pixelDelta = Math.abs(updatedPoints[1] - updatedPoints[0]);
                const paperLongSideMm = 297; // Static fixed assumption for user simplicity
                const calculatedScale = paperLongSideMm / pixelDelta;

                setMmPerPixel(calculatedScale);
                setBaseXWater((updatedPoints[0] + updatedPoints[1]) / 2); // Set frame center point
                setSetupStep('active_run');
            }
        }
    };

    useEffect(() => {
        if (!hasStream) return;
        let animationFrameId;

        const processFrame = () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                if (video.readyState >= video.HAVE_CURRENT_DATA) {
                    // Explicitly mirror the active hardware stream onto our display viewport canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Setup Overlay View Mode
                    if (setupStep === 'click_paper_edges') {
                        ctx.fillStyle = '#22d3ee';
                        clickPoints.forEach(pt => {
                            ctx.beginPath(); ctx.arc(pt, canvas.height / 2, 10, 0, 2 * Math.PI); ctx.fill();
                        });

                        // Draw baseline crosshair helpers
                        ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
                    }

                    // Measurement Tracker Processing Mode
                    if (setupStep === 'active_run') {
                        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = frame.data;
                        let targetX = -1, targetY = -1, highestValue = 0;

                        for (let i = 0; i < data.length; i += 16) {
                            const r = data[i], g = data[i + 1], b = data[i + 2];
                            const [h, s, v] = rgbToHsv(r, g, b);

                            // Filter out the brown cardboard background by isolating high saturation red
                            if ((h < 18 || h > 342) && s > 0.55 && v > 0.80) {
                                if (v > highestValue) {
                                    highestValue = v;
                                    const pixelIndex = i / 4;
                                    targetX = pixelIndex % canvas.width;
                                    targetY = Math.floor(pixelIndex / canvas.width);
                                }
                            }
                        }

                        if (targetX !== -1) {
                            setLiveX(targetX);
                            ctx.strokeStyle = '#ef4444';
                            ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.arc(targetX, targetY, 14, 0, 2 * Math.PI); ctx.stroke();

                            const lPrism = parseFloat(prismDistance) || 2500;
                            const pixelShift = targetX - baseXWater;
                            const deltaXMm = pixelShift * mmPerPixel;

                            const computedAngle = 23.6 + (Math.atan(deltaXMm / lPrism) * (180.0 / Math.PI));
                            const radAngle = ((60.0 + computedAngle) / 2.0) * (Math.PI / 180.0);
                            const refIndex = Math.sin(radAngle) / 0.5;

                            let brix = (refIndex - 1.3333) / 0.00143;
                            if (brix < 0) brix = 0.0;

                            setLiveAngle(computedAngle);
                            setLiveBrix(brix);

                            if (brix > 0.1 && brix < minBrixObserved) {
                                setMinBrixObserved(brix);
                                setLockedAngle(computedAngle);
                            }
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(processFrame);
        };

        processFrame();
        return () => cancelAnimationFrame(animationFrameId);
    }, [hasStream, setupStep, threshold, prismDistance, mmPerPixel, baseXWater, minBrixObserved, clickPoints]);

    const fetchCloudReport = async () => {
        if (minBrixObserved === 99.0) return;
        setLoading(true);
        setApiResponse("Loading report...");
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ angle: lockedAngle, brix: minBrixObserved })
            });
            const data = await res.json();
            setApiResponse(data.analysis || data.error);
        } catch (err) {
            setApiResponse(`Connection failure: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#090d16] p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl flex flex-col gap-5">

                {/* Simple Header */}
                <header className="border border-slate-800 bg-[#0f172a] rounded-xl p-5 flex justify-between items-center shadow-md">
                    <div>
                        <h1 className="text-xl font-bold tracking-wide text-white">Laser Refractometer</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Laser spot tracking and concentration tracker</p>
                    </div>
                    {setupStep === 'active_run' && (
                        <button onClick={() => { setSetupStep('input_distance'); setClickPoints([]); setMinBrixObserved(99.0); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-all">
                            Reset Calibration
                        </button>
                    )}
                </header>

                {/* Hidden internal video capture pipeline feed source */}
                <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                {/* STEP 1: PRISM DISTANCE ENTRY */}
                {setupStep === 'input_distance' && (
                    <section className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <Layers className="w-4 h-4 text-sky-400" />
                            <h2 className="text-sm font-semibold text-slate-200">Prism Setup Configuration</h2>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Prism to Wall Distance (mm)</label>
                            <input type="number" value={prismDistance} onChange={e => setPrismDistance(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-mono-lab focus:outline-none focus:border-sky-500" placeholder="e.g. 2500" />
                        </div>
                        <button onClick={() => { if (prismDistance) startCameraInput(); else alert('Please enter your prism-to-wall distance.'); }} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl shadow-md text-sm transition-all">
                            Turn On Camera
                        </button>
                    </section>
                )}

                {/* STEP 2: POSITION CALIBRATION SELECTION MARKERS OVERLAY PANEL */}
                {setupStep === 'click_paper_edges' && (
                    <section className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
                        <div className="bg-sky-950/40 border border-sky-900/50 rounded-lg p-3 text-xs text-sky-300">
                            <strong>Quick Calibration:</strong> Please stick a standard sheet of A4 paper horizontally on your wall. Click the <strong>Left edge</strong> of the paper on the screen below, then click the <strong>Right edge</strong>.
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-950 shadow-inner">
                            <canvas ref={canvasRef} width="640" height="480" onClick={handleCanvasClick} className="w-full h-full object-cover bg-slate-950" />
                        </div>
                        <div className="text-xs text-slate-400 text-center font-mono-lab py-1">
                            Selected Targets: {clickPoints.length} / 2
                        </div>
                    </section>
                )}

                {/* STEP 3: RUN AUTOMATED METRIC TELEMETRY ANALYSIS PASS */}
                {setupStep === 'active_run' && (
                    <>
                        <section className="bg-black rounded-xl overflow-hidden border border-slate-800 shadow-xl aspect-video">
                            <canvas ref={canvasRef} width="640" height="480" className="w-full h-full object-cover" />
                        </section>

                        <section className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-md text-xs flex flex-col gap-2">
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Laser Filtering Threshold:</span>
                                <span className="text-sky-400 font-mono-lab font-bold text-sm">{threshold}</span>
                            </div>
                            <input type="range" min="130" max="240" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-sky-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none" />
                        </section>

                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Reading</p>
                                <h3 className="text-3xl font-bold text-sky-400 mt-1 font-mono-lab">{liveBrix.toFixed(2)}% <span className="text-xs font-normal text-slate-500">Brix</span></h3>
                            </div>
                            <div className="bg-[#0e221b] border border-emerald-950 p-5 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Lowest Point Locked</p>
                                <h3 className="text-3xl font-bold text-emerald-400 mt-1 font-mono-lab">
                                    {minBrixObserved === 99.0 ? "0.00" : minBrixObserved.toFixed(2)}% <span className="text-xs font-normal text-emerald-600">Brix</span>
                                </h3>
                            </div>
                        </section>

                        <section className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                            <div className="bg-[#050914] rounded-lg p-4 min-h-[90px] border border-slate-950 font-mono-lab text-xs text-sky-200/90 leading-relaxed">
                                {loading ? (
                                    <div className="flex items-center gap-2.5 text-slate-400 animate-pulse py-2">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                                        <span>Processing metrics matrix data pass...</span>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-line">{apiResponse}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={fetchCloudReport} disabled={minBrixObserved === 99.0 || loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md text-sm flex items-center justify-center">
                                    View Report
                                </button>
                                <button onClick={() => { setMinBrixObserved(99.0); setLockedAngle(23.6); setApiResponse("Data cache cleared."); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-5 rounded-xl transition-all text-sm border border-slate-700">
                                    Reset Metrics
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}