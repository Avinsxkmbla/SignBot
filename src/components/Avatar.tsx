import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { avatarService } from '../services/avatarService';

interface AvatarProps {
  isAnimating: boolean;
  currentText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ isAnimating, currentText }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      avatarService.initialize(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (currentText && isAnimating) {
      avatarService.animateText(currentText);
    }
  }, [currentText, isAnimating]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Sign Language Assistant</h3>
        {isAnimating && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-3 bg-green-500 rounded-full"
          />
        )}
      </div>

      <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
        
        {!isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center text-gray-400"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🤟</div>
              <p className="text-sm">Ready to help you</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};