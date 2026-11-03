(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlay-title');
  const message = document.getElementById('overlay-message');
  const startButton = document.getElementById('start-button');
  const scoreElement = document.getElementById('score');
  const livesElement = document.getElementById('lives');
  const bestElement = document.getElementById('best');

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();
  const controls = { left: false, right: false, fire: false };
  const bestKey = 'kohakuShooterBest';
  let best = Number(localStorage.getItem(bestKey)) || 0;
  let score = 0;
  let lives = 3;
  let running = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let shotTimer = 0;
  let invulnerable = 0;
  let spirits = [];
  let shots = [];
  let particles = [];
  let stars = [];
  const player = { x: W / 2, y: H - 76, width: 58, height: 70, speed: 390 };
  const hero = new Image();
  hero.src = 'assets/kohaku.svg';

  bestElement.textContent = formatScore(best);

  function formatScore(value) { return String(value).padStart(5, '0'); }
  function updateHud() {
    scoreElement.textContent = formatScore(score);
    livesElement.textContent = lives > 0 ? Array(lives).fill('♥').join(' ') : '—';
  }
  function resetGame() {
    score = 0;
    lives = 3;
    spirits = [];
    shots = [];
    particles = [];
    spawnTimer = 0.6;
    shotTimer = 0;
    invulnerable = 0;
    player.x = W / 2;
    updateHud();
  }
  function startGame() {
    resetGame();
    running = true;
    overlay.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
  function endGame() {
    running = false;
    if (score > best) {
      best = score;
      localStorage.setItem(bestKey, String(best));
      bestElement.textContent = formatScore(best);
    }
    title.textContent = 'ひとやすみ！';
    message.textContent = `スコアは ${formatScore(score)} 点！ こはくともう一度、夜空を守ろう。`;
    startButton.textContent = 'もう一度出撃';
    overlay.classList.remove('hidden');
  }
  startButton.addEventListener('click', startGame);

  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (!running && event.code === 'Space') startGame();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => { keys.clear(); controls.left = controls.right = controls.fire = false; });

  document.querySelectorAll('[data-control]').forEach((button) => {
    const control = button.dataset.control;
    const set = (value) => { controls[control] = value; };
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); });
    button.addEventListener('pointerup', () => set(false));
    button.addEventListener('pointercancel', () => set(false));
    button.addEventListener('lostpointercapture', () => set(false));
  });

  function addStar() {
    stars.push({ x: Math.random() * W, y: -8, size: 1 + Math.random() * 2.5, speed: 18 + Math.random() * 36, alpha: .25 + Math.random() * .65 });
  }
  for (let i = 0; i < 90; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, size: 1 + Math.random() * 2.5, speed: 18 + Math.random() * 36, alpha: .25 + Math.random() * .65 });

  function spawnSpirit() {
    const level = Math.min(1.8, score / 8000);
    const size = 34 + Math.random() * 13;
    spirits.push({ x: 38 + Math.random() * (W - 76), y: -size, size, speed: 105 + Math.random() * 70 + level * 70, phase: Math.random() * Math.PI * 2, drift: 20 + Math.random() * 40, type: Math.random() < 0.5 ? '👻' : '🧚' });
  }
  function shoot() {
    shots.push({ x: player.x, y: player.y - 32, speed: 560, phase: Math.random() * Math.PI * 2 });
    for (let i = 0; i < 4; i++) particles.push({ x: player.x + (Math.random() - .5) * 12, y: player.y - 20, vx: (Math.random() - .5) * 50, vy: -Math.random() * 70, life: .22, color: '#ffe99a', size: 3 + Math.random() * 3 });
  }
  function burst(x, y, color = '#ff9dd2') {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .3, color, size: 3 + Math.random() * 5 });
    }
  }
  function hit(a, b, radius) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy < radius * radius;
  }

  function update(dt) {
    const left = keys.has('ArrowLeft') || keys.has('KeyA') || controls.left;
    const right = keys.has('ArrowRight') || keys.has('KeyD') || controls.right;
    const firing = keys.has('Space') || controls.fire;
    if (left) player.x -= player.speed * dt;
    if (right) player.x += player.speed * dt;
    player.x = Math.max(34, Math.min(W - 34, player.x));
    if (invulnerable > 0) invulnerable -= dt;

    shotTimer -= dt;
    if (firing && shotTimer <= 0) { shoot(); shotTimer = .22; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnSpirit();
      spawnTimer = Math.max(.38, 1.05 - score / 18000) * (.72 + Math.random() * .56);
    }
    if (Math.random() < dt * 1.2) addStar();
    stars.forEach((star) => star.y += star.speed * dt);
    stars = stars.filter((star) => star.y < H + 8);
    shots.forEach((shot) => shot.y -= shot.speed * dt);
    shots = shots.filter((shot) => shot.y > -20);

    for (const spirit of spirits) {
      spirit.y += spirit.speed * dt;
      spirit.x += Math.sin(performance.now() / 380 + spirit.phase) * spirit.drift * dt;
      if (spirit.y > H + 30 && !spirit.passed) {
        spirit.passed = true;
        lives -= 1;
        burst(spirit.x, H - 12, '#a7dcff');
        updateHud();
        if (lives <= 0) { endGame(); return; }
      }
    }
    spirits = spirits.filter((spirit) => spirit.y <= H + 50 && !spirit.dead);

    for (const shot of shots) {
      for (const spirit of spirits) {
        if (!spirit.dead && hit(shot, spirit, spirit.size * .42)) {
          shot.dead = true;
          spirit.dead = true;
          score += 100;
          burst(spirit.x, spirit.y);
          updateHud();
          break;
        }
      }
    }
    shots = shots.filter((shot) => !shot.dead);
    spirits = spirits.filter((spirit) => !spirit.dead);

    if (invulnerable <= 0) {
      for (const spirit of spirits) {
        if (!spirit.passed && hit(player, spirit, 38)) {
          spirit.dead = true;
          lives -= 1;
          invulnerable = 1.3;
          burst(spirit.x, spirit.y, '#fff0a8');
          updateHud();
          if (lives <= 0) { endGame(); return; }
          break;
        }
      }
    }
    spirits = spirits.filter((spirit) => !spirit.dead);
    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 110 * dt; p.life -= dt; });
    particles = particles.filter((p) => p.life > 0);
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#17142b');
    gradient.addColorStop(.68, '#30204e');
    gradient.addColorStop(1, '#5b356e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    // Distant shrine silhouettes
    ctx.fillStyle = '#211b3c';
    ctx.beginPath(); ctx.moveTo(0, 450); ctx.quadraticCurveTo(180, 400, 360, 455); ctx.quadraticCurveTo(600, 390, 800, 440); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
    ctx.fillStyle = '#17152f';
    ctx.beginPath(); ctx.moveTo(0, 510); ctx.quadraticCurveTo(220, 450, 440, 520); ctx.quadraticCurveTo(650, 445, 800, 505); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
    // Torii gate silhouette
    ctx.fillStyle = '#a94771';
    ctx.fillRect(94, 255, 13, 135); ctx.fillRect(185, 255, 13, 135);
    ctx.fillRect(78, 253, 136, 12); ctx.fillRect(88, 272, 116, 7);
    stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#fff2bf';
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Drifting sakura petals
    ctx.fillStyle = '#ffc9e5';
    for (let i = 0; i < 9; i++) {
      const x = (i * 97 + performance.now() * .018) % W;
      const y = (i * 71 + performance.now() * .035) % H;
      ctx.globalAlpha = .45;
      ctx.beginPath(); ctx.ellipse(x, y, 4, 7, .5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawPlayer() {
    if (invulnerable > 0 && Math.floor(performance.now() / 90) % 2 === 0) return;
    ctx.save();
    ctx.translate(player.x, player.y);
    if (hero.complete && hero.naturalWidth) ctx.drawImage(hero, -35, -45, 70, 90);
    else {
      ctx.fillStyle = '#f6c6d9';
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-7, -3, 3, 0, Math.PI * 2); ctx.arc(7, -3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function draw() {
    drawBackground();
    // Glowing star talismans
    shots.forEach((shot) => {
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(performance.now() / 180 + shot.phase);
      ctx.shadowColor = '#ffe99a'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#fff4bd';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? 10 : 4;
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    spirits.forEach((spirit) => {
      ctx.save(); ctx.translate(spirit.x, spirit.y);
      ctx.font = `${spirit.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#d5b9ff'; ctx.shadowBlur = 12;
      ctx.fillText(spirit.type, 0, 0);
      ctx.restore();
    });
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawPlayer();
  }
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, .04);
    lastTime = now;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  draw();
})();
