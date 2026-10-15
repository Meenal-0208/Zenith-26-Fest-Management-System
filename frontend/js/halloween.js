// Halloween Spooky Fest Animations & Particle Controller
(function() {
  const spookySymbols = ['🎃', '👻', '🦇', '🕷️', '🕸️', '✨', '🍬', '💀'];

  function initHalloween() {
    // 1. Create floating particles background
    const container = document.createElement('div');
    container.id = 'spooky-particles-container';
    document.body.appendChild(container);

    const particleCount = window.innerWidth < 768 ? 10 : 20;

    for (let i = 0; i < particleCount; i++) {
      createSpookyParticle(container);
    }

    // 2. Flying Bat occasional animation
    setInterval(spawnFlyingBat, 9000);
    setTimeout(spawnFlyingBat, 1500);

    // 3. Hanging spider web in top corner
    addCornerWebs();

    // 4. Default halloween mode on or add toggle
    document.body.classList.add('halloween-mode');
  }

  function createSpookyParticle(container) {
    const el = document.createElement('div');
    el.className = 'spooky-particle';
    const symbol = spookySymbols[Math.floor(Math.random() * spookySymbols.length)];
    el.textContent = symbol;

    const size = Math.floor(Math.random() * 18) + 16; // 16px - 34px
    el.style.fontSize = `${size}px`;
    el.style.left = `${Math.random() * 96}vw`;
    
    const duration = Math.random() * 14 + 10; // 10s - 24s
    const delay = Math.random() * 10;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;

    container.appendChild(el);
  }

  function spawnFlyingBat() {
    const bat = document.createElement('div');
    bat.textContent = '🦇';
    bat.style.position = 'fixed';
    bat.style.top = `${Math.random() * 45 + 5}vh`;
    bat.style.left = '0';
    bat.style.fontSize = `${Math.random() * 20 + 32}px`;
    bat.style.zIndex = '9999';
    bat.style.pointerEvents = 'none';
    bat.style.filter = 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.7))';
    bat.style.animation = 'batFly 7s cubic-bezier(0.25, 1, 0.5, 1) forwards';

    document.body.appendChild(bat);

    setTimeout(() => {
      if (bat.parentNode) {
        bat.parentNode.removeChild(bat);
      }
    }, 7500);
  }

  function addCornerWebs() {
    // Top-left spider web SVG
    const webLeft = document.createElement('div');
    webLeft.className = 'spider-web-corner left-0';
    webLeft.innerHTML = `
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="rgba(249, 115, 22, 0.5)" stroke-width="1.2">
        <path d="M0 0 L100 0 M0 0 L80 60 M0 0 L60 80 M0 0 L0 100" />
        <path d="M20 0 Q 18 18 0 20" />
        <path d="M40 0 Q 36 36 0 40" />
        <path d="M60 0 Q 54 54 0 60" />
        <path d="M80 0 Q 72 72 0 80" />
        <path d="M100 0 Q 90 90 0 100" />
      </svg>
    `;

    // Hanging spider on top-right
    const spiderContainer = document.createElement('div');
    spiderContainer.className = 'fixed top-0 right-10 z-40 pointer-events-none flex flex-col items-center';
    spiderContainer.style.animation = 'spiderSwing 3s ease-in-out infinite alternate';
    spiderContainer.innerHTML = `
      <div style="width: 1px; height: 50px; background: rgba(249, 115, 22, 0.4);"></div>
      <div style="font-size: 24px; filter: drop-shadow(0 0 8px rgba(249,115,22,0.8));">🕷️</div>
    `;

    document.body.appendChild(webLeft);
    document.body.appendChild(spiderContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHalloween);
  } else {
    initHalloween();
  }
})();
