const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverText = document.getElementById("game-over");
const restartButton = document.getElementById("restart");

// Mobile buttons
const jumpBtn = document.getElementById("jump-btn");
const duckBtn = document.getElementById("duck-btn");

// Load sounds
const jumpSound = new Audio("sounds/jump.wav");
const duckSound = new Audio("sounds/duck.wav");
const gameOverSound = new Audio("sounds/gameover.wav");

let trex = {
  x: 50,
  y: 160,
  width: 20,
  height: 40,
  dy: 0,
  isJumping: false,
  isDucking: false,
  legFrame: 0,
};

let gravity = 0.7;
let obstacles = [];
let birds = [];
let score = 0;
let gameRunning = true;
let speed = 5;

function drawHuman() {
  trex.legFrame = (trex.legFrame + 1) % 40;
  let stride = Math.sin((trex.legFrame / 40) * Math.PI * 2) * 0.9;

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  // Body
  ctx.beginPath();
  ctx.moveTo(trex.x + 10, trex.y + trex.height - 10);
  ctx.lineTo(trex.x + 10, trex.y + trex.height - 30);
  ctx.stroke();

  let legLength = 12;
  let hipX = trex.x + 10;
  let hipY = trex.y + trex.height - 10;

  let leftLegAngle = Math.PI / 2 + stride;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(
    hipX - Math.sin(leftLegAngle) * legLength,
    hipY + Math.cos(leftLegAngle) * legLength
  );
  ctx.stroke();

  let rightLegAngle = Math.PI / 2 - stride;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(
    hipX + Math.sin(rightLegAngle) * legLength,
    hipY + Math.cos(rightLegAngle) * legLength
  );
  ctx.stroke();

  // Arms
  ctx.beginPath();
  let armLength = 15;
  if (trex.isDucking) {
    ctx.moveTo(trex.x + 10, trex.y + trex.height - 20);
    ctx.lineTo(trex.x, trex.y + trex.height - 10);
    ctx.moveTo(trex.x + 10, trex.y + trex.height - 20);
    ctx.lineTo(trex.x + 20, trex.y + trex.height - 10);
  } else {
    ctx.moveTo(trex.x + 10, trex.y + trex.height - 25);
    ctx.lineTo(trex.x, trex.y + trex.height - 20);
    ctx.moveTo(trex.x + 10, trex.y + trex.height - 25);
    ctx.lineTo(trex.x + 20, trex.y + trex.height - 20);
  }
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(trex.x + 10, trex.y + trex.height - 35, 5, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
}

function drawObstacles() {
  ctx.fillStyle = "green";
  obstacles.forEach((stack) => {
    stack.blocks.forEach((block) => {
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  });
}

function drawBirds() {
  birds.forEach((bird) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.fillStyle = "brown";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-16, bird.wingUp ? -8 : 8);
    ctx.moveTo(8, 0);
    ctx.lineTo(16, bird.wingUp ? -8 : 8);
    ctx.stroke();
    ctx.restore();
  });
}

function spawnObstacle() {
  if (Math.random() < 0.7) {
    let groupType = Math.random();
    let blocks = [];
    let baseX = canvas.width;
    let blockHeight = 75 + Math.floor(Math.random() * 30);

    if (groupType < 0.5) {
      blocks.push({ x: baseX, y: 180, width: 16, height: blockHeight });
    } else if (groupType < 0.8) {
      blocks.push({ x: baseX, y: 180, width: 16, height: blockHeight });
      blocks.push({ x: baseX + 20, y: 180, width: 16, height: blockHeight });
    } else {
      blocks.push({ x: baseX - 20, y: 180, width: 16, height: blockHeight });
      blocks.push({ x: baseX, y: 180, width: 16, height: blockHeight + 10 });
      blocks.push({ x: baseX + 20, y: 180, width: 16, height: blockHeight });
    }
    obstacles.push({ blocks });
  } else {
    const high = Math.random() < 0.5;
    birds.push({
      x: canvas.width,
      y: high ? 140 : 190,
      width: 24,
      height: 12,
      wingUp: Math.random() < 0.5,
      type: high ? "high" : "low",
    });
  }
}

function updateObstacles() {
  obstacles.forEach((stack) => {
    stack.blocks.forEach((block) => (block.x -= speed));
  });
  obstacles = obstacles.filter((stack) =>
    stack.blocks.some((block) => block.x + block.width > 0)
  );
}

function updateBirds() {
  birds.forEach((bird) => {
    bird.x -= speed + 1;
    bird.wingUp = !bird.wingUp;
  });
  birds = birds.filter((bird) => bird.x + bird.width > 0);
}

function checkCollision() {
  for (let stack of obstacles) {
    for (let block of stack.blocks) {
      if (
        trex.x < block.x + block.width &&
        trex.x + trex.width > block.x &&
        trex.y + trex.height > block.y &&
        trex.y < block.y + block.height
      ) {
        return true;
      }
    }
  }

  for (let bird of birds) {
    if (
      trex.x < bird.x + bird.width &&
      trex.x + trex.width > bird.x &&
      trex.y < bird.y + bird.height &&
      trex.y + trex.height > bird.y
    ) {
      if (
        (bird.type === "high" && !trex.isDucking) ||
        (bird.type === "low" && !trex.isJumping)
      ) {
        return true;
      }
    }
  }
  return false;
}

function updateTrex() {
  if (trex.isJumping) {
    trex.dy += gravity;
    trex.y += trex.dy;
    if (trex.y >= 160) {
      trex.y = 160;
      trex.isJumping = false;
      trex.dy = 0;
    }
  }
}

function updateScore() {
  score += 1;
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText(`Score: ${score}`, 700, 20);
  speed = 5 + score / 400;
}

function endGame() {
  gameRunning = false;
  gameOverText.style.display = "block";
  restartButton.style.display = "block";
  gameOverSound.play();
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#888";
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.lineTo(canvas.width, 200);
  ctx.stroke();

  drawHuman();
  drawObstacles();
  drawBirds();
  updateTrex();
  updateObstacles();
  updateBirds();
  updateScore();

  if (checkCollision()) {
    endGame();
  }

  requestAnimationFrame(gameLoop);
}

function resetGame() {
  trex = {
    x: 50,
    y: 160,
    width: 20,
    height: 40,
    dy: 0,
    isJumping: false,
    isDucking: false,
    legFrame: 0,
  };
  obstacles = [];
  birds = [];
  score = 0;
  speed = 5;
  gameRunning = true;
  gameOverText.style.display = "none";
  restartButton.style.display = "none";
  gameLoop();
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !trex.isJumping) {
    trex.isJumping = true;
    trex.dy = -12;
    jumpSound.play();
  }
  if (e.code === "ArrowDown" && !trex.isDucking) {
    trex.isDucking = true;
    duckSound.play();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") {
    trex.isDucking = false;
  }
});

// Mobile controls
jumpBtn.addEventListener("touchstart", () => {
  if (!trex.isJumping) {
    trex.isJumping = true;
    trex.dy = -12;
    jumpSound.play();
  }
});

duckBtn.addEventListener("touchstart", () => {
  trex.isDucking = true;
  duckSound.play();
});

duckBtn.addEventListener("touchend", () => {
  trex.isDucking = false;
});

// Restart button
restartButton.addEventListener("click", resetGame);

// Spawn obstacles and start game loop
setInterval(spawnObstacle, 1500);
gameLoop();
