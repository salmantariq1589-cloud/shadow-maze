const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const highScoreText = document.getElementById("highScore");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

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

let gameOver = false;
let gameStarted = false;
let isEnding = false;
let isMoving = false;
let isLevelTransitioning = false;

let deathAnimation = {
  active: false,
  frame: 0,
  maxFrames: 45,
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
  targetY: 1 * tileSize + tileSize / 2,
  color: "#4df3ff"
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
  color: "#ff4d6d",
  active: false
};

let pathHistory = [];
let orbs = [];
let playerTrail = [];

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

function getTileCenter(row, col) {
  return {
    x: col * tileSize + tileSize / 2,
    y: row * tileSize + tileSize / 2
  };
}

function setPlayerPosition(row, col) {
  const position = getTileCenter(row, col);

  player.row = row;
  player.col = col;
  player.previousRow = row;
  player.previousCol = col;
  player.x = position.x;
  player.y = position.y;
  player.targetX = position.x;
  player.targetY = position.y;
}

function setShadowPosition(row, col) {
  const position = getTileCenter(row, col);

  shadow.row = row;
  shadow.col = col;
  shadow.previousRow = row;
  shadow.previousCol = col;
  shadow.x = position.x;
  shadow.y = position.y;
  shadow.targetX = position.x;
  shadow.targetY = position.y;
}

function chooseMazeForLevel() {
  const mazeIndex = (level - 1) % mazeTemplates.length;
  maze = mazeTemplates[mazeIndex];
}

function createOrbs() {
  orbs = [];

  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      if (maze[row][col] === 0) {
        const isPlayerStart = row === player.row && col === player.col;
        const isShadowStart = shadow.active && row === shadow.row && col === shadow.col;

        if (!isPlayerStart && !isShadowStart) {
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

function canMoveTo(row, col) {
  if (row < 0 || col < 0 || row >= rows || col >= cols) {
    return false;
  }

  return maze[row][col] === 0;
}

function getShadowDelay() {
  return Math.max(4, 10 - Math.floor(level / 2));
}

function movePlayer(rowChange, colChange) {
  if (gameOver || !gameStarted || isEnding || isMoving || isLevelTransitioning) return;

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

  pathHistory.push({
    row: player.row,
    col: player.col
  });

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

  isMoving = true;
}

function updateSmoothMovement() {
  if (isMoving) {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= movementSpeed) {
      player.x = player.targetX;
      player.y = player.targetY;
      isMoving = false;

      addPlayerTrail();
      collectOrbs();
      checkCollision();
    } else {
      player.x += (dx / distance) * movementSpeed;
      player.y += (dy / distance) * movementSpeed;
    }
  }

  if (shadow.active) {
    const shadowDx = shadow.targetX - shadow.x;
    const shadowDy = shadow.targetY - shadow.y;
    const shadowDistance = Math.sqrt(shadowDx * shadowDx + shadowDy * shadowDy);

    if (shadowDistance <= movementSpeed) {
      shadow.x = shadow.targetX;
      shadow.y = shadow.targetY;
    } else if (shadowDistance > 0) {
      shadow.x += (shadowDx / shadowDistance) * movementSpeed;
      shadow.y += (shadowDy / shadowDistance) * movementSpeed;
    }
  }
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
  playerTrail.forEach(trail => {
    trail.life--;
  });

  playerTrail = playerTrail.filter(trail => trail.life > 0);
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("shadowMazeHighScore", highScore);
    highScoreText.textContent = highScore;
  }
}

function collectOrbs() {
  if (isLevelTransitioning) return;

  orbs.forEach(orb => {
    if (orb.row === player.row && orb.col === player.col && !orb.collected) {
      orb.collected = true;
      score += 10;
      scoreText.textContent = score;
      updateHighScore();
    }
  });

  const remainingOrbs = orbs.filter(orb => !orb.collected);

  if (remainingOrbs.length === 0) {
    showLevelCompleteScreen();
  }
}

function showLevelCompleteScreen() {
  if (isLevelTransitioning) return;

  isLevelTransitioning = true;
  isMoving = false;

  const completedLevel = level;
  pendingNextLevel = level + 1;
  const levelBonus = pendingNextLevel * 100;

  score += levelBonus;
  scoreText.textContent = score;
  updateHighScore();

  levelCompleteTitle.textContent = "Level " + completedLevel + " Complete!";
  levelBonusText.textContent = "Bonus +" + levelBonus;
  nextLevelText.textContent = "Get ready for Level " + pendingNextLevel;

  levelCompleteScreen.classList.remove("hidden");
}

function continueToNextLevel() {
  level = pendingNextLevel;

  chooseMazeForLevel();

  setPlayerPosition(1, 1);
  setShadowPosition(13, 13);
  shadow.active = false;

  pathHistory = [];
  playerTrail = [];
  isMoving = false;
  isLevelTransitioning = false;

  createOrbs();

  levelCompleteScreen.classList.add("hidden");
}

function endGame() {
  if (isEnding || gameOver) return;

  isEnding = true;
  gameOver = true;
  gameStarted = false;
  isMoving = false;
  isLevelTransitioning = false;

  updateHighScore();

  deathAnimation.active = true;
  deathAnimation.frame = 0;
  deathAnimation.row = player.row;
  deathAnimation.col = player.col;

  message.textContent = "Your shadow caught you!";

  setTimeout(() => {
    finalScoreText.textContent = "Final Score: " + score;
    finalLevelText.textContent = "You reached Level " + level;

    message.textContent = "";
    deathAnimation.active = false;
    gameOverScreen.classList.remove("hidden");
  }, 1100);
}

function checkCollision() {
  if (!shadow.active || isLevelTransitioning) return;

  const sameTile = player.row === shadow.row && player.col === shadow.col;

  const crossedPaths =
    player.row === shadow.previousRow &&
    player.col === shadow.previousCol &&
    shadow.row === player.previousRow &&
    shadow.col === player.previousCol;

  if (sameTile || crossedPaths) {
    endGame();
  }
}

function drawMaze() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (maze[row][col] === 1) {
        const x = col * tileSize;
        const y = row * tileSize;

        ctx.fillStyle = "#1f1744";
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        ctx.strokeStyle = "rgba(77, 243, 255, 0.28)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

        ctx.fillStyle = "rgba(255, 216, 107, 0.05)";
        ctx.fillRect(x + 8, y + 8, tileSize - 16, tileSize - 16);
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
      const radius = 5 + pulse;

      ctx.beginPath();
      ctx.fillStyle = "#ffd86b";
      ctx.shadowColor = "#ffd86b";
      ctx.shadowBlur = 18;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 216, 107, 0.35)";
      ctx.lineWidth = 2;
      ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 0;
    }
  });
}

function drawPlayerTrail() {
  playerTrail.forEach(trail => {
    const opacity = trail.life / 18;

    ctx.beginPath();
    ctx.fillStyle = "rgba(77, 243, 255, " + opacity * 0.25 + ")";
    ctx.shadowColor = "#4df3ff";
    ctx.shadowBlur = 12;
    ctx.arc(trail.x, trail.y, 12 * opacity, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawPlayer() {
  const pulse = Math.sin(Date.now() / 120) * 2;

  ctx.beginPath();
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 24;
  ctx.arc(player.x, player.y, 13 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "rgba(77, 243, 255, 0.38)";
  ctx.lineWidth = 3;
  ctx.arc(player.x, player.y, 21 + pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

function drawShadow() {
  if (!shadow.active || isLevelTransitioning) return;

  const pulse = Math.sin(Date.now() / 95) * 2.5;

  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 77, 109, 0.18)";
  ctx.shadowColor = "#ff4d6d";
  ctx.shadowBlur = 26;
  ctx.arc(shadow.x, shadow.y, 23 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = shadow.color;
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = 24;
  ctx.arc(shadow.x, shadow.y, 14 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawLevelText() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial";
  ctx.fillText("Level " + level, 15, 25);
}

function drawDeathAnimation() {
  if (!deathAnimation.active) return;

  const x = deathAnimation.col * tileSize + tileSize / 2;
  const y = deathAnimation.row * tileSize + tileSize / 2;

  const progress = deathAnimation.frame / deathAnimation.maxFrames;
  const opacity = 1 - progress;

  const ringRadius = 12 + progress * 110;
  const innerRadius = 8 + progress * 42;

  ctx.save();

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 77, 109, " + opacity + ")";
  ctx.lineWidth = 6;
  ctx.shadowColor = "#ff4d6d";
  ctx.shadowBlur = 30;
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 216, 107, " + opacity + ")";
  ctx.shadowColor = "#ffd86b";
  ctx.shadowBlur = 35;
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

  ctx.restore();

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

  drawMaze();
  drawOrbs();
  drawPlayerTrail();

  if (!deathAnimation.active) {
    drawPlayer();
  }

  drawShadow();
  drawLevelText();
  drawDeathAnimation();

  ctx.restore();
}

function gameLoop() {
  if (!gameOver && gameStarted && !isEnding && !isLevelTransitioning) {
    updateSmoothMovement();
    updateTrail();
  }

  drawGame();

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", event => {
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    movePlayer(-1, 0);
  }

  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    movePlayer(1, 0);
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    movePlayer(0, -1);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    movePlayer(0, 1);
  }
});

function addMobileButtonControls() {
  upBtn.addEventListener("click", () => {
    movePlayer(-1, 0);
  });

  downBtn.addEventListener("click", () => {
    movePlayer(1, 0);
  });

  leftBtn.addEventListener("click", () => {
    movePlayer(0, -1);
  });

  rightBtn.addEventListener("click", () => {
    movePlayer(0, 1);
  });

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

restartBtn.addEventListener("click", restartGame);

startBtn.addEventListener("click", () => {
  gameStarted = true;
  gameOver = false;
  isEnding = false;
  isLevelTransitioning = false;

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  levelCompleteScreen.classList.add("hidden");
  message.textContent = "";
});

playAgainBtn.addEventListener("click", () => {
  restartGame();
  gameStarted = true;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  levelCompleteScreen.classList.add("hidden");
});

continueLevelBtn.addEventListener("click", () => {
  continueToNextLevel();
});

function restartGame() {
  score = 0;
  level = 1;
  pendingNextLevel = 2;

  gameOver = false;
  gameStarted = true;
  isEnding = false;
  isMoving = false;
  isLevelTransitioning = false;

  deathAnimation.active = false;
  deathAnimation.frame = 0;

  chooseMazeForLevel();

  scoreText.textContent = score;
  highScoreText.textContent = highScore;
  message.textContent = "";

  setPlayerPosition(1, 1);
  setShadowPosition(13, 13);
  shadow.active = false;

  pathHistory = [];
  playerTrail = [];

  createOrbs();

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  levelCompleteScreen.classList.add("hidden");
}

chooseMazeForLevel();
setPlayerPosition(1, 1);
setShadowPosition(13, 13);
shadow.active = false;
createOrbs();
addMobileButtonControls();
gameLoop();