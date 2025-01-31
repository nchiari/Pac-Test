const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Definición del jugador
let player = {
  x: 50,
  y: 50,
  radius: 15,
  speed: 3,
  dx: 0,
  dy: 0
};

// Función para crear enemigos
function createEnemy(x, y) {
  return {
    x: x,
    y: y,
    radius: 15,
    speed: 2,
    dx: (Math.random() * 2 - 1) * 2,
    dy: (Math.random() * 2 - 1) * 2
  };
}

// Generamos algunos enemigos
let enemies = [];
for (let i = 0; i < 4; i++) {
  enemies.push(createEnemy(Math.random() * canvas.width, Math.random() * canvas.height));
}

// Manejo del teclado para mover al jugador
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  switch (e.key) {
    case "ArrowUp":
    case "w":
      player.dy = -player.speed;
      break;
    case "ArrowDown":
    case "s":
      player.dy = player.speed;
      break;
    case "ArrowLeft":
    case "a":
      player.dx = -player.speed;
      break;
    case "ArrowRight":
    case "d":
      player.dx = player.speed;
      break;
  }
}

function keyUpHandler(e) {
  switch (e.key) {
    case "ArrowUp":
    case "w":
      if (player.dy < 0) player.dy = 0;
      break;
    case "ArrowDown":
    case "s":
      if (player.dy > 0) player.dy = 0;
      break;
    case "ArrowLeft":
    case "a":
      if (player.dx < 0) player.dx = 0;
      break;
    case "ArrowRight":
    case "d":
      if (player.dx > 0) player.dx = 0;
      break;
  }
}

// Manejo de eventos táctiles para móviles
canvas.addEventListener("touchstart", handleTouch, false);
canvas.addEventListener("touchmove", handleTouch, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

function handleTouch(e) {
  e.preventDefault();
  let touch = e.touches[0];
  let rect = canvas.getBoundingClientRect();
  let touchX = touch.clientX - rect.left;
  let touchY = touch.clientY - rect.top;
  // Calculamos el ángulo desde el jugador hacia el punto de toque
  let angle = Math.atan2(touchY - player.y, touchX - player.x);
  player.dx = player.speed * Math.cos(angle);
  player.dy = player.speed * Math.sin(angle);
}

function handleTouchEnd(e) {
  e.preventDefault();
  // Al levantar el dedo, detenemos al jugador
  player.dx = 0;
  player.dy = 0;
}

// Función principal de actualización y renderizado
function update() {
  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Actualizar posición del jugador
  player.x += player.dx;
  player.y += player.dy;

  // Limitar al jugador dentro del canvas
  if (player.x < player.radius) player.x = player.radius;
  if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
  if (player.y < player.radius) player.y = player.radius;
  if (player.y > canvas.height - player.radius) player.y = canvas.height - player.radius;

  // Dibujar jugador (forma simple de “pacman”)
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0.25 * Math.PI, 1.75 * Math.PI, false);
  ctx.lineTo(player.x, player.y);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();

  // Actualizar y dibujar enemigos
  enemies.forEach(enemy => {
    // Calcular distancia entre enemigo y jugador
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Si el jugador está cerca, el enemigo lo persigue
    if (distance < 150) {
      let norm = Math.sqrt(dx * dx + dy * dy);
      if (norm > 0) {
        enemy.dx = (dx / norm) * enemy.speed;
        enemy.dy = (dy / norm) * enemy.speed;
      }
    } else {
      // Si no, el enemigo se mueve al azar y cambia de dirección de vez en cuando
      if (Math.random() < 0.01) {
        enemy.dx = (Math.random() * 2 - 1) * enemy.speed;
        enemy.dy = (Math.random() * 2 - 1) * enemy.speed;
      }
    }

    enemy.x += enemy.dx;
    enemy.y += enemy.dy;

    // Rebote en los límites del canvas
    if (enemy.x < enemy.radius || enemy.x > canvas.width - enemy.radius) {
      enemy.dx = -enemy.dx;
    }
    if (enemy.y < enemy.radius || enemy.y > canvas.height - enemy.radius) {
      enemy.dy = -enemy.dy;
    }

    // Dibujar enemigo (círculo rojo)
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  });

  requestAnimationFrame(update);
}

update();