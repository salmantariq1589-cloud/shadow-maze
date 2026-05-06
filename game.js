const firebaseConfig = {
  apiKey: "AIzaSyBRKPqjcEHz_KQY90vH4kd29eP0zKWTdoc",
  authDomain: "shadow-maze-4d93c.firebaseapp.com",
  databaseURL: "https://shadow-maze-4d93c-default-rtdb.firebaseio.com",
  projectId: "shadow-maze-4d93c",
  storageBucket: "shadow-maze-4d93c.firebasestorage.app",
  messagingSenderId: "485176484069",
  appId: "1:485176484069:web:8a67569d04aff3ab3cb40c"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const leaderboardRef = database.ref("leaderboard");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const highScoreText = document.getElementById("highScore");
const livesText = document.getElementById("lives");
const comboText = document.getElementById("combo");
const shieldStatusText = document.getElementById("shieldStatus");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const soundBtn = document.getElementById("soundBtn");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startBtn = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const finalScoreText = document.getElementById("finalScoreText");
const finalLevelText = document.getElementById("finalLevelText");

const levelCompleteScreen = document.getElementById("levelCompleteScreen");
const levelCompleteTitle = document.getElementById("levelCompleteTitle");
const levelBonusText = document.getElementById("levelBonusText");
const nextLevelText = document.getElementById("nextLevelText");
const continueLevelBtn = document.getElementById("continueLevelBtn");

const pauseScreen = document.getElementById("pauseScreen");
const resumeBtn = document.getElementById("resumeBtn");

const playerNameInput = document.getElementById("playerNameInput");
const submitScoreBtn = document.getElementById("submitScoreBtn");
const submitStatus = document.getElementById("submitStatus");
const leaderboardList = document.getElementById("leaderboardList");

const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const tileSize = 40;
const rows = 15;
const cols = 15;
const movementSpeed = 8;

let score = 0;
let level = 1;
let pendingNextLevel = 2;
let lives = 3;

let hasShield = false;
let shieldTimer = null;
let shieldTimeLeft = 0;

let combo = 1;
let lastOrbCollectTime = 0;
let comboTimeout = 1700;

let gameOver = false;
let gameStarted = false;
let isEnding = false;
let isMoving = false;
let isLevelTransitioning = false;
let isHitRecovering = false;
let isPaused = false;
let scoreSubmitted = false;

let shadowFrozen = false;
let shadowFreezeTimer = null;

let soundEnabled = localStorage.getItem("shadowMazeSound") !== "off";
let audioContext = null;

let deathAnimation = {
  active: false,
  frame: 0,
  maxFrames: 45,
  row: 0,
  col: 0
};

let hitAnimation = {
  active: false,
  frame: 0,
  maxFrames: 28,
  row: 0,
  col: 0
};

let highScore = Number(localStorage.getItem("shadowMazeHighScore")) || 0;
highScoreText.textContent = highScore;

let player = {
  row: 1,
  col: 1,
  previousRow: 1,
  previousCol: 1,
  x: 1 * tileSize + tileSize / 2,
  y: 1 * tileSize + tileSize / 2,
  targetX: 1 * tileSize + tileSize / 2,
  targetY: 1 * tileSize + tileSize / 2
};

let shadow = {
  row: 13,
  col: 13,
  previousRow: 13,
  previousCol: 13,
  x: 13 * tileSize + tileSize / 2,
  y: 13 * tileSize + tileSize / 2,
  targetX: 13 * tileSize + tileSize / 2,
  targetY: 13 * tileSize + tileSize / 2,
  active: false
};

let hunter = {
  row: 13,
  col: 1,
  previousRow: 13,
  previousCol: 1,
  x: 1 * tileSize + tileSize / 2,
  y: 13 * tileSize + tileSize / 2,
  targetX: 1 * tileSize + tileSize / 2,
  targetY: 13 * tileSize + tileSize / 2,
  active: false,
  moveCounter: 0
};

let pathHistory = [];
let orbs = [];
let powerUps = [];
let portals = [];
let playerTrail = [];
let backgroundParticles = [];

const mazeTemplates = [
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,1,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
];

let maze = mazeTemplates[0];

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency, duration, type = "sine", volume = 0.06, delay = 0) {
  if (!soundEnabled) return;

  try {
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);

    gain.gain.setValueAtTime(0, audioContext.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + delay + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime + delay);
    oscillator.stop(audioContext.currentTime + delay + duration);
  } catch (error) {
    console.warn("Audio unavailable:", error);
  }
}

function playSound(name) {
  if (!soundEnabled) return;

  if (name === "collect") {
    playTone(880, 0.08, "sine", 0.035);
  }

  if (name === "power") {
    playTone(660, 0.08, "triangle", 0.05);
    playTone(990, 0.12, "triangle", 0.05, 0.07);
  }

  if (name === "teleport") {
    playTone(320, 0.08, "sawtooth", 0.035);
    playTone(760, 0.14, "sawtooth", 0.035, 0.08);
  }

  if (name === "hit") {
    playTone(180, 0.22, "square", 0.055);
  }

  if (name === "level") {
    playTone(523, 0.1, "triangle", 0.05);
    playTone(659, 0.1, "triangle", 0.05, 0.1);
    playTone(784, 0.15, "triangle", 0.05, 0.2);
  }

  if (name === "gameover") {
    playTone(220, 0.18, "sawtooth", 0.045);
    playTone(140, 0.25, "sawtooth", 0.045, 0.17);
  }

  if (name === "click") {
    playTone(520, 0.06, "sine", 0.03);
  }
}

function updateSoundButton() {
  soundBtn.textContent = soundEnabled ? "Sound On" : "Sound Off";
}

function getTileCenter(row, col) {
  return {
    x: col * tileSize + tileSize / 2,
    y: row * tileSize + tileSize / 2
  };
}

function setEntityPosition(entity, row, col) {
  const position = getTileCenter(row, col);

  entity.row = row;
  entity.col = col;
  entity.previousRow = row;
  entity.previousCol = col;
  entity.x = position.x;
  entity.y = position.y;
  entity.targetX = position.x;
  entity.targetY = position.y;
}

function setPlayerPosition(row, col) {
  setEntityPosition(player, row, col);
}

function setShadowPosition(row, col) {
  setEntityPosition(shadow, row, col);
}

function setHunterPosition(row, col) {
  setEntityPosition(hunter, row, col);
}

function chooseMazeForLevel() {
  const mazeIndex = (level - 1) % mazeTemplates.length;
  maze = mazeTemplates[mazeIndex];
}

function canMoveTo(row, col) {
  if (row < 0 || col < 0 || row >= rows || col >= cols) {
    return false;
  }

  return maze[row][col] === 0;
}

function isPortalTile(row, col) {
  return portals.some(portal => portal.row === row && portal.col === col);
}

function isPowerUpTile(row, col) {
  return powerUps.some(powerUp => powerUp.row === row && powerUp.col === col && !powerUp.collected);
}

function isOccupiedSpecial(row, col) {
  if (row === player.row && col === player.col) return true;
  if (shadow.active && row === shadow.row && col === shadow.col) return true;
  if (hunter.active && row === hunter.row && col === hunter.col) return true;
  if (isPortalTile(row, col)) return true;
  if (isPowerUpTile(row, col)) return true;
  return false;
}

function getOpenTiles() {
  const spaces = [];

  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      const isNearStart = row <= 2 && col <= 2;

      if (maze[row][col] === 0 && !isNearStart && !isOccupiedSpecial(row, col)) {
        spaces.push({ row, col });
      }
    }
  }

  return spaces;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createOrbs() {
  orbs = [];
  powerUps = [];
  portals = [];

  createPortals();
  createPowerUps();

  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      if (maze[row][col] === 0) {
        const isPlayerStart = row === player.row && col === player.col;
        const isShadowStart = shadow.active && row === shadow.row && col === shadow.col;
        const isHunterStart = hunter.active && row === hunter.row && col === hunter.col;
        const isPortal = isPortalTile(row, col);
        const isPower = isPowerUpTile(row, col);

        if (!isPlayerStart && !isShadowStart && !isHunterStart && !isPortal && !isPower) {
          orbs.push({
            row,
            col,
            collected: false,
            pulseOffset: Math.random() * Math.PI * 2
          });
        }
      }
    }
  }
}

function createPowerUps() {
  powerUps = [];
  const spaces = getOpenTiles();

  if (spaces.length < 2) return;

  const freezeTile = randomFrom(spaces);

  powerUps.push({
    row: freezeTile.row,
    col: freezeTile.col,
    type: "freeze",
    collected: false,
    pulseOffset: Math.random() * Math.PI * 2
  });

  const remaining = spaces.filter(tile => tile.row !== freezeTile.row || tile.col !== freezeTile.col);

  if (remaining.length === 0) return;

  const shieldTile = randomFrom(remaining);

  powerUps.push({
    row: shieldTile.row,
    col: shieldTile.col,
    type: "shield",
    collected: false,
    pulseOffset: Math.random() * Math.PI * 2
  });
}

function createPortals() {
  const portalA = { row: 1, col: 13 };
  const portalB = { row: 13, col: 1 };

  if (canMoveTo(portalA.row, portalA.col) && canMoveTo(portalB.row, portalB.col)) {
    portals = [
      { row: portalA.row, col: portalA.col, pairIndex: 1 },
      { row: portalB.row, col: portalB.col, pairIndex: 0 }
    ];
    return;
  }

  const spaces = getOpenTiles();

  if (spaces.length >= 2) {
    const first = spaces[0];
    const second = spaces[spaces.length - 1];

    portals = [
      { row: first.row, col: first.col, pairIndex: 1 },
      { row: second.row, col: second.col, pairIndex: 0 }
    ];
  }
}

function getShadowDelay() {
  if (level <= 2) return 10;
  if (level <= 4) return 8;
  if (level <= 6) return 7;
  if (level <= 9) return 6;
  return 5;
}

function movePlayer(rowChange, colChange) {
  if (gameOver || !gameStarted || isEnding || isMoving || isLevelTransitioning || isHitRecovering || isPaused) return;

  const newRow = player.row + rowChange;
  const newCol = player.col + colChange;

  if (!canMoveTo(newRow, newCol)) return;

  player.previousRow = player.row;
  player.previousCol = player.col;

  player.row = newRow;
  player.col = newCol;

  const playerTarget = getTileCenter(newRow, newCol);
  player.targetX = playerTarget.x;
  player.targetY = playerTarget.y;

  pathHistory.push({ row: player.row, col: player.col });

  updateShadowTargetFromHistory();
  updateHunterTarget();

  isMoving = true;
}

function updateShadowTargetFromHistory() {
  if (shadowFrozen) return;

  const shadowDelay = getShadowDelay();

  if (pathHistory.length > shadowDelay) {
    const oldPosition = pathHistory.shift();

    if (!shadow.active) {
      setShadowPosition(oldPosition.row, oldPosition.col);
      shadow.active = true;
    } else {
      shadow.previousRow = shadow.row;
      shadow.previousCol = shadow.col;

      shadow.row = oldPosition.row;
      shadow.col = oldPosition.col;

      const shadowTarget = getTileCenter(shadow.row, shadow.col);
      shadow.targetX = shadowTarget.x;
      shadow.targetY = shadowTarget.y;
    }
  }
}

function updateHunterTarget() {
  if (!hunter.active || level < 3) return;

  hunter.moveCounter++;

  let hunterMoveRate = 3;

  if (level >= 5) hunterMoveRate = 2;
  if (level >= 8) hunterMoveRate = 1;

  if (hunter.moveCounter % hunterMoveRate !== 0) return;

  const possibleMoves = [
    { row: hunter.row - 1, col: hunter.col },
    { row: hunter.row + 1, col: hunter.col },
    { row: hunter.row, col: hunter.col - 1 },
    { row: hunter.row, col: hunter.col + 1 }
  ].filter(move => canMoveTo(move.row, move.col));

  if (possibleMoves.length === 0) return;

  possibleMoves.sort((a, b) => {
    const distanceA = Math.abs(a.row - player.row) + Math.abs(a.col - player.col);
    const distanceB = Math.abs(b.row - player.row) + Math.abs(b.col - player.col);
    return distanceA - distanceB;
  });

  const bestMove = possibleMoves[0];

  hunter.previousRow = hunter.row;
  hunter.previousCol = hunter.col;
  hunter.row = bestMove.row;
  hunter.col = bestMove.col;

  const target = getTileCenter(hunter.row, hunter.col);
  hunter.targetX = target.x;
  hunter.targetY = target.y;
}

function updateSmoothMovement() {
  if (isMoving) {
    moveEntitySmooth(player, movementSpeed);

    const playerArrived = player.x === player.targetX && player.y === player.targetY;

    if (playerArrived) {
      isMoving = false;

      addPlayerTrail();
      handlePortal();
      collectOrbs();
      collectPowerUps();
      checkCollision();
    }
  }

  if (shadow.active && !shadowFrozen) {
    moveEntitySmooth(shadow, movementSpeed);
  }

  if (hunter.active) {
    const hunterSpeed = level >= 7 ? movementSpeed - 1 : movementSpeed - 2;
    moveEntitySmooth(hunter, Math.max(5, hunterSpeed));
  }
}

function moveEntitySmooth(entity, speed) {
  const dx = entity.targetX - entity.x;
  const dy = entity.targetY - entity.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= speed) {
    entity.x = entity.targetX;
    entity.y = entity.targetY;
  } else if (distance > 0) {
    entity.x += (dx / distance) * speed;
    entity.y += (dy / distance) * speed;
  }
}

function handlePortal() {
  const portalIndex = portals.findIndex(portal => portal.row === player.row && portal.col === player.col);

  if (portalIndex === -1) return;

  const targetPortal = portals[portals[portalIndex].pairIndex];

  setPlayerPosition(targetPortal.row, targetPortal.col);
  playerTrail = [];
  message.textContent = "Teleported!";
  playSound("teleport");

  setTimeout(() => {
    if (!gameOver && !isLevelTransitioning && !isPaused) {
      message.textContent = "";
    }
  }, 900);
}

function addPlayerTrail() {
  playerTrail.push({
    x: player.x,
    y: player.y,
    life: 18
  });

  if (playerTrail.length > 8) {
    playerTrail.shift();
  }
}

function updateTrail() {
  playerTrail.forEach(trail => trail.life--);
  playerTrail = playerTrail.filter(trail => trail.life > 0);
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("shadowMazeHighScore", highScore);
    highScoreText.textContent = highScore;
  }
}

function updateHud() {
  scoreText.textContent = score;
  highScoreText.textContent = highScore;
  livesText.textContent = lives;
  comboText.textContent = "x" + combo;

  if (hasShield) {
    shieldStatusText.textContent = shieldTimeLeft > 0 ? shieldTimeLeft + "s" : "Yes";
  } else {
    shieldStatusText.textContent = "No";
  }
}

function collectOrbs() {
  if (isLevelTransitioning) return;

  const now = Date.now();
  let collectedAny = false;

  orbs.forEach(orb => {
    if (orb.row === player.row && orb.col === player.col && !orb.collected) {
      orb.collected = true;
      collectedAny = true;

      if (now - lastOrbCollectTime < comboTimeout) {
        combo = Math.min(combo + 1, 5);
      } else {
        combo = 1;
      }

      const points = 10 * combo;
      score += points;
      lastOrbCollectTime = now;

      message.textContent = combo > 1 ? "Combo x" + combo + "! +" + points : "";
      playSound("collect");
      updateHighScore();
      updateHud();
    }
  });

  if (!collectedAny && now - lastOrbCollectTime > comboTimeout) {
    combo = 1;
    updateHud();
  }

  const remainingOrbs = orbs.filter(orb => !orb.collected);

  if (remainingOrbs.length === 0) {
    showLevelCompleteScreen();
  }
}

function collectPowerUps() {
  if (isLevelTransitioning) return;

  powerUps.forEach(powerUp => {
    if (powerUp.row === player.row && powerUp.col === player.col && !powerUp.collected) {
      powerUp.collected = true;

      if (powerUp.type === "freeze") {
        score += 50;
        activateFreezePowerUp();
      }

      if (powerUp.type === "shield") {
        score += 75;
        activateShieldPowerUp();
      }

      playSound("power");
      updateHighScore();
      updateHud();
    }
  });
}

function activateFreezePowerUp() {
  shadowFrozen = true;
  message.textContent = "Shadow frozen! +50";

  if (shadowFreezeTimer) clearTimeout(shadowFreezeTimer);

  shadowFreezeTimer = setTimeout(() => {
    shadowFrozen = false;

    if (!gameOver && !isLevelTransitioning && !isPaused) {
      message.textContent = "";
    }
  }, 3000);
}

function activateShieldPowerUp() {
  hasShield = true;
  shieldTimeLeft = 6;
  message.textContent = "Shield activated! +75";

  if (shieldTimer) {
    clearInterval(shieldTimer);
  }

  updateHud();

  shieldTimer = setInterval(() => {
    if (isPaused) return;

    shieldTimeLeft--;
    updateHud();

    if (shieldTimeLeft <= 0) {
      hasShield = false;
      shieldTimeLeft = 0;

      clearInterval(shieldTimer);
      shieldTimer = null;

      if (!gameOver && !isLevelTransitioning && !isPaused) {
        message.textContent = "";
      }

      updateHud();
    }
  }, 1000);
}

function clearShield() {
  hasShield = false;
  shieldTimeLeft = 0;

  if (shieldTimer) {
    clearInterval(shieldTimer);
    shieldTimer = null;
  }

  updateHud();
}

function showLevelCompleteScreen() {
  if (isLevelTransitioning) return;

  isLevelTransitioning = true;
  isMoving = false;
  isPaused = false;
  shadowFrozen = false;
  clearShield();

  if (shadowFreezeTimer) {
    clearTimeout(shadowFreezeTimer);
    shadowFreezeTimer = null;
  }

  const completedLevel = level;
  pendingNextLevel = level + 1;
  const levelBonus = pendingNextLevel * 100;

  score += levelBonus;
  updateHighScore();
  updateHud();

  levelCompleteTitle.textContent = "Level " + completedLevel + " Complete!";
  levelBonusText.textContent = "Bonus +" + levelBonus;
  nextLevelText.textContent = "Get ready for Level " + pendingNextLevel;

  pauseScreen.classList.add("hidden");
  pauseBtn.textContent = "Pause";
  levelCompleteScreen.classList.remove("hidden");
  playSound("level");
}

function continueToNextLevel() {
  playSound("click");
  level = pendingNextLevel;

  chooseMazeForLevel();

  setPlayerPosition(1, 1);
  setShadowPosition(13, 13);
  setHunterPosition(13, 1);

  shadow.active = false;
  hunter.active = level >= 3;
  hunter.moveCounter = 0;
  shadowFrozen = false;
  clearShield();

  if (shadowFreezeTimer) {
    clearTimeout(shadowFreezeTimer);
    shadowFreezeTimer = null;
  }

  pathHistory = [];
  playerTrail = [];
  powerUps = [];
  portals = [];
  isMoving = false;
  isLevelTransitioning = false;
  isPaused = false;

  createOrbs();
  updateHud();

  levelCompleteScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseBtn.textContent = "Pause";
  message.textContent = level >= 3 ? "New enemy: Hunter!" : "";
}

function handlePlayerHit() {
  if (isEnding || isHitRecovering) return;

  if (hasShield) {
    clearShield();
    resetEnemiesAfterHit();
    message.textContent = "Shield saved you!";
    playSound("power");
    return;
  }

  lives--;
  updateHud();

  hitAnimation.active = true;
  hitAnimation.frame = 0;
  hitAnimation.row = player.row;
  hitAnimation.col = player.col;

  playSound("hit");

  if (lives <= 0) {
    endGame();
    return;
  }

  isHitRecovering = true;
  gameStarted = false;
  message.textContent = "Hit! Lives left: " + lives;

  setTimeout(() => {
    resetAfterLifeLost();
  }, 900);
}

function resetAfterLifeLost() {
  setPlayerPosition(1, 1);
  resetEnemiesAfterHit();

  pathHistory = [];
  playerTrail = [];
  isMoving = false;
  isHitRecovering = false;
  gameStarted = true;
  message.textContent = "";
}

function resetEnemiesAfterHit() {
  setShadowPosition(13, 13);
  setHunterPosition(13, 1);

  shadow.active = false;
  hunter.active = level >= 3;
  hunter.moveCounter = 0;
  shadowFrozen = false;

  if (shadowFreezeTimer) {
    clearTimeout(shadowFreezeTimer);
    shadowFreezeTimer = null;
  }
}

function endGame() {
  if (isEnding || gameOver) return;

  isEnding = true;
  gameOver = true;
  gameStarted = false;
  isMoving = false;
  isLevelTransitioning = false;
  isPaused = false;
  shadowFrozen = false;
  clearShield();

  if (shadowFreezeTimer) {
    clearTimeout(shadowFreezeTimer);
    shadowFreezeTimer = null;
  }

  updateHighScore();

  deathAnimation.active = true;
  deathAnimation.frame = 0;
  deathAnimation.row = player.row;
  deathAnimation.col = player.col;

  pauseScreen.classList.add("hidden");
  pauseBtn.textContent = "Pause";
  message.textContent = "Your shadow caught you!";
  playSound("gameover");

  setTimeout(() => {
    finalScoreText.textContent = "Final Score: " + score;
    finalLevelText.textContent = "You reached Level " + level;

    const savedName = localStorage.getItem("shadowMazePlayerName") || "";
    playerNameInput.value = savedName;
    submitStatus.textContent = scoreSubmitted ? "Score already submitted." : "";

    message.textContent = "";
    deathAnimation.active = false;
    gameOverScreen.classList.remove("hidden");
  }, 1100);
}

function checkCollision() {
  if (isLevelTransitioning || isHitRecovering) return;

  let shadowCollision = false;
  let hunterCollision = false;

  if (shadow.active && !shadowFrozen) {
    const sameTile = player.row === shadow.row && player.col === shadow.col;

    const crossedPaths =
      player.row === shadow.previousRow &&
      player.col === shadow.previousCol &&
      shadow.row === player.previousRow &&
      shadow.col === player.previousCol;

    shadowCollision = sameTile || crossedPaths;
  }

  if (hunter.active) {
    hunterCollision = player.row === hunter.row && player.col === hunter.col;
  }

  if (shadowCollision || hunterCollision) {
    handlePlayerHit();
  }
}

function submitScoreToLeaderboard() {
  if (score <= 0) {
    submitStatus.textContent = "Play first, then submit your score.";
    return;
  }

  if (scoreSubmitted) {
    submitStatus.textContent = "You already submitted this score.";
    return;
  }

  const cleanName = playerNameInput.value.trim().replace(/[<>]/g, "").slice(0, 20);

  if (!cleanName) {
    submitStatus.textContent = "Please enter your name.";
    return;
  }

  localStorage.setItem("shadowMazePlayerName", cleanName);

  submitScoreBtn.disabled = true;
  submitStatus.textContent = "Submitting...";

  leaderboardRef.push({
    name: cleanName,
    score: score,
    level: level,
    createdAt: Date.now()
  })
    .then(() => {
      scoreSubmitted = true;
      submitStatus.textContent = "Score submitted!";
      playSound("level");
    })
    .catch(error => {
      console.error(error);
      submitStatus.textContent = "Could not submit score. Check Firebase rules.";
    })
    .finally(() => {
      submitScoreBtn.disabled = false;
    });
}

function loadLeaderboard() {
  leaderboardRef
    .orderByChild("score")
    .limitToLast(10)
    .on("value", snapshot => {
      const scores = [];

      snapshot.forEach(childSnapshot => {
        scores.push(childSnapshot.val());
      });

      scores.sort((a, b) => b.score - a.score);

      if (scores.length === 0) {
        leaderboardList.innerHTML = "<li>No scores yet. Be the first!</li>";
        return;
      }

      leaderboardList.innerHTML = scores.map((entry, index) => {
        const name = String(entry.name || "Player").replace(/[<>]/g, "").slice(0, 20);
        const safeScore = Number(entry.score || 0);
        const safeLevel = Number(entry.level || 1);

        return `
          <li>
            <span class="rank-number">#${index + 1}</span>
            <span class="score-name">${name} <small>Level ${safeLevel}</small></span>
            <span class="score-points">${safeScore}</span>
          </li>
        `;
      }).join("");
    }, error => {
      console.error(error);
      leaderboardList.innerHTML = "<li>Leaderboard could not load.</li>";
    });
}

function createBackgroundParticles() {
  backgroundParticles = [];

  for (let i = 0; i < 12; i++) {
    backgroundParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1 + Math.random() * 2,
      speed: 0.15 + Math.random() * 0.3,
      opacity: 0.12 + Math.random() * 0.25
    });
  }
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawAnimatedFloor() {
  ctx.fillStyle = "#060711";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(77, 243, 255, 0.035)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  backgroundParticles.forEach(particle => {
    particle.y += particle.speed;

    if (particle.y > canvas.height) {
      particle.y = -5;
      particle.x = Math.random() * canvas.width;
    }

    ctx.beginPath();
    ctx.fillStyle = "rgba(77, 243, 255, " + particle.opacity + ")";
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMaze() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (maze[row][col] === 1) {
        const x = col * tileSize;
        const y = row * tileSize;

        ctx.fillStyle = "#1d1644";
        drawRoundedRect(x + 3, y + 3, tileSize - 6, tileSize - 6, 7);
        ctx.fill();

        ctx.strokeStyle = "rgba(77, 243, 255, 0.22)";
        ctx.lineWidth = 2;
        drawRoundedRect(x + 5, y + 5, tileSize - 10, tileSize - 10, 6);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 216, 107, 0.04)";
        drawRoundedRect(x + 10, y + 10, tileSize - 20, tileSize - 20, 4);
        ctx.fill();
      }
    }
  }
}

function drawOrbs() {
  const time = Date.now() / 180;

  orbs.forEach(orb => {
    if (!orb.collected) {
      const x = orb.col * tileSize + tileSize / 2;
      const y = orb.row * tileSize + tileSize / 2;
      const pulse = Math.sin(time + orb.pulseOffset) * 2;
      const radius = 5.5 + pulse;

      ctx.beginPath();
      ctx.fillStyle = "#fff2a8";
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 216, 107, 0.35)";
      ctx.lineWidth = 2;
      ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
      ctx.stroke();

      if (Math.sin(time + orb.pulseOffset) > 0.75) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();
      }
    }
  });
}

function drawPowerUps() {
  const time = Date.now() / 140;

  powerUps.forEach(powerUp => {
    if (powerUp.collected) return;

    const x = powerUp.col * tileSize + tileSize / 2;
    const y = powerUp.row * tileSize + tileSize / 2;
    const pulse = Math.sin(time + powerUp.pulseOffset) * 2.5;
    const radius = 10 + pulse;

    const color = powerUp.type === "freeze" ? "#4df3ff" : "#50ff88";
    const icon = powerUp.type === "freeze" ? "❄" : "◆";

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 3;
    ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, x, y + 1);
  });
}

function drawPortals() {
  const time = Date.now() / 180;

  portals.forEach((portal, index) => {
    const x = portal.col * tileSize + tileSize / 2;
    const y = portal.row * tileSize + tileSize / 2;
    const pulse = Math.sin(time + index) * 2;

    ctx.beginPath();
    ctx.strokeStyle = "#b84dff";
    ctx.lineWidth = 4;
    ctx.arc(x, y, 15 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(77, 243, 255, 0.75)";
    ctx.lineWidth = 2;
    ctx.arc(x, y, 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawPlayerTrail() {
  playerTrail.forEach(trail => {
    const opacity = trail.life / 18;

    ctx.beginPath();
    ctx.fillStyle = "rgba(77, 243, 255, " + opacity * 0.22 + ")";
    ctx.arc(trail.x, trail.y, 12 * opacity, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  const pulse = Math.sin(Date.now() / 130) * 1.5;

  if (hasShield) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(80, 255, 136, 0.8)";
    ctx.lineWidth = 4;
    ctx.arc(player.x, player.y, 26 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.fillStyle = "#4df3ff";
  ctx.arc(player.x, player.y, 14 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.arc(player.x - 4, player.y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawShadow() {
  if (!shadow.active || isLevelTransitioning) return;

  const pulse = Math.sin(Date.now() / 110) * 1.5;

  if (shadowFrozen) {
    ctx.beginPath();
    ctx.fillStyle = "#4df3ff";
    ctx.arc(shadow.x, shadow.y, 15 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 3;
    ctx.arc(shadow.x, shadow.y, 22 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    return;
  }

  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 77, 109, 0.25)";
  ctx.arc(shadow.x, shadow.y, 24 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "#ff4d6d";
  ctx.arc(shadow.x, shadow.y, 14 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.arc(shadow.x + 4, shadow.y + 4, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawHunter() {
  if (!hunter.active || isLevelTransitioning) return;

  const pulse = Math.sin(Date.now() / 110) * 1.5;

  ctx.beginPath();
  ctx.fillStyle = "rgba(184, 77, 255, 0.25)";
  ctx.arc(hunter.x, hunter.y, 24 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "#b84dff";
  ctx.arc(hunter.x, hunter.y, 14 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", hunter.x, hunter.y + 1);
}

function drawLevelText() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Level " + level, 15, 25);

  if (shadowFrozen) {
    ctx.fillStyle = "#4df3ff";
    ctx.font = "bold 16px Arial";
    ctx.fillText("SHADOW FROZEN", 15, 50);
  }

  if (hunter.active) {
    ctx.fillStyle = "#b84dff";
    ctx.font = "bold 16px Arial";
    ctx.fillText("HUNTER ACTIVE", 15, shadowFrozen ? 75 : 50);
  }
}

function drawHitAnimation() {
  if (!hitAnimation.active) return;

  const x = hitAnimation.col * tileSize + tileSize / 2;
  const y = hitAnimation.row * tileSize + tileSize / 2;
  const progress = hitAnimation.frame / hitAnimation.maxFrames;
  const opacity = 1 - progress;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 216, 107, " + opacity + ")";
  ctx.lineWidth = 5;
  ctx.arc(x, y, 10 + progress * 55, 0, Math.PI * 2);
  ctx.stroke();

  hitAnimation.frame++;

  if (hitAnimation.frame >= hitAnimation.maxFrames) {
    hitAnimation.active = false;
  }
}

function drawDeathAnimation() {
  if (!deathAnimation.active) return;

  const x = deathAnimation.col * tileSize + tileSize / 2;
  const y = deathAnimation.row * tileSize + tileSize / 2;
  const progress = deathAnimation.frame / deathAnimation.maxFrames;
  const opacity = 1 - progress;

  const ringRadius = 12 + progress * 110;
  const innerRadius = 8 + progress * 42;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 77, 109, " + opacity + ")";
  ctx.lineWidth = 6;
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 216, 107, " + opacity + ")";
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 / 14) * i;
    const distance = progress * 95;
    const particleX = x + Math.cos(angle) * distance;
    const particleY = y + Math.sin(angle) * distance;

    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 77, 109, " + opacity + ")";
    ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  deathAnimation.frame++;

  if (deathAnimation.frame >= deathAnimation.maxFrames) {
    deathAnimation.active = false;
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  if (deathAnimation.active) {
    const shakeAmount = 8;
    const shakeX = (Math.random() - 0.5) * shakeAmount;
    const shakeY = (Math.random() - 0.5) * shakeAmount;
    ctx.translate(shakeX, shakeY);
  }

  drawAnimatedFloor();
  drawMaze();
  drawOrbs();
  drawPortals();
  drawPowerUps();
  drawPlayerTrail();

  if (!deathAnimation.active) drawPlayer();

  drawShadow();
  drawHunter();
  drawLevelText();
  drawHitAnimation();
  drawDeathAnimation();

  ctx.restore();
}

function gameLoop() {
  if (!gameOver && gameStarted && !isEnding && !isLevelTransitioning && !isHitRecovering && !isPaused) {
    updateSmoothMovement();
    updateTrail();
  }

  drawGame();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", event => {
  const activeTag = document.activeElement.tagName;

  if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
    return;
  }

  const key = event.key.toLowerCase();

  const movementKeys = [
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "w",
    "a",
    "s",
    "d"
  ];

  if (movementKeys.includes(key)) {
    event.preventDefault();
  }

  if (key === "p") {
    togglePause();
    return;
  }

  if (key === "arrowup" || key === "w") movePlayer(-1, 0);
  if (key === "arrowdown" || key === "s") movePlayer(1, 0);
  if (key === "arrowleft" || key === "a") movePlayer(0, -1);
  if (key === "arrowright" || key === "d") movePlayer(0, 1);
});

function addMobileButtonControls() {
  upBtn.addEventListener("click", () => movePlayer(-1, 0));
  downBtn.addEventListener("click", () => movePlayer(1, 0));
  leftBtn.addEventListener("click", () => movePlayer(0, -1));
  rightBtn.addEventListener("click", () => movePlayer(0, 1));

  upBtn.addEventListener("touchstart", event => {
    event.preventDefault();
    movePlayer(-1, 0);
  });

  downBtn.addEventListener("touchstart", event => {
    event.preventDefault();
    movePlayer(1, 0);
  });

  leftBtn.addEventListener("touchstart", event => {
    event.preventDefault();
    movePlayer(0, -1);
  });

  rightBtn.addEventListener("touchstart", event => {
    event.preventDefault();
    movePlayer(0, 1);
  });
}

function pauseGame() {
  if (gameOver || !gameStarted || isEnding || isLevelTransitioning || isHitRecovering) return;

  isPaused = true;
  pauseScreen.classList.remove("hidden");
  pauseBtn.textContent = "Resume";
  playSound("click");
}

function resumeGame() {
  isPaused = false;
  pauseScreen.classList.add("hidden");
  pauseBtn.textContent = "Pause";
  playSound("click");
}

function togglePause() {
  if (isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

restartBtn.addEventListener("click", () => {
  initAudio();
  playSound("click");
  restartGame();
});

pauseBtn.addEventListener("click", () => {
  initAudio();
  togglePause();
});

resumeBtn.addEventListener("click", () => {
  initAudio();
  resumeGame();
});

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("shadowMazeSound", soundEnabled ? "on" : "off");
  updateSoundButton();

  if (soundEnabled) {
    initAudio();
    playSound("click");
  }
});

submitScoreBtn.addEventListener("click", () => {
  initAudio();
  playSound("click");
  submitScoreToLeaderboard();
});

startBtn.addEventListener("click", () => {
  initAudio();
  playSound("click");

  gameStarted = true;
  gameOver = false;
  isEnding = false;
  isLevelTransitioning = false;
  isPaused = false;

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  levelCompleteScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseBtn.textContent = "Pause";
  message.textContent = "";
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  playSound("click");
  restartGame();
});

continueLevelBtn.addEventListener("click", () => {
  continueToNextLevel();
});

function restartGame() {
  score = 0;
  level = 1;
  pendingNextLevel = 2;
  lives = 3;
  combo = 1;
  lastOrbCollectTime = 0;
  scoreSubmitted = false;

  gameOver = false;
  gameStarted = true;
  isEnding = false;
  isMoving = false;
  isLevelTransitioning = false;
  isHitRecovering = false;
  isPaused = false;
  shadowFrozen = false;

  clearShield();

  if (shadowFreezeTimer) {
    clearTimeout(shadowFreezeTimer);
    shadowFreezeTimer = null;
  }

  deathAnimation.active = false;
  deathAnimation.frame = 0;
  hitAnimation.active = false;
  hitAnimation.frame = 0;

  chooseMazeForLevel();

  setPlayerPosition(1, 1);
  setShadowPosition(13, 13);
  setHunterPosition(13, 1);

  shadow.active = false;
  hunter.active = false;
  hunter.moveCounter = 0;

  pathHistory = [];
  playerTrail = [];
  powerUps = [];
  portals = [];

  createOrbs();
  createBackgroundParticles();
  updateHud();

  submitStatus.textContent = "";
  message.textContent = "";
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  levelCompleteScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseBtn.textContent = "Pause";
}

chooseMazeForLevel();
setPlayerPosition(1, 1);
setShadowPosition(13, 13);
setHunterPosition(13, 1);
shadow.active = false;
hunter.active = false;
createOrbs();
createBackgroundParticles();
updateHud();
updateSoundButton();
loadLeaderboard();
addMobileButtonControls();
gameLoop();