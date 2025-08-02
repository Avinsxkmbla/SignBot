import React from 'react';
import { motion } from 'framer-motion';
import { Video, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ModeToggle: React.FC = () => {
  const { currentMode, setCurrentMode } = useAppStore();

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentMode('text')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          currentMode === 'text'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <MessageSquare size={18} />
        Text Input
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentMode('sign')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          currentMode === 'sign'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <Video size={18} />
        Sign Language
      </motion.button>
    </div>
  );
};