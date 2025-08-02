export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  inputMethod: 'sign' | 'text';
  timestamp: Date;
}

export interface GestureData {
  landmarks: number[][];
  confidence: number;
  gesture: string;
}

export interface AvatarAnimation {
  name: string;
  keyframes: AvatarKeyframe[];
  duration: number;
}

export interface AvatarKeyframe {
  timestamp: number;
  leftArm: { x: number; y: number; rotation: number };
  rightArm: { x: number; y: number; rotation: number };
  head: { rotation: number };
  expression: 'neutral' | 'happy' | 'questioning';
}

export interface AppState {
  currentMode: 'sign' | 'text';
  isRecording: boolean;
  messages: Message[];
  isProcessing: boolean;
  cameraPermission: 'granted' | 'denied' | 'pending';
  currentGesture: string | null;
}