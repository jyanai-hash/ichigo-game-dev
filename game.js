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
  const bestKey = 'ichigoShooterBest';
  let best = Number(localStorage.getItem(bestKey)) || 0;
  let score = 0;
  let lives = 3;
  let running = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let shotTimer = 0;
  let invulnerable = 0;
  let bugs = [];
  let shots = [];
  let particles = [];
  let clouds = [];
  const player = { x: W / 2, y: H - 76, width: 54, height: 56, speed: 390 };

  bestElement.textContent = formatScore(best);

  function formatScore(value) { return String(value).padStart(5, '0'); }
  function updateHud() {
    scoreElement.textContent = formatScore(score);
    livesElement.textContent = lives > 0 ? Array(lives).fill('🍓').join(' ') : '—';
  }
  function resetGame() {
    score = 0;
    lives = 3;
    bugs = [];
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
    title.textContent = 'ゲームオーバー';
    message.textContent = `スコアは ${formatScore(score)} 点！ もう一度チャレンジしてね。`;
    startButton.textContent = 'もう一度あそぶ';
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

  function addCloud() {
    clouds.push({ x: Math.random() * W, y: -50, size: 22 + Math.random() * 32, speed: 12 + Math.random() * 18 });
  }
  for (let i = 0; i < 8; i++) clouds.push({ x: Math.random() * W, y: Math.random() * H, size: 22 + Math.random() * 32, speed: 12 + Math.random() * 18 });

  function spawnBug() {
    const level = Math.min(1.8, score / 8000);
    const size = 34 + Math.random() * 13;
    bugs.push({ x: 38 + Math.random() * (W - 76), y: -size, size, speed: 105 + Math.random() * 70 + level * 70, phase: Math.random() * Math.PI * 2, drift: 20 + Math.random() * 40, type: Math.random() < 0.5 ? '🐞' : '🐝' });
  }
  function shoot() {
    shots.push({ x: player.x, y: player.y - 28, speed: 560 });
    for (let i = 0; i < 4; i++) particles.push({ x: player.x + (Math.random() - .5) * 12, y: player.y - 16, vx: (Math.random() - .5) * 50, vy: -Math.random() * 70, life: .22, color: '#ffe6a3', size: 3 + Math.random() * 3 });
  }
  function burst(x, y, color = '#ff7897') {
    for (let i = 0; i < 12; i++) {
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
      spawnBug();
      spawnTimer = Math.max(.38, 1.05 - score / 18000) * (.72 + Math.random() * .56);
    }
    if (Math.random() < dt * .16) addCloud();
    clouds.forEach((cloud) => cloud.y += cloud.speed * dt);
    clouds = clouds.filter((cloud) => cloud.y < H + 60);
    shots.forEach((shot) => shot.y -= shot.speed * dt);
    shots = shots.filter((shot) => shot.y > -20);

    for (const bug of bugs) {
      bug.y += bug.speed * dt;
      bug.x += Math.sin(performance.now() / 380 + bug.phase) * bug.drift * dt;
      if (bug.y > H + 30 && !bug.passed) {
        bug.passed = true;
        lives -= 1;
        burst(bug.x, H - 12, '#ffc45d');
        updateHud();
        if (lives <= 0) { endGame(); return; }
      }
    }
    bugs = bugs.filter((bug) => bug.y <= H + 50 && !bug.dead);

    for (const shot of shots) {
      for (const bug of bugs) {
        if (!bug.dead && hit(shot, bug, bug.size * .42)) {
          shot.dead = true;
          bug.dead = true;
          score += 100;
          burst(bug.x, bug.y);
          updateHud();
          break;
        }
      }
    }
    shots = shots.filter((shot) => !shot.dead);
    bugs = bugs.filter((bug) => !bug.dead);

    if (invulnerable <= 0) {
      for (const bug of bugs) {
        if (!bug.passed && hit(player, bug, 38)) {
          bug.dead = true;
          lives -= 1;
          invulnerable = 1.3;
          burst(bug.x, bug.y, '#fff0a8');
          updateHud();
          if (lives <= 0) { endGame(); return; }
          break;
        }
      }
    }
    bugs = bugs.filter((bug) => !bug.dead);
    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 110 * dt; p.life -= dt; });
    particles = particles.filter((p) => p.life > 0);
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#9de0eb');
    gradient.addColorStop(.72, '#d7f4e3');
    gradient.addColorStop(1, '#a9db91');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    // Distant hills
    ctx.fillStyle = '#b4e2a5';
    ctx.beginPath(); ctx.moveTo(0, 450); ctx.quadraticCurveTo(180, 370, 360, 455); ctx.quadraticCurveTo(600, 350, 800, 440); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
    ctx.fillStyle = '#91cf83';
    ctx.beginPath(); ctx.moveTo(0, 510); ctx.quadraticCurveTo(220, 430, 440, 520); ctx.quadraticCurveTo(650, 435, 800, 505); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
    clouds.forEach((cloud) => {
      ctx.globalAlpha = .45;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.size * 1.35, cloud.size * .48, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x - cloud.size * .48, cloud.y + 3, cloud.size * .7, cloud.size * .38, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x + cloud.size * .5, cloud.y + 2, cloud.size * .72, cloud.size * .42, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Floating petals
    ctx.fillStyle = '#fff7fa';
    for (let i = 0; i < 10; i++) {
      const x = (i * 97 + performance.now() * .018) % W;
      const y = (i * 71 + performance.now() * .035) % H;
      ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.ellipse(x, y, 4, 7, .5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawPlayer() {
    if (invulnerable > 0 && Math.floor(performance.now() / 90) % 2 === 0) return;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.font = '50px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍓', 0, 0);
    ctx.restore();
  }
  function draw() {
    drawBackground();
    // Sweet seed shots
    ctx.save();
    ctx.shadowColor = '#fff4ae'; ctx.shadowBlur = 12;
    shots.forEach((shot) => {
      ctx.fillStyle = '#fff5a8';
      ctx.beginPath(); ctx.ellipse(shot.x, shot.y, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    bugs.forEach((bug) => {
      ctx.save(); ctx.translate(bug.x, bug.y);
      ctx.font = `${bug.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bug.type, 0, 0);
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
