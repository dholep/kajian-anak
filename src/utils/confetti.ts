// Lightweight, reliable DOM-based confetti effect that works safely in all sandboxed environments
export function triggerConfetti() {
  if (typeof document === 'undefined') return;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '99999';
  container.style.overflow = 'hidden';

  const colors = ['#10b981', '#059669', '#34d399', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899'];
  const particleCount = 60;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 6;
    const startX = Math.random() * 80 + 10; // 10% to 90%
    const endX = startX + (Math.random() * 40 - 20); // drift left/right
    const duration = Math.random() * 1.5 + 1.8; // 1.8s - 3.3s
    const delay = Math.random() * 0.4;
    const rotate = Math.random() * 360;
    const endRotate = rotate + Math.random() * 720 - 360;

    particle.style.position = 'absolute';
    particle.style.width = `${size}px`;
    particle.style.height = `${size * (Math.random() > 0.5 ? 1.4 : 0.8)}px`;
    particle.style.backgroundColor = color;
    particle.style.borderRadius = Math.random() > 0.6 ? '50%' : '2px';
    particle.style.left = `${startX}%`;
    particle.style.top = '-20px';
    particle.style.opacity = '1';
    particle.style.transform = `rotate(${rotate}deg)`;
    particle.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s, top ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s, opacity ${duration}s ease ${delay}s`;

    container.appendChild(particle);

    // Trigger animation next frame
    requestAnimationFrame(() => {
      particle.style.top = `${Math.random() * 40 + 75}vh`;
      particle.style.left = `${endX}%`;
      particle.style.transform = `rotate(${endRotate}deg) scale(0.6)`;
      particle.style.opacity = '0';
    });
  }

  document.body.appendChild(container);

  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 4000);
}
