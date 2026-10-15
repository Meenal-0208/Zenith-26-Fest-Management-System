// Halloween Spooky Fest: Spirits, Walking Zombies, Flying Bats, and Creepy Critters Controller
(function() {
  const spookySymbols = ['🎃', '👻', '🦇', '🕷️', '🕸️', '🍬', '💀', '🕯️', '🧟'];

  function initHalloween() {
    // 1. Create floating background particles container
    const container = document.createElement('div');
    container.id = 'spooky-particles-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:hidden;';
    document.body.appendChild(container);

    const particleCount = window.innerWidth < 768 ? 20 : 35;
    for (let i = 0; i < particleCount; i++) {
      createSpookyParticle(container);
    }

    // 2. Corner Web & Swinging Spider
    addSpiderWebs();

    // 3. Immediately launch flying bats
    spawnFlyingBat();
    setInterval(spawnFlyingBat, 5000);

    // 4. Roaming Spirits floating across the screen
    spawnFloatingSpirit();
    setInterval(spawnFloatingSpirit, 7000);

    // 5. Walking Zombies crawling along the bottom
    spawnWalkingZombie();
    setInterval(spawnWalkingZombie, 8500);

    // 6. Crawling Spiders along cards & screen
    spawnCrawlingSpider();
    setInterval(spawnCrawlingSpider, 11000);
  }

  // Floating ambient icons rising from ground to sky
  function createSpookyParticle(container) {
    const el = document.createElement('div');
    el.className = 'spooky-particle';
    const symbol = spookySymbols[Math.floor(Math.random() * spookySymbols.length)];
    el.textContent = symbol;

    const size = Math.floor(Math.random() * 20) + 16;
    el.style.fontSize = `${size}px`;
    el.style.left = `${Math.random() * 95}vw`;
    
    const duration = Math.random() * 12 + 8; // 8s to 20s
    const delay = Math.random() * 8;
    el.style.animation = `particleUp ${duration}s linear ${delay}s infinite`;

    container.appendChild(el);
  }

  // 1. Flying Bats swooping across the page
  function spawnFlyingBat() {
    const bat = document.createElement('div');
    bat.textContent = Math.random() > 0.4 ? '🦇' : '🦇🦇';
    bat.style.cssText = `
      position: fixed;
      top: ${Math.random() * 50 + 5}vh;
      left: 0;
      font-size: ${Math.random() * 22 + 32}px;
      z-index: 9999;
      pointer-events: none;
      filter: drop-shadow(0 0 14px rgba(249, 115, 22, 0.9));
      animation: batFlyAcross ${Math.random() * 2.5 + 5.5}s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    `;

    document.body.appendChild(bat);
    setTimeout(() => {
      if (bat.parentNode) bat.parentNode.removeChild(bat);
    }, 8500);
  }

  // 2. Floating Spirits drifting ghostly across the viewport
  function spawnFloatingSpirit() {
    const spirit = document.createElement('div');
    const ghostIcons = ['👻', '💀', '🌫️👻'];
    spirit.textContent = ghostIcons[Math.floor(Math.random() * ghostIcons.length)];
    const startY = Math.random() * 60 + 15;
    const fromLeft = Math.random() > 0.5;

    spirit.style.cssText = `
      position: fixed;
      top: ${startY}vh;
      ${fromLeft ? 'left: -80px;' : 'right: -80px;'}
      font-size: ${Math.random() * 25 + 45}px;
      z-index: 9998;
      pointer-events: none;
      filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.85)) drop-shadow(0 0 35px rgba(56, 189, 248, 0.6));
      animation: ${fromLeft ? 'spiritDriftRight' : 'spiritDriftLeft'} ${Math.random() * 3 + 9}s ease-in-out forwards;
      opacity: 0.88;
    `;

    document.body.appendChild(spirit);
    setTimeout(() => {
      if (spirit.parentNode) spirit.parentNode.removeChild(spirit);
    }, 12500);
  }

  // 3. Walking Zombies pacing along the bottom of the screen
  function spawnWalkingZombie() {
    const zombie = document.createElement('div');
    const zombieTypes = ['🧟', '🧟‍♂️', '🧟‍♀️'];
    zombie.textContent = zombieTypes[Math.floor(Math.random() * zombieTypes.length)];
    const walkRight = Math.random() > 0.5;

    zombie.style.cssText = `
      position: fixed;
      bottom: ${Math.random() * 15 + 10}px;
      ${walkRight ? 'left: -80px;' : 'right: -80px;'}
      font-size: ${Math.random() * 16 + 46}px;
      z-index: 9997;
      pointer-events: none;
      filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 25px rgba(249, 115, 22, 0.5));
      animation: ${walkRight ? 'zombieWalkRight' : 'zombieWalkLeft'} ${Math.random() * 4 + 11}s linear forwards;
    `;

    document.body.appendChild(zombie);
    setTimeout(() => {
      if (zombie.parentNode) zombie.parentNode.removeChild(zombie);
    }, 15500);
  }

  // 4. Crawling spider across the screen
  function spawnCrawlingSpider() {
    const spider = document.createElement('div');
    spider.textContent = '🕷️';
    spider.style.cssText = `
      position: fixed;
      top: ${Math.random() * 80 + 10}vh;
      left: -60px;
      font-size: 32px;
      z-index: 9996;
      pointer-events: none;
      filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.9));
      animation: spiderCrawl 14s linear forwards;
    `;

    document.body.appendChild(spider);
    setTimeout(() => {
      if (spider.parentNode) spider.parentNode.removeChild(spider);
    }, 14500);
  }

  // Hanging Spider & Web
  function addSpiderWebs() {
    const webLeft = document.createElement('div');
    webLeft.className = 'fixed top-0 left-0 pointer-events-none z-30 opacity-60';
    webLeft.innerHTML = `
      <svg width="140" height="140" viewBox="0 0 100 100" fill="none" stroke="rgba(249, 115, 22, 0.7)" stroke-width="1.2">
        <path d="M0 0 L100 0 M0 0 L80 60 M0 0 L60 80 M0 0 L0 100" />
        <path d="M20 0 Q 18 18 0 20" />
        <path d="M40 0 Q 36 36 0 40" />
        <path d="M60 0 Q 54 54 0 60" />
        <path d="M80 0 Q 72 72 0 80" />
        <path d="M100 0 Q 90 90 0 100" />
      </svg>
    `;

    const spiderContainer = document.createElement('div');
    spiderContainer.className = 'fixed top-0 right-10 z-40 pointer-events-none flex flex-col items-center';
    spiderContainer.style.animation = 'spiderSwing 3.5s ease-in-out infinite alternate';
    spiderContainer.innerHTML = `
      <div style="width: 2px; height: 75px; background: linear-gradient(to bottom, rgba(249,115,22,0.8), rgba(168,85,247,0.5));"></div>
      <div style="font-size: 34px; filter: drop-shadow(0 0 12px rgba(249,115,22,0.9));">🕷️</div>
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
