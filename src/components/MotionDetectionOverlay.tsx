import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MotionDetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  trackingData: any;
  isRecording: boolean;
  gestureConfidence: number;
}

interface TrackingPoint {
  x: number;
  y: number;
  confidence: number;
}

interface HandLandmarks {
  landmarks: TrackingPoint[];
  connections: number[][];
}

export const MotionDetectionOverlay: React.FC<MotionDetectionOverlayProps> = ({
  videoRef,
  trackingData,
  isRecording,
  gestureConfidence
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        setOverlayDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef]);

  useEffect(() => {
    if (isRecording && trackingData) {
      drawOverlay();
    } else {
      clearOverlay();
    }
  }, [trackingData, isRecording, gestureConfidence]);

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up canvas dimensions to match video
    canvas.width = overlayDimensions.width;
    canvas.height = overlayDimensions.height;

    // Generate simulated hand landmarks for demonstration
    const handLandmarks = generateSimulatedLandmarks(canvas.width, canvas.height);
    
    // Determine overlay color based on gesture confidence
    const overlayColor = getOverlayColor(gestureConfidence);
    
    // Draw hand landmarks and connections
    drawHandLandmarks(ctx, handLandmarks, overlayColor);
    
    // Draw confidence indicator
    drawConfidenceIndicator(ctx, gestureConfidence, overlayColor);
    
    // Draw gesture label if detected
    if (trackingData?.gesture) {
      drawGestureLabel(ctx, trackingData.gesture, overlayColor);
    }

    // Continue animation loop
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(drawOverlay);
    }
  };

  const clearOverlay = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const generateSimulatedLandmarks = (width: number, height: number): HandLandmarks => {
    // Simulate hand landmarks (21 points for a hand)
    const landmarks: TrackingPoint[] = [];
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    
    // Generate realistic hand landmark positions
    const handPoints = [
      // Wrist
      { x: 0, y: 0.3 },
      // Thumb
      { x: -0.15, y: 0.1 }, { x: -0.2, y: 0 }, { x: -0.25, y: -0.1 }, { x: -0.3, y: -0.15 },
      // Index finger
      { x: -0.1, y: -0.1 }, { x: -0.1, y: -0.2 }, { x: -0.1, y: -0.3 }, { x: -0.1, y: -0.35 },
      // Middle finger
      { x: 0, y: -0.1 }, { x: 0, y: -0.25 }, { x: 0, y: -0.35 }, { x: 0, y: -0.4 },
      // Ring finger
      { x: 0.1, y: -0.1 }, { x: 0.1, y: -0.2 }, { x: 0.1, y: -0.3 }, { x: 0.1, y: -0.35 },
      // Pinky
      { x: 0.2, y: -0.05 }, { x: 0.2, y: -0.15 }, { x: 0.2, y: -0.25 }, { x: 0.2, y: -0.3 },
      // Palm
      { x: 0.05, y: 0.1 }
    ];

    handPoints.forEach((point, index) => {
      // Add some natural movement variation
      const variation = Math.sin(Date.now() * 0.001 + index) * 0.02;
      landmarks.push({
        x: centerX + (point.x * 150) + (variation * 20),
        y: centerY + (point.y * 150) + (variation * 15),
        confidence: 0.8 + Math.random() * 0.2
      });
    });

    // Define hand connections (simplified)
    const connections = [
      // Thumb connections
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm connections
      [5, 9], [9, 13], [13, 17]
    ];

    return { landmarks, connections };
  };

  const getOverlayColor = (confidence: number): string => {
    if (confidence > 0.8) return '#10B981'; // Green for high confidence
    if (confidence > 0.6) return '#F59E0B'; // Yellow for medium confidence
    return '#EF4444'; // Red for low confidence
  };

  const drawHandLandmarks = (ctx: CanvasRenderingContext2D, handData: HandLandmarks, color: string) => {
    const { landmarks, connections } = handData;

    // Draw connections first (lines between landmarks)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.confidence > 0.5 && end.confidence > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    });

    // Draw landmarks (points)
    ctx.globalAlpha = 1;
    landmarks.forEach((landmark, index) => {
      if (landmark.confidence > 0.5) {
        const radius = index === 0 ? 6 : 4; // Larger point for wrist
        
        // Draw outer circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw inner circle for better visibility
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, radius - 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  const drawConfidenceIndicator = (ctx: CanvasRenderingContext2D, confidence: number, color: string) => {
    const barWidth = 100;
    const barHeight = 8;
    const x = 20;
    const y = 20;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Confidence bar
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth * confidence, barHeight);

    // Label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Confidence: ${Math.round(confidence * 100)}%`, x, y - 5);
  };

  const drawGestureLabel = (ctx: CanvasRenderingContext2D, gesture: string, color: string) => {
    const x = 20;
    const y = 50;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 5, y - 20, 150, 25);

    // Text
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Detected: ${gesture}`, x, y);
  };

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isRecording ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        width: '100%',
        height: '100%',
        transform: 'scaleX(-1)' // Mirror to match video
      }}
    />
  );
};