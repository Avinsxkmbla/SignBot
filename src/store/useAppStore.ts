import { create } from 'zustand';
import { AppState, Message } from '../types';

interface AppStore extends AppState {
  setCurrentMode: (mode: 'sign' | 'text') => void;
  setIsRecording: (recording: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setIsProcessing: (processing: boolean) => void;
  setCameraPermission: (permission: 'granted' | 'denied' | 'pending') => void;
  setCurrentGesture: (gesture: string | null) => void;
  clearMessages: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentMode: 'text',
  isRecording: false,
  messages: [],
  isProcessing: false,
  cameraPermission: 'pending',
  currentGesture: null,

  setCurrentMode: (mode) => set({ currentMode: mode }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]
  })),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setCameraPermission: (permission) => set({ cameraPermission: permission }),
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  clearMessages: () => set({ messages: [] })
}));