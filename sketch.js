/**
 * Modified Game: Senna Racer
 * Features:
 * - McLaren Senna car with subtle 'midevs' label.
 * - Dynamic environments: forests, deserts, lakeside, beaches.
 * - Scrolling road with scenery: tall lilies, hydrangeas, birds, homes.
 * - Obstacles: Other cars on the road.
 * - Tilt/Keyboard Control: Mobile accelerometer with desktop fallback.
 * - Sound: Continuous loop of song.mp3.
 * - State Flow: Title -> Instructions -> Playing -> GameOver.
 */
/* ================= GLOBAL VARIABLES ================= */
let gameState = 'TITLE';
let player;
let obstacles = [];
let sceneries = [];
let score = 0;
let highScore = 0;
let gameSpeed = 5;
let bgOffset = 0;
let bgSong;
let permissionGranted = false;
let permissionButton;
let tiltX = 0;
let tiltY = 0;
let currentBiome = 'forest';
let biomes = ['forest', 'desert', 'lakeside', 'beach'];

/* ================= PRELOAD ================= */
function preload() {
  soundFormats('mp3', 'ogg');
  bgSong = loadSound('song.mp3'); // Ensure file exists
}

/* ================= SETUP ================= */
function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  player = new Player();
  sceneries = [];
  // Mobile Sensor Permission Handling
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    permissionButton = createButton('Enable Tilt Sensors');
    permissionButton.position(width / 2 - 75, height / 2 + 100);
    permissionButton.style('padding', '10px');
    permissionButton.style('border-radius', '5px');
    permissionButton.mousePressed(requestSensorPermission);
  } else if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener('deviceorientation', handleOrientation);
    permissionGranted = true;
  } else {
    console.log('Device orientation not supported');
  }
}

/* ================= MAIN LOOP ================= */
function draw() {
  drawRoad();
  switch (gameState) {
    case 'TITLE':
      drawTitleScreen();
      break;
    case 'INSTRUCTIONS':
      drawInstructionScreen();
      break;
    case 'PLAYING':
      playGame();
      break;
    case 'GAMEOVER':
      drawGameOverScreen();
      break;
  }
}

/* ================= ENVIRONMENT ================= */
function drawRoad() {
  background(135, 206, 235); // Sky blue
  let topColor, bottomColor, roadColor = 60;
  switch (currentBiome) {
    case 'forest':
      topColor = color(34, 139, 34); // Green
      bottomColor = topColor;
      break;
    case 'desert':
      topColor = color(210, 180, 140); // Tan sand
      bottomColor = topColor;
      break;
    case 'lakeside':
      topColor = color(0, 191, 255); // Blue water
      bottomColor = color(34, 139, 34); // Green
      break;
    case 'beach':
      topColor = color(238, 221, 130); // Golden sand
      bottomColor = topColor;
      break;
  }
  // Top shoulder (distant)
  noStroke();
  fill(topColor);
  rect(width / 2, 25, width, 50);
  // Bottom shoulder (near)
  fill(bottomColor);
  rect(width / 2, height - 25, width, 50);
  // Road
  fill(roadColor);
  rect(width / 2, height / 2, width, height - 100);
  // Moving lane lines (multiple for lanes)
  stroke(255);
  strokeWeight(4);
  bgOffset -= gameSpeed;
  if (bgOffset < -100) bgOffset = 0;
  for (let l = 1; l < 3; l++) {
    let ly = (l * height) / 3;
    for (let x = bgOffset; x < width; x += 100) {
      line(x + 20, ly, x + 70, ly);
    }
  }
}

/* ================= GAME SCREENS ================= */
function drawTitleScreen() {
  fill(0, 0, 0, 150);
  rect(width / 2, height / 2, width, height);
  fill(255, 204, 0);
  textSize(50);
  text('SENNA RACER', width / 2, height / 2 - 50);
  textSize(20);
  fill(255);
  text('Safety First! Avoid the Cars.', width / 2, height / 2);
  fill(0, 255, 150);
  text('Tap to Start', width / 2, height / 2 + 60);
}

function drawInstructionScreen() {
  fill(0, 0, 0, 180);
  rect(width / 2, height / 2, width, height);
  fill(255);
  textSize(24);
  text('DRIVER INSTRUCTIONS', width / 2, height / 3);
  textSize(18);
  text(
    'Tilt your phone to steer.\nOn Laptop: Use Arrow Keys.\nDon’t hit the other cars!',
    width / 2,
    height / 2
  );
  fill(0, 255, 150);
  text('Tap to Ride', width / 2, height / 2 + 120);
}

function drawGameOverScreen() {
  fill(0, 0, 0, 200);
  rect(width / 2, height / 2, width, height);
  fill(255, 50, 50);
  textSize(48);
  text('CRASH!', width / 2, height / 2 - 60);
  fill(255);
  textSize(24);
  text(`Final Distance: ${score}m`, width / 2, height / 2);
  text(`Session Record: ${highScore}m`, width / 2, height / 2 + 40);
  fill(0, 255, 150);
  text('Tap to Restart', width / 2, height / 2 + 100);
}

/* ================= GAMEPLAY ================= */
function playGame() {
  handleInput();
  player.update();
  player.display();
  if (frameCount % 50 === 0) {
    obstacles.push(new Obstacle());
  }
  if (frameCount % 30 === 0) {
    sceneries.push(new Scenery());
  }
  if (frameCount % 1800 === 0) {
    currentBiome = random(biomes.filter(b => b !== currentBiome));
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].display();
    if (obstacles[i].hits(player)) endGame();
    if (obstacles[i].offscreen()) {
      obstacles.splice(i, 1);
      score++;
      if (score % 10 === 0) {
        gameSpeed += 0.5;
      }
    }
  }
  for (let i = sceneries.length - 1; i >= 0; i--) {
    sceneries[i].update();
    sceneries[i].display();
    if (sceneries[i].offscreen()) {
      sceneries.splice(i, 1);
    }
  }
  drawHUD();
}

/* ================= HUD & INPUT ================= */
function drawHUD() {
  fill(255, 255, 0);
  noStroke();
  textSize(22);
  textAlign(LEFT);
  text(`Distance: ${score}m`, 30, 50);
  textAlign(RIGHT);
  text(`Best: ${highScore}m`, width - 30, 50);
  textAlign(CENTER);
}

function handleInput() {
  if (permissionGranted) {
    tiltX = constrain(tiltX, -25, 25);
    tiltY = constrain(tiltY, -25, 25);
    player.applyForce(tiltX * 0.12, tiltY * 0.12);
  }
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-0.6, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(0.6, 0);
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -0.6);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, 0.6);
}

function mousePressed() {
  if (gameState === 'TITLE') {
    gameState = 'INSTRUCTIONS';
    if (!bgSong.isPlaying()) {
      bgSong.loop();
      bgSong.setVolume(0.4);
    }
  } else if (gameState === 'INSTRUCTIONS' || gameState === 'GAMEOVER') {
    resetGame();
    gameState = 'PLAYING';
  }
}

/* ================= GAME FLOW ================= */
function resetGame() {
  score = 0;
  gameSpeed = 5;
  obstacles = [];
  sceneries = [];
  currentBiome = random(biomes);
  player = new Player();
}

function endGame() {
  gameState = 'GAMEOVER';
  if (score > highScore) highScore = score;
}

/* ================= SENSOR HANDLING ================= */
async function requestSensorPermission() {
  try {
    const orientationPermission = await DeviceOrientationEvent.requestPermission();
    const motionPermission = await DeviceMotionEvent.requestPermission();
    if (orientationPermission === 'granted' && motionPermission === 'granted') {
      permissionGranted = true;
      window.addEventListener('deviceorientation', handleOrientation);
      permissionButton.remove();
    }
  } catch (error) {
    console.error(error);
  }
}

function handleOrientation(event) {
  tiltX = event.gamma || 0;
  tiltY = event.beta || 0;
}

/* ================= CLASSES ================= */
class Player {
  constructor() {
    this.x = 150;
    this.y = height / 2;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.94;
  }
  applyForce(fx, fy) {
    this.vx += fx;
    this.vy += fy;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x = constrain(this.x, 30, width - 30);
    this.y = constrain(this.y, 70, height - 70);
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(1.2);
    // Body (approximating McLaren Senna shape)
    noStroke();
    fill(255, 69, 0); // Orange
    beginShape();
    vertex(-25, 5);
    bezierVertex(-25, 5, -20, -5, -10, -5);
    bezierVertex(0, -5, 10, -5, 20, -3);
    bezierVertex(25, 0, 30, 5, 25, 5);
    bezierVertex(20, 10, 0, 10, -25, 5);
    endShape(CLOSE);
    // Wheels
    fill(0);
    stroke(100);
    strokeWeight(2);
    ellipse(-15, 10, 12, 12);
    ellipse(18, 10, 12, 12);
    // Rear wing
    noStroke();
    fill(50);
    rect(20, -3, 15, 2);
    stroke(50);
    strokeWeight(2);
    line(22, 0, 22, 5);
    line(28, 0, 28, 5);
    // Front splitter
    noStroke();
    fill(0);
    triangle(-25, 0, -20, -3, -25, -3);
    // Window
    fill(0, 0, 0, 150);
    quad(-5, -5, 5, -5, 10, 0, -2, 0);
    // Subtle label
    fill(255, 255, 255, 150);
    textSize(6);
    text('midevs', 0, 3);
    pop();
  }
}

class Obstacle {
  constructor() {
    this.w = 40;
    this.h = 20;
    this.x = width + this.w;
    this.y = random(80, height - 80);
    this.color = color(random(100, 255), random(0, 100), random(0, 100));
  }
  update() {
    this.x -= gameSpeed;
  }
  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.color);
    rect(0, 0, 40, 15);
    fill(0);
    ellipse(-15, 8, 8, 8);
    ellipse(15, 8, 8, 8);
    fill(255, 255, 255, 100);
    quad(-10, 0, 0, 0, 5, 3, -5, 3);
    pop();
  }
  hits(p) {
    return (
      p.x + 25 > this.x - 20 &&
      p.x - 25 < this.x + 20 &&
      p.y + 15 > this.y - 10 &&
      p.y - 15 < this.y + 10
    );
  }
  offscreen() {
    return this.x < -100;
  }
}

class Scenery {
  constructor() {
    this.x = width + 50;
    this.y = random(80, height - 80);
    this.type = random(['lily', 'hydrangea', 'house', 'bird']);
    this.height = random(100, 200); // For lily
    if (this.type === 'bird') this.y = random(50, 200);
    if (this.type === 'house' || this.type === 'hydrangea') this.y = random(height - 150, height - 50);
    if (this.type === 'lily') this.y = random(height - 100, height - 50);
  }
  update() {
    this.x -= gameSpeed * 0.8; // Parallax for depth
  }
  display() {
    push();
    translate(this.x, this.y);
    switch (this.type) {
      case 'lily':
        // Tall stem
        stroke(0, 200, 0);
        strokeWeight(5);
        line(0, 0, 0, -this.height);
        // Detailed flower
        noStroke();
        fill(255, 182, 193); // Pink
        for (let a = 0; a < 6; a++) {
          push();
          rotate(a * TWO_PI / 6);
          ellipse(0, -this.height - 10, 10, 30);
          pop();
        }
        // Center
        fill(255, 255, 0);
        ellipse(0, -this.height - 10, 8, 8);
        break;
      case 'hydrangea':
        // Bush
        fill(0, 128, 0);
        ellipse(0, 0, 50, 30);
        // Flowers
        fill(106, 90, 205); // Purple-blue
        for (let i = 0; i < 20; i++) {
          let bx = random(-25, 25);
          let by = random(-15, 15);
          ellipse(bx, by, 8, 8);
        }
        break;
      case 'house':
        fill(150);
        rect(0, 0, 50, 40);
        fill(100);
        triangle(-25, -20, 25, -20, 0, -50);
        fill(255);
        rect(-10, 10, 10, 10); // Window
        rect(10, 10, 10, 10); // Window
        fill(139, 69, 19);
        rect(0, 25, 15, 30); // Door
        break;
      case 'bird':
        noStroke();
        fill(0);
        triangle(0, 0, -15, -5, -15, 5);
        // Wings
        stroke(0);
        strokeWeight(2);
        line(-10, 0, -20, -10);
        line(-10, 0, -20, 10);
        break;
    }
    pop();
  }
  offscreen() {
    return this.x < -50;
  }
}

/* ================= RESPONSIVE ================= */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}