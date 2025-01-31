const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Diseño del nivel: cada fila es una cadena.
// '#' = pared; '.' = pellet; ' ' = espacio vacío.
const levelDesign = [
  "####################",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#..................#",
  "#.####.#.##.#.####.#",
  "#........##........#",
  "####################"
];

const grid = levelDesign.map(row => row.split(''));
const rows = grid.length;
const cols = grid[0].length;

// Se calcula el tamaño de cada celda según la pantalla.
let tileSize = Math.floor(Math.min(window.innerWidth / cols, window.innerHeight / rows));
canvas.width = tileSize * cols;
canvas.height = tileSize * rows;

// Direcciones cardinales (sin diagonales) con vector y ángulo para dibujar.
const directions = {
  left:  { dx: -1, dy:  0, angle: Math.PI },
  right: { dx:  1, dy:  0, angle: 0 },
  up:    { dx:  0, dy: -1, angle: -Math.PI/2 },
  down:  { dx:  0, dy:  1, angle: Math.PI/2 }
};

// El jugador se posiciona en la celda (10,3)
let player = {
  col: 10,
  row: 3,
  x: (10 + 0.5) * tileSize,
  y: (3 + 0.5) * tileSize,
  currentDirection: null,  // Dirección en ejecución
  nextDirection: null,     // Dirección solicitada
  speed: tileSize / 16,    // Velocidad de movimiento
  targetCol: 10,           // Celda destino
  targetRow: 3
};

let score = 0;

// Creación de fantasmas con colores distintos.
const ghostColors = ["red", "pink", "cyan", "orange"];
let enemies = [];

function createEnemy(col, row, color) {
  let dirKeys = Object.keys(directions);
  let randomDir = directions[dirKeys[Math.floor(Math.random() * dirKeys.length)]];
  return {
    col: col,
    row: row,
    x: (col + 0.5) * tileSize,
    y: (row + 0.5) * tileSize,
    currentDirection: randomDir,
    speed: tileSize / 20, // Los fantasmas se mueven algo más lentos
    color: color,
    targetCol: col,
    targetRow: row
  };
}

// Ubicaciones iniciales: en cada esquina.
enemies.push(createEnemy(cols - 2, 1, ghostColors[0]));       // esquina superior derecha
enemies.push(createEnemy(cols - 2, rows - 2, ghostColors[1]));  // esquina inferior derecha
enemies.push(createEnemy(1, rows - 2, ghostColors[2]));         // esquina inferior izquierda
enemies.push(createEnemy(1, 1, ghostColors[3]));                // esquina superior izquierda

// Dibuja la grilla con paredes y pellets.
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

// Dibuja al jugador (Pac-Man) con "boca" según la dirección.
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

// Dibuja un fantasma con forma característica (cabeza semicircular y pies ondulados).
function drawGhost(enemy) {
  const x = enemy.x;
  const y = enemy.y;
  const size = tileSize * 0.8;
  const radius = size / 2;
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  // Cabeza: semicírculo.
  ctx.arc(x, y - radius * 0.3, radius, Math.PI, 0, false);
  // Cuerpo: línea hacia la esquina derecha.
  ctx.lineTo(x + radius, y + radius);
  // Dibujar “pies” con ondas (3 picos).
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

// Retorna true si la celda (col, row) es transitable (no es pared).
function isValidCell(col, row) {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  return grid[row][col] !== "#";
}

// Movimiento del jugador basado en celdas.
// Si el jugador está centrado en su celda (dentro de un epsilon),
// se verifica la dirección solicitada y se fija la celda destino.
function updatePlayer() {
  let centerX = (player.col + 0.5) * tileSize;
  let centerY = (player.row + 0.5) * tileSize;
  let epsilon = 2;
  if (Math.abs(player.x - centerX) < epsilon && Math.abs(player.y - centerY) < epsilon) {
    player.x = centerX;
    player.y = centerY;
    // Consumir pellet si hay.
    if (grid[player.row][player.col] === ".") {
      grid[player.row][player.col] = " ";
      score += 10;
    }
    // Si hay dirección pendiente, se intenta cambiar.
    if (player.nextDirection) {
      let nd = player.nextDirection;
      if (isValidCell(player.col + nd.dx, player.row + nd.dy)) {
        player.currentDirection = nd;
      }
      player.nextDirection = null;
    }
    // Verificar que la dirección actual siga siendo válida.
    if (player.currentDirection && !isValidCell(player.col + player.currentDirection.dx, player.row + player.currentDirection.dy)) {
      player.currentDirection = null;
    }
    // Definir la celda destino.
    if (player.currentDirection) {
      player.targetCol = player.col + player.currentDirection.dx;
      player.targetRow = player.row + player.currentDirection.dy;
    } else {
      player.targetCol = player.col;
      player.targetRow = player.row;
    }
  }
  // Interpolación hacia el centro de la celda destino.
  if (player.currentDirection) {
    let targetX = (player.targetCol + 0.5) * tileSize;
    let targetY = (player.targetRow + 0.5) * tileSize;
    let dx = targetX - player.x;
    let dy = targetY - player.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < player.speed) {
      player.x = targetX;
      player.y = targetY;
      player.col = player.targetCol;
      player.row = player.targetRow;
    } else {
      player.x += (dx / dist) * player.speed;
      player.y += (dy / dist) * player.speed;
    }
  }
}

// Movimiento de los enemigos (fantasmas) con lógica similar.
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
        if (isValidCell(enemy.col + d.dx, enemy.row + d.dy)) {
          if (enemy.currentDirection && d.dx === -enemy.currentDirection.dx && d.dy === -enemy.currentDirection.dy)
            continue;
          possibleDirs.push(d);
        }
      }
      // Si el jugador está cercano (umbral de 5 celdas), se persigue.
      let dx = player.col - enemy.col;
      let dy = player.row - enemy.row;
      let manhattan = Math.abs(dx) + Math.abs(dy);
      if (manhattan <= 5 && possibleDirs.length > 0) {
        possibleDirs.sort((a, b) => {
          let da = Math.abs((enemy.col + a.dx) - player.col) + Math.abs((enemy.row + a.dy) - player.row);
          let db = Math.abs((enemy.col + b.dx) - player.col) + Math.abs((enemy.row + b.dy) - player.row);
          return da - db;
        });
        enemy.currentDirection = possibleDirs[0];
      } else if (possibleDirs.length > 0) {
        enemy.currentDirection = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
      } else {
        enemy.currentDirection = null;
      }
      if (enemy.currentDirection) {
        enemy.targetCol = enemy.col + enemy.currentDirection.dx;
        enemy.targetRow = enemy.row + enemy.currentDirection.dy;
      } else {
        enemy.targetCol = enemy.col;
        enemy.targetRow = enemy.row;
      }
    }
    if (enemy.currentDirection) {
      let targetX = (enemy.targetCol + 0.5) * tileSize;
      let targetY = (enemy.targetRow + 0.5) * tileSize;
      let dx = targetX - enemy.x;
      let dy = targetY - enemy.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemy.speed) {
        enemy.x = targetX;
        enemy.y = targetY;
        enemy.col = enemy.targetCol;
        enemy.row = enemy.targetRow;
      } else {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
      }
    }
  });
}

// Bucle principal: actualiza y dibuja en cada frame.
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

// Controles de teclado: se aceptan solo direcciones cardinales.
document.addEventListener("keydown", (e) => {
  let newDir = null;
  if (e.key === "ArrowUp") newDir = directions.up;
  else if (e.key === "ArrowDown") newDir = directions.down;
  else if (e.key === "ArrowLeft") newDir = directions.left;
  else if (e.key === "ArrowRight") newDir = directions.right;
  if (newDir) player.nextDirection = newDir;
});

// Controles táctiles según zonas.
// Se asume pantalla vertical. Se divide el canvas en 3 filas: 
// top: 20% de la altura, middle: 60%, bottom: 20%.
// En la fila central se divide horizontalmente en 3 columnas iguales.
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  let touch = e.changedTouches[0];
  let rect = canvas.getBoundingClientRect();
  let touchX = touch.clientX - rect.left;
  let touchY = touch.clientY - rect.top;
  let width = canvas.width;
  let height = canvas.height;
  
  // Definimos las zonas verticales.
  let topZone = height * 0.2;
  let bottomZone = height * 0.8;
  
  if (touchY < topZone) {
    // Toca la zona superior: mover hacia arriba.
    player.nextDirection = directions.up;
  } else if (touchY > bottomZone) {
    // Toca la zona inferior: mover hacia abajo.
    player.nextDirection = directions.down;
  } else {
    // En la zona central: dividimos en 3 columnas.
    if (touchX < width / 3) {
      // Columna izquierda: mover a la izquierda.
      player.nextDirection = directions.left;
    } else if (touchX > (2 * width) / 3) {
      // Columna derecha: mover a la derecha.
      player.nextDirection = directions.right;
    } else {
      // Columna central: si se está moviendo, se frena.
      if (player.currentDirection) {
        player.currentDirection = null;
        player.nextDirection = null;
      }
    }
  }
});