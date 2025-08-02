import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, MessageCircle, Settings } from 'lucide-react';
import { ModeToggle } from './components/ModeToggle';
import { VideoInput } from './components/VideoInput';
import { TextInput } from './components/TextInput';
import { Avatar } from './components/Avatar';
import { Transcript } from './components/Transcript';
import { useAppStore } from './store/useAppStore';
import { llmService } from './services/llmService';

function App() {
  const { currentMode, messages, addMessage, isProcessing, setIsProcessing } = useAppStore();
  const [isAvatarAnimating, setIsAvatarAnimating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');

  // Process latest user message
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    
    if (latestMessage && latestMessage.type === 'user' && !isProcessing && messages.length > 0) {
      handleUserMessage(latestMessage.content);
    }
  }, [messages, isProcessing]);

  const handleUserMessage = async (userInput: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await llmService.generateResponse(userInput);
      
      addMessage({
        type: 'bot',
        content: response,
        inputMethod: 'text' // Bot responses are always text, converted to sign language
      });

      // Animate avatar with response
      setCurrentResponse(response);
      setIsAvatarAnimating(true);
      
      // Stop animation after a delay
      setTimeout(() => {
        setIsAvatarAnimating(false);
        setCurrentResponse('');
      }, Math.max(response.split(' ').length * 600 + 1000, 2000)); // Minimum 2s animation
      
    } catch (error) {
      console.error('Error processing user message:', error);
      
      addMessage({
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your message right now. Please try again.",
        inputMethod: 'text'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white"
              >
                <Hand size={20} />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SignChat AI</h1>
                <p className="text-sm text-gray-600">Real-time Sign Language Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ModeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Settings size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-6">
            <AnimatePresence mode="wait">
              {currentMode === 'sign' ? (
                <motion.div
                  key="video-input"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <VideoInput />
                </motion.div>
              ) : (
                <motion.div
                  key="text-input"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TextInput />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Hello', 'Thank you', 'Help me', 'How are you?'].map((phrase) => (
                  <motion.button
                    key={phrase}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserMessage(phrase)}
                    disabled={isProcessing}
                    className="p-3 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {phrase}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Avatar */}
          <div className="lg:col-span-1">
            <Avatar isAnimating={isAvatarAnimating} currentText={currentResponse} />
          </div>

          {/* Right Column - Transcript */}
          <div className="lg:col-span-1">
            <Transcript />
          </div>
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-4"
        >
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                System Active
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle size={14} />
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span>Mode: {currentMode === 'sign' ? 'Sign Language' : 'Text Input'}</span>
              {isProcessing && (
                <span className="flex items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Processing...
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              SignChat AI - Bridging communication through technology
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Built with accessibility and inclusivity in mind
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;