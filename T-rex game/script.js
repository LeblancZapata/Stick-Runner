const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverText = document.getElementById("game-over");
const restartButton = document.getElementById("restart");

const GROUND_Y = 150;

// Mobile buttons
const jumpBtn = document.getElementById("jump-btn");
const duckBtn = document.getElementById("duck-btn");

// Load sounds
const jumpSound = new Audio("sounds/jump.wav");
const duckSound = new Audio("sounds/duck.wav");
const gameOverSound = new Audio("sounds/gameover.wav");

let player = {
  x: 50,
  y: GROUND_Y,
  width: 20,
  height: 44,
  dy: 0,
  isJumping: false,
  isDucking: false,
  frame: 0,
};

let gravity = 0.6;
let obstacles = [];
let birds = [];
let score = 0;
let highScore = 0;
let gameRunning = true;
let speed = 6;
let frameCount = 0;

function drawPlayer() {
  ctx.strokeStyle = "#535353";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  frameCount++;
  let legSwing = Math.sin(frameCount * 0.15) * 8;
  let armSwing = -Math.sin(frameCount * 0.15) * 6;

  let x = player.x + 10;
  let y = player.y;
  let isDuck = player.isDucking && !player.isJumping;

  if (isDuck) {
    ctx.beginPath();
    ctx.arc(x + 8, y + 24, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 8, y + 29);
    ctx.lineTo(x, y + 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 2, y + 32);
    ctx.lineTo(x - 8, y + 36);
    ctx.moveTo(x - 2, y + 32);
    ctx.lineTo(x - 10, y + 34);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y + 35);
    ctx.lineTo(x - 2, y + 40);
    ctx.lineTo(x - 8, y + 42);
    ctx.moveTo(x, y + 35);
    ctx.lineTo(x + 2, y + 40);
    ctx.lineTo(x + 8, y + 42);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y + 8, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y + 14);
    ctx.lineTo(x, y + 28);
    ctx.stroke();

    if (!player.isJumping) {
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x - 6, y + 24 + armSwing);
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x + 6, y + 24 - armSwing);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x - 7, y + 22);
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x + 7, y + 22);
      ctx.stroke();
    }

    if (!player.isJumping) {
      ctx.beginPath();
      ctx.moveTo(x, y + 28);
      ctx.lineTo(x - 4 + legSwing * 0.3, y + 36);
      ctx.lineTo(x - 2 + legSwing * 0.5, y + 44);
      ctx.moveTo(x, y + 28);
      ctx.lineTo(x + 4 - legSwing * 0.3, y + 36);
      ctx.lineTo(x + 2 - legSwing * 0.5, y + 44);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y + 28);
      ctx.lineTo(x - 3, y + 36);
      ctx.lineTo(x - 2, y + 44);
      ctx.moveTo(x, y + 28);
      ctx.lineTo(x + 3, y + 36);
      ctx.lineTo(x + 2, y + 44);
      ctx.stroke();
    }
  }
}


function drawObstacles() {
  ctx.fillStyle = "#535353";
  obstacles.forEach((obs) => {
    obs.parts.forEach(part => ctx.fillRect(part.x, part.y, part.width, part.height));
  });
}

function drawBirds() {
  ctx.fillStyle = "#535353";
  birds.forEach((bird) => {
    let wingUp = Math.floor(frameCount / 8) % 2 === 0;
    ctx.fillRect(bird.x + 4, bird.y + 6, 16, 8);
    if (wingUp) ctx.fillRect(bird.x, bird.y, 24, 4);
    else ctx.fillRect(bird.x, bird.y + 10, 24, 4);
    ctx.fillRect(bird.x + 20, bird.y + 8, 4, 4);
  });
}

function spawnObstacle() {
  if (Math.random() < 0.8) {
    let type = Math.random();
    let parts = [];
    let baseX = canvas.width;

    if (type < 0.4) parts.push({x: baseX, y: GROUND_Y + 10, width: 12, height: 34});
    else if (type < 0.7) parts.push({x: baseX, y: GROUND_Y, width: 12, height: 44});
    else if (type < 0.85) {
      parts.push({x: baseX, y: GROUND_Y + 10, width: 12, height: 34});
      parts.push({x: baseX + 16, y: GROUND_Y + 10, width: 12, height: 34});
    } else {
      parts.push({x: baseX, y: GROUND_Y + 10, width: 12, height: 34});
      parts.push({x: baseX + 16, y: GROUND_Y, width: 12, height: 44});
      parts.push({x: baseX + 32, y: GROUND_Y + 10, width: 12, height: 34});
    }
    obstacles.push({parts});
  } else {
    let height = Math.random() < 0.5 ? GROUND_Y - 20 : GROUND_Y - 50;
    birds.push({x: canvas.width, y: height, width: 24, height: 14});
  }
}


function updateObstacles() {
  obstacles.forEach(obs => obs.parts.forEach(part => (part.x -= speed)));
  obstacles = obstacles.filter(obs => obs.parts.some(part => part.x + part.width > 0));
}

function updateBirds() {
  birds.forEach(bird => bird.x -= speed);
  birds = birds.filter(bird => bird.x + bird.width > 0);
}


function checkCollision() {
  let px = player.x + 4;
  let py = player.y + (player.isDucking ? 20 : 4);
  let pw = player.width - 8;
  let ph = player.isDucking ? 24 : 40;

  for (let obs of obstacles) {
    for (let part of obs.parts) {
      if (
        px < part.x + part.width - 4 &&
        px + pw > part.x + 4 &&
        py < part.y + part.height - 4 &&
        py + ph > part.y + 4
      ) return true;
    }
  }

  for (let bird of birds) {
    if (
      px < bird.x + bird.width - 4 &&
      px + pw > bird.x + 4 &&
      py < bird.y + bird.height - 4 &&
      py + ph > bird.y + 4
    ) return true;
  }
  return false;
}


function updatePlayer() {
  if (player.isJumping) {
    player.dy += gravity;
    player.y += player.dy;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.isJumping = false;
      player.dy = 0;
    }
  }
}

function drawGround() {
  ctx.strokeStyle = "#535353";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 44);
  ctx.lineTo(canvas.width, GROUND_Y + 44);
  ctx.stroke();

  let offset = (frameCount * speed / 2) % 20;
  for (let i = -offset; i < canvas.width; i += 20) {
    ctx.fillStyle = "#535353";
    ctx.fillRect(i, GROUND_Y + 45, 2, 2);
  }
}
function drawScore() {
  score++;
  let displayScore = Math.floor(score / 10);
  if (displayScore > highScore) highScore = displayScore;

  ctx.fillStyle = "#535353";
  ctx.font = "16px monospace";
  ctx.textAlign = "right";
  ctx.fillText("HI " + String(highScore).padStart(5, "0"), canvas.width - 10, 30);
  ctx.fillText(String(displayScore).padStart(5, "0"), canvas.width - 10, 50);
}

function drawClouds() {
  let cloudX = (frameCount * 0.5) % (canvas.width + 100) - 100;
  ctx.fillStyle = "#535353";
  ctx.fillRect(cloudX, 30, 30, 4);
  ctx.fillRect(cloudX + 10, 26, 10, 4);
  ctx.fillRect(cloudX + 20, 26, 10, 4);

  let cloudX2 = (frameCount * 0.3 + 400) % (canvas.width + 100) - 100;
  ctx.fillRect(cloudX2, 50, 40, 4);
  ctx.fillRect(cloudX2 + 10, 46, 10, 4);
  ctx.fillRect(cloudX2 + 25, 46, 10, 4);
}
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawClouds();
  drawGround();
  drawPlayer();
  drawObstacles();
  drawBirds();
  drawScore();
  updatePlayer();
  updateObstacles();
  updateBirds();

  if (checkCollision()) {
    gameRunning = false;
    gameOverText.style.display = "block";
    restartButton.style.display = "block";
  }

  speed = 6 + Math.floor(score / 1000) * 0.5;
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player = {
    x: 50,
    y: GROUND_Y,
    width: 20,
    height: 44,
    dy: 0,
    isJumping: false,
    isDucking: false,
    frame: 0,
  };
  obstacles = [];
  birds = [];
  score = 0;
  speed = 6;
  frameCount = 0;
  gameRunning = true;
  gameOverText.style.display = "none";
  restartButton.style.display = "none";
  gameLoop();
}
// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !player.isJumping) {
    player.isJumping = true;
    player.dy = -12;
    jumpSound.play();
    e.preventDefault();
  }
  if (e.code === "ArrowDown") {
    player.isDucking = true;
     duckSound.play();
    e.preventDefault();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") {
    player.isDucking = false;
  }
});

// Mobile controls
jumpBtn.addEventListener("touchstart", () => {
  if (!player.isJumping) {
    player.isJumping = true;
    player.dy = -12;
    jumpSound.play();
  }
});

duckBtn.addEventListener("touchstart", () => {
  player.isDucking = true;
  duckSound.play();
});

duckBtn.addEventListener("touchend", () => {
  player.isDucking = false;
});

// Restart button
restartButton.addEventListener("click", resetGame);

// Spawn obstacles and start game loop
setInterval(spawnObstacle, 1500);
gameLoop();

