import { useState, useEffect, useCallback, useRef } from 'react';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export function useDetection(isCameraReady, videoRef, confidenceThreshold = 0.90) {
  // Configuration
  const PERSISTENCE_DURATION = 1000;
  const ALLOWED_CLASSES = ['elephant', 'bear'];


  const [detections, setDetections] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [model, setModel] = useState(null);
  const requestRef = useRef();
  const persistenceRef = useRef({}); // Stores { 'label': firstSeenTime }

  // Load Model
  useEffect(() => {
    async function loadModel() {
      try {
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        setModel(loadedModel);
        console.log("AI Model Loaded");
      } catch (err) {
        console.error("Failed to load AI model", err);
      }
    }
    loadModel();
  }, []);

  const detectFrame = async () => {
    if (videoRef.current && videoRef.current.readyState === 4 && model && isDetecting) {
      const predictions = await model.detect(videoRef.current);
      const now = Date.now();

      // 1. Strict Filter (Class + Score)
      const rawDetections = predictions.filter(p => {
        return p.score >= confidenceThreshold && ALLOWED_CLASSES.includes(p.class.toLowerCase());
      });

      // 2. Persistence Logic
      const currentLabels = rawDetections.map(d => d.class);
      const confirmedDetections = [];

      // Update Persistence Tracker
      // Check current detections against tracker
      currentLabels.forEach(label => {
        if (!persistenceRef.current[label]) {
          persistenceRef.current[label] = now; // Start tracking
        }
      });

      // Clean up tracker: Remove labels NOT in current frame, BUT be careful about flickering.
      // Strict removal here: if it misses a frame, it resets. 
      // This is why 2000ms was hard. 1000ms is easier. 
      Object.keys(persistenceRef.current).forEach(label => {
        if (!currentLabels.includes(label)) {
          delete persistenceRef.current[label]; // Reset if animal disappears
        }
      });

      // 3. Build Final Result List
      const results = rawDetections.map(p => {
        const label = p.class;
        const firstSeen = persistenceRef.current[label];
        const duration = now - firstSeen;
        const isConfirmed = duration > PERSISTENCE_DURATION;

        return {
          id: label + firstSeen, // Unique ID based on instance
          label: label.charAt(0).toUpperCase() + label.slice(1),
          confidence: p.score,
          status: isConfirmed ? 'confirmed' : 'verifying',
          duration: duration,
          box: {
            x: (p.bbox[0] / videoRef.current.videoWidth) * 100,
            y: (p.bbox[1] / videoRef.current.videoHeight) * 100,
            width: (p.bbox[2] / videoRef.current.videoWidth) * 100,
            height: (p.bbox[3] / videoRef.current.videoHeight) * 100
          }
        };
      });

      setDetections(results);
      requestRef.current = requestAnimationFrame(detectFrame);
    } else {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
  };

  const startDetection = useCallback(() => {
    if (!model) return;
    setIsDetecting(true);
  }, [model]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setDetections([]);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  // Loop
  useEffect(() => {
    if (isDetecting && isCameraReady) {
      detectFrame();
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDetecting, isCameraReady, model, confidenceThreshold]);

  return { detections, isDetecting, startDetection, stopDetection, modelLoaded: !!model };
}
