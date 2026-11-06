(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlay-title');
  const message = document.getElementById('overlay-message');
  const startButton = document.getElementById('start-button');
  const pauseControls = document.getElementById('pause-controls');
  const pauseStageSelect = document.getElementById('pause-stage-select');
  const resumeButton = document.getElementById('resume-button');
  const startStageButton = document.getElementById('start-stage-button');
  const restartButton = document.getElementById('restart-button');
  const retryPhaseButton = document.getElementById('retry-phase-button');
  const continueControls = document.getElementById('continue-controls');
  const continueButton = document.getElementById('continue-button');
  const giveUpButton = document.getElementById('give-up-button');
  const difficultyControl = document.getElementById('difficulty-control');
  const difficultySelect = document.getElementById('difficulty-select');
  const debugPhaseControl = document.getElementById('debug-phase-control');
  const debugPhaseSelect = document.getElementById('debug-phase-select');
  const debugMode = new URLSearchParams(window.location.search).get('debug') === '1';
  const scoreElement = document.getElementById('score');
  const livesElement = document.getElementById('lives');
  const phaseElement = document.getElementById('phase');
  const powerElement = document.getElementById('power');
  const bombsElement = document.getElementById('bombs');
  const bestElement = document.getElementById('best');
  const effectNameElement = document.getElementById('effect-name');
  const effectDescriptionElement = document.getElementById('effect-description');
  const bonusEffectElement = document.getElementById('bonus-effect');
  const upgradeElements = {
    speed: {
      level: document.getElementById('speed-level'),
      progress: document.getElementById('speed-progress'),
      gauge: document.getElementById('speed-gauge'),
      label: '速射'
    },
    spread: {
      level: document.getElementById('spread-level'),
      progress: document.getElementById('spread-progress'),
      gauge: document.getElementById('spread-gauge'),
      label: '拡散'
    },
    rear: {
      level: document.getElementById('rear-level'),
      progress: document.getElementById('rear-progress'),
      gauge: document.getElementById('rear-gauge'),
      label: '後方'
    },
    orb: {
      level: document.getElementById('orb-level'),
      progress: document.getElementById('orb-progress'),
      gauge: document.getElementById('orb-gauge'),
      label: '光玉'
    },
    talisman: {
      level: document.getElementById('talisman-level'),
      progress: document.getElementById('talisman-progress'),
      gauge: document.getElementById('talisman-gauge'),
      label: '札'
    }
  };

  const baseWidth = 800;
  const baseHeight = 600;
  let W = baseWidth;
  let H = baseHeight;
  const keys = new Set();
  const controls = { left: false, right: false, up: false, down: false, fire: false, slow: false, bomb: false };
  const bestKey = 'kohakuShooterBest';
  const difficultyKey = 'kohakuShooterDifficulty';
  const difficulties = ['easy', 'normal', 'hard', 'oni'];
  let difficulty = difficulties.includes(localStorage.getItem(difficultyKey))
    ? localStorage.getItem(difficultyKey)
    : 'normal';
  const itemTypes = {
    speed: { label: '速射', color: '#80e8ff', symbol: '⚡' },
    spread: { label: '拡散', color: '#ff9fd2', symbol: '✿' },
    orb: { label: '光玉', color: '#85e9ff', symbol: '●' },
    talisman: { label: '札', color: '#ff9fd2', symbol: '▰' },
    rear: { label: '前後', color: '#c6a2ff', symbol: '↕' },
    mobility: { label: '移動速度', color: '#a8fff0', symbol: '➤' },
    blessing: { label: '星の加護', color: '#fff0a8', symbol: '✦' }
  };
  function enemyDesign(type, hp, speed, value, color, movement, attack, count, shotSpeed, shape = 'round', cooldown = 2.2) {
    return { type, hp, speed, value, color, movement, attack, count, shotSpeed, shape, cooldown };
  }
  const enemyPhaseDesigns = {
    1: [
      enemyDesign('🌸', 1, 84, 180, '#ffb6d2', 'diagonal', 'aim', 1, 145),
      enemyDesign('👻', 1, 70, 180, '#91dcff', 'zigzag', 'aim', 3, 115, 'round', 2.6),
      enemyDesign('🌟', 1, 65, 220, '#ffe99a', 'stop', 'fan', 5, 105, 'diamond', 2.8)
    ],
    2: [
      enemyDesign('🦊', 2, 88, 260, '#ff9b59', 'diagonalCenter', 'aim', 2, 165, 'round', 2.2),
      enemyDesign('🌑', 2, 70, 280, '#bd9cff', 'stop', 'fan', 3, 120, 'round', 2.5),
      enemyDesign('🌸', 2, 76, 300, '#ff91bd', 'swoop', 'fan', 6, 95, 'round', 2.8)
    ],
    3: [
      enemyDesign('🔥', 2, 92, 320, '#ff754d', 'swoop', 'fan', 3, 135, 'round', 2.2),
      enemyDesign('🌟', 2, 65, 300, '#ffe99a', 'stop', 'fan', 5, 110, 'diamond', 2.6),
      enemyDesign('🦊', 2, 84, 340, '#ff9b59', 'diagonalCenter', 'aim', 2, 165, 'round', 2.2)
    ],
    4: [
      enemyDesign('🦇', 2, 90, 320, '#d39cff', 'diagonalCenter', 'aim', 1, 160, 'round', 2),
      enemyDesign('🦊', 3, 65, 380, '#ffad70', 'stop', 'fan', 3, 135, 'round', 2.4),
      enemyDesign('🦇', 2, 130, 360, '#8a79c8', 'shadowCross', 'directionFan', 5, 125, 'diamond', 2.5)
    ],
    5: [
      enemyDesign('🪼', 3, 60, 400, '#80e8ff', 'zigzag', 'slowRadial', 8, 92, 'ring', 2.8),
      enemyDesign('🦋', 3, 84, 430, '#ff91c8', 'swoop', 'aim', 3, 130, 'round', 2.6),
      enemyDesign('🪼', 3, 52, 420, '#9deaff', 'stop', 'slowRadial', 6, 96, 'ring', 2.8)
    ],
    6: [
      enemyDesign('🐉', 4, 76, 520, '#ff9f87', 'orbitTurn', 'aim', 3, 160, 'diamond', 2.4),
      enemyDesign('🌟', 3, 70, 480, '#ffe99a', 'centerStop', 'fan', 7, 120, 'diamond', 2.6),
      enemyDesign('🐉', 4, 88, 550, '#ff8b67', 'zigzag', 'fan', 5, 135, 'round', 2.2)
    ],
    7: [
      enemyDesign('🐟', 2, 92, 320, '#8ceaff', 'diagonalCenter', 'aim', 1, 145),
      enemyDesign('🪼', 2, 58, 350, '#80e8ff', 'slowZigzag', 'fan', 5, 92, 'ring', 2.6),
      enemyDesign('🐟', 2, 76, 330, '#9cecff', 'stopDiagonalExit', 'fan', 3, 120, 'round', 2.4)
    ],
    8: [
      enemyDesign('🦀', 3, 68, 390, '#ffbd86', 'weaveStop', 'aim', 2, 155, 'diamond', 2.2),
      enemyDesign('🐠', 3, 88, 410, '#ff9fd2', 'swoop', 'fan', 5, 118, 'round', 2.4),
      enemyDesign('🧊', 3, 62, 420, '#a8eaff', 'slowStop', 'slowFan', 3, 108, 'diamond', 2.6)
    ],
    9: [
      enemyDesign('🐟', 3, 100, 430, '#9cecff', 'diagonal', 'aim', 3, 155, 'diamond', 2.4),
      enemyDesign('🐙', 3, 62, 440, '#b8c5ff', 'stop', 'fan', 7, 112, 'round', 2.7),
      enemyDesign('🪼', 3, 60, 430, '#80e8ff', 'zigzag', 'radial', 8, 90, 'ring', 2.8)
    ],
    10: [
      enemyDesign('🦑', 4, 78, 480, '#30305f', 'squidStopReverse', 'fan', 5, 115, 'round', 2.4),
      enemyDesign('🐬', 4, 98, 500, '#9cecff', 'riseReverse', 'aim', 2, 150, 'round', 2.2),
      enemyDesign('🫧', 3, 65, 490, '#8eeaff', 'bubbleStopMove', 'decelerateRadial', 6, 95, 'ring', 2.8)
    ],
    11: [
      enemyDesign('🐚', 4, 58, 500, '#a8eaff', 'slowStop', 'fan', 3, 110, 'diamond', 2.4),
      enemyDesign('🪸', 4, 82, 520, '#80e8ff', 'swoop', 'fan', 5, 120, 'round', 2.5),
      enemyDesign('🫧', 4, 56, 530, '#b8f5ff', 'stop', 'accelerateRadial', 8, 92, 'ring', 2.8)
    ],
    12: [
      enemyDesign('🦈', 4, 112, 550, '#80e8ff', 'sharkCenterCharge', 'charge', 0, 0, 'round', 2.2),
      enemyDesign('🐉', 5, 72, 620, '#9cecff', 'deepDragonSweepStop', 'fan', 7, 118, 'diamond', 2.5),
      enemyDesign('🐙', 5, 58, 600, '#c6a2ff', 'slowStop', 'burstFastThenSlowRadial', 9, 94, 'ring', 2.8)
    ],
    13: [
      enemyDesign('🔥', 3, 92, 380, '#ff7448', 'diagonal', 'aim', 1, 165),
      enemyDesign('🌋', 3, 66, 420, '#ff9b59', 'stop', 'fan', 3, 140, 'round', 2.3),
      enemyDesign('✨', 2, 105, 400, '#ffd36e', 'zigzag', 'fan', 5, 120, 'round', 2.4)
    ],
    14: [
      enemyDesign('🪨', 4, 60, 460, '#be8064', 'straight', 'explodeFan', 3, 120, 'diamond', 2.3),
      enemyDesign('🔥', 4, 88, 490, '#ff754d', 'stop', 'aim', 2, 175, 'round', 2.1),
      enemyDesign('🦂', 4, 82, 500, '#e9894c', 'zigzag', 'fan', 5, 128, 'round', 2.4)
    ],
    15: [
      enemyDesign('🔥', 4, 96, 520, '#ff7448', 'diagonalCenter', 'aim', 3, 170, 'round', 2.1),
      enemyDesign('🌋', 4, 64, 540, '#ff6548', 'stop', 'fan', 7, 135, 'diamond', 2.4),
      enemyDesign('✨', 3, 104, 520, '#ffcf70', 'zigzag', 'fan', 5, 128, 'round', 2.3)
    ],
    16: [
      enemyDesign('🔥', 4, 112, 560, '#ff7448', 'flank', 'aim', 3, 185, 'round', 2),
      enemyDesign('🌋', 5, 65, 600, '#ff6548', 'stop', 'fan', 5, 140, 'diamond', 2.4),
      enemyDesign('🦖', 5, 90, 620, '#e98248', 'zigzag', 'explodeFan', 7, 145, 'round', 2.3)
    ],
    17: [
      enemyDesign('🔥', 4, 90, 560, '#ffcf70', 'stop', 'aim', 2, 180, 'round', 2.1),
      enemyDesign('🪨', 5, 92, 600, '#be8064', 'diagonal', 'fan', 3, 135, 'diamond', 2.3),
      enemyDesign('✨', 4, 106, 580, '#ffd36e', 'zigzag', 'fan', 8, 135, 'round', 2.5)
    ],
    18: [
      enemyDesign('🐉', 6, 84, 700, '#ff9b59', 'stop', 'aim', 3, 185, 'diamond', 2),
      enemyDesign('🌋', 5, 92, 680, '#ff7652', 'cross', 'fan', 7, 145, 'round', 2.3),
      enemyDesign('🐲', 6, 76, 720, '#ffd67a', 'stop', 'fan', 9, 150, 'diamond', 2.5)
    ],
    19: [
      enemyDesign('🎋', 3, 92, 400, '#b8d985', 'diagonal', 'aim', 1, 140),
      enemyDesign('🦋', 3, 82, 420, '#a8d7b4', 'swoop', 'fan', 5, 112, 'ring', 2.4),
      enemyDesign('🌑', 3, 64, 440, '#b8d5b0', 'stop', 'fan', 3, 118, 'round', 2.3)
    ],
    20: [
      enemyDesign('🦋', 4, 92, 480, '#c5c6e8', 'zigzag', 'aim', 3, 135, 'ring', 2.4),
      enemyDesign('🎋', 4, 66, 490, '#9ae0a6', 'stop', 'fan', 5, 120, 'round', 2.3),
      enemyDesign('🦌', 4, 94, 500, '#d6e8ad', 'diagonal', 'fan', 7, 125, 'diamond', 2.5)
    ],
    21: [
      enemyDesign('🦋', 4, 90, 520, '#b8d5b0', 'swoop', 'fan', 5, 120, 'ring', 2.3),
      enemyDesign('🎋', 4, 86, 520, '#9ae0a6', 'stop', 'aim', 3, 155, 'round', 2.1),
      enemyDesign('🌑', 4, 104, 530, '#b8d5b0', 'diagonal', 'fan', 7, 128, 'diamond', 2.4)
    ],
    22: [
      enemyDesign('🌑', 5, 96, 580, '#c7dfa1', 'diagonal', 'aim', 3, 160, 'round', 2.2),
      enemyDesign('🦋', 5, 92, 590, '#c5c6e8', 'swoop', 'fan', 7, 132, 'ring', 2.4),
      enemyDesign('🎋', 5, 84, 600, '#9ae0a6', 'stop', 'fan', 5, 132, 'diamond', 2.4)
    ],
    23: [
      enemyDesign('🦋', 5, 96, 630, '#d6e8ad', 'swoop', 'fan', 9, 130, 'ring', 2.4),
      enemyDesign('🌑', 5, 102, 640, '#b8d5b0', 'flank', 'seekFan', 3, 165, 'round', 2.1),
      enemyDesign('🎋', 5, 90, 630, '#9ae0a6', 'stop', 'fan', 7, 138, 'diamond', 2.4)
    ],
    24: [
      enemyDesign('🌑', 6, 100, 700, '#c7dfa1', 'diagonal', 'reflectFan', 7, 138, 'round', 2.3),
      enemyDesign('🦋', 6, 102, 710, '#d9dfbd', 'zigzag', 'aim', 3, 170, 'ring', 2.1),
      enemyDesign('🎋', 6, 92, 720, '#9ae0a6', 'stop', 'fan', 9, 140, 'diamond', 2.5)
    ],
    25: [
      enemyDesign('🌟', 4, 96, 430, '#d3b3ff', 'diagonal', 'aim', 1, 150),
      enemyDesign('✨', 4, 84, 440, '#e3dcff', 'stop', 'fan', 5, 120, 'diamond', 2.3),
      enemyDesign('🐉', 4, 76, 460, '#c5d9ff', 'stop', 'fan', 7, 128, 'ring', 2.4)
    ],
    26: [
      enemyDesign('🌟', 4, 102, 500, '#c6b5ff', 'diagonal', 'aim', 3, 155, 'round', 2.2),
      enemyDesign('✨', 4, 96, 510, '#e2d4ff', 'zigzag', 'fan', 7, 130, 'diamond', 2.3),
      enemyDesign('🐉', 5, 78, 540, '#b4d7ff', 'stop', 'fan', 9, 135, 'ring', 2.5)
    ],
    27: [
      enemyDesign('🌟', 5, 104, 570, '#b5c5ff', 'diagonal', 'aim', 3, 165, 'round', 2.1),
      enemyDesign('☄️', 5, 112, 590, '#ffb8ed', 'swoop', 'fan', 7, 138, 'diamond', 2.3),
      enemyDesign('🐉', 5, 82, 600, '#c5d9ff', 'stop', 'fan', 9, 142, 'ring', 2.4)
    ],
    28: [
      enemyDesign('🌟', 5, 110, 620, '#b4d7ff', 'flank', 'aim', 3, 170, 'round', 2.1),
      enemyDesign('✨', 5, 102, 630, '#d8e8ff', 'zigzag', 'fan', 9, 140, 'diamond', 2.3),
      enemyDesign('🐉', 5, 86, 640, '#c5d9ff', 'stop', 'fan', 11, 145, 'ring', 2.5)
    ],
    29: [
      enemyDesign('🌟', 6, 112, 680, '#e5b3ff', 'flank', 'aim', 3, 175, 'round', 2),
      enemyDesign('✨', 6, 108, 690, '#fff0c8', 'zigzag', 'fan', 11, 145, 'diamond', 2.3),
      enemyDesign('🐉', 6, 88, 700, '#c5d9ff', 'stop', 'reflectFan', 13, 148, 'ring', 2.5)
    ],
    30: [
      enemyDesign('🌟', 7, 116, 740, '#c5d9ff', 'flank', 'aim', 5, 180, 'round', 1.9),
      enemyDesign('✨', 7, 110, 750, '#e2f4ff', 'zigzag', 'fan', 13, 150, 'diamond', 2.2),
      enemyDesign('🐉', 7, 90, 760, '#c5d9ff', 'stop', 'reflectFan', 15, 155, 'ring', 2.5)
    ]
  };
  const phaseWavePlans = {
    1: [[0], [1], [0, 0], [2], [0, 1, 2]],
    2: [[0, 0], [1], [2], [0, 1, 2]],
    3: [[0], [1, 1], [2], [0, 1, 2]],
    4: [[0, 0], [1], [2], [0, 1, 2]],
    5: [[0], [1, 1], [2], [0, 1, 2]],
    6: [[0], [1, 1], [2], [0, 1, 2]],
    7: [[0, 0, 0], [1], [2], [0, 1, 2]],
    8: [[0, 0], [1], [2], [0, 1, 2]],
    9: [[0], [1], [2], [0, 1, 2]],
    10: [[0], [1, 1], [2], [0, 1, 2]],
    11: [[0], [1, 1], [2], [0, 1, 2]],
    12: [[0, 0], [1], [2], [0, 1, 2]]
  };
  const phaseThemes = {
    1: { top: '#17142b', middle: '#30204e', bottom: '#5b356e', star: '#fff2bf', enemy: '#d5b9ff' },
    2: { top: '#171d39', middle: '#263c62', bottom: '#3f7190', star: '#a9eaff', enemy: '#80e8ff' },
    3: { top: '#281735', middle: '#563052', bottom: '#a14f78', star: '#ffc3ec', enemy: '#ff9fd2' },
    4: { top: '#191b37', middle: '#303a68', bottom: '#596aa0', star: '#c6d5ff', enemy: '#b5c5ff' },
    5: { top: '#152737', middle: '#245b70', bottom: '#55a0a0', star: '#aef7e7', enemy: '#80e8ff' },
    6: { top: '#321a36', middle: '#713454', bottom: '#c16b76', star: '#ffe99a', enemy: '#ffb1a6' },
    7: { top: '#071b38', middle: '#103d61', bottom: '#147f9c', star: '#b8f5ff', enemy: '#9cecff' },
    8: { top: '#092643', middle: '#145777', bottom: '#1b9aaa', star: '#a8fff0', enemy: '#80e8ff' },
    9: { top: '#102344', middle: '#253d76', bottom: '#477eb0', star: '#c6d5ff', enemy: '#b7c8ff' },
    10: { top: '#102c42', middle: '#1b6177', bottom: '#4aa9a5', star: '#d4fff0', enemy: '#aef7e7' },
    11: { top: '#071b35', middle: '#153c69', bottom: '#286e9c', star: '#a9eaff', enemy: '#80e8ff' },
    12: { top: '#102b50', middle: '#286b91', bottom: '#62b8c2', star: '#e0fbff', enemy: '#b8f5ff' },
    13: { top: '#30151d', middle: '#753229', bottom: '#d66c3b', star: '#ffe6a3', enemy: '#ff9b59' },
    14: { top: '#3b171b', middle: '#8a3026', bottom: '#e65b35', star: '#fff0b0', enemy: '#ffb347' },
    15: { top: '#411a24', middle: '#a43e32', bottom: '#f07b43', star: '#ffe3a1', enemy: '#ff9b59' },
    16: { top: '#35171b', middle: '#8b3929', bottom: '#d96536', star: '#fff0bd', enemy: '#ffbd70' },
    17: { top: '#261521', middle: '#74332f', bottom: '#c35742', star: '#ffe99a', enemy: '#ffad65' },
    18: { top: '#24131c', middle: '#60242a', bottom: '#a94336', star: '#fff0c2', enemy: '#ffc078' },
    19: { top: '#0d1d1b', middle: '#25473a', bottom: '#5a7950', star: '#e7f2b1', enemy: '#b8d985' },
    20: { top: '#101f24', middle: '#315b4c', bottom: '#769267', star: '#f1efb5', enemy: '#c3df9e' },
    21: { top: '#17232a', middle: '#456958', bottom: '#94a578', star: '#f7e9ae', enemy: '#d5e0a1' },
    22: { top: '#0e1c25', middle: '#2c514a', bottom: '#6f8b70', star: '#eaf5c2', enemy: '#b9d6a5' },
    23: { top: '#172027', middle: '#3c5749', bottom: '#84916a', star: '#fff0b4', enemy: '#d8d694' },
    24: { top: '#111d21', middle: '#314b3e', bottom: '#6a795c', star: '#e8f4bd', enemy: '#c7dfa1' },
    25: { top: '#100e30', middle: '#322461', bottom: '#7651a0', star: '#fff2c2', enemy: '#cfb4ff' },
    26: { top: '#15123a', middle: '#3b2a76', bottom: '#8463b5', star: '#e2d4ff', enemy: '#c6b5ff' },
    27: { top: '#1b1040', middle: '#503080', bottom: '#9b62b1', star: '#fff0d4', enemy: '#e4b7ff' },
    28: { top: '#110f35', middle: '#3a3278', bottom: '#766db4', star: '#d8e8ff', enemy: '#b4d7ff' },
    29: { top: '#21123d', middle: '#573275', bottom: '#aa639b', star: '#fff0c8', enemy: '#e5b3ff' },
    30: { top: '#0d1330', middle: '#303563', bottom: '#6e78a3', star: '#e2f4ff', enemy: '#c5d9ff' }
  };
  const stageThemes = [
    { name: '夜桜の神社', bossName: '夜桜の大妖狐', bossType: '🦊', color: '#ff79c6', accent: '#ffe99a', hp: 360, minions: ['🦊', '🧚'], specialNames: ['妖狐の必殺技・夜桜吹雪！', '妖狐の必殺技・狐火乱舞！', '妖狐の必殺技・天狐星陣！'], specialName: '妖狐の必殺技！', summonName: '妖狐の眷属を召喚！' },
    { name: '深海と氷海', bossName: '深海の氷龍', bossType: '🐉', color: '#8eeaff', accent: '#b8f5ff', hp: 360, minions: ['🪼', '🐟'], specialName: '氷海の必殺技！', summonName: '深海の眷属を召喚！' },
    { name: '紅蓮火山', bossName: '灼熱の鳳凰', bossType: '🦅', color: '#ff8b45', accent: '#ffe06e', hp: 420, minions: ['🔥', '🦅'], specialName: '火山噴火！', summonName: '火山の眷属が出現！' },
    { name: '月影の竹林', bossName: '月影の白鹿', bossType: '🦌', color: '#9ae0a6', accent: '#e8f3b2', hp: 480, minions: ['🐇', '🦋'], specialName: '月影の幻惑！', summonName: '竹林の眷属が出現！' },
    { name: '星冠の天空城', bossName: '星冠の天龍', bossType: '🐲', color: '#b9a2ff', accent: '#e7ddff', hp: 540, minions: ['🌟', '🪽'], specialName: '星冠の大彗星！', summonName: '星の眷属が出現！' }
  ];
  let best = Number(localStorage.getItem(bestKey)) || 0;
  let score = 0;
  let lives = 3;
  let bombs = 3;
  const maxLives = 5;
  const extraLifeScore = 20000;
  let nextExtraLifeScore = extraLifeScore;
  let running = false;
  let paused = false;
  let gameFinished = false;
  let continueAvailable = false;
  let lastTime = 0;
  let elapsed = 0;
  let spawnTimer = 0;
  let spawnSequenceIndex = 0;
  let shotTimer = 0;
  let invulnerable = 0;
  let blessingTimer = 0;
  let bombFlash = 0;
  let phaseBanner = 0;
  let bossBanner = 0;
  let phase = 1;
  let defeated = 0;
  let phaseDefeated = 0;
  let midBoss = null;
  let stageBoss = null;
  let bossBannerText = '';
  let pendingTransition = null;
  let spirits = [];
  let shots = [];
  let enemyShots = [];
  let items = [];
  let particles = [];
  let stars = [];
  let bulletSpeed = 560;
  let shotInterval = .22;
  let bulletCount = 1;
  const upgrades = {
    speed: { level: 1, progress: 0 },
    spread: { level: 1, progress: 0 },
    rear: { level: 1, progress: 0 },
    orb: { level: 1, progress: 0 },
    talisman: { level: 1, progress: 0 }
  };
  const maxUpgradeLevel = 10;
  const maxSpecialShotLevel = 6;
  const player = { x: W / 2, y: H - 76, width: 58, height: 70, speed: 390 };
  const hero = new Image();
  hero.src = 'assets/kohaku.svg';

  function getStage(phaseNumber = phase) {
    return Math.min(stageThemes.length, Math.ceil(phaseNumber / 6));
  }
  function getStagePhase(phaseNumber = phase) {
    return ((phaseNumber - 1) % 6) + 1;
  }
  function getGlobalPhase(stageNumber, stagePhase) {
    return (stageNumber - 1) * 6 + stagePhase;
  }

  debugPhaseControl.hidden = !debugMode;
  difficultySelect.value = difficulty;
  bestElement.textContent = formatScore(best);

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvasWidth = Math.max(320, Math.min(window.innerWidth - 24, baseWidth));
    const canvasHeight = (canvasWidth / baseWidth) * baseHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = Math.round(baseWidth * ratio);
    canvas.height = Math.round(baseHeight * ratio);
    W = baseWidth;
    H = baseHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateHud();

  function formatScore(value) { return String(value).padStart(5, '0'); }
  function updateBonusEffectHud() {
    const effects = [];
    if (player.speed > 390) effects.push(`移動速度アップ ${Math.round(player.speed)}`);
    if (blessingTimer > 0) effects.push(`星の加護 ${blessingTimer.toFixed(1)}秒`);
    bonusEffectElement.textContent = effects.join(' / ');
  }
  function updateHud() {
    scoreElement.textContent = formatScore(score);
    livesElement.textContent = lives > 0 ? Array(lives).fill('♥').join(' ') : '—';
    phaseElement.textContent = `${getStage()}-${getStagePhase()}`;
    const orbShots = Math.min(5, upgrades.orb.level - 1);
    const talismanShots = Math.min(5, upgrades.talisman.level - 1);
    const rearShots = Math.min(5, upgrades.rear.level - 1);
    powerElement.textContent = `星×${bulletCount}${orbShots ? ` 光×${orbShots}` : ''}${talismanShots ? ` 札×${talismanShots}` : ''}${rearShots ? ` 後×${rearShots}` : ''}${upgrades.speed.level > 1 ? ' ⚡' : ''}`;
    bombsElement.textContent = bombs > 0 ? Array(bombs).fill('✹').join(' ') : '—';
    effectNameElement.textContent = '星弾＋追加弾';
    effectDescriptionElement.textContent = `星弾と併用：光玉×${orbShots}（周囲を旋回）、札×${talismanShots}（追尾）`;
    updateBonusEffectHud();
    for (const [type, upgrade] of Object.entries(upgrades)) {
      const elements = upgradeElements[type];
      const maxLevel = type === 'orb' || type === 'talisman' ? maxSpecialShotLevel : maxUpgradeLevel;
      const required = upgrade.level >= maxLevel ? 0 : upgrade.level * 2 - 1;
      elements.level.textContent = `${elements.label} Lv.${upgrade.level}`;
      elements.progress.max = required || 1;
      elements.progress.value = required ? upgrade.progress : 1;
      elements.gauge.textContent = required ? `${upgrade.progress}/${required}` : 'MAX';
      elements.progress.setAttribute('aria-label', required
        ? `${elements.label} レベル${upgrade.level + 1}まで ${upgrade.progress}/${required}`
        : `${elements.label} 最大レベル`);
    }
  }
  function addScore(points) {
    score += points;
    let extraLives = 0;
    while (score >= nextExtraLifeScore) {
      if (lives < maxLives) {
        lives += 1;
        extraLives += 1;
      }
      nextExtraLifeScore += extraLifeScore;
    }
    if (extraLives > 0) {
      bossBannerText = `スコアボーナス：残機 +${extraLives}`;
      bossBanner = 2.5;
    }
  }
  function registerPlayerHit(x, y, color) {
    if (difficulty === 'easy') {
      score = Math.max(0, score - 100);
    } else {
      lives -= 1;
    }
    invulnerable = 1.3;
    burst(x, y, color);
    updateHud();
    if (lives <= 0) endGame();
  }
  function applyUpgradeStats() {
    bulletSpeed = 560 + (upgrades.speed.level - 1) * 35;
    shotInterval = (.22 - (upgrades.speed.level - 1) * .01) / 1.5;
    bulletCount = upgrades.spread.level;
  }
  function getUpgradeGauge(type) {
    const upgrade = upgrades[type];
    const maxLevel = type === 'orb' || type === 'talisman' ? maxSpecialShotLevel : maxUpgradeLevel;
    return {
      level: upgrade.level,
      progress: upgrade.progress,
      required: upgrade.level >= maxLevel ? 0 : upgrade.level * 2 - 1
    };
  }
  function gainUpgrade(type) {
    const upgrade = upgrades[type];
    if (!upgrade) return;
    const maxLevel = type === 'orb' || type === 'talisman' ? maxSpecialShotLevel : maxUpgradeLevel;
    if (upgrade.level >= maxLevel) return;
    upgrade.progress += 1;
    const required = upgrade.level * 2 - 1;
    if (upgrade.progress >= required) {
      upgrade.level += 1;
      upgrade.progress = 0;
      applyUpgradeStats();
    }
  }
  function resetGame(startPosition = 1) {
    const debugBossStage = startPosition >= 101 && startPosition <= 105 ? startPosition - 100 : 0;
    const startPhase = debugBossStage ? debugBossStage * 6 : Math.max(1, Math.min(30, startPosition));
    score = 0;
    gameFinished = false;
    lives = 3;
    bombs = 3;
    nextExtraLifeScore = extraLifeScore;
    elapsed = 0;
    phase = startPhase;
    defeated = 0;
    phaseDefeated = 0;
    spawnSequenceIndex = 0;
    midBoss = null;
    stageBoss = null;
    pendingTransition = null;
    bossBannerText = '';
    spirits = [];
    shots = [];
    enemyShots = [];
    items = [];
    particles = [];
    spawnTimer = getStagePhase() === 3 ? 1.5 : getStagePhase() === 1 ? .6 : 1;
    shotTimer = 0;
    invulnerable = 0;
    blessingTimer = 0;
    bombFlash = 0;
    phaseBanner = 0;
    bossBanner = 0;
    upgrades.speed.level = 1;
    upgrades.speed.progress = 0;
    upgrades.spread.level = 1;
    upgrades.spread.progress = 0;
    upgrades.rear.level = 1;
    upgrades.rear.progress = 0;
    upgrades.orb.level = 1;
    upgrades.orb.progress = 0;
    upgrades.talisman.level = 1;
    upgrades.talisman.progress = 0;
    applyUpgradeStats();
    player.speed = 390;
    player.x = W / 2;
    player.y = H - 76;
    if (getStagePhase() === 3) {
      midBoss = createMidBoss(startPhase);
    } else if (debugBossStage) {
      enterStageBoss(debugBossStage);
    }
    phaseBanner = debugMode ? 3 : 0;
    updateHud();
  }
  function enterPhase(nextPhase) {
    phase = nextPhase;
    phaseDefeated = 0;
    spawnSequenceIndex = 0;
    elapsed = 0;
    phaseBanner = 2.6;
    spawnTimer = 1;
    stageBoss = null;
    spirits = [];
    enemyShots = [];
    updateHud();
  }
  function startGame() {
    beginRun(debugMode ? Number(debugPhaseSelect.value) : 1);
  }
  function beginRun(startPosition) {
    continueAvailable = false;
    resetGame(startPosition);
    paused = false;
    running = true;
    pauseControls.hidden = true;
    continueControls.hidden = true;
    startButton.hidden = false;
    difficultyControl.hidden = true;
    debugPhaseControl.hidden = !debugMode;
    overlay.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
  function pauseGame() {
    if (!running) return;
    running = false;
    paused = true;
    keys.clear();
    Object.keys(controls).forEach((control) => { controls[control] = false; });
    title.textContent = '一時停止';
    message.textContent = 'ゲームを再開するか、ステージ・フェーズを選び直せます。';
    startButton.hidden = true;
    difficultyControl.hidden = true;
    debugPhaseControl.hidden = true;
    pauseStageSelect.value = String(getStage());
    pauseControls.hidden = false;
    overlay.classList.remove('hidden');
  }
  function resumeGame() {
    if (!paused) return;
    paused = false;
    running = true;
    pauseControls.hidden = true;
    startButton.hidden = false;
    difficultyControl.hidden = true;
    overlay.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
  function retryCurrentPhase() {
    const startPosition = stageBoss ? 100 + stageBoss.stage : phase;
    const savedRun = {
      score,
      lives,
      bombs,
      defeated,
      nextExtraLifeScore,
      playerSpeed: player.speed,
      upgrades: Object.fromEntries(Object.entries(upgrades).map(([type, upgrade]) => [
        type, { level: upgrade.level, progress: upgrade.progress }
      ]))
    };
    resetGame(startPosition);
    score = savedRun.score;
    lives = savedRun.lives;
    bombs = savedRun.bombs;
    defeated = savedRun.defeated;
    nextExtraLifeScore = savedRun.nextExtraLifeScore;
    player.speed = savedRun.playerSpeed;
    for (const [type, upgrade] of Object.entries(savedRun.upgrades)) {
      upgrades[type].level = upgrade.level;
      upgrades[type].progress = upgrade.progress;
    }
    applyUpgradeStats();
    updateHud();
    paused = true;
    resumeGame();
  }
  function endGame(cleared = false) {
    if (gameFinished) return;
    gameFinished = true;
    running = false;
    paused = false;
    pauseControls.hidden = true;
    startButton.hidden = true;
    continueControls.hidden = cleared;
    continueAvailable = !cleared;
    debugPhaseControl.hidden = !debugMode;
    difficultyControl.hidden = cleared;
    if (score > best) {
      best = score;
      localStorage.setItem(bestKey, String(best));
      bestElement.textContent = formatScore(best);
    }
    title.textContent = cleared ? '夜空を守りきった！' : 'ゲームオーバー';
    message.textContent = cleared
      ? `全ステージクリア！ スコアは ${formatScore(score)} 点！こはくと夜空の平和を守りました。`
      : `スコアは ${formatScore(score)} 点です。コンティニューするか、あきらめるかを選んでください。`;
    startButton.textContent = 'もう一度出撃';
    overlay.classList.remove('hidden');
  }
  function continueGame() {
    if (!continueAvailable) return;
    const startPosition = stageBoss ? 100 + stageBoss.stage : phase;
    const reducedUpgrades = Object.fromEntries(Object.entries(upgrades).map(([type, upgrade]) => [
      type, Math.max(1, upgrade.level - 2)
    ]));
    beginRun(startPosition);
    for (const [type, level] of Object.entries(reducedUpgrades)) {
      upgrades[type].level = level;
      upgrades[type].progress = 0;
    }
    score = 0;
    lives = 3;
    bombs = 3;
    nextExtraLifeScore = extraLifeScore;
    applyUpgradeStats();
    updateHud();
  }
  function giveUp() {
    if (!continueAvailable) return;
    continueAvailable = false;
    continueControls.hidden = true;
    startButton.hidden = false;
    startButton.textContent = 'もう一度出撃';
    difficultyControl.hidden = false;
    debugPhaseControl.hidden = !debugMode;
    message.textContent = `ゲームオーバー。スコアは ${formatScore(score)} 点です。もう一度挑戦しましょう。`;
  }
  startButton.addEventListener('click', startGame);
  difficultySelect.addEventListener('change', () => {
    if (!difficulties.includes(difficultySelect.value)) {
      difficultySelect.value = difficulty;
      return;
    }
    difficulty = difficultySelect.value;
    localStorage.setItem(difficultyKey, difficulty);
  });
  resumeButton.addEventListener('click', resumeGame);
  startStageButton.addEventListener('click', () => {
    beginRun(getGlobalPhase(Number(pauseStageSelect.value), 1));
  });
  restartButton.addEventListener('click', () => beginRun(1));
  retryPhaseButton.addEventListener('click', retryCurrentPhase);
  continueButton.addEventListener('click', continueGame);
  giveUpButton.addEventListener('click', giveUp);

  function useBomb() {
    if (!running || bombs <= 0) return;
    bombs -= 1;
    bombFlash = .65;
    enemyShots = [];
    // A bomb sweeps the screen clear and scores for enemies caught in the blast.
    for (const spirit of spirits) {
      if (!spirit.dead) {
        spirit.dead = true;
        addScore(100);
        defeated += 1;
        phaseDefeated += 1;
        dropItem(spirit.x, spirit.y);
        burst(spirit.x, spirit.y, '#ffe99a');
      }
    }
    for (const item of items) collectItem(item);
    items = [];
    if (stageBoss && stageBoss.specialTime <= 0) damageStageBoss(24);
    if (midBoss) {
      midBoss.hp -= 24;
      burst(midBoss.x, midBoss.y, '#ffe99a');
      if (midBoss.hp <= 0) defeatMidBoss();
    }
    spirits = spirits.filter((spirit) => !spirit.dead);
    updateHud();
  }
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      event.preventDefault();
      if (event.repeat) return;
      if (running) pauseGame();
      else if (paused) resumeGame();
      return;
    }
    if (paused) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
    if (event.code === 'KeyX' && !keys.has('KeyX')) useBomb();
    keys.add(event.code);
    if (!running && !paused && !continueAvailable && event.code === 'Space' && event.target !== difficultySelect) startGame();
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
    const designs = enemyPhaseDesigns[phase];
    const plan = phaseWavePlans[phase] || [[0], [1], [2], [0, 1, 2]];
    const planIndex = phase === 4
      ? Math.min(spawnSequenceIndex, plan.length - 1)
      : spawnSequenceIndex % plan.length;
    const group = plan[planIndex];
    const activeCount = spirits.filter((spirit) => !spirit.dead).length;
    if (activeCount + group.length > 5) return false;
    const formationX = group.length === 1
      ? [W * (.2 + Math.random() * .6)]
      : group.length === 2 ? [W * .3, W * .7] : [W * .22, W * .5, W * .78];
    group.forEach((designIndex, groupIndex) => {
      const design = designs[designIndex];
      let x = formationX[groupIndex] + (Math.random() - .5) * 28;
      if (design.movement === 'diagonal' || design.movement === 'diagonalCenter' || design.movement === 'orbitTurn' || design.movement === 'centerStop') {
        x = (phase === 4 && group.length === 2) || (phase === 6 && designIndex === 1 && group.length === 2)
          ? groupIndex === 0 ? 46 : W - 46
          : phase === 7 && designIndex === 0 && group.length > 1
            ? groupIndex % 2 === 0 ? 46 : W - 46
            : Math.random() < .5 ? 46 : W - 46;
      } else if (design.movement === 'flank' || design.movement === 'shadowCross') {
        x = player.x < W / 2 ? W - 42 : 42;
      } else if (design.movement === 'cross') {
        x = Math.random() < .5 ? 42 : W - 42;
      } else if (design.movement === 'sharkCenterCharge') {
        x = groupIndex % 2 === 0 ? 26 : W - 26;
      }
      const side = x < W / 2 ? 1 : -1;
      const size = 40 + Math.min(8, design.hp);
      const spawnY = design.movement === 'shadowCross'
        ? Math.min(player.y + 54, H - 1)
        : design.movement === 'centerStop'
          ? 135 + Math.random() * 35
          : design.movement === 'sharkCenterCharge'
            ? 140 + Math.random() * 45
            : design.movement === 'deepDragonSweepStop'
              ? 112 + Math.random() * 28
          : design.movement === 'riseReverse'
            ? H + size
            : -size;
      const direction = design.movement === 'flank' || design.movement === 'shadowCross'
        ? (x < W / 2 ? 1 : -1)
        : design.movement === 'sharkCenterCharge'
          ? (x < W / 2 ? 1 : -1)
        : design.movement === 'stopDiagonalExit'
          ? (x < W / 2 ? -1 : 1)
          : (Math.random() < .5 ? -1 : 1);
      const spirit = {
        x, y: spawnY,
        size, speed: design.speed * (.92 + Math.random() * .16),
        phase: Math.random() * Math.PI * 2, age: 0,
        movement: design.movement,
        direction,
        originX: x, entrySide: side,
        pauseAt: design.movement === 'slowStop'
          ? phase === 12 && designIndex === 2 ? 110 + Math.random() * 25 : 115 + Math.random() * 35
          : design.movement === 'bubbleStopMove'
            ? 110 + Math.random() * 25
            : design.movement === 'riseReverse'
              ? 105 + Math.random() * 40
              : 125 + Math.random() * 80,
        pauseDuration: design.movement === 'centerStop' || design.movement === 'slowStop'
          ? .85 + Math.random() * .25
          : design.movement === 'stop' && phase === 5 && designIndex === 2
            ? .85 + Math.random() * .25
            : .55 + Math.random() * .25,
        pauseTimer: 0, pauseDone: false, centerTurned: false,
        type: design.type, hp: design.hp, maxHp: design.hp,
        fireTimer: .55 + Math.random() * .95, burstRemaining: 0,
        value: design.value, color: design.color, design
      };
      if (design.movement === 'sharkCenterCharge') {
        spirit.sharkStopX = direction > 0
          ? W * (.3 + Math.random() * .12)
          : W * (.58 + Math.random() * .12);
      }
      spirits.push(spirit);
    });
    spawnSequenceIndex += 1;
    return true;
  }
  function addPlayerShot(x, y, angle, direction, type = 'star') {
    shots.push({
      x, y, vx: Math.sin(angle) * bulletSpeed, vy: direction * Math.cos(angle) * bulletSpeed,
      phase: Math.random() * Math.PI * 2, type,
      pierce: type === 'orb' ? 2 : 0,
      hitTargets: new Set()
    });
  }
  function shoot() {
    const spacing = .13 + (upgrades.spread.level - 1) * .012;
    for (let i = 0; i < bulletCount; i++) {
      const angle = (i - (bulletCount - 1) / 2) * spacing;
      addPlayerShot(player.x, player.y - 32, angle, -1);
    }
    const talismanShots = Math.min(5, upgrades.talisman.level - 1);
    for (let i = 0; i < talismanShots; i++) {
      const angle = -.24 + (i - (talismanShots - 1) / 2) * .12;
      addPlayerShot(player.x - 7, player.y - 32, angle, -1, 'talisman');
    }
    const rearShots = Math.min(5, upgrades.rear.level - 1);
    const rearSpeed = bulletSpeed * (1 + Math.max(0, upgrades.rear.level - 6) * .08);
    for (let i = 0; i < rearShots; i++) {
      const angle = (i - (rearShots - 1) / 2) * (.14 + upgrades.rear.level * .012);
      shots.push({
        x: player.x, y: player.y + 32, vx: Math.sin(angle) * rearSpeed,
        vy: Math.cos(angle) * rearSpeed, phase: Math.random() * Math.PI * 2,
        type: 'star', pierce: 0, hitTargets: new Set()
      });
    }
    for (let i = 0; i < 4; i++) particles.push({ x: player.x + (Math.random() - .5) * 12, y: player.y - 20, vx: (Math.random() - .5) * 50, vy: -Math.random() * 70, life: .22, color: '#ffe99a', size: 3 + Math.random() * 3 });
  }
  function updateOrbitingOrbs(dt) {
    const count = Math.min(5, upgrades.orb.level - 1);
    let orbs = shots.filter((shot) => shot.orbiting);
    if (orbs.length > count) {
      const remove = new Set(orbs.slice(count));
      shots = shots.filter((shot) => !remove.has(shot));
      orbs = orbs.slice(0, count);
    }
    while (orbs.length < count) {
      const index = orbs.length;
      const angle = index * Math.PI * 2 / count;
      const orb = {
        x: player.x, y: player.y, vx: 0, vy: 0, phase: 0, type: 'orb',
        radius: 14, orbiting: true, orbitAngle: angle, orbitSpeed: 2.4,
        hitTargets: new Map()
      };
      shots.push(orb);
      orbs.push(orb);
    }
    for (const orb of orbs) {
      orb.orbitAngle += orb.orbitSpeed * dt;
      orb.orbitAngle %= Math.PI * 2;
      orb.x = player.x + Math.cos(orb.orbitAngle) * 48;
      orb.y = player.y + Math.sin(orb.orbitAngle) * 48;
    }
  }
  function dropItem(x, y) {
    if (defeated === 0 || defeated % 4 !== 0) return;
    const roll = Math.random();
    const type = roll < .08
      ? 'blessing'
      : roll < .10
        ? 'orb'
        : roll < .12
          ? 'talisman'
          : ['speed', 'spread', 'rear', 'mobility'][Math.floor(Math.random() * 4)];
    items.push({ x, y, type, speed: 105, phase: Math.random() * Math.PI * 2 });
  }
  function collectItem(item) {
    if (item.type === 'speed') {
      gainUpgrade('speed');
    } else if (item.type === 'spread') {
      gainUpgrade('spread');
    } else if (item.type === 'rear') {
      gainUpgrade('rear');
    } else if (item.type === 'orb' || item.type === 'talisman') {
      gainUpgrade(item.type);
    } else if (item.type === 'mobility') {
      player.speed = Math.min(540, player.speed + 30);
    } else if (item.type === 'blessing') {
      blessingTimer = 8;
      invulnerable = Math.max(invulnerable, 2.5);
    }
    burst(item.x, item.y, itemTypes[item.type].color);
    updateHud();
  }
  function fireEnemyShot(spirit) {
    const design = spirit.design || {
      attack: 'aim', count: 1, shotSpeed: 160, color: spirit.color || '#ff9fd2', shape: 'round'
    };
    const dx = player.x - spirit.x;
    const dy = player.y - spirit.y;
    const aimedAngle = design.attack === 'directionFan'
      ? (spirit.direction > 0 ? 0 : Math.PI)
      : Math.atan2(dy, dx);
    const radial = design.attack.toLowerCase().endsWith('radial');
    const slow = design.attack === 'slowFan' || design.attack === 'slowRadial';
    const decelerateOnly = design.attack === 'decelerateRadial';
    const burstFastThenSlow = design.attack === 'burstFastThenSlowRadial';
    const delayedExplosion = design.attack === 'explodeFan';
    const count = design.attack === 'aim' ? 1 : design.count;
    const spread = Math.min(1.7, .16 * (count - 1));
    for (let i = 0; i < count; i++) {
      const angle = radial
        ? -Math.PI / 2 + i * Math.PI * 2 / count + spirit.shotRotation
        : aimedAngle + (count === 1 ? 0 : (i - (count - 1) / 2) * spread / (count - 1));
      const speed = design.shotSpeed;
      const launchSpeed = burstFastThenSlow ? speed * 3
        : slow ? speed * .72
          : design.attack === 'accelerateRadial' ? speed * .42 : speed;
      const shot = {
        x: spirit.x,
        y: spirit.movement === 'shadowCross' ? Math.min(spirit.y + 12, H - 8) : spirit.y + 12,
        vx: Math.cos(angle) * launchSpeed,
        vy: Math.sin(angle) * launchSpeed,
        radius: 5, color: design.color, shape: design.shape
      };
      if (slow || design.attack === 'accelerateRadial' || decelerateOnly) {
        shot.baseSpeed = speed;
        shot.angle = angle;
        shot.motionAge = 0;
        shot.decelerate = slow;
        shot.decelerateOnly = decelerateOnly;
        shot.accelerate = design.attack === 'accelerateRadial';
      }
      if (burstFastThenSlow) {
        shot.baseSpeed = speed;
        shot.angle = angle;
        shot.motionAge = 0;
        shot.burstFastThenSlow = true;
      }
      if (delayedExplosion) shot.explodeTimer = .9;
      if (design.attack === 'seekFan') shot.seek = true;
      if (design.attack === 'reflectFan') shot.reflect = true;
      enemyShots.push(shot);
    }
    if (radial) spirit.shotRotation = (spirit.shotRotation || 0) + .12;
  }
  function updateSpiritMovement(spirit, dt) {
    spirit.age += dt;
    if (spirit.movement === 'sharkCenterCharge') {
      if (!spirit.sharkStopped) {
        spirit.x += spirit.direction * spirit.speed * 2.6 * dt;
        if (spirit.direction > 0 ? spirit.x >= spirit.sharkStopX : spirit.x <= spirit.sharkStopX) {
          spirit.x = spirit.sharkStopX;
          spirit.sharkStopped = true;
          spirit.pauseTimer = 1;
        }
        return;
      }
      if (!spirit.sharkCharging) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        if (spirit.pauseTimer === 0) {
          const angle = Math.atan2(player.y - spirit.y, player.x - spirit.x);
          const dashSpeed = spirit.speed * 3.8;
          spirit.vx = Math.cos(angle) * dashSpeed;
          spirit.vy = Math.sin(angle) * dashSpeed;
          spirit.sharkCharging = true;
        }
        return;
      }
      spirit.x += spirit.vx * dt;
      spirit.y += spirit.vy * dt;
      return;
    }
    if (spirit.movement === 'deepDragonSweepStop') {
      if (spirit.age < 1.5) {
        spirit.x = Math.max(40, Math.min(
          W - 40,
          spirit.originX + Math.sin(spirit.age * 2.8 + spirit.phase) * 145
        ));
        return;
      }
      if (!spirit.dragonStopped) {
        spirit.dragonStopped = true;
        spirit.pauseTimer = .65;
      }
      if (spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        return;
      }
      spirit.y += spirit.speed * .72 * dt;
      return;
    }
    if (spirit.movement === 'squidStopReverse') {
      if (spirit.squidTurned && spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        if (spirit.pauseTimer === 0) spirit.direction *= -1;
        return;
      }
      const nextY = spirit.y + spirit.speed * dt;
      if (!spirit.squidTurned && nextY >= spirit.pauseAt) {
        spirit.y = spirit.pauseAt;
        spirit.squidTurned = true;
        spirit.pauseTimer = spirit.pauseDuration;
        return;
      }
      spirit.y = nextY;
      spirit.x += spirit.direction * spirit.speed * .85 * dt;
      if (spirit.x < 38 || spirit.x > W - 38) {
        spirit.x = Math.max(38, Math.min(W - 38, spirit.x));
        spirit.direction *= -1;
      }
      return;
    }
    if (spirit.movement === 'riseReverse') {
      if (!spirit.riseTurned) {
        const nextY = spirit.y - spirit.speed * dt;
        if (nextY <= spirit.pauseAt) {
          spirit.y = spirit.pauseAt;
          spirit.riseTurned = true;
        } else {
          spirit.y = nextY;
        }
      } else {
        spirit.y += spirit.speed * dt;
      }
      spirit.x = Math.max(38, Math.min(
        W - 38,
        spirit.originX + Math.sin(spirit.age * 1.8 + spirit.phase) * 110
      ));
      return;
    }
    if (spirit.movement === 'bubbleStopMove') {
      if (!spirit.pauseDone) {
        const nextY = spirit.y + spirit.speed * dt;
        if (nextY >= spirit.pauseAt) {
          spirit.y = spirit.pauseAt;
          spirit.pauseDone = true;
          spirit.pauseTimer = spirit.pauseDuration;
          return;
        }
        spirit.y = nextY;
        return;
      }
      if (spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        return;
      }
      spirit.x += spirit.direction * spirit.speed * 1.1 * dt;
      if (spirit.x < 38 || spirit.x > W - 38) {
        spirit.x = Math.max(38, Math.min(W - 38, spirit.x));
        spirit.direction *= -1;
      }
      return;
    }
    if (spirit.movement === 'weaveStop') {
      if (spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
      } else if (!spirit.pauseDone && spirit.y >= spirit.pauseAt) {
        spirit.y = spirit.pauseAt;
        spirit.pauseDone = true;
        spirit.pauseTimer = spirit.pauseDuration;
      } else {
        spirit.y += spirit.speed * (spirit.pauseDone ? 1 : .72) * dt;
      }
      spirit.x = Math.max(32, Math.min(
        W - 32,
        spirit.originX + Math.sin(spirit.age * 2.2 + spirit.phase) * 92
      ));
      return;
    }
    if (spirit.movement === 'centerStop') {
      if (!spirit.centerStopped) {
        const nextX = spirit.x + spirit.direction * spirit.speed * 1.2 * dt;
        if (spirit.direction > 0 ? nextX >= W / 2 : nextX <= W / 2) {
          spirit.x = W / 2;
          spirit.centerStopped = true;
          spirit.pauseTimer = spirit.pauseDuration;
        } else {
          spirit.x = nextX;
        }
        return;
      }
      if (spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        if (spirit.pauseTimer > 0) return;
      }
      spirit.y += spirit.speed * 1.15 * dt;
      return;
    }
    if (spirit.movement === 'orbitTurn') {
      if (!spirit.orbitStarted) {
        spirit.y += spirit.speed * .72 * dt;
        const nextX = spirit.x + spirit.entrySide * spirit.speed * 1.2 * dt;
        if (spirit.entrySide > 0 ? nextX >= W / 2 : nextX <= W / 2) {
          spirit.x = W / 2;
          spirit.orbitStarted = true;
          spirit.orbitCenterY = spirit.y + 42;
          spirit.orbitProgress = 0;
        } else {
          spirit.x = nextX;
        }
      } else if (!spirit.orbitComplete) {
        spirit.orbitProgress = Math.min(1, spirit.orbitProgress + dt / 2.4);
        const angle = -Math.PI / 2 + spirit.orbitProgress * Math.PI * 2;
        spirit.x = W / 2 + Math.cos(angle) * 42;
        spirit.y = spirit.orbitCenterY + Math.sin(angle) * 42;
        if (spirit.orbitProgress === 1) spirit.orbitComplete = true;
      } else {
        spirit.y += spirit.speed * .72 * dt;
        spirit.x -= spirit.entrySide * spirit.speed * 1.2 * dt;
      }
      spirit.x = Math.max(32, Math.min(W - 32, spirit.x));
      return;
    }
    if (spirit.movement === 'stop' || spirit.movement === 'slowStop') {
      if (spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        if (spirit.pauseTimer > 0) return;
      }
      const descentSpeed = spirit.movement === 'slowStop'
        ? spirit.pauseDone ? .55 : 1
        : spirit.pauseDone ? 1.15 : 1;
      spirit.y += spirit.speed * descentSpeed * dt;
      if (!spirit.pauseDone && spirit.y >= spirit.pauseAt) {
        spirit.y = spirit.pauseAt;
        spirit.pauseDone = true;
        spirit.pauseTimer = spirit.pauseDuration;
      }
    } else {
      const verticalSpeed = spirit.movement === 'shadowCross' || spirit.movement === 'stopDiagonalExit' ? 0
        : spirit.movement === 'flank' ? .48
          : spirit.movement === 'diagonalCenter' ? .72
            : spirit.movement === 'slowZigzag' ? .58 : 1;
      spirit.y += spirit.speed * verticalSpeed * dt;
    }

    if (spirit.movement === 'stopDiagonalExit') {
      if (!spirit.pauseDone) {
        if (spirit.y >= spirit.pauseAt) {
          spirit.y = spirit.pauseAt;
          spirit.pauseTimer = spirit.pauseDuration;
          spirit.pauseDone = true;
          return;
        }
        spirit.y += spirit.speed * dt;
        return;
      }
      if (spirit.pauseTimer > 0) {
        spirit.pauseTimer = Math.max(0, spirit.pauseTimer - dt);
        if (spirit.pauseTimer > 0) return;
      }
      spirit.x += spirit.direction * spirit.speed * .85 * dt;
      spirit.y += spirit.speed * dt;
      return;
    }

    if (spirit.movement === 'diagonalCenter') {
      const direction = spirit.centerTurned ? -spirit.entrySide : spirit.entrySide;
      const nextX = spirit.x + direction * spirit.speed * 1.2 * dt;
      if (!spirit.centerTurned && (spirit.entrySide > 0 ? nextX >= W / 2 : nextX <= W / 2)) {
        spirit.x = W / 2;
        spirit.centerTurned = true;
      } else {
        spirit.x = nextX;
      }
    } else if (spirit.movement === 'diagonal') {
      const direction = spirit.age < 1.25 ? spirit.entrySide : -spirit.entrySide;
      spirit.x += direction * spirit.speed * .42 * dt;
    } else if (spirit.movement === 'cross' || spirit.movement === 'flank' || spirit.movement === 'shadowCross') {
      const horizontalSpeed = spirit.movement === 'shadowCross' || spirit.movement === 'flank' ? 1.35 : .82;
      spirit.x += spirit.direction * spirit.speed * horizontalSpeed * dt;
      if (spirit.movement !== 'shadowCross' && (spirit.x < 38 || spirit.x > W - 38)) {
        spirit.x = Math.max(38, Math.min(W - 38, spirit.x));
        spirit.direction *= -1;
      }
    } else if (spirit.movement === 'zigzag' || spirit.movement === 'slowZigzag') {
      spirit.x = spirit.originX + Math.sin(spirit.age * 3.2 + spirit.phase) * 74;
    } else if (spirit.movement === 'swoop') {
      spirit.x = spirit.originX + Math.sin(spirit.age * 1.7 + spirit.phase) * 128;
    } else {
      spirit.x = spirit.originX + Math.sin(spirit.age * 1.1 + spirit.phase) * 24;
    }
    if (spirit.movement !== 'shadowCross') spirit.x = Math.max(32, Math.min(W - 32, spirit.x));
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
  function getEnemyShotSpeed(shot) {
    if (shot.burstFastThenSlow) {
      const decelerationProgress = Math.max(0, Math.min(1, (shot.motionAge - .5) / .5));
      return shot.baseSpeed * (3 - decelerationProgress * 2.5);
    }
    if (shot.decelerateOnly) {
      return shot.baseSpeed * Math.max(.35, 1 - Math.max(0, shot.motionAge - .8) * .55);
    }
    if (shot.decelerate) {
      return shot.motionAge < .8
        ? shot.baseSpeed * Math.max(.32, .72 - shot.motionAge * .5)
        : shot.baseSpeed * Math.min(3, .32 + (shot.motionAge - .8) * 3.35);
    }
    return shot.baseSpeed * Math.min(1, .42 + shot.motionAge * .55);
  }
  function steerShot(shot, dt) {
    if (shot.type !== 'talisman') return;
    let target = null;
    let targetDistance = 360 * 360;
    const targets = spirits.filter((spirit) => !spirit.dead);
    if (stageBoss) targets.push(stageBoss);
    if (midBoss) targets.push(midBoss);
    for (const candidate of targets) {
      const dx = candidate.x - shot.x;
      const dy = candidate.y - shot.y;
      const distance = dx * dx + dy * dy;
      if (distance < targetDistance) {
        target = candidate;
        targetDistance = distance;
      }
    }
    if (!target) return;
    const speed = Math.hypot(shot.vx, shot.vy) || bulletSpeed;
    const dx = target.x - shot.x;
    const dy = target.y - shot.y;
    const distance = Math.hypot(dx, dy) || 1;
    const turn = Math.min(1, dt * 3.5);
    shot.vx += (dx / distance * speed - shot.vx) * turn;
    shot.vy += (dy / distance * speed - shot.vy) * turn;
    const adjustedSpeed = Math.hypot(shot.vx, shot.vy) || 1;
    shot.vx *= speed / adjustedSpeed;
    shot.vy *= speed / adjustedSpeed;
  }
  function consumeShotHit(shot, target) {
    if (shot.orbiting) {
      const now = performance.now() / 1000;
      const lastHit = shot.hitTargets.get(target);
      if (lastHit !== undefined && now - lastHit < .65) return false;
      shot.hitTargets.set(target, now);
      return true;
    }
    if (shot.hitTargets.has(target)) return false;
    shot.hitTargets.add(target);
    if (shot.pierce > 0) shot.pierce -= 1;
    else shot.dead = true;
    return true;
  }
  function enterPhaseTwo() {
    enterPhase(2);
  }
  function enterStageBoss(stage) {
    const theme = stageThemes[stage - 1];
    stageBoss = {
      stage, name: theme.bossName, type: theme.bossType,
      color: theme.color, accent: theme.accent, specialName: theme.specialName,
      specialNames: theme.specialNames || [theme.specialName],
      summonName: theme.summonName, minions: theme.minions,
      x: W / 2, y: 112, size: 96, hp: theme.hp, maxHp: theme.hp,
      attackTimer: 1, attackIndex: 0, ringOffset: 0,
      dashState: 'idle', dashTimer: 0, dashCooldown: 4.5, dashTargetX: W / 2,
      dashHomeX: W / 2,
      specialCooldown: stage === 1 ? 8 : Math.max(10, 16 - stage),
      specialWarning: 0, specialTime: 0, specialUses: 0, attackStyle: 0,
      specialRingTimer: 0, specialAimTimer: 0, specialRotation: 0,
      summonRemaining: 0, summonTimer: 0
    };
    spirits = [];
    enemyShots = [];
    spawnTimer = Infinity;
    phaseBanner = 3;
    bossBannerText = `${stage}面ボス・${stageBoss.name}！`;
    updateHud();
  }
  function damageStageBoss(damage) {
    if (!stageBoss || stageBoss.specialTime > 0) return;
    const hpFloor = stageBoss.stage === 1 && stageBoss.specialUses < 3
      ? stageBoss.specialUses === 0 ? stageBoss.maxHp * 2 / 3
        : stageBoss.specialUses === 1 ? stageBoss.maxHp / 3 : 1
      : 0;
    stageBoss.hp = Math.max(hpFloor, stageBoss.hp - damage);
    burst(stageBoss.x, stageBoss.y, '#ffe99a');
    if (stageBoss.hp <= 0) defeatStageBoss();
  }
  function grantBossShotReward() {
    const available = ['orb', 'talisman'].filter((type) => upgrades[type].level < maxSpecialShotLevel);
    if (available.length === 0) return null;
    const type = available[Math.floor(Math.random() * available.length)];
    gainUpgrade(type);
    return type;
  }
  function bossShotRewardLabel(type) {
    return type === 'orb' ? '光玉' : '札';
  }
  function defeatStageBoss() {
    if (!stageBoss) return;
    const defeatedStage = stageBoss.stage;
    burst(stageBoss.x, stageBoss.y, '#ffe99a');
    addScore(defeatedStage === 1 ? 5000 : 8000);
    const reward = grantBossShotReward();
    spirits = [];
    enemyShots = [];
    stageBoss = null;
    if (reward) {
      bossBannerText = `ボス撃破報酬：${bossShotRewardLabel(reward)} +1`;
      bossBanner = 2.8;
    }
    if (defeatedStage < stageThemes.length) {
      enemyShots = [];
      pendingTransition = { type: 'stageClear', target: getGlobalPhase(defeatedStage + 1, 1), clearTimer: 1.8 };
    } else {
      bossBannerText = `${defeatedStage}面クリア！`;
      bossBanner = 3;
      endGame(true);
    }
    updateHud();
  }
  function enterPhaseThree(targetPhase = 3) {
    phase = targetPhase;
    phaseDefeated = 0;
    spawnSequenceIndex = 0;
    elapsed = 0;
    phaseBanner = 3;
    spawnTimer = 1.5;
    spirits = [];
    enemyShots = [];
    midBoss = createMidBoss(targetPhase);
    updateHud();
  }
  function createMidBoss(targetPhase) {
    return {
      stage: getStage(targetPhase), x: W / 2, y: 105, size: 76,
      hp: 120, maxHp: 120, fireTimer: 1.2, patternIndex: 0, ringOffset: 0,
      attackState: 'idle', attackTimer: 1.2, burstShots: 0, burstTimer: 0,
      burstCycles: 0, specialDue: false, rainTimer: 1 + Math.random(),
      moveTargetX: W / 2, specialWaveTimer: 0, specialWave: 0,
      specialBaseAngle: 0
    };
  }
  function scheduleTransition(type, target = null) {
    if (pendingTransition) return;
    pendingTransition = { type, target, clearTimer: null };
  }
  function updatePendingTransition(dt) {
    if (!pendingTransition) return;
    if (spirits.length > 0) return;
    if (pendingTransition.clearTimer === null) pendingTransition.clearTimer = 2;
    pendingTransition.clearTimer -= dt;
    if (pendingTransition.clearTimer > 0) return;
    const transition = pendingTransition;
    pendingTransition = null;
    if (transition.type === 'stageBoss') enterStageBoss(transition.target);
    else if (transition.type === 'phaseThree') enterPhaseThree(transition.target);
    else if (transition.type === 'phase') enterPhase(transition.target);
    else if (transition.type === 'stageClear') enterPhase(transition.target);
    else if (transition.type === 'clear') endGame(true);
  }
  function defeatMidBoss() {
    if (!midBoss) return;
    burst(midBoss.x, midBoss.y, '#ffe99a');
    addScore(2500);
    bombs += 1;
    enemyShots = [];
    const reward = grantBossShotReward();
    midBoss = null;
    bossBannerText = `中ボス撃破！ ボム +1${reward ? `・${bossShotRewardLabel(reward)} +1` : ''}`;
    bossBanner = 2.8;
    spawnTimer = .9;
    updateHud();
  }
  function fireBossPattern() {
    const dx = player.x - midBoss.x;
    const dy = player.y - midBoss.y;
    const baseAngle = Math.atan2(dy, dx);
    const pattern = midBoss.patternIndex % 3;
    midBoss.patternIndex += 1;
    let count;
    let firstAngle;
    let angleStep;
    let speed;
    let color;
    let shape;
    if (pattern === 0) {
      count = 5;
      firstAngle = baseAngle - .4;
      angleStep = .2;
      speed = 150;
      color = '#ff9fd2';
      shape = 'round';
    } else if (pattern === 1) {
      count = 8;
      firstAngle = midBoss.ringOffset;
      angleStep = Math.PI / 4;
      speed = 105;
      color = '#9cecff';
      shape = 'ring';
      midBoss.ringOffset += Math.PI / 8;
    } else {
      count = 7;
      firstAngle = Math.PI / 2 - .54;
      angleStep = .18;
      speed = 125;
      color = '#ffe99a';
      shape = 'diamond';
    }
    for (let i = 0; i < count; i++) {
      const angle = firstAngle + angleStep * i;
      enemyShots.push({
        x: midBoss.x, y: midBoss.y + 24,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: 6, color, shape
      });
    }
  }
  function fireSecondStageBossRing(offset = 0, count = 16, speed = 108, color = '#ff8b67', shape = 'round') {
    for (let i = 0; i < count; i++) {
      const angle = offset + i * Math.PI * 2 / count;
      enemyShots.push({
        x: midBoss.x, y: midBoss.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: 5, color, shape
      });
    }
  }
  function fireSecondStageBossGhostfireRing(offset = 0) {
    fireSecondStageBossRing(offset, 16, 162, '#e34bff', 'flame');
    enemyShots.slice(-16).forEach((shot) => { shot.explodeTimer = 1; });
  }
  function explodeSecondStageBossGhostfire(shot) {
    shot.dead = true;
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI * 2 / 16;
      enemyShots.push({
        x: shot.x, y: shot.y,
        vx: Math.cos(angle) * 132, vy: Math.sin(angle) * 132,
        radius: 5, color: '#e34bff', shape: 'diamond'
      });
    }
  }
  function fireSecondStageBossBurst() {
    const aimAngle = Math.atan2(player.y - midBoss.y, player.x - midBoss.x);
    fireSecondStageBossRing(aimAngle, 48, 145, '#ffe99a', 'diamond');
  }
  function fireSecondStageBossBlueRain() {
    enemyShots.push({
      x: 14 + Math.random() * (W - 28), y: -8,
      vx: (Math.random() - .5) * 36, vy: 120 + Math.random() * 40,
      radius: 7, color: '#65d9ff', shape: 'ring'
    });
  }
  function fireSecondStageBossSpecialPattern(count, offset, speed, color, shape, radius) {
    for (let i = 0; i < count; i++) {
      const angle = midBoss.specialBaseAngle + offset + i * Math.PI * 2 / count;
      enemyShots.push({
        x: midBoss.x, y: midBoss.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius, color, shape
      });
    }
  }
  function startSecondStageBossAttack() {
    if (midBoss.specialDue) {
      midBoss.specialDue = false;
      midBoss.attackState = 'specialMove';
      return;
    }
    if (midBoss.burstCycles >= 5) {
      midBoss.burstCycles = 0;
      midBoss.specialDue = true;
      midBoss.attackState = 'ring';
      fireSecondStageBossRing();
      fireSecondStageBossGhostfireRing();
      midBoss.attackTimer = 2;
      return;
    }
    midBoss.attackState = 'burstPause';
    midBoss.attackTimer = .5;
    midBoss.burstShots = 0;
  }
  function updateSecondStageMidBoss(dt) {
    midBoss.rainTimer -= dt;
    if (midBoss.rainTimer <= 0) {
      fireSecondStageBossBlueRain();
      midBoss.rainTimer = .55 + Math.random() * .65;
    }
    if (midBoss.attackState === 'idle') {
      const hoverX = W / 2 + Math.sin(performance.now() / 1100) * 190;
      const hoverY = 105 + Math.sin(performance.now() / 760) * 18;
      const moveX = Math.sign(hoverX - midBoss.x) * Math.min(Math.abs(hoverX - midBoss.x), 90 * dt);
      const moveY = Math.sign(hoverY - midBoss.y) * Math.min(Math.abs(hoverY - midBoss.y), 36 * dt);
      midBoss.x += moveX;
      midBoss.y += moveY;
      midBoss.attackTimer -= dt;
      if (midBoss.attackTimer <= 0) startSecondStageBossAttack();
      return;
    }
    if (midBoss.attackState === 'burstPause') {
      midBoss.attackTimer -= dt;
      if (midBoss.attackTimer <= 0) {
        midBoss.attackState = 'burstFire';
        fireSecondStageBossBurst();
        midBoss.burstShots = 1;
        midBoss.burstTimer = .25;
      }
      return;
    }
    if (midBoss.attackState === 'burstFire') {
      midBoss.burstTimer -= dt;
      if (midBoss.burstTimer <= 0) {
        fireSecondStageBossBurst();
        midBoss.burstShots += 1;
        if (midBoss.burstShots === 3) {
          midBoss.burstCycles += 1;
          midBoss.attackState = 'retreat';
          midBoss.moveTargetX = midBoss.x < W / 2 ? W * .78 : W * .22;
        } else {
          midBoss.burstTimer = .25;
        }
      }
      return;
    }
    if (midBoss.attackState === 'retreat') {
      midBoss.x += Math.sign(midBoss.moveTargetX - midBoss.x) * Math.min(Math.abs(midBoss.moveTargetX - midBoss.x), 220 * dt);
      if (Math.abs(midBoss.moveTargetX - midBoss.x) < 1) {
        midBoss.x = midBoss.moveTargetX;
        midBoss.attackState = 'idle';
        midBoss.attackTimer = .6;
      }
      return;
    }
    if (midBoss.attackState === 'ring') {
      midBoss.attackTimer -= dt;
      if (midBoss.attackTimer <= 0) {
        fireSecondStageBossRing(Math.PI / 4, 16);
        fireSecondStageBossGhostfireRing(Math.PI / 4);
        midBoss.attackState = 'idle';
        midBoss.attackTimer = .7;
      }
      return;
    }
    if (midBoss.attackState === 'specialMove') {
      midBoss.x += Math.sign(W / 2 - midBoss.x) * Math.min(Math.abs(W / 2 - midBoss.x), 210 * dt);
      midBoss.y += Math.sign(130 - midBoss.y) * Math.min(Math.abs(130 - midBoss.y), 120 * dt);
      if (Math.abs(midBoss.x - W / 2) < .01 && Math.abs(midBoss.y - 130) < .01) {
        midBoss.x = W / 2;
        midBoss.y = 130;
        midBoss.attackState = 'specialWarning';
        midBoss.attackTimer = 1;
        bossBannerText = '星喰いの大輪！';
        bossBanner = 1;
      }
      return;
    }
    if (midBoss.attackState === 'specialWarning') {
      midBoss.attackTimer -= dt;
      if (midBoss.attackTimer <= 0) {
        midBoss.attackState = 'specialActive';
        midBoss.specialWave = 1;
        midBoss.specialWaveTimer = 1;
        midBoss.specialBaseAngle = Math.atan2(player.y - midBoss.y, player.x - midBoss.x);
        fireSecondStageBossSpecialPattern(12, 0, 160, '#ffe99a', 'star', 7);
      }
      return;
    }
    if (midBoss.attackState === 'specialActive') {
      midBoss.specialWaveTimer -= dt;
      if (midBoss.specialWaveTimer <= 0 && midBoss.specialWave === 1) {
        fireSecondStageBossSpecialPattern(6, Math.PI / 12, 190, '#ffe99a', 'star', 8);
        midBoss.specialWave += 1;
        midBoss.specialWaveTimer = 1;
      } else if (midBoss.specialWaveTimer <= 0 && midBoss.specialWave === 2) {
        fireSecondStageBossSpecialPattern(8, 0, 130, '#ff704d', 'fire', 8);
        midBoss.attackState = 'specialRecovery';
        midBoss.attackTimer = 1.5;
      }
      return;
    }
    if (midBoss.attackState === 'specialRecovery') {
      midBoss.attackTimer -= dt;
      if (midBoss.attackTimer <= 0) {
        midBoss.attackState = 'idle';
        midBoss.attackTimer = 1;
      }
    }
  }
  function fireStageBossPattern() {
    const dx = player.x - stageBoss.x;
    const dy = player.y - stageBoss.y;
    const baseAngle = Math.atan2(dy, dx);
    const pattern = stageBoss.attackIndex % 3;
    stageBoss.attackIndex += 1;
    let count;
    let firstAngle;
    let angleStep;
    let speed;
    let shape;
    let color;
    if (stageBoss.stage === 1) {
      if (pattern === 0) {
        count = 5;
        firstAngle = baseAngle - .4;
        angleStep = .2;
        speed = 145;
        shape = 'round';
        color = '#ff9fd2';
      } else if (pattern === 1) {
        count = 7;
        firstAngle = Math.PI / 2 - .54;
        angleStep = .18;
        speed = 125;
        shape = 'diamond';
        color = '#ffe99a';
      } else {
        count = 10;
        firstAngle = stageBoss.ringOffset;
        angleStep = Math.PI * 2 / count;
        speed = 100;
        shape = 'ring';
        color = '#9cecff';
        stageBoss.ringOffset += .16;
      }
    } else if (stageBoss.stage === 2) {
      if (pattern === 0) {
        count = 9;
        firstAngle = Math.PI / 2 - .72;
        angleStep = .18;
        speed = 118;
        shape = 'diamond';
        color = '#b8f5ff';
      } else if (pattern === 1) {
        count = 6;
        firstAngle = baseAngle - .35;
        angleStep = .14;
        speed = 132;
        shape = 'ring';
        color = '#80e8ff';
      } else {
        count = 12;
        firstAngle = stageBoss.ringOffset;
        angleStep = Math.PI * 2 / count;
        speed = 92;
        shape = 'ring';
        color = '#d4fff0';
        stageBoss.ringOffset += .12;
      }
    } else {
      const stage = stageBoss.stage;
      if (pattern === 0) {
        count = stage === 3 ? 7 : stage === 4 ? 9 : 11;
        firstAngle = Math.PI / 2 - (count - 1) * .09;
        angleStep = .18;
        speed = 112 + stage * 3;
        shape = stage === 4 ? 'ring' : 'diamond';
        color = stageBoss.accent;
      } else if (pattern === 1) {
        count = stage === 3 ? 5 : stage === 4 ? 7 : 9;
        firstAngle = baseAngle - (count - 1) * .11;
        angleStep = .22;
        speed = 132 + stage * 2;
        shape = 'round';
        color = stageBoss.color;
      } else {
        count = stage === 3 ? 12 : stage === 4 ? 14 : 16;
        firstAngle = stageBoss.ringOffset;
        angleStep = Math.PI * 2 / count;
        speed = 88 + stage * 3;
        shape = stage === 4 ? 'diamond' : 'ring';
        color = stageBoss.accent;
        stageBoss.ringOffset += stage === 5 ? .21 : .15;
      }
    }
    if (stageBoss.stage === 1 && stageBoss.attackStyle > 0) {
      if (stageBoss.attackStyle === 1) {
        if (pattern === 0) {
          count = 7; firstAngle = baseAngle - .48; angleStep = .16;
          speed = 155; shape = 'round'; color = '#ffad70';
        } else if (pattern === 1) {
          count = 9; firstAngle = Math.PI / 2 - .8; angleStep = .2;
          speed = 132; shape = 'diamond'; color = '#ffe99a';
        } else {
          count = 12; firstAngle = stageBoss.ringOffset; angleStep = Math.PI * 2 / count;
          speed = 108; shape = 'ring'; color = '#ff79c6';
          stageBoss.ringOffset += .23;
        }
      } else if (pattern === 0) {
        count = 5; firstAngle = baseAngle - .36; angleStep = .18;
        speed = 190; shape = 'round'; color = '#ffe99a';
      } else if (pattern === 1) {
        count = 16; firstAngle = stageBoss.ringOffset; angleStep = Math.PI * 2 / count;
        speed = 94; shape = 'ring'; color = '#b7c8ff';
        stageBoss.ringOffset += .28;
      } else {
        count = 11; firstAngle = Math.PI / 2 - .7; angleStep = .14;
        speed = 145; shape = 'diamond'; color = '#ff9fd2';
      }
    }
    for (let i = 0; i < count; i++) {
      const angle = firstAngle + angleStep * i;
      enemyShots.push({
        x: stageBoss.x, y: stageBoss.y + 28,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: 6, color, shape
      });
    }
  }
  function fireStageBossSpecial() {
    const dx = player.x - stageBoss.x;
    const dy = player.y - stageBoss.y;
    const baseAngle = Math.atan2(dy, dx);
    const ringCount = stageBoss.stage === 1
      ? stageBoss.specialUses === 2 ? 8 : stageBoss.specialUses === 3 ? 18 : 12
      : stageBoss.stage <= 2 ? 12 : 10 + stageBoss.stage * 2;
    const aimedCount = stageBoss.stage === 1
      ? stageBoss.specialUses === 2 ? 9 : stageBoss.specialUses === 3 ? 7 : 5
      : stageBoss.stage === 2 ? 7 : 7 + stageBoss.stage - 2;
    for (let i = 0; i < ringCount; i++) {
      const angle = stageBoss.specialRotation + i * Math.PI * 2 / ringCount;
      const speed = 76 + stageBoss.stage * 6 + (i % 2) * 16;
      enemyShots.push({
        x: stageBoss.x, y: stageBoss.y + 24,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: 6, color: i % 2 === 0 ? stageBoss.color : stageBoss.accent,
        shape: i % 2 === 0 ? 'ring' : 'diamond'
      });
    }
    for (let i = 0; i < aimedCount; i++) {
      const angle = baseAngle + (i - (aimedCount - 1) / 2) * .16;
      enemyShots.push({
        x: stageBoss.x, y: stageBoss.y + 24,
        vx: Math.cos(angle) * (100 + stageBoss.stage * 3),
        vy: Math.sin(angle) * (100 + stageBoss.stage * 3),
        radius: 5, color: stageBoss.accent, shape: 'round'
      });
    }
    if (stageBoss.stage === 1 && stageBoss.specialUses === 2) {
      for (const direction of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const angle = baseAngle + direction * (.55 + i * .12);
          enemyShots.push({
            x: stageBoss.x, y: stageBoss.y + 24,
            vx: Math.cos(angle) * 128, vy: Math.sin(angle) * 128,
            radius: 5, color: stageBoss.color, shape: 'diamond'
          });
        }
      }
    }
    stageBoss.specialRotation += .18;
  }
  function updateStageBoss(dt) {
    if (!stageBoss) return;
    if (stageBoss.hp <= 0) {
      defeatStageBoss();
      return;
    }
    if (stageBoss.specialTime > 0) {
      stageBoss.specialTime = Math.max(0, stageBoss.specialTime - dt);
      stageBoss.specialRingTimer -= dt;
      stageBoss.specialAimTimer -= dt;
      if (stageBoss.specialRingTimer <= 0) {
        fireStageBossSpecial();
        stageBoss.specialRingTimer = .95;
        stageBoss.specialAimTimer = .55;
      } else if (stageBoss.specialAimTimer <= 0) {
        const dx = player.x - stageBoss.x;
        const dy = player.y - stageBoss.y;
        const angle = Math.atan2(dy, dx);
        for (let i = -1; i <= 1; i++) {
          const spreadAngle = angle + i * .22;
          enemyShots.push({
            x: stageBoss.x, y: stageBoss.y + 24,
            vx: Math.cos(spreadAngle) * 112, vy: Math.sin(spreadAngle) * 112,
            radius: 5, color: '#bce8ff', shape: 'round'
          });
        }
        stageBoss.specialAimTimer = 1.1;
      }
      if (stageBoss.specialTime <= 0) {
        stageBoss.specialCooldown = stageBoss.stage === 1
          ? stageBoss.specialUses < 3 ? 8 : Infinity
          : 16;
        if (stageBoss.stage === 1) stageBoss.attackStyle = Math.min(2, stageBoss.specialUses);
        stageBoss.summonRemaining = 8;
        stageBoss.summonTimer = .25;
        bossBannerText = stageBoss.summonName;
        bossBanner = 2.4;
      }
      return;
    }
    if (stageBoss.summonRemaining > 0) {
      stageBoss.summonTimer -= dt;
      if (stageBoss.summonTimer <= 0) {
        const side = stageBoss.summonRemaining % 2 === 0 ? -1 : 1;
        spirits.push({
          x: Math.max(38, Math.min(W - 38, stageBoss.x + side * (35 + Math.random() * 45))),
          y: stageBoss.y + 25,
          size: 38,
          speed: 68 + Math.random() * 22,
          phase: Math.random() * Math.PI * 2,
          drift: 32,
          type: stageBoss.minions[stageBoss.summonRemaining % stageBoss.minions.length],
          hp: 1,
          maxHp: 1,
          fireTimer: 1.8 + Math.random() * .8,
          value: 150,
          color: stageBoss.color,
          summoned: true
        });
        stageBoss.summonRemaining -= 1;
        stageBoss.summonTimer = .38;
      }
      return;
    }
    if (stageBoss.specialWarning > 0) {
      stageBoss.specialWarning -= dt;
      if (stageBoss.specialWarning <= 0) {
        stageBoss.specialTime = 6;
        if (stageBoss.stage === 1) stageBoss.specialUses += 1;
        stageBoss.specialRingTimer = 0;
        stageBoss.specialAimTimer = 0;
        enemyShots = [];
      }
      return;
    }
    if (stageBoss.dashState === 'warning') {
      stageBoss.dashTimer -= dt;
      stageBoss.x += (stageBoss.dashTargetX - stageBoss.x) * Math.min(1, dt * 2.5);
      if (stageBoss.dashTimer <= 0) stageBoss.dashState = 'dash';
      return;
    }
    if (stageBoss.dashState === 'dash') {
      stageBoss.y += 560 * dt;
      if (stageBoss.y > H + stageBoss.size) {
        stageBoss.dashState = 'return';
        stageBoss.y = H + stageBoss.size;
      }
      return;
    }
    if (stageBoss.dashState === 'return') {
      stageBoss.x += Math.sign(stageBoss.dashHomeX - stageBoss.x)
        * Math.min(Math.abs(stageBoss.dashHomeX - stageBoss.x), 260 * dt);
      stageBoss.y -= Math.min(stageBoss.y - 112, 360 * dt);
      if (stageBoss.y <= 112 && Math.abs(stageBoss.x - stageBoss.dashHomeX) < 1) {
        stageBoss.x = stageBoss.dashHomeX;
        stageBoss.y = 112;
        stageBoss.dashState = 'idle';
        stageBoss.dashCooldown = 4.5;
        stageBoss.attackTimer = 1;
      }
      return;
    }
    const hoverX = W / 2 + Math.sin(performance.now() / 900) * 220;
    const hoverY = 112 + Math.sin(performance.now() / 700) * 14;
    const hoverEase = Math.min(1, dt * 2);
    stageBoss.x += (hoverX - stageBoss.x) * hoverEase;
    stageBoss.y += (hoverY - stageBoss.y) * hoverEase;
    stageBoss.specialCooldown -= dt;
    if (stageBoss.specialCooldown <= 0) {
      stageBoss.specialWarning = stageBoss.stage >= 3 ? 1.6 : 1.3;
      if (stageBoss.stage === 1) {
        stageBoss.specialName = stageBoss.specialNames[Math.min(stageBoss.specialUses, stageBoss.specialNames.length - 1)];
      }
      return;
    }
    stageBoss.dashCooldown -= dt;
    if (stageBoss.dashCooldown <= 0) {
      stageBoss.dashState = 'warning';
      stageBoss.dashTimer = .8;
      stageBoss.dashTargetX = player.x;
      stageBoss.dashHomeX = stageBoss.x;
      return;
    }
    stageBoss.attackTimer -= dt;
    if (stageBoss.attackTimer <= 0) {
      fireStageBossPattern();
      stageBoss.attackTimer = 1.15;
    }
  }

  function update(dt) {
    elapsed += dt;
    blessingTimer = Math.max(0, blessingTimer - dt);
    updateBonusEffectHud();
    if (!pendingTransition && !stageBoss) {
      const stagePhase = getStagePhase();
      const nextPhase = phase + 1;
      if (stagePhase === 1 && (phaseDefeated >= 36 || (phase === 1 && elapsed >= 45))) {
        scheduleTransition('phase', nextPhase);
      } else if (stagePhase === 2 && (phaseDefeated >= 48 || elapsed >= 100)) {
        scheduleTransition('phaseThree', nextPhase);
      } else if (stagePhase === 3 && !midBoss && phaseDefeated >= 48) {
        scheduleTransition('phase', nextPhase);
      } else if (stagePhase === 4 && phaseDefeated >= 54) {
        scheduleTransition('phase', nextPhase);
      } else if (stagePhase === 5 && phaseDefeated >= 60) {
        scheduleTransition('phase', nextPhase);
      } else if (stagePhase === 6 && phaseDefeated >= 72) {
        scheduleTransition('stageBoss', getStage());
      }
    }
    phaseBanner = Math.max(0, phaseBanner - dt);
    bossBanner = Math.max(0, bossBanner - dt);
    bombFlash = Math.max(0, bombFlash - dt);

    const left = keys.has('ArrowLeft') || keys.has('KeyA') || controls.left;
    const right = keys.has('ArrowRight') || keys.has('KeyD') || controls.right;
    const up = keys.has('ArrowUp') || keys.has('KeyW') || controls.up;
    const down = keys.has('ArrowDown') || keys.has('KeyS') || controls.down;
    const firing = keys.has('Space') || controls.fire;
    const slow = keys.has('ShiftLeft') || keys.has('ShiftRight') || controls.slow;
    const speed = player.speed * (blessingTimer > 0 ? 1.35 : 1) * (slow ? .42 : 1);
    let moveX = (right ? 1 : 0) - (left ? 1 : 0);
    let moveY = (down ? 1 : 0) - (up ? 1 : 0);
    if (moveX && moveY) { moveX *= Math.SQRT1_2; moveY *= Math.SQRT1_2; }
    player.x += moveX * speed * dt;
    player.y += moveY * speed * dt;
    player.x = Math.max(34, Math.min(W - 34, player.x));
    player.y = Math.max(45, Math.min(H - 35, player.y));
    if (invulnerable > 0) invulnerable -= dt;
    updateOrbitingOrbs(dt);

    shotTimer -= dt;
    if (firing && shotTimer <= 0) {
      shoot();
      shotTimer = shotInterval * (blessingTimer > 0 ? 1 / 1.5 : 1);
    }
    if (!midBoss && !stageBoss && !pendingTransition) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const activeCount = spirits.filter((spirit) => !spirit.dead).length;
        const spawned = activeCount === 0 || (phase !== 4 && Math.random() < .3)
          ? spawnSpirit()
          : false;
        spawnTimer = spawned
          ? (activeCount === 0 ? .8 : 1.15) + Math.random() * .35
          : .35;
      }
    }
    if (stageBoss) updateStageBoss(dt);
    if (!running) return;
    if (midBoss) {
      if (midBoss.stage === 2) {
        updateSecondStageMidBoss(dt);
      } else {
        midBoss.x = W / 2 + Math.sin(performance.now() / 1100) * 210;
        midBoss.y = 105 + Math.sin(performance.now() / 760) * 18;
        midBoss.fireTimer -= dt;
        if (midBoss.fireTimer <= 0) {
          fireBossPattern();
          midBoss.fireTimer = .95;
        }
      }
    }
    if (Math.random() < dt * 1.2) addStar();
    stars.forEach((star) => star.y += star.speed * dt);
    stars = stars.filter((star) => star.y < H + 8);
    shots.forEach((shot) => {
      if (shot.orbiting) return;
      steerShot(shot, dt);
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
    });
    shots = shots.filter((shot) => shot.y > -20 && shot.y < H + 20 && shot.x > -20 && shot.x < W + 20);
    enemyShots.forEach((shot) => {
      if (shot.decelerate || shot.decelerateOnly || shot.accelerate || shot.burstFastThenSlow) {
        shot.motionAge += dt;
        const speed = getEnemyShotSpeed(shot);
        shot.vx = Math.cos(shot.angle) * speed;
        shot.vy = Math.sin(shot.angle) * speed;
      }
      if (shot.seek) {
        const speed = Math.hypot(shot.vx, shot.vy) || 1;
        const dx = player.x - shot.x;
        const dy = player.y - shot.y;
        const distance = Math.hypot(dx, dy) || 1;
        const turn = Math.min(1, dt * .7);
        shot.vx += (dx / distance * speed - shot.vx) * turn;
        shot.vy += (dy / distance * speed - shot.vy) * turn;
        const adjustedSpeed = Math.hypot(shot.vx, shot.vy) || 1;
        shot.vx *= speed / adjustedSpeed;
        shot.vy *= speed / adjustedSpeed;
      }
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (shot.reflect && (shot.x < 6 || shot.x > W - 6)) {
        shot.x = Math.max(6, Math.min(W - 6, shot.x));
        shot.vx *= -1;
        shot.reflectCount = (shot.reflectCount || 0) + 1;
        if (shot.reflectCount >= 2) shot.reflect = false;
      }
      if (shot.explodeTimer !== undefined) {
        shot.explodeTimer -= dt;
        if (shot.explodeTimer <= 0) {
          if (shot.shape === 'flame') {
            explodeSecondStageBossGhostfire(shot);
          } else {
            shot.dead = true;
            for (let i = 0; i < 6; i++) {
              const angle = i * Math.PI / 3;
              enemyShots.push({
                x: shot.x, y: shot.y,
                vx: Math.cos(angle) * 132, vy: Math.sin(angle) * 132,
                radius: 5, color: shot.color, shape: 'diamond'
              });
            }
          }
        }
      }
    });
    enemyShots = enemyShots.filter((shot) => !shot.dead && shot.x > -20 && shot.x < W + 20 && shot.y > -20 && shot.y < H + 20);
    items.forEach((item) => { item.y += item.speed * dt; item.x += Math.sin(performance.now() / 360 + item.phase) * 30 * dt; });
    items = items.filter((item) => item.y < H + 20);

    for (const spirit of spirits) {
      if (spirit.summoned) {
        spirit.y += spirit.speed * dt;
        spirit.x += Math.sin(performance.now() / 380 + spirit.phase) * spirit.drift * dt;
      } else {
        updateSpiritMovement(spirit, dt);
      }
      if (spirit.maxHp && (spirit.summoned || !spirit.design || spirit.design.attack !== 'charge')) {
        const canAttack = spirit.y > 20
          && (spirit.movement === 'shadowCross' ? spirit.y < H + spirit.size : spirit.y < H - 80);
        if (canAttack) spirit.fireTimer -= dt;
        if (spirit.fireTimer <= 0 && canAttack) {
          fireEnemyShot(spirit);
          if (spirit.summoned) {
            spirit.fireTimer = 2.8 + Math.random() * .8;
          } else if (spirit.design.attack === 'aim') {
            if (!spirit.burstActive) {
              spirit.burstRemaining = spirit.design.count - 1;
              spirit.burstActive = true;
            } else if (spirit.burstRemaining > 0) {
              spirit.burstRemaining -= 1;
            }
            if (spirit.burstRemaining > 0) {
              spirit.fireTimer = .2;
            } else {
              spirit.burstActive = false;
              spirit.fireTimer = spirit.design.cooldown * (.88 + Math.random() * .24);
            }
          } else {
            spirit.fireTimer = spirit.design.cooldown * (.88 + Math.random() * .24);
          }
        }
      }
      const escaped = (spirit.movement === 'riseReverse'
        ? spirit.riseTurned && spirit.y > H + 30
        : spirit.movement === 'sharkCenterCharge'
          ? spirit.sharkCharging && (spirit.x < -spirit.size || spirit.x > W + spirit.size || spirit.y < -spirit.size || spirit.y > H + 30)
          : spirit.y > H + 30)
        || (spirit.movement === 'shadowCross' && (spirit.x < -spirit.size || spirit.x > W + spirit.size));
      if (escaped && !spirit.passed) {
        spirit.passed = true;
        score = Math.max(0, score - 100);
        burst(spirit.x, H - 12, '#a7dcff');
        updateHud();
      }
    }
    spirits = spirits.filter((spirit) => spirit.y <= H + 50
      && (spirit.movement !== 'shadowCross' || (spirit.x >= -spirit.size && spirit.x <= W + spirit.size))
      && (spirit.movement !== 'sharkCenterCharge' || !spirit.passed
        || (spirit.x >= -spirit.size && spirit.x <= W + spirit.size && spirit.y >= -spirit.size))
      && !spirit.dead);

    for (const shot of shots) {
      if (stageBoss && hit(shot, stageBoss, stageBoss.size * .52 + (shot.orbiting ? shot.radius : 0)) && consumeShotHit(shot, stageBoss)) {
        if (stageBoss.specialTime <= 0) {
          damageStageBoss(1);
        }
        if (shot.dead) continue;
      }
      if (midBoss && hit(shot, midBoss, midBoss.size * .52 + (shot.orbiting ? shot.radius : 0)) && consumeShotHit(shot, midBoss)) {
        midBoss.hp -= 1;
        burst(shot.x, shot.y, '#ffe99a');
        if (midBoss.hp <= 0) defeatMidBoss();
        if (shot.dead) continue;
      }
      for (const spirit of spirits) {
        if (!spirit.dead && hit(shot, spirit, spirit.size * .42 + (shot.orbiting ? shot.radius : 0)) && consumeShotHit(shot, spirit)) {
          spirit.hp -= 1;
          if (spirit.hp <= 0) {
            spirit.dead = true;
            addScore(spirit.value || 100);
            defeated += 1;
            phaseDefeated += 1;
            dropItem(spirit.x, spirit.y);
            burst(spirit.x, spirit.y);
            updateHud();
          } else {
            burst(shot.x, shot.y, '#ffe99a');
          }
          if (shot.dead) break;
        }
      }
    }
    shots = shots.filter((shot) => !shot.dead);
    spirits = spirits.filter((spirit) => !spirit.dead);
    if (!running) return;

    items = items.filter((item) => {
      if (hit(player, item, 30)) { collectItem(item); return false; }
      return true;
    });
    if (invulnerable <= 0) {
      for (const shot of enemyShots) {
        if (hit(player, shot, shot.radius + 10)) {
          shot.dead = true;
          registerPlayerHit(player.x, player.y, '#a9eaff');
          if (lives <= 0) return;
          break;
        }
      }
      enemyShots = enemyShots.filter((shot) => !shot.dead);
      if (invulnerable <= 0 && stageBoss && hit(player, stageBoss, stageBoss.size * .55)) {
        registerPlayerHit(player.x, player.y, '#a9eaff');
        if (lives <= 0) return;
      }
      if (invulnerable <= 0 && midBoss && hit(player, midBoss, midBoss.size * .55)) {
        registerPlayerHit(player.x, player.y, '#a9eaff');
        if (lives <= 0) return;
      }
      for (const spirit of spirits) {
        if (invulnerable <= 0 && !spirit.passed && hit(player, spirit, 38)) {
          spirit.dead = true;
          registerPlayerHit(spirit.x, spirit.y, '#fff0a8');
          if (lives <= 0) return;
          break;
        }
      }
    }
    spirits = spirits.filter((spirit) => !spirit.dead);
    updatePendingTransition(dt);
    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 110 * dt; p.life -= dt; });
    particles = particles.filter((p) => p.life > 0);
  }

  function drawBackground() {
    const theme = phaseThemes[phase] || phaseThemes[30];
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(.68, theme.middle);
    gradient.addColorStop(1, theme.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    if (phase <= 6) {
      ctx.fillStyle = '#211b3c';
      ctx.beginPath(); ctx.moveTo(0, 450); ctx.quadraticCurveTo(180, 400, 360, 455); ctx.quadraticCurveTo(600, 390, 800, 440); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.fillStyle = '#17152f';
      ctx.beginPath(); ctx.moveTo(0, 510); ctx.quadraticCurveTo(220, 450, 440, 520); ctx.quadraticCurveTo(650, 445, 800, 505); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.fillStyle = '#a94771';
      ctx.fillRect(94, 255, 13, 135); ctx.fillRect(185, 255, 13, 135);
      ctx.fillRect(78, 253, 136, 12); ctx.fillRect(88, 272, 116, 7);
    } else if (getStage() === 2) {
      ctx.fillStyle = '#092b4b';
      ctx.beginPath(); ctx.moveTo(0, 480); ctx.quadraticCurveTo(180, 430, 360, 482); ctx.quadraticCurveTo(600, 420, 800, 465); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.fillStyle = '#061d39';
      ctx.beginPath(); ctx.moveTo(0, 525); ctx.quadraticCurveTo(220, 470, 440, 530); ctx.quadraticCurveTo(650, 465, 800, 520); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.strokeStyle = '#38a99e';
      ctx.lineWidth = 6;
      for (let i = 0; i < 8; i++) {
        const x = 25 + i * 108;
        ctx.beginPath();
        ctx.moveTo(x, 555);
        ctx.quadraticCurveTo(x + Math.sin(performance.now() / 700 + i) * 24, 510, x + 12, 465 - (i % 3) * 24);
        ctx.stroke();
      }
      ctx.strokeStyle = '#54c8d0';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const x = 38 + i * 174;
        ctx.beginPath();
        ctx.moveTo(x, 585);
        ctx.quadraticCurveTo(x - 15, 550, x + 4, 525);
        ctx.quadraticCurveTo(x + 24, 550, x + 15, 580);
        ctx.stroke();
      }
    } else if (getStage() === 3) {
      ctx.fillStyle = '#491b20';
      ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(170, 390, 350, 468); ctx.quadraticCurveTo(590, 370, 800, 455); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.fillStyle = '#6e2824';
      ctx.beginPath(); ctx.moveTo(0, 535); ctx.quadraticCurveTo(210, 470, 430, 540); ctx.quadraticCurveTo(620, 480, 800, 520); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.strokeStyle = '#ff8b45'; ctx.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        const x = 35 + i * 105;
        ctx.beginPath(); ctx.moveTo(x, 590); ctx.quadraticCurveTo(x + Math.sin(performance.now() / 300 + i) * 12, 550, x + 8, 515); ctx.stroke();
      }
    } else if (getStage() === 4) {
      ctx.fillStyle = '#172d2a';
      ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(200, 425, 410, 475); ctx.quadraticCurveTo(620, 415, 800, 460); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.fillStyle = '#10201f'; ctx.fillRect(0, 520, W, 80);
      ctx.strokeStyle = '#7d9b61'; ctx.lineWidth = 13;
      for (let i = 0; i < 9; i++) {
        const x = 35 + i * 96;
        ctx.beginPath(); ctx.moveTo(x, 600); ctx.quadraticCurveTo(x - 5, 420, x + Math.sin(performance.now() / 900 + i) * 18, 280); ctx.stroke();
        ctx.strokeStyle = '#a8bd79'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 9, 430); ctx.lineTo(x + 9, 430); ctx.moveTo(x - 9, 365); ctx.lineTo(x + 9, 365); ctx.stroke();
        ctx.strokeStyle = '#7d9b61'; ctx.lineWidth = 13;
      }
    } else {
      ctx.fillStyle = '#1a1b47';
      ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(150, 425); ctx.lineTo(255, 475); ctx.lineTo(390, 400); ctx.lineTo(530, 470); ctx.lineTo(680, 420); ctx.lineTo(800, 465); ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.fill();
      ctx.fillStyle = '#292454';
      ctx.fillRect(90, 365, 42, 150); ctx.fillRect(110, 320, 8, 45);
      ctx.fillRect(640, 345, 50, 180); ctx.fillRect(660, 300, 10, 45);
      ctx.fillStyle = '#8d79bf';
      for (let i = 0; i < 7; i++) {
        const x = 70 + i * 110;
        ctx.beginPath(); ctx.arc(x, 505 + Math.sin(performance.now() / 500 + i) * 5, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = theme.star;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {
      const x = (i * 97 + performance.now() * .018) % W;
      const y = (i * 71 + performance.now() * .035) % H;
      ctx.globalAlpha = .45;
      if (getStage() === 1) {
        ctx.fillStyle = '#ffc9e5';
        ctx.beginPath(); ctx.ellipse(x, y, 4, 7, .5, 0, Math.PI * 2); ctx.fill();
      } else if (getStage() === 2) {
        ctx.fillStyle = '#a8fff0';
        ctx.beginPath(); ctx.arc(x, y, 3 + i % 3, 0, Math.PI * 2); ctx.fill();
      } else if (getStage() === 3) {
        ctx.fillStyle = '#ffae5e';
        ctx.globalAlpha = .5;
        ctx.beginPath(); ctx.ellipse(x, y, 3 + i % 2, 6, .3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = .45;
      } else if (getStage() === 4) {
        ctx.fillStyle = '#c9e6a5';
        ctx.beginPath(); ctx.ellipse(x, y, 5, 2, performance.now() / 500 + i, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#e0d4ff';
        ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.fill();
      }
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
      ctx.beginPath(); ctx.arc(0, 0, shot.orbiting ? shot.radius : 6, 0, Math.PI * 2); ctx.fill();
      if (shot.orbiting) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#e4ffff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, shot.radius + 4, 0, Math.PI * 2); ctx.stroke();
      }
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
      ctx.beginPath();
      if (shot.shape === 'circle') {
        ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.shape === 'ellipse') {
        ctx.ellipse(shot.x, shot.y, 6, 3, Math.atan2(shot.vy, shot.vx), 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.shape === 'star') {
        const rotation = Math.atan2(shot.vy, shot.vx) + Math.PI / 2;
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? shot.radius : shot.radius * .45;
          const angle = rotation + i * Math.PI / 5;
          const x = shot.x + Math.cos(angle) * radius;
          const y = shot.y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else if (shot.shape === 'butterfly') {
        ctx.ellipse(shot.x - 4, shot.y, 5, 7, -.45, 0, Math.PI * 2);
        ctx.ellipse(shot.x + 4, shot.y, 5, 7, .45, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(shot.x, shot.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.shape === 'fire') {
        ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd36e';
        ctx.beginPath();
        ctx.arc(shot.x - shot.radius * .2, shot.y - shot.radius * .2, shot.radius * .48, 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.shape === 'laser') {
        ctx.translate(shot.x, shot.y);
        ctx.rotate(Math.atan2(shot.vy, shot.vx));
        ctx.fillRect(-18, -5, 36, 10);
      } else if (shot.shape === 'flame') {
        ctx.translate(shot.x, shot.y);
        ctx.rotate(Math.atan2(shot.vy, shot.vx));
        ctx.moveTo(shot.radius, 0);
        ctx.quadraticCurveTo(-shot.radius * .2, -shot.radius, -shot.radius * 1.8, -shot.radius * .65);
        ctx.quadraticCurveTo(-shot.radius * 1.2, 0, -shot.radius * 1.8, shot.radius * .65);
        ctx.quadraticCurveTo(-shot.radius * .2, shot.radius, shot.radius, 0);
        ctx.fill();
        ctx.fillStyle = '#ff9af7';
        ctx.beginPath();
        ctx.arc(0, 0, shot.radius * .55, 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.shape === 'ring') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = shot.color;
        ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shot.shape === 'diamond') {
        ctx.moveTo(shot.x, shot.y - shot.radius);
        ctx.lineTo(shot.x + shot.radius, shot.y);
        ctx.lineTo(shot.x, shot.y + shot.radius);
        ctx.lineTo(shot.x - shot.radius, shot.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (stageBoss && stageBoss.dashState === 'warning') {
      ctx.save();
      ctx.globalAlpha = .45 + Math.sin(performance.now() / 70) * .2;
      ctx.strokeStyle = '#fff0a8';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(stageBoss.dashTargetX, stageBoss.y + 38);
      ctx.lineTo(stageBoss.dashTargetX, H);
      ctx.stroke();
      ctx.restore();
    }
    items.forEach((item) => {
      const style = itemTypes[item.type];
      ctx.save(); ctx.translate(item.x, item.y);
      ctx.shadowColor = style.color; ctx.shadowBlur = 14; ctx.fillStyle = style.color;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      if (item.type === 'blessing') {
        ctx.strokeStyle = '#fff8c7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.fillStyle = '#2b1d3d';
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(style.symbol, 0, 1); ctx.restore();
    });
    spirits.forEach((spirit) => {
      ctx.save(); ctx.translate(spirit.x, spirit.y);
      ctx.font = `${spirit.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = spirit.color || (phaseThemes[phase] || phaseThemes[6]).enemy; ctx.shadowBlur = 12;
      ctx.fillText(spirit.type, 0, 0);
      if (spirit.maxHp) {
        ctx.shadowBlur = 0; ctx.fillStyle = '#221a34'; ctx.fillRect(-18, spirit.size * .48, 36, 4);
        ctx.fillStyle = '#ff9fd2'; ctx.fillRect(-18, spirit.size * .48, 36 * spirit.hp / spirit.maxHp, 4);
      }
      ctx.restore();
    });
    if (midBoss) {
      ctx.save();
      ctx.translate(midBoss.x, midBoss.y);
      ctx.font = `${midBoss.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff78c7';
      ctx.shadowBlur = 24;
      ctx.fillText('👹', 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#281735';
      ctx.fillRect(-64, midBoss.size * .62, 128, 8);
      ctx.fillStyle = '#ff79c6';
      ctx.fillRect(-64, midBoss.size * .62, 128 * Math.max(0, midBoss.hp) / midBoss.maxHp, 8);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#fff0fa';
      ctx.fillText('星喰いの鬼', 0, -midBoss.size * .68);
      if (midBoss.stage === 2 && midBoss.attackState === 'specialWarning') {
        const pulse = 50 + Math.sin(performance.now() / 90) * 7;
        ctx.globalAlpha = .65 + Math.sin(performance.now() / 120) * .2;
        ctx.strokeStyle = '#ffe99a';
        ctx.shadowColor = '#e34bff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = .55;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, pulse * .72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#ffe99a';
        ctx.fillText('星喰いの大輪！', 0, -midBoss.size * .95);
      }
      ctx.restore();
    }
    if (stageBoss) {
      ctx.save();
      ctx.translate(stageBoss.x, stageBoss.y);
      ctx.font = `${stageBoss.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = stageBoss.specialTime > 0 ? stageBoss.accent : stageBoss.color;
      ctx.shadowBlur = stageBoss.specialTime > 0 ? 32 : 22;
      ctx.fillText(stageBoss.type, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#281735';
      ctx.fillRect(-82, stageBoss.size * .62, 164, 10);
      ctx.fillStyle = stageBoss.specialTime > 0 ? stageBoss.accent : stageBoss.color;
      ctx.fillRect(-82, stageBoss.size * .62, 164 * Math.max(0, stageBoss.hp) / stageBoss.maxHp, 10);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#fff0fa';
      ctx.fillText(stageBoss.name, 0, -stageBoss.size * .7);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#fff8e8';
      ctx.fillText(`HP ${Math.max(0, Math.ceil(stageBoss.hp))} / ${stageBoss.maxHp}`, 0, stageBoss.size * .62 - 8);
      if (stageBoss.specialTime > 0) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = stageBoss.accent;
        ctx.fillText('必殺技中・ダメージ無効', 0, stageBoss.size * .9);
      }
      ctx.restore();
    }
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
      const theme = phaseThemes[phase] || phaseThemes[30];
      ctx.fillStyle = theme.star;
      ctx.shadowColor = theme.enemy; ctx.shadowBlur = 18;
      ctx.font = '900 42px sans-serif';
        const currentStage = getStage();
        const localPhase = getStagePhase();
      ctx.fillText(stageBoss ? `STAGE ${stageBoss.stage} BOSS` : `STAGE ${currentStage} - PHASE ${localPhase}`, W / 2, H * .34);
      ctx.font = '700 19px sans-serif';
      const phaseMessages = {
        1: '妖精たちが現れた！',
        2: '妖怪の反撃！',
        3: '中ボス・星喰いの鬼！',
        4: '夜空の守り手たち！',
        5: '星の海を切りひらけ！',
        6: '最後の星を守りぬけ！',
        7: '深海の世界へ！',
        8: '珊瑚の海を進め！',
        9: '氷海の守り手！',
        10: '凍てつく海流！',
        11: '深海の主が目覚める！',
        12: '氷海の龍に挑め！',
        13: '紅蓮火山へ！',
        14: '火山の眷属！',
        15: '噴き上がる溶岩！',
        16: '灼熱の試練！',
        17: '鳳凰の炎翼！',
        18: '火山の主に挑め！',
        19: '月影の竹林へ！',
        20: '竹林の小さな守り手！',
        21: '月明かりの道！',
        22: '幻惑の蝶が舞う！',
        23: '古森の主が目覚める！',
        24: '白鹿に挑め！',
        25: '星冠の天空城へ！',
        26: '星の回廊！',
        27: '彗星の訪れ！',
        28: '天空城の守り手！',
        29: '星々が集う！',
        30: '天龍との決戦！'
      };
      ctx.fillText(stageBoss ? `${stageBoss.name}！` : phaseMessages[phase] || '', W / 2, H * .34 + 34);
      ctx.restore();
    }
    if (pendingTransition) {
      ctx.save();
      ctx.textAlign = 'center';
      const isStageClear = pendingTransition.type === 'stageBoss' || pendingTransition.type === 'stageClear';
      ctx.fillStyle = isStageClear ? '#b8f5ff' : '#fff0d0';
      ctx.shadowColor = isStageClear ? '#80e8ff' : '#ff9fd2';
      ctx.shadowBlur = 16;
      ctx.font = '900 28px sans-serif';
      ctx.fillText(
        spirits.length ? '敵を片付けよう！'
          : pendingTransition.type === 'stageClear' ? `STAGE ${getStage(pendingTransition.target) - 1} CLEAR`
            : isStageClear ? `STAGE ${pendingTransition.target} CLEAR` : 'PHASE CLEAR',
        W / 2, H * .27
      );
      if (!spirits.length && pendingTransition.clearTimer !== null) {
        ctx.font = '700 17px sans-serif';
        ctx.fillText(`次へ進むまで ${Math.max(1, Math.ceil(pendingTransition.clearTimer))}`, W / 2, H * .27 + 28);
      }
      ctx.restore();
    }
    if (stageBoss && stageBoss.specialWarning > 0) {
      ctx.save();
      ctx.globalAlpha = .65 + Math.sin(performance.now() / 90) * .25;
      ctx.textAlign = 'center';
      ctx.fillStyle = stageBoss.accent;
      ctx.shadowColor = stageBoss.color;
      ctx.shadowBlur = 20;
      ctx.font = '900 30px sans-serif';
      ctx.fillText(stageBoss.specialName, W / 2, H * .24);
      ctx.restore();
    }
    if (bossBanner > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, bossBanner * 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe99a';
      ctx.shadowColor = '#ff9fd2';
      ctx.shadowBlur = 18;
      ctx.font = '900 34px sans-serif';
      ctx.fillText(bossBannerText, W / 2, H * .3);
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
