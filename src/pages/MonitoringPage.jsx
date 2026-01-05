import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Volume2, StopCircle, Target, Zap, Bell, Mail } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useDetection } from '../hooks/useDetection';
import { saveDetection } from '../utils/storage';
import { useRef, useState, useEffect } from 'react';
import { audioManager } from '../utils/audioManager';
import { sendAlertEmail } from '../utils/emailService';
import DebugConsole from '../components/DebugConsole';

export default function MonitoringPage() {
    const navigate = useNavigate();
    const { videoRef, error, isStreaming, startCamera, stopCamera, logs } = useCamera();

    // Night Vision States
    const [brightness, setBrightness] = useState(100);

    // Confidence Threshold State
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.90);

    const { detections, isDetecting, startDetection, stopDetection, modelLoaded } = useDetection(isStreaming, videoRef, confidenceThreshold);

    const [isAlarmActive, setIsAlarmActive] = useState(false);

    // Preventive Action States
    const [flashActive, setFlashActive] = useState(false);
    const [sirenActive, setSirenActive] = useState(false);

    // ROI State (Simple centered box 60% x 60% for now - adjustable prototype)
    const [roi, setRoi] = useState({ x: 20, y: 20, width: 60, height: 60 });
    const [showRoiControl, setShowRoiControl] = useState(false);

    // Email Throttling State
    const [lastEmailTime, setLastEmailTime] = useState(0);

    // Continuous Alarm Logic
    const startAlarm = () => {
        if (isAlarmActive) return;
        setIsAlarmActive(true);
        audioManager.playSiren();
    };

    const stopAlarm = () => {
        setIsAlarmActive(false);
        audioManager.stopSiren();
    };

    const isInsideRoi = (box) => {
        if (!showRoiControl && roi.width === 100 && roi.height === 100) return true; // Full screen default if hidden? 
        // Logic: specific ROI is active
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        return (
            centerX >= roi.x && centerX <= (roi.x + roi.width) &&
            centerY >= roi.y && centerY <= (roi.y + roi.height)
        );
    };

    useEffect(() => {
        startCamera();
        // Also ensure audio is initialized if user deep-linked (less common but good fallback)
        // audioManager.initialize(); 
        // Note: initializing here might fail autoplay blocks, relying on HomePage is better.

        return () => {
            stopAlarm();
            stopCamera();
        };
    }, []);

    // Alert & Logic Trigger
    useEffect(() => {
        // 1. Get Confirmed Detection (Time Based)
        const confirmedAnimals = detections.filter(d => d.status === 'confirmed');

        // 2. Filter by ROI (Space Based)
        const animalsInRoi = confirmedAnimals.filter(d => isInsideRoi(d.box));

        if (animalsInRoi.length > 0) {
            // Save to history (has built-in spam prevention in storage.js)
            animalsInRoi.forEach(animal => {
                saveDetection(animal);
            });

            if (!isAlarmActive) {
                startAlarm();
                if (navigator.vibrate) navigator.vibrate([1000, 500, 1000]);

                // 3. Send Email (Throttled: Once every 60 seconds)
                const now = Date.now();
                if (now - lastEmailTime > 60000) {
                    sendAlertEmail(animalsInRoi[0], animalsInRoi.length);
                    setLastEmailTime(now);
                    console.log(`[EMAIL SENT]: ${animalsInRoi.length} ${animalsInRoi[0].label}(s)`);
                }
            }
        } else {
            // STOP Alarm if the animal leaves the ROI!
            // (Optional: User asked for manual stop, but usually if threat is gone, auto-stop is good? 
            // User said "Continuous until stopped". I will stick to Manual Stop for safety as requested.)
        }
    }, [detections, roi, isAlarmActive, lastEmailTime]); // Added isAlarmActive to dependencies to prevent re-triggering if already active

    useEffect(() => {
        if (isStreaming) {
            startDetection();
        }
    }, [isStreaming]);

    // ROI Interaction State
    const containerRef = useRef(null);
    const [interaction, setInteraction] = useState({ mode: 'none', startX: 0, startY: 0, startRoi: null });

    // Unified Handler for Start
    const handleStart = (e, mode) => {
        e.stopPropagation();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        setInteraction({
            mode: mode,
            startX: clientX,
            startY: clientY,
            startRoi: { ...roi }
        });
    };

    // Unified Handler for Move
    const handleMove = (e) => {
        if (interaction.mode === 'none' || !containerRef.current) return;

        // Prevent scrolling on touch, no effect on mouse usually but good practice
        // if (e.cancelable) e.preventDefault(); 

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = containerRef.current.getBoundingClientRect();

        const deltaXPixels = clientX - interaction.startX;
        const deltaYPixels = clientY - interaction.startY;

        const deltaX = (deltaXPixels / rect.width) * 100;
        const deltaY = (deltaYPixels / rect.height) * 100;

        let newRoi = { ...interaction.startRoi };

        if (interaction.mode === 'drag') {
            newRoi.x = Math.max(0, Math.min(100 - newRoi.width, newRoi.x + deltaX));
            newRoi.y = Math.max(0, Math.min(100 - newRoi.height, newRoi.y + deltaY));
        } else if (interaction.mode === 'resize') {
            newRoi.width = Math.max(10, Math.min(100 - newRoi.x, newRoi.width + deltaX));
            newRoi.height = Math.max(10, Math.min(100 - newRoi.y, newRoi.height + deltaY));
        }

        setRoi(newRoi);
    };

    const handleEnd = () => {
        setInteraction({ mode: 'none', startX: 0, startY: 0, startRoi: null });
    };

    return (
        <div
            ref={containerRef}
            className="fullscreen-container"
            style={{ background: 'black', touchAction: 'none', userSelect: 'none' }}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            <DebugConsole logs={logs} />
            {/* Top Stats Bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
                padding: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    {detections.length > 0 && (
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                            {detections.length} Animal(s) Visible
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* ROI Toggle */}
                    <div onClick={() => setShowRoiControl(!showRoiControl)} style={{ cursor: 'pointer', color: showRoiControl ? 'var(--color-primary)' : 'white' }}>
                        <Target size={24} />
                        {showRoiControl && <span style={{ fontSize: '0.6rem', display: 'block' }}>ROI</span>}
                    </div>

                    {/* Brightness Slider */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                        <label style={{ fontSize: '0.7rem', marginBottom: '2px' }}> Bright: {brightness}%</label>
                        <input
                            type="range"
                            min="50"
                            max="200"
                            step="10"
                            value={brightness}
                            onChange={(e) => setBrightness(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Confidence Slider */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                        <label style={{ fontSize: '0.7rem', marginBottom: '2px' }}>Conf: {Math.round(confidenceThreshold * 100)}%</label>
                        <input
                            type="range"
                            min="0.5"
                            max="0.95"
                            step="0.05"
                            value={confidenceThreshold}
                            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            {/* Multi-Animal Warning */}
            {detections.filter(d => d.status === 'confirmed').length > 1 && (
                <div style={{
                    position: 'absolute', top: '70px', left: 0, right: 0, zIndex: 25,
                    background: 'var(--color-danger)', color: 'white',
                    padding: '1rem', textAlign: 'center',
                    animation: 'pulse-red 1.5s infinite',
                    fontWeight: 'bold', fontSize: '1.1rem'
                }}>
                    ⚠️ DANGER: {detections.filter(d => d.status === 'confirmed').length} animals detected! Be extremely careful if going outside.
                </div>
            )}

            {/* Camera Layer */}
            {/* Loading State */}
            {!isStreaming && !error && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#111', color: '#888', zIndex: 5
                }}>
                    <div className="loader" style={{ marginBottom: '1rem' }}></div> {/* Assuming global loader css or just text */}
                    <p>Initializing Camera...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#111', color: 'var(--color-danger)', zIndex: 10, padding: '2rem', textAlign: 'center'
                }}>
                    <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Camera Error</p>
                    <p>{error}</p>
                    <button
                        className="btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => startCamera()}
                    >
                        Retry
                    </button>
                </div>
            )}

            <video
                ref={videoRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: isStreaming ? 1 : 0,
                    filter: `brightness(${brightness}%)`
                }}
                autoPlay playsInline muted
            />

            {/* ROI Overlay */}
            {showRoiControl && (
                <>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 14, pointerEvents: 'none' }}></div>

                    <div
                        style={{
                            position: 'absolute',
                            border: '3px dashed var(--color-primary)',
                            background: 'rgba(47, 172, 102, 0.2)',
                            left: `${roi.x}%`, top: `${roi.y}%`, width: `${roi.width}%`, height: `${roi.height}%`,
                            zIndex: 15,
                            touchAction: 'none',
                            cursor: 'move'
                        }}
                        onTouchStart={(e) => handleStart(e, 'drag')}
                        onMouseDown={(e) => handleStart(e, 'drag')}
                    >
                        {/* Label */}
                        <div style={{ position: 'absolute', top: -30, left: 0, background: 'var(--color-primary)', color: 'black', fontSize: '0.9rem', padding: '4px 8px', fontWeight: 'bold' }}>
                            Scan Area
                        </div>

                        {/* Resize Handle */}
                        <div
                            style={{
                                position: 'absolute', bottom: -15, right: -15,
                                width: 44, height: 44,
                                background: 'white', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                                zIndex: 16,
                                cursor: 'nwse-resize'
                            }}
                            onTouchStart={(e) => handleStart(e, 'resize')}
                            onMouseDown={(e) => handleStart(e, 'resize')}
                        >
                            <Target size={24} color="black" />
                        </div>
                    </div>
                </>
            )}

            {/* Detections Overlay */}
            {isDetecting && detections.map(det => {
                const inRoi = isInsideRoi(det.box);
                // Status is 'confirmed' (time) AND 'inRoi' (space) -> DANGER
                const isDanger = det.status === 'confirmed' && inRoi;

                let borderColor = 'var(--color-warning)'; // Default Yellow (Verifying)
                let bgColor = 'var(--color-warning)';

                if (isDanger) {
                    borderColor = 'var(--color-danger)'; // Red
                    bgColor = 'var(--color-danger)';
                } else if (det.status === 'confirmed' && !inRoi) {
                    borderColor = '#999'; // Gray (Ignored outside ROI)
                    bgColor = '#999';
                }

                return (
                    <div key={det.id} style={{
                        position: 'absolute',
                        left: `${det.box.x}%`, top: `${det.box.y}%`, width: `${det.box.width}%`, height: `${det.box.height}%`,
                        border: `4px solid ${borderColor}`,
                        zIndex: 10,
                        opacity: inRoi ? 1 : 0.6, // Dim outside detections
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            background: bgColor,
                            color: 'black', fontWeight: 'bold', padding: '0.2rem 0.5rem', display: 'inline-block'
                        }}>
                            {det.label} {Math.round(det.confidence * 100)}%
                            {det.status === 'verifying' && ' ⏳'}
                            {!inRoi && ' (Ignored)'}
                        </div>
                        {isDanger && (
                            <div className="alert-pulse" style={{ position: 'absolute', inset: -10, border: '2px solid red', borderRadius: 4 }}></div>
                        )}
                    </div>
                );
            })}

            {/* Guide Text for ROI */}
            {showRoiControl && (
                <div style={{
                    position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 25,
                    background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem', borderRadius: 20,
                    color: 'white', fontSize: '0.9rem', whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                }}>
                    Drag box to move • Drag circle to resize
                </div>
            )}

            {/* Actions Bar (Bottom) */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
                background: 'rgba(15, 17, 21, 0.9)', padding: '1rem',
                borderTop: '1px solid #333'
            }}>
                {isAlarmActive ? (
                    <button className="btn-danger w-full" onClick={stopAlarm} style={{ animation: 'pulse-red 1s infinite' }}>
                        <StopCircle size={32} /> STOP ALARM ({detections.length})
                    </button>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ background: sirenActive ? 'orange' : '#333', color: sirenActive ? 'black' : 'white' }}
                            onClick={() => {
                                const newState = !sirenActive;
                                setSirenActive(newState);
                                if (newState) {
                                    startAlarm(); // MANUALLY TRIGGER ALARM
                                } else {
                                    stopAlarm();
                                }
                            }}
                        >
                            <Bell size={24} /> Test Siren
                        </button>
                    </div>
                )}
            </div>

            {/* Visual Flash Effect */}
            {flashActive && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'white', zIndex: 5,
                    animation: 'pulse-red 0.1s infinite', opacity: 0.5
                }}></div>
            )}
        </div>
    );
}
