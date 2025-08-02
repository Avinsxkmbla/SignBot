import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { gestureRecognitionService } from '../services/gestureRecognition';
import { MotionDetectionOverlay } from './MotionDetectionOverlay';

export const VideoInput: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gestureQueue, setGestureQueue] = useState<string[]>([]);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const {
    isRecording,
    setIsRecording,
    setCameraPermission,
    setCurrentGesture,
    currentGesture,
    addMessage,
    setIsProcessing
  } = useAppStore();

  // Effect to initialize services and handle component cleanup
  useEffect(() => {
    const initialize = async () => {
      try {
        await gestureRecognitionService.initialize();
      } catch (err) {
        console.error('Failed to initialize gesture recognition:', err);
        setError('Failed to initialize gesture recognition system');
      }
    };
    initialize();

    // Cleanup function runs when component unmounts to release the camera
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty array ensures this runs only once on mount

  // Effect to handle the video stream when it becomes available
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const videoElement = videoRef.current;
    videoElement.srcObject = stream;

    const onLoadedMetadata = () => {
      videoElement.play().then(() => {
        setIsVideoReady(true);
      }).catch(err => {
        console.error('Error playing video:', err);
        setError('Could not start video playback.');
      });
    };

    videoElement.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [stream]);

  // CORE FIX: Declarative effect to run the gesture processing loop.
  // This loop starts/stops based on the state of `isRecording` and `isVideoReady`.
  useEffect(() => {
    let animationFrameId: number;

    const processFrame = async () => {
      if (!isRecording || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return; // Stop processing if conditions are not met
      }

      try {
        const gestureData = await gestureRecognitionService.processFrame(videoRef.current);
        
        // Update tracking data for the overlay regardless of confidence
        setTrackingData(gestureData);

        if (gestureData && gestureData.confidence > 0.7) {
          setCurrentGesture(gestureData.gesture);
          // Improvement: Only add a new gesture if it's different from the last one
          setGestureQueue(prev => {
            if (prev.length === 0 || prev[prev.length - 1] !== gestureData.gesture) {
              return [...prev, gestureData.gesture];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Gesture processing error:', err);
      }
      
      // Use requestAnimationFrame for a smoother, more efficient loop
      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isRecording && isVideoReady) {
      processFrame();
    }

    // Cleanup function to cancel the loop when effect re-runs or component unmounts
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRecording, isVideoReady, setCurrentGesture]); // Dependencies that control the loop

  const startCamera = async () => {
    if (stream) return; // Don't re-initialize if stream already exists
    
    try {
      setError(null);
      setIsVideoReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      setStream(mediaStream);
      setCameraPermission('granted');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      setError('Camera access denied. Please allow camera access to use sign language input.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    setCurrentGesture(null);
    setIsVideoReady(false);
    setTrackingData(null);
  };
  
  const startRecording = async () => {
    // If stream isn't ready, start it. The effect will handle starting the processing loop.
    if (!stream) {
      await startCamera();
    }
    setGestureQueue([]);
    setIsRecording(true);
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    setCurrentGesture(null);
    
    if (gestureQueue.length > 0) {
      setIsProcessing(true);
      const recognizedText = gestureRecognitionService.convertGestureToText(gestureQueue);
      
      addMessage({
        type: 'user',
        content: recognizedText,
        inputMethod: 'sign'
      });
      
      setIsProcessing(false);
      setGestureQueue([]); // Clear queue after processing
    }
    
    // UX CHOICE: Keep camera on for another recording. 
    // To turn off the camera on every stop, call `stopCamera()` here.
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Sign Language Input</h3>
        <div className="flex items-center gap-2">
          {currentGesture && (
            <motion.span
              key={currentGesture}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
            >
              {currentGesture}
            </motion.span>
          )}
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
        <AnimatePresence>
          {stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  opacity: isVideoReady ? 1 : 0,
                  transition: 'opacity 300ms ease-in-out',
                }}
                className="relative z-10"
              />
              {!isVideoReady && (
                <motion.div
                  key="loader"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-200 z-20"
                >
                  <div className="text-center">
                    <Loader2 size={32} className="mx-auto mb-2 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">Loading camera...</p>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center text-gray-500"
            >
              <div className="text-center">
                <Camera size={48} className="mx-auto mb-2 opacity-50" />
                <p>Camera access needed for sign language input</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isVideoReady && (
          <MotionDetectionOverlay
            videoRef={videoRef}
            trackingData={trackingData}
            isRecording={isRecording}
            gestureConfidence={trackingData?.confidence || 0}
          />
        )}

        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 border-2 border-red-400 rounded-lg pointer-events-none z-30"
            >
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                RECORDING
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
        >
          {error}
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        {!isRecording ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            disabled={!gestureRecognitionService.isInitialized()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Camera size={18} />
            Start Recording
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <CameraOff size={18} />
            Stop Recording
          </motion.button>
        )}

        {stream && !isRecording && (
          <button onClick={stopCamera} className="text-sm text-gray-500 hover:text-gray-700">
            Turn off camera
          </button>
        )}

        {gestureQueue.length > 0 && !isRecording && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};
