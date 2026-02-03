// TETRIS Remastered
document.addEventListener('DOMContentLoaded', () => {
    
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const BLOCK_SIZE = 30;
    const COLORS = [
        null,
        '#FF0D72', // I - Pink
        '#0DC2FF', // J - Blue
        '#0DFF72', // L - Green
        '#F538FF', // O - Purple
        '#FF8E0D', // S - Orange
        '#FFE138', // T - Yellow
        '#3877FF'  // Z - Light Blue
    ];
    
    // Tetromino Shapes
    const TETROMINOS = [
        null,
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ], // I
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ], // J
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ], // L
        [
            [4, 4],
            [4, 4]
        ], // O
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ], // S
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ], // T
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]  // Z
    ];
    
    // Game Variables
    let gameMode = 'single'; // 'single' or 'multi'
    let difficulty = 'medium';
    let isMobile = false;
    let isPaused = false;
    let isGameOver = false;
    let gameLoopId = null;
    
    // Players
    let player1 = {
        board: null,
        canvas: null,
        ctx: null,
        nextCanvas: null,
        nextCtx: null,
        score: 0,
        level: 1,
        lines: 0,
        dropCounter: 0,
        dropInterval: 1000,
        playerMatrix: null,
        nextPiece: null,
        position: {x: 0, y: 0},
        gameOver: false
    };
    
    let player2 = {
        board: null,
        canvas: null,
        ctx: null,
        nextCanvas: null,
        nextCtx: null,
        score: 0,
        level: 1,
        lines: 0,
        dropCounter: 0,
        dropInterval: 1000,
        playerMatrix: null,
        nextPiece: null,
        position: {x: 0, y: 0},
        gameOver: false
    };
    
    // Animation Variables
    let lineClearAnimations = [];
    let lastTime = 0;
    
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const deviceWarning = document.getElementById('device-warning');
    const multiplayerDivider = document.getElementById('multiplayer-divider');
    const player2Container = document.getElementById('player2-container');
    const winnerAnnouncement = document.getElementById('winner-announcement');
    const mobileControls = document.getElementById('mobile-controls');
    
    // Force hide all non-active screens
    function forceHideScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            if (!screen.classList.contains('active')) {
                screen.style.display = 'none';
                screen.style.visibility = 'hidden';
                screen.style.opacity = '0';
            } else {
                screen.style.display = 'flex';
                screen.style.visibility = 'visible';
                screen.style.opacity = '1';
            }
        });
    }

    // Initialize the game
    function init() {
        // Detect mobile device
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Update UI based on device
        if (isMobile) {
            gameMode = 'single';
            deviceWarning.classList.remove('hidden');
            document.querySelector('.mode-option[data-mode="multi"]').style.opacity = '0.5';
            document.querySelector('.mode-option[data-mode="multi"]').style.pointerEvents = 'none';
            document.querySelector('.mode-option[data-mode="single"]').classList.add('selected');
            mobileControls.classList.add('hidden');
        } else {
            deviceWarning.classList.add('hidden');
        }
        
        // Set up event listeners
        setupEventListeners();
        forceHideScreens();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                if (isMobile && option.dataset.mode === 'multi') return;
                
                document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                gameMode = option.dataset.mode;
            });
        });
        
        // Difficulty selection
        document.querySelectorAll('.diff-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.diff-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                difficulty = option.dataset.diff;
            });
        });
        
        // Start game button
        document.getElementById('start-game').addEventListener('click', startGame);
        
        // Game control buttons
        document.getElementById('pause-btn').addEventListener('click', togglePause);
        document.getElementById('restart-btn').addEventListener('click', restartGame);
        document.getElementById('menu-btn').addEventListener('click', goToMainMenu);
        document.getElementById('play-again-btn').addEventListener('click', playAgain);
        document.getElementById('main-menu-btn').addEventListener('click', goToMainMenu);
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Mobile touch controls
        if (isMobile) {
            setupMobileControls();
        }
    }
    
    // Set up mobile touch controls
    function setupMobileControls() {
        document.getElementById('mobile-left').addEventListener('touchstart', () => movePiece(player1, -1, 0));
        document.getElementById('mobile-right').addEventListener('touchstart', () => movePiece(player1, 1, 0));
        document.getElementById('mobile-down').addEventListener('touchstart', () => {
            player1.dropInterval = 50; // Speed up drop
        });
        document.getElementById('mobile-down').addEventListener('touchend', () => {
            resetDropInterval(player1);
        });
        document.getElementById('mobile-rotate').addEventListener('touchstart', () => rotatePiece(player1));
    }
    
    // Handle keyboard input
    function handleKeyDown(event) {
        if (isGameOver || isPaused) return;
        
        switch(event.key) {
            // Player 1 controls (WASD)
            case 'w':
            case 'W':
                rotatePiece(player1);
                break;
            case 'a':
            case 'A':
                movePiece(player1, -1, 0);
                break;
            case 'd':
            case 'D':
                movePiece(player1, 1, 0);
                break;
            case 's':
            case 'S':
                player1.dropInterval = 50; // Speed up drop
                break;
                
            // Player 2 controls (Arrow keys)
            case 'ArrowUp':
                if (gameMode === 'multi') rotatePiece(player2);
                break;
            case 'ArrowLeft':
                if (gameMode === 'multi') movePiece(player2, -1, 0);
                break;
            case 'ArrowRight':
                if (gameMode === 'multi') movePiece(player2, 1, 0);
                break;
            case 'ArrowDown':
                if (gameMode === 'multi') player2.dropInterval = 50; // Speed up drop
                break;
                
            // Pause game
            case 'p':
            case 'P':
            case ' ':
                togglePause();
                break;
        }
    }
    
    // Handle key up events
    function handleKeyUp(event) {
        switch(event.key) {
            case 's':
            case 'S':
                resetDropInterval(player1);
                break;
            case 'ArrowDown':
                if (gameMode === 'multi') resetDropInterval(player2);
                break;
        }
    }
    
    // Reset drop interval to normal
    function resetDropInterval(player) {
        const baseSpeed = getDropSpeed();
        player.dropInterval = baseSpeed / Math.sqrt(player.level);
    }
    
    // Get drop speed based on difficulty
    function getDropSpeed() {
        switch(difficulty) {
            case 'easy': return 1200;
            case 'medium': return 1000;
            case 'hard': return 800;
            case 'expert': return 600;
            default: return 1000;
        }
    }
    
    // Start the game
    function startGame() {
        // Cancel any existing game loop
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        
        // Show mobile controls if on mobile
        if (isMobile) {
            mobileControls.classList.remove('hidden');
            document.body.classList.add('mobile-active');
        }
        
        // Hide start screen, show game screen
        startScreen.classList.remove('active');
        gameScreen.classList.add('active');
        gameOverScreen.classList.remove('active'); // Make sure game over is hidden
        
        // Reset game state
        isGameOver = false;
        isPaused = false;
        lineClearAnimations = [];
        
        // Initialize game mode
        if (gameMode === 'multi') {
            multiplayerDivider.classList.remove('hidden');
            player2Container.classList.remove('hidden');
        } else {
            multiplayerDivider.classList.add('hidden');
            player2Container.classList.add('hidden');
        }
        
        // Initialize players
        initPlayer(player1, 'player1-board', 'player1-next');
        if (gameMode === 'multi') {
            initPlayer(player2, 'player2-board', 'player2-next');
        }
        
        // Start game loop
        lastTime = 0;
        gameLoopId = requestAnimationFrame(gameLoop);
        
        // Show notification
        showNotification('Game Started!', 1500);

        forceHideScreens();
    }

    
    // Initialize a player
    function initPlayer(player, boardId, nextId) {
        // Get canvas elements
        player.canvas = document.getElementById(boardId);
        player.ctx = player.canvas.getContext('2d');
        player.nextCanvas = document.getElementById(nextId);
        player.nextCtx = player.nextCanvas.getContext('2d');
        
        // Clear and reset canvas
        player.ctx.clearRect(0, 0, player.canvas.width, player.canvas.height);
        player.nextCtx.clearRect(0, 0, player.nextCanvas.width, player.nextCanvas.height);
        
        // Reset canvas dimensions
        player.canvas.width = 300;
        player.canvas.height = 600;
        player.nextCanvas.width = 120;
        player.nextCanvas.height = 120;
        
        // Set canvas display size
        player.canvas.style.width = '300px';
        player.canvas.style.height = '600px';
        player.nextCanvas.style.width = '120px';
        player.nextCanvas.style.height = '120px';
        
        // Reset transformation matrix
        player.ctx.setTransform(1, 0, 0, 1, 0, 0);
        player.nextCtx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Initialize game state
        player.board = createMatrix(BOARD_WIDTH, BOARD_HEIGHT);
        player.score = 0;
        player.level = 1;
        player.lines = 0;
        player.dropCounter = 0;
        player.dropInterval = getDropSpeed();
        player.gameOver = false;
        
        // Create first piece
        player.nextPiece = createRandomPiece();
        resetPlayer(player);
        
        // Draw initial state
        drawBoard(player);
        drawNextPiece(player);
    }
    
    // Create game board matrix
    function createMatrix(width, height) {
        const matrix = [];
        for (let i = 0; i < height; i++) {
            matrix.push(new Array(width).fill(0));
        }
        return matrix;
    }
    
    // Create a random tetromino
    function createRandomPiece() {
        const pieceId = Math.floor(Math.random() * 7) + 1;
        return {
            matrix: JSON.parse(JSON.stringify(TETROMINOS[pieceId])), // Deep clone
            color: COLORS[pieceId],
            id: pieceId
        };
    }
    
    // Reset player for new piece
    function resetPlayer(player) {
        player.playerMatrix = player.nextPiece;
        player.nextPiece = createRandomPiece();
        player.position.y = 0;
        player.position.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.playerMatrix.matrix[0].length / 2);
        
        // Check if game over (new piece collides immediately)
        if (collide(player.board, player.playerMatrix.matrix, player.position)) {
            player.gameOver = true;
            checkGameOver();
        }
        
        // Update next piece display
        drawNextPiece(player);
    }
    
    // Main game loop
    function gameLoop(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        if (!isPaused && !isGameOver) {
            // Update players
            updatePlayer(player1, deltaTime);
            if (gameMode === 'multi') {
                updatePlayer(player2, deltaTime);
            }
            
            // Update animations
            updateAnimations(deltaTime);
        }
        
        // Draw game state
        draw();
        
        // Continue game loop
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // Update player state
    function updatePlayer(player, deltaTime) {
        if (player.gameOver) return;
        
        player.dropCounter += deltaTime;
        if (player.dropCounter > player.dropInterval) {
            playerDrop(player);
        }
    }
    
    // Update line clear animations
    function updateAnimations(deltaTime) {
        for (let i = lineClearAnimations.length - 1; i >= 0; i--) {
            const anim = lineClearAnimations[i];
            anim.progress += deltaTime / 300; // 300ms animation
            
            if (anim.progress >= 1) {
                lineClearAnimations.splice(i, 1);
                // Remove the cleared rows from the board
                removeRows(anim.player, anim.rows);
            }
        }
    }
    
    // Draw everything
    function draw() {
        // Draw player boards
        drawBoard(player1);
        if (gameMode === 'multi') {
            drawBoard(player2);
        }
        
        // Update UI
        updatePlayerUI(player1, 'p1');
        if (gameMode === 'multi') {
            updatePlayerUI(player2, 'p2');
        }
    }
    
    // Draw player board
    function drawBoard(player) {
        const { ctx, canvas } = player;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        drawGrid(ctx);
        
        // Draw placed blocks
        drawMatrix(ctx, player.board, {x: 0, y: 0});
        
        // Draw current piece
        if (!player.gameOver) {
            drawMatrix(ctx, player.playerMatrix.matrix, player.position, player.playerMatrix.color);
        }
        
        // Draw line clear animations
        drawLineClearAnimations(player);
        
        // Draw game over overlay
        if (player.gameOver) {
            drawGameOver(ctx, canvas);
        }
    }
    
    // Draw grid lines
    function drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }
    }
    
    // Draw a matrix (board or piece)
    function drawMatrix(ctx, matrix, offset, color = null) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const blockColor = color || COLORS[value];
                    drawBlock(ctx, x + offset.x, y + offset.y, blockColor);
                }
            });
        });
    }
    
    // Draw a single block with 3D effect
    function drawBlock(ctx, x, y, color) {
        const blockX = x * BLOCK_SIZE;
        const blockY = y * BLOCK_SIZE;
        
        // Draw main block
        ctx.fillStyle = color;
        ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw block border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw 3D effect - top and left highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(blockX, blockY, BLOCK_SIZE, 3);
        ctx.fillRect(blockX, blockY, 3, BLOCK_SIZE);
        
        // Draw 3D effect - bottom and right shadows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(blockX, blockY + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
        ctx.fillRect(blockX + BLOCK_SIZE - 3, blockY, 3, BLOCK_SIZE);
        
        // Draw inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(blockX + 5, blockY + 5, BLOCK_SIZE - 10, BLOCK_SIZE - 10);
    }
    
    // Draw line clear animations
    function drawLineClearAnimations(player) {
        lineClearAnimations.forEach(anim => {
            if (anim.player === player) {
                anim.rows.forEach(row => {
                    const progress = anim.progress;
                    const y = row * BLOCK_SIZE;
                    const width = BOARD_WIDTH * BLOCK_SIZE;
                    
                    // Draw animated white bar
                    const centerX = width / 2;
                    const barWidth = width * progress;
                    
                    // Create gradient for explosion effect
                    const gradient = player.ctx.createLinearGradient(
                        centerX - barWidth/2, y, 
                        centerX + barWidth/2, y + BLOCK_SIZE
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    player.ctx.fillStyle = gradient;
                    player.ctx.fillRect(centerX - barWidth/2, y, barWidth, BLOCK_SIZE);
                    
                    // Draw particles
                    if (progress < 0.8) {
                        drawParticles(player.ctx, centerX, y + BLOCK_SIZE/2, progress);
                    }
                });
            }
        });
    }
    
    // Draw particles for line clear animation
    function drawParticles(ctx, x, y, progress) {
        const particleCount = 20;
        const maxRadius = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = progress * 100;
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            const radius = maxRadius * (1 - progress);
            const alpha = 1 - progress;
            
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.arc(particleX, particleY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw game over screen
    function drawGameOver(ctx, canvas) {
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw game over text
        ctx.fillStyle = '#FF3333';
        ctx.font = 'bold 40px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        // Draw shadow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillText('GAME OVER', canvas.width / 2 + 3, canvas.height / 2 + 3);
    }
    
    // Draw next piece preview
    function drawNextPiece(player) {
        const { nextCtx, nextCanvas, nextPiece } = player;
        
        // Clear canvas
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        // Draw background
        nextCtx.fillStyle = 'rgba(0, 0, 30, 0.8)';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (!nextPiece) return;
        
        // Calculate position to center the piece
        const pieceMatrix = nextPiece.matrix;
        const pieceWidth = pieceMatrix[0].length;
        const pieceHeight = pieceMatrix.length;
        const offsetX = (nextCanvas.width / BLOCK_SIZE - pieceWidth) / 2;
        const offsetY = (nextCanvas.height / BLOCK_SIZE - pieceHeight) / 2;
        
        // Draw the next piece
        drawMatrix(nextCtx, pieceMatrix, {x: offsetX, y: offsetY}, nextPiece.color);
    }
    
    // Move player piece
    function movePiece(player, dirX, dirY) {
        if (player.gameOver) return;
        
        player.position.x += dirX;
        player.position.y += dirY;
        
        if (collide(player.board, player.playerMatrix.matrix, player.position)) {
            player.position.x -= dirX;
            player.position.y -= dirY;
            return false;
        }
        
        return true;
    }
    
    // Rotate player piece
    function rotatePiece(player) {
        if (player.gameOver) return;
        
        const originalMatrix = player.playerMatrix.matrix;
        const rotated = rotateMatrix(originalMatrix);
        
        // Try to rotate, with wall kick
        const position = player.position.x;
        let offset = 0;
        
        // Wall kick: try moving left/right if rotation causes collision
        while (collide(player.board, rotated, {x: player.position.x + offset, y: player.position.y}) && offset < 3) {
            offset = offset <= 0 ? -offset + 1 : -offset;
        }
        
        if (Math.abs(offset) < 3) {
            player.position.x += offset;
            player.playerMatrix.matrix = rotated;
            return true;
        }
        
        return false;
    }
    
    // Rotate a matrix 90 degrees
    function rotateMatrix(matrix) {
        const N = matrix.length;
        const rotated = [];
        
        for (let i = 0; i < N; i++) {
            rotated[i] = [];
            for (let j = 0; j < N; j++) {
                rotated[i][j] = matrix[N - j - 1][i];
            }
        }
        
        return rotated;
    }
    
    // Check for collision
    function collide(board, pieceMatrix, position) {
        for (let y = 0; y < pieceMatrix.length; y++) {
            for (let x = 0; x < pieceMatrix[y].length; x++) {
                if (pieceMatrix[y][x] !== 0 && 
                   (board[y + position.y] && 
                    board[y + position.y][x + position.x]) !== 0) {
                    return true;
                }
                
                // Check if out of bounds
                if (pieceMatrix[y][x] !== 0 && 
                   (x + position.x < 0 || 
                    x + position.x >= BOARD_WIDTH || 
                    y + position.y >= BOARD_HEIGHT)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Player drop (move down)
    function playerDrop(player) {
        if (player.gameOver) return;
        
        player.dropCounter = 0;
        
        if (!movePiece(player, 0, 1)) {
            // Piece has landed
            mergePiece(player);
            resetPlayer(player);
            checkLineClear(player);
        }
    }
    
    // Merge piece into board
    function mergePiece(player) {
        const { board, playerMatrix, position } = player;
        
        playerMatrix.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + position.y][x + position.x] = playerMatrix.id;
                }
            });
        });
    }
    
    // Check for completed lines
    function checkLineClear(player) {
        const rowsToClear = [];
        
        // Find completed rows
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (player.board[y].every(value => value !== 0)) {
                rowsToClear.push(y);
            }
        }
        
        // If lines were cleared
        if (rowsToClear.length > 0) {
            // Start line clear animation
            lineClearAnimations.push({
                player: player,
                rows: rowsToClear,
                progress: 0
            });
            
            // Update score
            updateScore(player, rowsToClear.length);
        }
    }
    
    // Remove cleared rows from board
    function removeRows(player, rows) {
        // Sort rows from top to bottom
        rows.sort((a, b) => a - b);
        
        // Remove each row and add empty rows at the top
        rows.forEach(row => {
            player.board.splice(row, 1);
            player.board.unshift(new Array(BOARD_WIDTH).fill(0));
        });
    }
    
    // Update player score
    function updateScore(player, linesCleared) {
        // Score based on lines cleared
        const linePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
        player.score += linePoints[linesCleared] * player.level;
        
        // Update lines
        player.lines += linesCleared;
        
        // Update level every 10 lines
        const newLevel = Math.floor(player.lines / 10) + 1;
        if (newLevel > player.level) {
            player.level = newLevel;
            showNotification(`Level ${player.level}!`, 1000);
        }
        
        // Update drop speed
        const baseSpeed = getDropSpeed();
        player.dropInterval = baseSpeed / Math.sqrt(player.level);
    }
    
    // Update player UI
    function updatePlayerUI(player, prefix) {
        document.getElementById(`${prefix}-score`).textContent = player.score.toLocaleString();
        document.getElementById(`${prefix}-level`).textContent = player.level;
        document.getElementById(`${prefix}-lines`).textContent = player.lines;
    }
    
    // Check if game is over
    function checkGameOver() {
        // Check if both players are game over (in multiplayer) or single player is game over
        let gameOver = false;
        
        if (gameMode === 'single') {
            gameOver = player1.gameOver;
        } else {
            gameOver = player1.gameOver && player2.gameOver;
            
            // If one player is game over in multiplayer
            if (player1.gameOver !== player2.gameOver) {
                const winner = player1.gameOver ? 'Player 2' : 'Player 1';
                showNotification(`${winner} Wins!`, 3000);
            }
        }
        
        if (gameOver) {
            endGame();
        }
    }
    
    // End the game
    function endGame() {
        isGameOver = true;
        
        // Cancel game loop
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        
        // Hide mobile controls on game over
        if (isMobile) {
            mobileControls.classList.add('hidden');
            document.body.classList.remove('mobile-active');
        }
        
        // Update final scores
        document.getElementById('final-p1-score').textContent = player1.score.toLocaleString();
        document.getElementById('final-p1-level').textContent = player1.level;
        document.getElementById('final-p1-lines').textContent = player1.lines;
        
        if (gameMode === 'multi') {
            document.getElementById('final-p2-score').textContent = player2.score.toLocaleString();
            document.getElementById('final-p2-level').textContent = player2.level;
            document.getElementById('final-p2-lines').textContent = player2.lines;
            
            // Show winner announcement
            if (player1.score > player2.score) {
                document.getElementById('winner-name').textContent = 'Player 1';
                winnerAnnouncement.classList.remove('hidden');
            } else if (player2.score > player1.score) {
                document.getElementById('winner-name').textContent = 'Player 2';
                winnerAnnouncement.classList.remove('hidden');
            } else {
                document.getElementById('winner-name').textContent = 'It\'s a Tie!';
                winnerAnnouncement.classList.remove('hidden');
            }
            
            document.querySelector('.player2-score').classList.remove('hidden');
        } else {
            document.querySelector('.player2-score').classList.add('hidden');
            winnerAnnouncement.classList.add('hidden');
        }
        
        // Switch to game over screen
        gameScreen.classList.remove('active');
        gameOverScreen.classList.add('active');
    }
    
    // Toggle pause state
    function togglePause() {
        if (isGameOver) return;
        
        isPaused = !isPaused;
        
        const pauseBtn = document.getElementById('pause-btn');
        const icon = pauseBtn.querySelector('i');
        
        if (isPaused) {
            icon.className = 'fas fa-play';
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            showNotification('Game Paused', 2000);
        } else {
            icon.className = 'fas fa-pause';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            showNotification('Game Resumed', 1000);
        }
    }
    
    // Restart game
    function restartGame() {
        startGame();
    }
    
    // Play again
    function playAgain() {
        // Hide game over screen
        gameOverScreen.classList.remove('active');
        
        // Start new game
        startGame();
        forceHideScreens();
    }
    
    // Go to main menu
    function goToMainMenu() {
        // Cancel game loop
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        
        // Hide mobile controls
        if (isMobile) {
            mobileControls.classList.add('hidden');
            document.body.classList.remove('mobile-active');
        }
        
        // Show start screen, hide others
        startScreen.classList.add('active');
        gameScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        
        // Reset winner announcement
        winnerAnnouncement.classList.add('hidden');

        forceHideScreens();
    }
    
    // Show notification
    function showNotification(message, duration = 2000) {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notification-text');
        
        text.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    }
    
    // Initialize the game when page loads
    init();
});
