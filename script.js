const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Diseño del nivel: cada string representa una fila de la grilla
// '#' = pared; '.' = pellet; ' ' = espacio vacío
const levelDesign = [
  "####################",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#.................#",
  "#.####.#.##.#.####.#",
  "#........##........#",
  "####################"
];

// Convertir el diseño a una matriz modificable
let grid = levelDesign.map(row => row.split(''));
const rows = grid.length;
const cols = grid[0].length;

// Calcular el tamaño de cada celda según el dispositivo (para jugar en vertical o horizontal)
let tileSize = Math.floor(Math.min(window.innerWidth / cols, window.innerHeight / rows));
canvas.width = tileSize * cols;
canvas.height = tileSize * rows;

// Definición de direcciones cardinales con vector y ángulo para dibujar
const directions = {
  left:  { dx: -1, dy:  0, angle: Math.PI },
  right: { dx:  1, dy:  0, angle: 0 },
  up:    { dx:  0, dy: -1, angle: -Math.PI/2 },
  down:  { dx:  0, dy:  1, angle: Math.PI/2 }
};

// Inicialización del jugador: lo ubicamos en la celda (1,1)
let player = {
  col: 1,
  row: 1,
  x: (1 + 0.5) * tileSize,
  y: (1 + 0.5) * tileSize,
  currentDirection: null,
  nextDirection: null,
  speed: tileSize / 8
};

let score = 0; // Podés usarlo para mostrar puntaje

// Creación de enemigos (fantasmitas) con colores diferentes
let ghostColors = ["red", "pink", "cyan", "orange"];
let enemies = [];

// Función para instanciar un enemigo en una celda dada
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

// Ubicaciones iniciales de los fantasmas
enemies.push(createEnemy(cols - 2, 1, ghostColors[0]));
enemies.push(createEnemy(cols - 2, rows - 2, ghostColors[1]));
enemies.push(createEnemy(1, rows - 2, ghostColors[2]));
enemies.push(createEnemy(Math.floor(cols/2), Math.floor(rows/2), ghostColors[3]));

// Dibujo de la grilla: paredes y pellets
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
        ctx.arc(x + tileSize/2, y + tileSize/2, pelletSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Dibujo del jugador (Pac-Man). Se usa un arco con “boca” abierta según la dirección.
function drawPlayer() {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  let dir = player.currentDirection || directions.right;
  // Se dibuja un arco con un ángulo para simular la boca
  let startAngle = dir.angle + 0.25;
  let endAngle = dir.angle - 0.25;
  ctx.moveTo(player.x, player.y);
  ctx.arc(player.x, player.y, tileSize * 0.4, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fill();
}

// Dibujo de un fantasmita usando una forma simple
function drawGhost(enemy) {
  let x = enemy.x;
  let y = enemy.y;
  let size = tileSize * 0.8;
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  // Cabeza: un semicírculo
  ctx.arc(x, y - size * 0.15, size / 2, Math.PI, 0, false);
  // Cuerpo: parte inferior con “pies” alternos
  ctx.lineTo(x + size/2, y + size/2);
  ctx.lineTo(x + size/3, y + size/2 - size * 0.15);
  ctx.lineTo(x + size/6, y + size/2);
  ctx.lineTo(x, y + size/2 - size * 0.15);
  ctx.lineTo(x - size/6, y + size/2);
  ctx.lineTo(x - size/3, y + size/2 - size * 0.15);
  ctx.lineTo(x - size/2, y + size/2);
  ctx.closePath();
  ctx.fill();
}

// Función que verifica si una celda (col, row) es transitable (no es pared)
function isValidCell(col, row) {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  return grid[row][col] !== "#";
}

// Actualiza la posición del jugador en base a su dirección y colisiones con la grilla
function updatePlayer() {
  // Cuando esté centrado en la celda, puede cambiar de dirección y comer pellet
  let centerX = (player.col + 0.5) * tileSize;
  let centerY = (player.row + 0.5) * tileSize;
  let epsilon = 2;
  if (Math.abs(player.x - centerX) < epsilon && Math.abs(player.y - centerY) < epsilon) {
    player.x = centerX;
    player.y = centerY;
    player.col = Math.floor(player.x / tileSize);
    player.row = Math.floor(player.y / tileSize);
    // Comer pellet
    if (grid[player.row][player.col] === ".") {
      grid[player.row][player.col] = " ";
      score += 10;
      // Podés agregar aquí actualización de marcador, etc.
    }
    // Si se pidió cambiar de dirección y es válida, se actualiza
    if (player.nextDirection) {
      let nd = player.nextDirection;
      let newCol = player.col + nd.dx;
      let newRow = player.row + nd.dy;
      if (isValidCell(newCol, newRow)) {
        player.currentDirection = nd;
      }
      player.nextDirection = null;
    }
    // Si la dirección actual quedó bloqueada, se para
    if (player.currentDirection) {
      let newCol = player.col + player.currentDirection.dx;
      let newRow = player.row + player.currentDirection.dy;
      if (!isValidCell(newCol, newRow)) {
        player.currentDirection = null;
      }
    }
  }
  // Mover al jugador si tiene una dirección asignada
  if (player.currentDirection) {
    player.x += player.currentDirection.dx * player.speed;
    player.y += player.currentDirection.dy * player.speed;
  }
}

// Actualiza el movimiento de los enemigos (fantasmitas)
// Cuando están centrados en una celda, eligen su próxima dirección.
// Si el jugador está cerca (dentro de cierto umbral en celdas) eligen perseguirlo (mínima distancia Manhattan); sino, se mueven al azar.
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
          // Evitar invertir la dirección actual
          if (enemy.currentDirection && (d.dx === -enemy.currentDirection.dx && d.dy === -enemy.currentDirection.dy)) {
            continue;
          }
          possibleDirs.push(d);
        }
      }
      // Si el jugador está cerca (por ejemplo, a 5 celdas de distancia), perseguirlo
      let dx = player.col - enemy.col;
      let dy = player.row - enemy.row;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let chaseThreshold = 5;
      if (distance <= chaseThreshold && possibleDirs.length > 0) {
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

// Ciclo principal de actualización y renderizado
function update() {
  updatePlayer();
  updateEnemies();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawPlayer();
  enemies.forEach(enemy => drawGhost(enemy));
  requestAnimationFrame(update);
}
update();

// Controles de teclado: sólo se asigna dirección cardinal (sin diagonales)
document.addEventListener("keydown", (e) => {
  let newDir = null;
  if (e.key === "ArrowUp") newDir = directions.up;
  else if (e.key === "ArrowDown") newDir = directions.down;
  else if (e.key === "ArrowLeft") newDir = directions.left;
  else if (e.key === "ArrowRight") newDir = directions.right;
  if (newDir) player.nextDirection = newDir;
});

// Controles táctiles: se detecta el swipe para determinar la dirección predominante
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