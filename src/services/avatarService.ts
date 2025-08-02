import { AvatarAnimation, AvatarKeyframe } from '../types';

export class AvatarService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentAnimation: AvatarAnimation | null = null;
  private animationStartTime: number = 0;
  private isAnimating: boolean = false;

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.setupCanvas();
  }

  private setupCanvas() {
    if (!this.canvas || !this.ctx) return;

    // Get the actual display size
    const rect = this.canvas.getBoundingClientRect();
    
    // Ensure we have valid dimensions
    if (rect.width === 0 || rect.height === 0) {
      // Fallback dimensions
      this.canvas.width = 400;
      this.canvas.height = 400;
      this.canvas.style.width = '400px';
      this.canvas.style.height = '400px';
      return;
    }

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  async animateText(text: string): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    const animation = this.textToAnimation(text);
    await this.playAnimation(animation);
  }

  private textToAnimation(text: string): AvatarAnimation {
    const words = text.toLowerCase().split(' ');
    const keyframes: AvatarKeyframe[] = [];
    let currentTime = 0;

    // Add initial neutral pose
    keyframes.push({
      timestamp: currentTime,
      leftArm: { x: 0, y: 0, rotation: 0 },
      rightArm: { x: 0, y: 0, rotation: 0 },
      head: { rotation: 0 },
      expression: 'neutral'
    });

    words.forEach((word, index) => {
      currentTime += 500; // 500ms per word
      const gesture = this.getGestureForWord(word);
      keyframes.push({
        timestamp: currentTime,
        ...gesture,
        expression: this.getExpressionForWord(word)
      });
    });

    // Return to neutral
    currentTime += 500;
    keyframes.push({
      timestamp: currentTime,
      leftArm: { x: 0, y: 0, rotation: 0 },
      rightArm: { x: 0, y: 0, rotation: 0 },
      head: { rotation: 0 },
      expression: 'neutral'
    });

    return {
      name: 'text-response',
      keyframes,
      duration: currentTime
    };
  }

  private getGestureForWord(word: string) {
    const gestures: Record<string, any> = {
      'hello': {
        leftArm: { x: -30, y: -20, rotation: 45 },
        rightArm: { x: 30, y: -20, rotation: -45 },
        head: { rotation: 0 }
      },
      'help': {
        leftArm: { x: 0, y: -30, rotation: 0 },
        rightArm: { x: 0, y: -30, rotation: 0 },
        head: { rotation: 5 }
      },
      'thank': {
        leftArm: { x: -20, y: -10, rotation: 30 },
        rightArm: { x: 20, y: -10, rotation: -30 },
        head: { rotation: -5 }
      },
      'you': {
        leftArm: { x: 0, y: 0, rotation: 0 },
        rightArm: { x: 15, y: -15, rotation: -20 },
        head: { rotation: 0 }
      },
      'good': {
        leftArm: { x: -25, y: -25, rotation: 60 },
        rightArm: { x: 25, y: -25, rotation: -60 },
        head: { rotation: 0 }
      }
    };

    return gestures[word] || {
      leftArm: { x: Math.random() * 40 - 20, y: Math.random() * 20 - 10, rotation: Math.random() * 60 - 30 },
      rightArm: { x: Math.random() * 40 - 20, y: Math.random() * 20 - 10, rotation: Math.random() * 60 - 30 },
      head: { rotation: Math.random() * 20 - 10 }
    };
  }

  private getExpressionForWord(word: string): 'neutral' | 'happy' | 'questioning' {
    if (['good', 'great', 'wonderful', 'happy', 'thank'].includes(word)) {
      return 'happy';
    }
    if (['what', 'how', 'why', 'when', 'where', '?'].includes(word)) {
      return 'questioning';
    }
    return 'neutral';
  }

  private async playAnimation(animation: AvatarAnimation): Promise<void> {
    return new Promise((resolve) => {
      this.currentAnimation = animation;
      this.animationStartTime = Date.now();
      this.isAnimating = true;

      const animate = () => {
        if (!this.isAnimating || !this.currentAnimation) {
          resolve();
          return;
        }

        const elapsed = Date.now() - this.animationStartTime;
        
        if (elapsed >= this.currentAnimation.duration) {
          this.isAnimating = false;
          resolve();
          return;
        }

        this.renderFrame(elapsed);
        requestAnimationFrame(animate);
      };

      animate();
    });
  }

  private renderFrame(elapsed: number) {
    if (!this.ctx || !this.canvas || !this.currentAnimation) return;

    const { width, height } = this.canvas.getBoundingClientRect();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Get current pose
    const pose = this.interpolatePose(elapsed);

    // Draw avatar
    this.drawAvatar(pose, width, height);
  }

  private interpolatePose(elapsed: number) {
    if (!this.currentAnimation) return this.currentAnimation!.keyframes[0];

    const keyframes = this.currentAnimation.keyframes;
    
    // Find surrounding keyframes
    let prevFrame = keyframes[0];
    let nextFrame = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (elapsed >= keyframes[i].timestamp && elapsed <= keyframes[i + 1].timestamp) {
        prevFrame = keyframes[i];
        nextFrame = keyframes[i + 1];
        break;
      }
    }

    // Interpolate between keyframes
    const duration = nextFrame.timestamp - prevFrame.timestamp;
    const progress = duration > 0 ? (elapsed - prevFrame.timestamp) / duration : 0;

    return {
      timestamp: elapsed,
      leftArm: {
        x: prevFrame.leftArm.x + (nextFrame.leftArm.x - prevFrame.leftArm.x) * progress,
        y: prevFrame.leftArm.y + (nextFrame.leftArm.y - prevFrame.leftArm.y) * progress,
        rotation: prevFrame.leftArm.rotation + (nextFrame.leftArm.rotation - prevFrame.leftArm.rotation) * progress
      },
      rightArm: {
        x: prevFrame.rightArm.x + (nextFrame.rightArm.x - prevFrame.rightArm.x) * progress,
        y: prevFrame.rightArm.y + (nextFrame.rightArm.y - prevFrame.rightArm.y) * progress,
        rotation: prevFrame.rightArm.rotation + (nextFrame.rightArm.rotation - prevFrame.rightArm.rotation) * progress
      },
      head: {
        rotation: prevFrame.head.rotation + (nextFrame.head.rotation - prevFrame.head.rotation) * progress
      },
      expression: progress < 0.5 ? prevFrame.expression : nextFrame.expression
    };
  }

  private drawAvatar(pose: AvatarKeyframe, width: number, height: number) {
    if (!this.ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 400;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);

    // Draw head
    this.ctx.save();
    this.ctx.rotate(pose.head.rotation * Math.PI / 180);
    this.drawHead(pose.expression);
    this.ctx.restore();

    // Draw body
    this.drawBody();

    // Draw arms
    this.drawArm('left', pose.leftArm);
    this.drawArm('right', pose.rightArm);

    this.ctx.restore();
  }

  private drawHead(expression: 'neutral' | 'happy' | 'questioning') {
    if (!this.ctx) return;

    // Head circle
    this.ctx.fillStyle = '#F3E8D0';
    this.ctx.beginPath();
    this.ctx.arc(0, -80, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = '#2D3748';
    this.ctx.beginPath();
    this.ctx.arc(-15, -85, 3, 0, Math.PI * 2);
    this.ctx.arc(15, -85, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Mouth based on expression
    this.ctx.strokeStyle = '#2D3748';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    switch (expression) {
      case 'happy':
        this.ctx.arc(0, -70, 15, 0.2 * Math.PI, 0.8 * Math.PI);
        break;
      case 'questioning':
        this.ctx.arc(0, -70, 10, 0.8 * Math.PI, 1.2 * Math.PI);
        break;
      default:
        this.ctx.moveTo(-10, -70);
        this.ctx.lineTo(10, -70);
    }
    this.ctx.stroke();
  }

  private drawBody() {
    if (!this.ctx) return;

    this.ctx.fillStyle = '#4A90E2';
    this.ctx.fillRect(-25, -40, 50, 80);
  }

  private drawArm(side: 'left' | 'right', armPose: { x: number; y: number; rotation: number }) {
    if (!this.ctx) return;

    const x = side === 'left' ? -25 : 25;
    const armX = x + armPose.x;
    const armY = -20 + armPose.y;

    this.ctx.save();
    this.ctx.translate(armX, armY);
    this.ctx.rotate(armPose.rotation * Math.PI / 180);

    // Upper arm
    this.ctx.fillStyle = '#F3E8D0';
    this.ctx.fillRect(-5, 0, 10, 30);

    // Forearm
    this.ctx.translate(0, 30);
    this.ctx.rotate(0.2); // Slight bend
    this.ctx.fillRect(-4, 0, 8, 25);

    // Hand
    this.ctx.translate(0, 25);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  stopAnimation() {
    this.isAnimating = false;
  }
}

export const avatarService = new AvatarService();