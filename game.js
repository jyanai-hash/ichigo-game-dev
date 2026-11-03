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
  const phaseElement = document.getElementById('phase');
  const powerElement = document.getElementById('power');
  const bombsElement = document.getElementById('bombs');
  const bestElement = document.getElementById('best');

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();
  const controls = { left: false, right: false, up: false, down: false, fire: false, slow: false, bomb: false };
  const bestKey = 'kohakuShooterBest';
  const itemTypes = {
    speed: { label: '速射', color: '#80e8ff', symbol: '⚡' },
    spread: { label: '三連', color: '#ff9fd2', symbol: '✿' },
    change: { label: '光弾', color: '#ffe99a', symbol: '◆' },
    rear: { label: '前後', color: '#c6a2ff', symbol: '↕' }
  };
  let best = Number(localStorage.getItem(bestKey)) || 0;
  let score = 0;
  let lives = 3;
  let bombs = 3;
  let running = false;
  let lastTime = 0;
  let elapsed = 0;
  let spawnTimer = 0;
  let shotTimer = 0;
  let invulnerable = 0;
  let bombFlash = 0;
  let phaseBanner = 0;
  let phase = 1;
  let defeated = 0;
  let spirits = [];
  let shots = [];
  let enemyShots = [];
  let items = [];
  let particles = [];
  let stars = [];
  let bulletSpeed = 560;
  let shotInterval = .22;
  let bulletCount = 1;
  let bulletType = 'star';
  let rearAttack = false;
  const player = { x: W / 2, y: H - 76, width: 58, height: 70, speed: 390 };
  const hero = new Image();
  hero.src = 'assets/kohaku.svg';

  bestElement.textContent = formatScore(best);

  function formatScore(value) { return String(value).padStart(5, '0'); }
  function updateHud() {
    scoreElement.textContent = formatScore(score);
    livesElement.textContent = lives > 0 ? Array(lives).fill('♥').join(' ') : '—';
    phaseElement.textContent = String(phase);
    const typeLabel = bulletType === 'star' ? '星弾' : bulletType === 'orb' ? '光玉' : '札';
    powerElement.textContent = `${typeLabel} ×${bulletCount}${rearAttack ? ' 前後' : ''}${shotInterval < .22 ? ' ⚡' : ''}`;
    bombsElement.textContent = bombs > 0 ? Array(bombs).fill('✹').join(' ') : '—';
  }
  function resetGame() {
    score = 0;
    lives = 3;
    bombs = 3;
    elapsed = 0;
    phase = 1;
    defeated = 0;
    spirits = [];
    shots = [];
    enemyShots = [];
    items = [];
    particles = [];
    spawnTimer = .6;
    shotTimer = 0;
    invulnerable = 0;
    bombFlash = 0;
    phaseBanner = 0;
    bulletSpeed = 560;
    shotInterval = .22;
    bulletCount = 1;
    bulletType = 'star';
    rearAttack = false;
    player.x = W / 2;
    player.y = H - 76;
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

  function useBomb() {
    if (!running || bombs <= 0) return;
    bombs -= 1;
    bombFlash = .65;
    enemyShots = [];
    // A bomb sweeps the screen clear and scores for enemies caught in the blast.
    for (const spirit of spirits) {
      if (!spirit.dead) {
        spirit.dead = true;
        score += 100;
        defeated += 1;
        burst(spirit.x, spirit.y, '#ffe99a');
      }
    }
    spirits = spirits.filter((spirit) => !spirit.dead);
    updateHud();
  }
  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
    if (event.code === 'KeyX' && !keys.has('KeyX')) useBomb();
    keys.add(event.code);
    if (!running && event.code === 'Space') startGame();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    keys.clear();
    Object.keys(controls).forEach((control) => { controls[control] = false; });
  });

  document.querySelectorAll('[data-control]').forEach((button) => {
    const control = button.dataset.control;
    const set = (value) => {
      const wasPressed = controls[control];
      controls[control] = value;
      if (control === 'bomb' && value && !wasPressed) useBomb();
    };
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
    if (phase === 1) {
      const size = 34 + Math.random() * 13;
      spirits.push({ x: 38 + Math.random() * (W - 76), y: -size, size, speed: 105 + Math.random() * 70 + level * 70, phase: Math.random() * Math.PI * 2, drift: 20 + Math.random() * 40, type: Math.random() < 0.5 ? '👻' : '🧚', hp: 1, fireTimer: 99 });
      return;
    }
    const isOrb = Math.random() < .48;
    const size = isOrb ? 43 : 48;
    spirits.push({
      x: 48 + Math.random() * (W - 96), y: -size, size,
      speed: isOrb ? 72 + Math.random() * 28 : 88 + Math.random() * 32,
      phase: Math.random() * Math.PI * 2, drift: isOrb ? 55 : 38,
      type: isOrb ? '👾' : '🔮', hp: isOrb ? 2 : 3,
      maxHp: isOrb ? 2 : 3, fireTimer: .8 + Math.random() * 1.4,
      value: isOrb ? 180 : 250
    });
  }
  function addPlayerShot(x, y, angle, direction) {
    shots.push({ x, y, vx: Math.sin(angle) * bulletSpeed, vy: direction * Math.cos(angle) * bulletSpeed, phase: Math.random() * Math.PI * 2, type: bulletType });
  }
  function shoot() {
    const spacing = .13;
    for (let i = 0; i < bulletCount; i++) {
      const angle = (i - (bulletCount - 1) / 2) * spacing;
      addPlayerShot(player.x, player.y - 32, angle, -1);
    }
    if (rearAttack) addPlayerShot(player.x, player.y + 32, 0, 1);
    for (let i = 0; i < 4; i++) particles.push({ x: player.x + (Math.random() - .5) * 12, y: player.y - 20, vx: (Math.random() - .5) * 50, vy: -Math.random() * 70, life: .22, color: '#ffe99a', size: 3 + Math.random() * 3 });
  }
  function dropItem(x, y) {
    if (Math.random() > .58) return;
    const types = Object.keys(itemTypes);
    const type = types[Math.floor(Math.random() * types.length)];
    items.push({ x, y, type, speed: 105, phase: Math.random() * Math.PI * 2 });
  }
  function collectItem(item) {
    if (item.type === 'speed') {
      bulletSpeed = Math.min(980, bulletSpeed + 100);
      shotInterval = Math.max(.095, shotInterval - .018);
    } else if (item.type === 'spread') {
      bulletCount = Math.min(5, bulletCount + 1);
    } else if (item.type === 'change') {
      bulletType = bulletType === 'star' ? 'orb' : bulletType === 'orb' ? 'talisman' : 'star';
    } else {
      rearAttack = true;
    }
    burst(item.x, item.y, itemTypes[item.type].color);
    updateHud();
  }
  function fireEnemyShot(spirit) {
    const dx = player.x - spirit.x;
    const dy = player.y - spirit.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = spirit.type === '🔮' ? 230 : 190;
    enemyShots.push({ x: spirit.x, y: spirit.y + 12, vx: dx / distance * speed, vy: dy / distance * speed, radius: spirit.type === '🔮' ? 7 : 6, color: spirit.type === '🔮' ? '#ff8ac7' : '#a9eaff' });
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
  function enterPhaseTwo() {
    phase = 2;
    phaseBanner = 2.4;
    spawnTimer = .8;
    updateHud();
  }

  function update(dt) {
    elapsed += dt;
    if (phase === 1 && (defeated >= 12 || elapsed >= 45)) enterPhaseTwo();
    phaseBanner = Math.max(0, phaseBanner - dt);
    bombFlash = Math.max(0, bombFlash - dt);

    const left = keys.has('ArrowLeft') || keys.has('KeyA') || controls.left;
    const right = keys.has('ArrowRight') || keys.has('KeyD') || controls.right;
    const up = keys.has('ArrowUp') || keys.has('KeyW') || controls.up;
    const down = keys.has('ArrowDown') || keys.has('KeyS') || controls.down;
    const firing = keys.has('Space') || controls.fire;
    const slow = keys.has('ShiftLeft') || keys.has('ShiftRight') || controls.slow;
    const speed = player.speed * (slow ? .42 : 1);
    let moveX = (right ? 1 : 0) - (left ? 1 : 0);
    let moveY = (down ? 1 : 0) - (up ? 1 : 0);
    if (moveX && moveY) { moveX *= Math.SQRT1_2; moveY *= Math.SQRT1_2; }
    player.x += moveX * speed * dt;
    player.y += moveY * speed * dt;
    player.x = Math.max(34, Math.min(W - 34, player.x));
    player.y = Math.max(45, Math.min(H - 35, player.y));
    if (invulnerable > 0) invulnerable -= dt;

    shotTimer -= dt;
    if (firing && shotTimer <= 0) { shoot(); shotTimer = shotInterval; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnSpirit();
      spawnTimer = (phase === 1 ? Math.max(.38, 1.05 - score / 18000) : .72) * (.72 + Math.random() * .56);
    }
    if (Math.random() < dt * 1.2) addStar();
    stars.forEach((star) => star.y += star.speed * dt);
    stars = stars.filter((star) => star.y < H + 8);
    shots.forEach((shot) => { shot.x += shot.vx * dt; shot.y += shot.vy * dt; });
    shots = shots.filter((shot) => shot.y > -20 && shot.y < H + 20 && shot.x > -20 && shot.x < W + 20);
    enemyShots.forEach((shot) => { shot.x += shot.vx * dt; shot.y += shot.vy * dt; });
    enemyShots = enemyShots.filter((shot) => shot.x > -20 && shot.x < W + 20 && shot.y > -20 && shot.y < H + 20);
    items.forEach((item) => { item.y += item.speed * dt; item.x += Math.sin(performance.now() / 360 + item.phase) * 30 * dt; });
    items = items.filter((item) => item.y < H + 20);

    for (const spirit of spirits) {
      spirit.y += spirit.speed * dt;
      spirit.x += Math.sin(performance.now() / 380 + spirit.phase) * spirit.drift * dt;
      if (phase === 2) {
        spirit.fireTimer -= dt;
        if (spirit.fireTimer <= 0 && spirit.y > 0 && spirit.y < H - 80) {
          fireEnemyShot(spirit);
          spirit.fireTimer = (spirit.type === '🔮' ? 1.25 : 1.75) + Math.random() * .75;
        }
      }
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
          spirit.hp -= 1;
          if (spirit.hp <= 0) {
            spirit.dead = true;
            score += spirit.value || 100;
            defeated += 1;
            dropItem(spirit.x, spirit.y);
            burst(spirit.x, spirit.y);
            updateHud();
          } else {
            burst(shot.x, shot.y, '#ffe99a');
          }
          break;
        }
      }
    }
    shots = shots.filter((shot) => !shot.dead);
    spirits = spirits.filter((spirit) => !spirit.dead);

    items = items.filter((item) => {
      if (hit(player, item, 30)) { collectItem(item); return false; }
      return true;
    });
    if (invulnerable <= 0) {
      for (const shot of enemyShots) {
        if (hit(player, shot, shot.radius + 10)) {
          shot.dead = true;
          lives -= 1;
          invulnerable = 1.3;
          burst(player.x, player.y, '#a9eaff');
          updateHud();
          if (lives <= 0) { endGame(); return; }
          break;
        }
      }
      enemyShots = enemyShots.filter((shot) => !shot.dead);
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
    gradient.addColorStop(0, phase === 1 ? '#17142b' : '#171d39');
    gradient.addColorStop(.68, phase === 1 ? '#30204e' : '#263c62');
    gradient.addColorStop(1, phase === 1 ? '#5b356e' : '#3f7190');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#211b3c';
    ctx.beginPath(); ctx.moveTo(0, 450); ctx.quadraticCurveTo(180, 400, 360, 455); ctx.quadraticCurveTo(600, 390, 800, 440); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
    ctx.fillStyle = '#17152f';
    ctx.beginPath(); ctx.moveTo(0, 510); ctx.quadraticCurveTo(220, 450, 440, 520); ctx.quadraticCurveTo(650, 445, 800, 505); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
    ctx.fillStyle = '#a94771';
    ctx.fillRect(94, 255, 13, 135); ctx.fillRect(185, 255, 13, 135);
    ctx.fillRect(78, 253, 136, 12); ctx.fillRect(88, 272, 116, 7);
    stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = phase === 1 ? '#fff2bf' : '#a9eaff';
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
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
    if (keys.has('ShiftLeft') || keys.has('ShiftRight') || controls.slow) {
      ctx.strokeStyle = '#9cecff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 8, 8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  function drawShot(shot) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(performance.now() / 180 + shot.phase);
    const color = shot.type === 'orb' ? '#85e9ff' : shot.type === 'talisman' ? '#ff9fd2' : '#fff4bd';
    ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fillStyle = color;
    if (shot.type === 'orb') {
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    } else if (shot.type === 'talisman') {
      ctx.fillRect(-4, -9, 8, 18);
    } else {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? 10 : 4;
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function draw() {
    drawBackground();
    shots.forEach(drawShot);
    enemyShots.forEach((shot) => {
      ctx.save(); ctx.shadowColor = shot.color; ctx.shadowBlur = 10; ctx.fillStyle = shot.color;
      ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    items.forEach((item) => {
      const style = itemTypes[item.type];
      ctx.save(); ctx.translate(item.x, item.y);
      ctx.shadowColor = style.color; ctx.shadowBlur = 14; ctx.fillStyle = style.color;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#2b1d3d';
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(style.symbol, 0, 1); ctx.restore();
    });
    spirits.forEach((spirit) => {
      ctx.save(); ctx.translate(spirit.x, spirit.y);
      ctx.font = `${spirit.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = phase === 2 ? '#80e8ff' : '#d5b9ff'; ctx.shadowBlur = 12;
      ctx.fillText(spirit.type, 0, 0);
      if (spirit.maxHp) {
        ctx.shadowBlur = 0; ctx.fillStyle = '#221a34'; ctx.fillRect(-18, spirit.size * .48, 36, 4);
        ctx.fillStyle = '#ff9fd2'; ctx.fillRect(-18, spirit.size * .48, 36 * spirit.hp / spirit.maxHp, 4);
      }
      ctx.restore();
    });
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawPlayer();
    if (bombFlash > 0) {
      ctx.save(); ctx.globalAlpha = bombFlash * .36; ctx.fillStyle = '#fff0ae'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    if (phaseBanner > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, phaseBanner * 2); ctx.textAlign = 'center';
      ctx.fillStyle = '#d9f5ff'; ctx.shadowColor = '#78dfff'; ctx.shadowBlur = 18;
      ctx.font = '900 42px sans-serif'; ctx.fillText('PHASE 2', W / 2, H * .34);
      ctx.font = '700 19px sans-serif'; ctx.fillText('妖怪の反撃！', W / 2, H * .34 + 34);
      ctx.restore();
    }
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
