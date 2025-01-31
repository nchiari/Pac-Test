const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Diseño del nivel: cada string representa una fila de la grilla
// '#' = pared; '.' = pellet; ' ' = espacio vacío
const levelDesign = [
  "####################",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#..................#",
  "#.####.#.##.#.####.#",
  "#........##........#",
  "####################"
];

// Nos aseguramos de que cada fila tenga la misma longitud (20 celdas)
const grid = levelDesign.map(row => {
  if (row.length < 20) {
    // Si falta alguna celda, completamos con pellets (podés ajustar)
    return row.padEnd(20, ".").split('');
  }
  return row.split('');
});
const rows = grid.length;
const cols = grid[0].length;

// Calcular el tamaño de cada celda (tileSize) según el tamaño de la ventana
let tileSize = Math.floor(Math.min(window.innerWidth / cols, window.innerHeight / rows));
canvas.width = tileSize * cols;
canvas.height = tileSize * rows;

// Definición de direcciones cardinales
const directions = {
  left:  { dx: -1, dy:  0, angle: Math.PI },
  right: { dx:  1, dy:  0, angle: 0 },
  up:    { dx:  0, dy: -1, angle: -Math.PI/2 },
  down:  { dx:  0, dy:  1, angle: Math.PI/2 }
};

// Ubicamos al jugador en una celda intermedia (por ejemplo, en (10,3))
let player = {
  col: 10,
  row: 3,
  x: (10 + 0.5) * tileSize,
  y: (3 + 0.5) * tileSize,
  currentDirection: null,
  nextDirection: null,
  speed: tileSize / 8
};

let score = 0; // Para puntuar (si querés mostrarlo luego)

// Creación de enemigos (fantasmitas) con colores diferentes
let ghostColors = ["red", "pink", "cyan", "orange"];
let enemies = [];

// Función para crear un fantasma en una celda dada
function createEnemy(col, row, color) {
  let dirKeys = Object.keys(directions);
  let randomDir = directions[dirKeys[Math.floor(Math.random() * dirKeys.length)]];
  return {
    col: col,
    row: row,
    x: (col + 0.5) * tileSize,
    y: (row + 0.5) * tileSize,
    currentDirection: randomDir,
    speed: tileSize / 8,
    color: color
  };
}

// Ubicaciones iniciales en las esquinas
enemies.push(createEnemy(cols - 2, 1, ghostColors[0]));       // esquina superior derecha
enemies.push(createEnemy(cols - 2, rows - 2, ghostColors[1]));  // esquina inferior derecha
enemies.push(createEnemy(1, rows - 2, ghostColors[2]));         // esquina inferior izquierda
enemies.push(createEnemy(1, 1, ghostColors[3]));                // esquina superior izquierda

// Dibuja la grilla: paredes y pellets
function drawGrid() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let cell = grid[row][col];
      let x = col * tileSize;
      let y = row * tileSize;
      if (cell === "#") {
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, tileSize, tileSize);
      } else if (cell === ".") {
        ctx.fillStyle = "white";
        let pelletSize = tileSize / 8;
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, pelletSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Dibuja al jugador (Pac-Man) con una "boca" abierta según la dirección
function drawPlayer() {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  let dir = player.currentDirection || directions.right;
  let startAngle = dir.angle + 0.25;
  let endAngle = dir.angle - 0.25;
  ctx.moveTo(player.x, player.y);
  ctx.arc(player.x, player.y, tileSize * 0.4, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fill();
}

// Dibuja un fantasma con forma característica (cabeza semicírculo y "pies" ondulados)
function drawGhost(enemy) {
  const x = enemy.x;
  const y = enemy.y;
  const size = tileSize * 0.8;
  const radius = size / 2;
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  // Cabeza: semicírculo
  ctx.arc(x, y - radius * 0.3, radius, Math.PI, 0, false);
  // Lado derecho y parte inferior
  ctx.lineTo(x + radius, y + radius);
  // Dibujar ondas en el fondo (3 "pies")
  const waveCount = 3;
  const waveWidth = (2 * radius) / waveCount;
  for (let i = 0; i < waveCount; i++) {
    let cx = x + radius - waveWidth * (i + 0.5);
    let cy = y + radius + (i % 2 === 0 ? 5 : -5);
    ctx.quadraticCurveTo(cx, cy, x + radius - waveWidth * (i + 1), y + radius);
  }
  ctx.lineTo(x - radius, y + radius);
  ctx.closePath();
  ctx.fill();
}

// Verifica si la celda (col, row) es transitable (es decir, no es pared)
function isValidCell(col, row) {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  return grid[row][col] !== "#";
}

// Actualiza la posición del jugador según la grilla y detecta colisiones
function updatePlayer() {
  // Cuando el jugador está centrado en la celda, se permite cambiar dirección y comer pellet
  let centerX = (player.col + 0.5) * tileSize;
  let centerY = (player.row + 0.5) * tileSize;
  let epsilon = 2;
  if (Math.abs(player.x - centerX) < epsilon && Math.abs(player.y - centerY) < epsilon) {
    player.x = centerX;
    player.y = centerY;
    player.col = Math.floor(player.x / tileSize);
    player.row = Math.floor(player.y / tileSize);
    // Comer pellet si está presente
    if (grid[player.row][player.col] === ".") {
      grid[player.row][player.col] = " ";
      score += 10;
    }
    // Si hay una nueva dirección solicitada y es válida, se actualiza
    if (player.nextDirection) {
      let nd = player.nextDirection;
      let newCol = player.col + nd.dx;
      let newRow = player.row + nd.dy;
      if (isValidCell(newCol, newRow)) {
        player.currentDirection = nd;
      }
      player.nextDirection = null;
    }
    // Si la dirección actual queda bloqueada, se detiene
    if (player.currentDirection) {
      let newCol = player.col + player.currentDirection.dx;
      let newRow = player.row + player.currentDirection.dy;
      if (!isValidCell(newCol, newRow)) {
        player.currentDirection = null;
      }
    }
  }
  // Se mueve en la dirección actual (solo horizontal o vertical)
  if (player.currentDirection) {
    player.x += player.currentDirection.dx * player.speed;
    player.y += player.currentDirection.dy * player.speed;
  }
}

// Actualiza el movimiento de los enemigos (fantasmas)
function updateEnemies() {
  enemies.forEach(enemy => {
    let centerX = (enemy.col + 0.5) * tileSize;
    let centerY = (enemy.row + 0.5) * tileSize;
    let epsilon = 2;
    if (Math.abs(enemy.x - centerX) < epsilon && Math.abs(enemy.y - centerY) < epsilon) {
      enemy.x = centerX;
      enemy.y = centerY;
      enemy.col = Math.floor(enemy.x / tileSize);
      enemy.row = Math.floor(enemy.y / tileSize);
      let possibleDirs = [];
      for (let key in directions) {
        let d = directions[key];
        let newCol = enemy.col + d.dx;
        let newRow = enemy.row + d.dy;
        if (isValidCell(newCol, newRow)) {
          // Evitamos invertir la dirección actual
          if (enemy.currentDirection && d.dx === -enemy.currentDirection.dx && d.dy === -enemy.currentDirection.dy) {
            continue;
          }
          possibleDirs.push(d);
        }
      }
      // Si el jugador está cerca (umbral de 5 celdas), el fantasma lo persigue
      let dx = player.col - enemy.col;
      let dy = player.row - enemy.row;
      let distance = Math.abs(dx) + Math.abs(dy);
      if (distance <= 5 && possibleDirs.length > 0) {
        possibleDirs.sort((a, b) => {
          let distA = Math.abs((enemy.col + a.dx) - player.col) + Math.abs((enemy.row + a.dy) - player.row);
          let distB = Math.abs((enemy.col + b.dx) - player.col) + Math.abs((enemy.row + b.dy) - player.row);
          return distA - distB;
        });
        enemy.currentDirection = possibleDirs[0];
      } else if (possibleDirs.length > 0) {
        enemy.currentDirection = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
      } else {
        enemy.currentDirection = { dx: 0, dy: 0, angle: 0 };
      }
    }
    enemy.x += enemy.currentDirection.dx * enemy.speed;
    enemy.y += enemy.currentDirection.dy * enemy.speed;
  });
}

// Ciclo principal: actualización y renderizado
function gameLoop() {
  updatePlayer();
  updateEnemies();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawPlayer();
  enemies.forEach(enemy => drawGhost(enemy));
  requestAnimationFrame(gameLoop);
}
gameLoop();

// Controles de teclado (solo direcciones cardinales)
document.addEventListener("keydown", (e) => {
  let newDir = null;
  if (e.key === "ArrowUp") newDir = directions.up;
  else if (e.key === "ArrowDown") newDir = directions.down;
  else if (e.key === "ArrowLeft") newDir = directions.left;
  else if (e.key === "ArrowRight") newDir = directions.right;
  if (newDir) player.nextDirection = newDir;
});

// Controles táctiles: detectar swipe para asignar la dirección
let touchStartX = null;
let touchStartY = null;
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (touchStartX === null || touchStartY === null) return;
  let touchEndX = e.changedTouches[0].clientX;
  let touchEndY = e.changedTouches[0].clientY;
  let diffX = touchEndX - touchStartX;
  let diffY = touchEndY - touchStartY;
  let newDir = null;
  if (Math.abs(diffX) > Math.abs(diffY)) {
    newDir = diffX > 0 ? directions.right : directions.left;
  } else {
    newDir = diffY > 0 ? directions.down : directions.up;
  }
  player.nextDirection = newDir;
  touchStartX = null;
  touchStartY = null;
});