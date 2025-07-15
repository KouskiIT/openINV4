import confetti from 'canvas-confetti';

export class ConfettiEffects {
  // Success celebration with confetti burst
  static celebrateSuccess(): void {
    // Main burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#059669', '#047857', '#34D399', '#6EE7B7']
    });
    
    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#3B82F6', '#1D4ED8', '#1E40AF', '#60A5FA', '#93C5FD']
      });
    }, 100);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#F59E0B', '#D97706', '#B45309', '#FBD24F', '#FDE68A']
      });
    }, 200);
  }
  
  // Scanner success with barcode-themed confetti
  static celebrateScan(): void {
    // Create barcode-like confetti
    const shapes = ['square', 'circle'];
    const colors = ['#000000', '#1F2937', '#374151', '#4B5563'];
    
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
      shapes: shapes,
      colors: colors,
      gravity: 0.8,
      drift: 0.1
    });
    
    // Add some colorful elements
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.4 },
        colors: ['#10B981', '#3B82F6', '#F59E0B'],
        gravity: 0.6
      });
    }, 150);
  }
  
  // Continuous scanning celebration
  static celebrateContinuousScanning(): void {
    // Small burst for each scan
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 },
      colors: ['#10B981', '#059669', '#34D399'],
      gravity: 1.2,
      scalar: 0.8
    });
  }
  
  // Special celebration for multiple scans
  static celebrateMultipleScans(count: number): void {
    const intensity = Math.min(count, 10); // Cap the intensity
    
    for (let i = 0; i < intensity; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 20 + i * 5,
          spread: 30 + i * 5,
          origin: { 
            x: 0.3 + (i % 3) * 0.2, 
            y: 0.5 + Math.sin(i) * 0.2 
          },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
        });
      }, i * 100);
    }
  }
}