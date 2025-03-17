// Game constants
const CELL_SIZE = 10; // Larger cells for better visibility while maintaining pixel-like appearance
const GAME_SPEED = 150; // Slightly slower for authentic feel
let gridWidth, gridHeight, offsetX, offsetY;
const CELEBRATION_DURATION = 2000; // Duration of celebration animation in milliseconds

// Game state
let snake = [];
let food = null;
let direction = 'right';
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameLoop;
let canvas, ctx, scoreElement;
let isPaused = false;
let isNewHighScore = false;
let celebrationTimer = null;
let celebrationParticles = [];
let hasHighScoreCelebrated = false; // Flag to track if high score has been celebrated in current game

// Initialize snake
const INITIAL_SNAKE_LENGTH = 3;

function initSnake() {
    snake = [];
    const startX = Math.floor(gridWidth/2);
    const startY = Math.floor(gridHeight/2);
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.push({ x: startX - i, y: startY });
    }
}

// Generate food at random position
function generateFood() {
    const x = Math.floor(Math.random() * gridWidth);
    const y = Math.floor(Math.random() * gridHeight);
    
    // Check if food spawns on snake
    const isOnSnake = snake.some(segment => segment.x === x && segment.y === y);
    if (isOnSnake) {
        return generateFood();
    }
    
    food = { x, y };
}

// Draw single grid cell
function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        offsetX + x * CELL_SIZE,
        offsetY + y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    );
}

// Draw game state
function draw() {
    // Clear canvas with Nokia green background
    ctx.fillStyle = '#9EAD86';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    snake.forEach((segment) => {
        drawCell(segment.x, segment.y, '#222222'); // Dark color for snake
    });
    
    // Draw food
    if (food) {
        drawCell(food.x, food.y, '#222222'); // Same color as snake in Nokia style
    }
    
    // Draw celebration particles if new high score
    if (isNewHighScore && celebrationParticles.length > 0) {
        drawCelebration();
    }
    
    // Draw pause indicator
    if (isPaused) {
        drawPauseScreen();
    }
}

// Update game state
function update() {
    // Don't update if game is paused
    if (isPaused) return;
    
    const head = { ...snake[0] };
    
    // Move head
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check wall collision - Nokia snake wraps around the screen
    if (head.x < 0) head.x = gridWidth - 1;
    if (head.x >= gridWidth) head.x = 0;
    if (head.y < 0) head.y = gridHeight - 1;
    if (head.y >= gridHeight) head.y = 0;
    
    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 1;
        scoreElement.textContent = score;
        
        // Check if new high score
        if (score > highScore) {
            // Only celebrate if we haven't celebrated in this game session
            if (!hasHighScoreCelebrated) {
                startCelebration();
                hasHighScoreCelebrated = true; // Mark that we've celebrated the high score
            }
            // Always update the high score
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('highScore').textContent = highScore;
        }
        
        generateFood();
    } else {
        snake.pop();
    }
    
    // Update celebration particles
    if (isNewHighScore) {
        updateCelebration();
    }
}

// Game over
function gameOver() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    clearInterval(gameLoop);
    stopCelebration();
    alert(`Game Over! Score: ${score}`);
    startGame();
}

// Handle keyboard input
function handleKeyPress(event) {
    const key = event.key;
    
    // Pause/resume with 'p' or 'Escape' key
    if (key === 'p' || key === 'P' || key === 'Escape') {
        togglePause();
        return;
    }
    
    // Don't process movement keys if game is paused
    if (isPaused) return;
    
    // Prevent reverse direction
    if (key === 'ArrowUp' && direction !== 'down') direction = 'up';
    if (key === 'ArrowDown' && direction !== 'up') direction = 'down';
    if (key === 'ArrowLeft' && direction !== 'right') direction = 'left';
    if (key === 'ArrowRight' && direction !== 'left') direction = 'right';
}

// Start game
function startGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    
    // Set responsive canvas size to take up more than 70% of the screen
    const minDimension = Math.min(window.innerWidth, window.innerHeight) * 0.7;
    canvas.width = minDimension;
    canvas.height = minDimension;
    
    // Calculate grid based on cell size
    gridWidth = Math.floor(canvas.width / CELL_SIZE);
    gridHeight = Math.floor(canvas.height / CELL_SIZE);
    
    // Center the grid
    offsetX = (canvas.width - gridWidth * CELL_SIZE) / 2;
    offsetY = (canvas.height - gridHeight * CELL_SIZE) / 2;
    
    // Initialize game state
    score = 0;
    scoreElement.textContent = score;
    document.getElementById('highScore').textContent = highScore;
    direction = 'right';
    isPaused = false;
    isNewHighScore = false;
    hasHighScoreCelebrated = false; // Reset the celebration flag
    celebrationParticles = [];
    if (celebrationTimer) clearTimeout(celebrationTimer);
    initSnake();
    generateFood();
    draw();
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        update();
        draw();
    }, GAME_SPEED);
    
    // Add pause button click handler
    setupPauseButton();
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    }
}

// Draw pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#9EAD86';
    ctx.font = '20px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = '14px Courier New';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 15);
}

// Setup pause button
function setupPauseButton() {
    let pauseButton = document.getElementById('pauseButton');
    
    if (!pauseButton) {
        pauseButton = document.createElement('button');
        pauseButton.id = 'pauseButton';
        pauseButton.className = 'nokia-score p-1 px-2 rounded cursor-pointer';
        pauseButton.textContent = 'Pause';
        
        const scoreContainer = document.querySelector('.flex.justify-center.items-center.space-x-4');
        if (scoreContainer) {
            scoreContainer.appendChild(pauseButton);
        }
    }
    
    pauseButton.onclick = togglePause;
}

// Start celebration animation
function startCelebration() {
    isNewHighScore = true;
    celebrationParticles = [];
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        celebrationParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 5 + 2,
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * 4 - 2,
            color: Math.random() > 0.5 ? '#222222' : '#9EAD86'
        });
    }
    
    // Set timeout to end celebration
    if (celebrationTimer) clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(stopCelebration, CELEBRATION_DURATION);
}

// Update celebration particles
function updateCelebration() {
    for (let particle of celebrationParticles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.width) particle.speedX *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height) particle.speedY *= -1;
    }
}

// Draw celebration particles
function drawCelebration() {
    for (let particle of celebrationParticles) {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    
    // Draw high score text
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 4);
}

// Stop celebration
function stopCelebration() {
    isNewHighScore = false;
    celebrationParticles = [];
    if (celebrationTimer) {
        clearTimeout(celebrationTimer);
        celebrationTimer = null;
    }
}

// Event listeners
document.addEventListener('keydown', handleKeyPress);
window.addEventListener('load', startGame);