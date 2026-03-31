let cameFromPause = false;
let gameStarted = false; 
let isGameOver = false;

// ✅ NOVO
let isPaused = false;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// imagens
const headImg = new Image();
headImg.src = "FM.png";

const foodImg = new Image();
foodImg.src = "PP.png";

// sons
const eatSound = new Audio("Ze.mp3");
const lostSound = new Audio("Lost.mp3");

// música de fundo
const bgMusic = new Audio("Song.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

// estado do jogo
let snake;
let direction;
let score;
let food;
let canChangeDirection;

// menu
const menuScreen = document.getElementById("menuScreen");
const startBtn = document.getElementById("startBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const gameContainer = document.querySelector(".container");

// game over
const gameOverScreen = document.getElementById("gameOverScreen");
const restartBtn = document.getElementById("restartBtn");
const menuBtn = document.getElementById("menuBtn");

// tela de configurações
const settingsScreen = document.getElementById("settingsScreen");
const backFromSettingsBtn = document.getElementById("backFromSettings");
const musicVolumeSlider = document.getElementById("musicVolume");
const effectsVolumeSlider = document.getElementById("effectsVolume");

// ✅ NOVO (PAUSE ELEMENTOS)
const pauseScreen = document.getElementById("pauseScreen");
const resumeBtn = document.getElementById("resumeBtn");
const pauseMenuBtn = document.getElementById("pauseMenuBtn");
const pauseSettingsBtn = document.getElementById("pauseSettingsBtn");

// ===================
// MENU
// ===================
startBtn.addEventListener("click", () => {
  menuScreen.style.display = "none";
  gameContainer.style.display = "flex";
  init();
});

settingsBtn.addEventListener("click", () => {
  menuScreen.style.display = "none";
  settingsScreen.style.display = "flex";
});

exitBtn.addEventListener("click", () => {
  alert("Feche a aba para sair do jogo.");
});

backFromSettingsBtn.addEventListener("click", () => {
  settingsScreen.style.display = "none";

  if (cameFromPause) {
    pauseScreen.style.display = "flex";
    cameFromPause = false;
  } else {
    menuScreen.style.display = "flex";
  }
});

// sliders de volume
musicVolumeSlider.addEventListener("input", () => {
  bgMusic.volume = parseFloat(musicVolumeSlider.value);
});

effectsVolumeSlider.addEventListener("input", () => {
  const vol = parseFloat(effectsVolumeSlider.value);
  eatSound.volume = vol;
  lostSound.volume = vol;
});

// ===================
// INICIALIZAÇÃO
// ===================
function init() {
  snake = [{ x: 200, y: 200 }];
  direction = { x: 0, y: 0 };
  score = 0;
  canChangeDirection = true;
  isGameOver = false;
  gameStarted = false;

  // ✅ NOVO
  isPaused = false;
  pauseScreen.style.display = "none";

  spawnFood();

  gameOverScreen.style.display = "none";
  gameContainer.style.display = "flex";

  // reiniciar música
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// ===================
// COMIDA
// ===================
function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * 20) * 20,
      y: Math.floor(Math.random() * 20) * 20
    };
  } while (snake.some(part => part.x === newFood.x && part.y === newFood.y));
  food = newFood;
}

// ===================
// TECLADO
// ===================
document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {
    if (!gameStarted || isGameOver) return;

    isPaused = !isPaused;

    if (isPaused) {
      pauseScreen.style.display = "flex";
      bgMusic.pause();
    } else {
      pauseScreen.style.display = "none";
      bgMusic.play();
    }

    return;
  }

  if (isPaused) return;

  if (isGameOver) return;
  if (!canChangeDirection) return;

  let moved = false;

  if (event.key === "ArrowUp" && direction.y === 0) {
    direction = { x: 0, y: -20 };
    moved = true;
  } else if (event.key === "ArrowDown" && direction.y === 0) {
    direction = { x: 0, y: 20 };
    moved = true;
  } else if (event.key === "ArrowLeft" && direction.x === 0) {
    direction = { x: -20, y: 0 };
    moved = true;
  } else if (event.key === "ArrowRight" && direction.x === 0) {
    direction = { x: 20, y: 0 };
    moved = true;
  }

  if (moved) {
    if (!gameStarted) {
      gameStarted = true;
      bgMusic.play();
    }
    canChangeDirection = false;
  }

})

// ===================
// LÓGICA
// ===================
function update() {
  if (!gameStarted || isGameOver || isPaused) return;

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // colisão parede
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    gameOver();
    return;
  }

  // colisão corpo
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    eatSound.currentTime = 0;
    eatSound.play();

    spawnFood();

    if (score >= 399) {
      victory();
      return;
    }

  } else {
    snake.pop();
  }

  canChangeDirection = true;
}

  

// ===================
// DESENHO
// ===================
function drawHead(part) {
  const size = 34;
  const offset = size / 2;
  ctx.save();
  ctx.translate(part.x + 10, part.y + 10);
  if (direction.x === 20) ctx.rotate(0);
  if (direction.x === -20) ctx.rotate(Math.PI);
  if (direction.y === 20) ctx.rotate(Math.PI / 2);
  if (direction.y === -20) ctx.rotate(-Math.PI / 2);
  ctx.drawImage(headImg, -offset, -offset, size, size);
  ctx.restore();
}

// ===================
// UTILIDADES
// ===================
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ===================
// CALDA FLUÍDA COM SPLINE
// ===================
function drawSnakeSpline() {
  if (snake.length === 0) return;

  const smoothSnake = [snake[0]];
  const followSpeed = 0.25;

  for (let i = 1; i < snake.length; i++) {
    const prev = smoothSnake[i - 1];
    const current = snake[i];
    const x = lerp(current.x, prev.x, followSpeed);
    const y = lerp(current.y, prev.y, followSpeed);
    smoothSnake.push({ x, y });
  }

  for (let i = 1; i < smoothSnake.length; i++) {
    const prev = smoothSnake[i - 1];
    const cur = smoothSnake[i];

    const t = i / smoothSnake.length;
    const width = lerp(20, 6, t);

    ctx.beginPath();
    ctx.moveTo(prev.x + 10, prev.y + 10);
    ctx.lineTo(cur.x + 10, cur.y + 10);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#4CAF50";
    ctx.shadowColor = "rgba(0,150,0,0.5)";
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cur.x + 5, cur.y + 5);
    ctx.lineTo(cur.x + 10, cur.y + 10);
    ctx.strokeStyle = "rgba(0,180,0,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawHead(smoothSnake[0]);

  if (smoothSnake.length > 2) {
    const tail = smoothSnake[smoothSnake.length - 1];
    const beforeTail = smoothSnake[smoothSnake.length - 2];
    const dx = tail.x - beforeTail.x;
    const dy = tail.y - beforeTail.y;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(tail.x + 10, tail.y + 10);
    ctx.lineTo(tail.x + 10 + Math.cos(angle) * 60, tail.y + 10 + Math.sin(angle) * 60);
    ctx.lineTo(tail.x + 10 + Math.cos(angle + 0.2) * 30, tail.y + 10 + Math.sin(angle + 0.2) * 30);
    ctx.closePath();
    ctx.fillStyle = "#4CAF50";
    ctx.shadowColor = "rgba(0,150,0,0.5)";
    ctx.shadowBlur = 6;
    ctx.fill();
  }
}

function drawFood() {
  const size = 34;
  const offset = size / 2;
  ctx.drawImage(foodImg, food.x + 10 - offset, food.y + 10 - offset, size, size);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSnakeSpline();
  drawFood();

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);

  if (!gameStarted && !isGameOver) {
    ctx.fillText("Pressione uma seta para começar", 40, 200);
  }
}

// ===================
// LOOP
// ===================
function gameLoop() {
  update();
  draw();
}
setInterval(gameLoop, 100);

// ===================
// GAME OVER
// ===================
function gameOver() {
  isGameOver = true;
  gameStarted = false;

  bgMusic.pause();
  lostSound.currentTime = 0;
  lostSound.play();

  document.getElementById("finalScore").innerText = "Pontuação: " + score;

  gameContainer.style.display = "none";
  gameOverScreen.style.display = "flex";
}

// ===================
// REINICIAR
// ===================
restartBtn.addEventListener("click", () => {
  init();
});

// ===================
// VOLTAR AO MENU
// ===================
menuBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  menuScreen.style.display = "flex";

  isGameOver = false;
  gameStarted = false;
});

// ===================
// PAUSE BOTÕES (NOVO)
// ===================
resumeBtn.addEventListener("click", () => {
  isPaused = false;
  pauseScreen.style.display = "none";
  bgMusic.play();
});

pauseMenuBtn.addEventListener("click", () => {
  isPaused = false;
  pauseScreen.style.display = "none";
  gameContainer.style.display = "none";
  menuScreen.style.display = "flex";
  bgMusic.pause();

  isGameOver = false;
  gameStarted = false;
});

pauseSettingsBtn.addEventListener("click", () => {
  cameFromPause = true;
  pauseScreen.style.display = "none";
  settingsScreen.style.display = "flex";
});

const victoryScreen = document.getElementById("victoryScreen");
const victoryMenuBtn = document.getElementById("victoryMenuBtn");
const victorySound = new Audio("Vitoria.mp3");

victoryMenuBtn.addEventListener("click", () => {
  victoryScreen.style.display = "none";
  menuScreen.style.display = "flex";

  isGameOver = false;
  gameStarted = false;
});

function victory() {
  isGameOver = true;
  gameStarted = false;

  bgMusic.pause();
  victorySound.currentTime = 0;
  victorySound.play();

  gameContainer.style.display = "none";
  victoryScreen.style.display = "flex";
}
