export default function initMouseMove() {
  const gradientElement = document.getElementById('gradient');
  
  if (!gradientElement) return;

  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  // 添加鼠标移动事件监听器
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // 使用 easeOutExpo 缓动函数实现平滑过渡
  const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  // 平滑动画函数
  function animate() {
    // 计算目标位置（基于鼠标位置）
    const targetX = (mouseX - window.innerWidth / 2) * 0.25;
    const targetY = (mouseY - window.innerHeight / 2) * 0.2;

    const ease = 0.005;
    
    // 计算当前位置与目标位置的差值
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    
    // 应用缓动
    currentX += dx * easeOutExpo(ease);
    currentY += dy * easeOutExpo(ease);

    // 应用变换
    gradientElement.style.transform = `translate(${currentX}px, ${currentY}px)`;

    // 继续动画
    requestAnimationFrame(animate);
  }

  // 启动动画
  animate();
} 