import { useState, useRef, useEffect } from 'react';

export function useCamera() {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const streamRef = useRef(null);
    const isMounted = useRef(false); // Track mount state
    const [logs, setLogs] = useState([]); // Internal logs for debug console

    // Helper to add logs to state
    const log = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        console.log(`[CameraHook] ${message}`);
        setLogs(prev => [...prev, { time, message, type }].slice(-50));
    };

    const startCamera = async () => {
        log("startCamera() initiated.");
        setError(null);
        setIsStreaming(false);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("navigator.mediaDevices not supported");
            }

            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            log(`Requesting User Media: ${JSON.stringify(constraints)}`);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            log(`Stream acquired. ID: ${stream.id}, Active: ${stream.active}. Tracks: ${stream.getTracks().length}`);

            if (!isMounted.current) {
                log("Component unmounted after stream acquisition. Stopping tracks.", 'warn');
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            // Cleanup previous
            if (streamRef.current) {
                log("Stopping previous stream tracks...");
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            streamRef.current = stream;

            if (videoRef.current) {
                log("Attaching stream to videoRef.");
                videoRef.current.srcObject = stream;

                // Handling play()
                // IMPORTANT: We use onloadedmetadata to ensure we are ready to play
                videoRef.current.onloadedmetadata = () => {
                    log("Event: onloadedmetadata fired.");
                    if (!videoRef.current) return;

                    const playPromise = videoRef.current.play();

                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                if (isMounted.current) {
                                    log("Video playing successfully.");
                                    setIsStreaming(true);
                                }
                            })
                            .catch(e => {
                                log(`Play error: ${e.message}`, 'error');
                                if (isMounted.current) {
                                    setError(`Playback Failed: ${e.name}`);
                                }
                            });
                    } else {
                        log("Video.play() returned undefined (older browser?). Assuming playing.");
                        setIsStreaming(true);
                    }
                };
            } else {
                log("Internal Error: videoRef.current is null!", 'error');
                setError("Internal Error: Video element missing");
            }

        } catch (err) {
            log(`Catch Error: ${err.name} - ${err.message}`, 'error');
            if (!isMounted.current) return;

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Camera permission denied. Check browser settings.");
            } else if (err.name === 'NotFoundError') {
                setError("No camera device found.");
            } else if (err.name === 'NotReadableError') {
                setError("Camera hardware error or in use by another app.");
            } else {
                setError(`Camera Error: ${err.message}`);
            }
            setIsStreaming(false);
        }
    };

    const stopCamera = () => {
        log("stopCamera() called.");
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                log(`Track stopped: ${track.kind}`);
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    // Mount/Unmount tracking
    useEffect(() => {
        isMounted.current = true;
        log("Hook mounted.");
        return () => {
            log("Hook unmounting.");
            isMounted.current = false;
            stopCamera();
        };
    }, []);

    return { videoRef, error, isStreaming, startCamera, stopCamera, logs };
}
