/**
 * Senna Racer: Positive Vibes Edition (Audio Fixed)
 * Features:
 * - Single merged mousePressed for audio + game logic.
 * - Side profile supercar design.
 * - Positive, uplifting labels on AI cars.
 */

/* ================= GLOBAL VARIABLES ================= */
let gameState = 'TITLE';
let player;
let obstacles = [];
let sceneries = [];
let particles = [];
let score = 0;
let highScore = 0;
let gameSpeed = 6;
let bgOffset = 0;
let currentBiome = 'forest';
let bgSong;

const positiveLabels = [
  'HOPE', 'JOY', 'DREAM', 'PEACE', 'LOVE', 
  'WISDOM', 'COURAGE', 'STRENGTH', 'GRACE', 
  'HARMONY', 'FAITH', 'KINDNESS', 'UNITY', 'CREATE'
];

/* ================= PRELOAD & AUDIO ================= */
function preload() {
  soundFormats('mp3');
  bgSong = loadSound('song.mp3');
}

function startMusic() {
  if (bgSong && !bgSong.isPlaying()) {
    userStartAudio(); // Critical for browser compatibility
    bgSong.loop();
    bgSong.setVolume(0.5);
  }
}

/* ================= SETUP ================= */
function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  player = new Player();
}

/* ================= MAIN LOOP ================= */
function draw() {
  drawEnvironment();
  
  switch (gameState) {
    case 'TITLE': drawTitleScreen(); break;
    case 'PLAYING': playGame(); break;
    case 'GAMEOVER': drawGameOverScreen(); break;
  }
}

function drawEnvironment() {
  background(135, 206, 235);
  noStroke();
  let groundColor = currentBiome === 'desert' ? color(210, 180, 140) : color(34, 139, 34);
  fill(groundColor);
  rect(width/2, 50, width, 100); 
  rect(width/2, height-50, width, 100); 

  fill(50);
  rect(width/2, height/2, width, height - 200);

  stroke(255, 200);
  strokeWeight(5);
  bgOffset -= gameSpeed;
  if (bgOffset < -100) bgOffset = 0;
  for (let x = bgOffset; x < width; x += 100) {
    line(x + 20, height/2, x + 70, height/2);
  }
}

/* ================= GAMEPLAY ================= */
function playGame() {
  player.update();
  player.display();

  if (frameCount % 2 === 0) particles.push(new Particle(player.x - 50, player.y + 15));
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  if (frameCount % 60 === 0) obstacles.push(new Obstacle());
  if (frameCount % 40 === 0) sceneries.push(new Scenery());

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].display();
    if (obstacles[i].hits(player)) {
      gameState = 'GAMEOVER';
      if (score > highScore) highScore = score;
    }
    if (obstacles[i].offscreen()) {
      obstacles.splice(i, 1);
      score++;
      gameSpeed += 0.05;
    }
  }

  for (let i = sceneries.length - 1; i >= 0; i--) {
    sceneries[i].update();
    sceneries[i].display();
    if (sceneries[i].offscreen()) sceneries.splice(i, 1);
  }

  drawHUD();
  handleControls();
}

function handleControls() {
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -0.7);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, 0.7);
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-0.7, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(0.7, 0);
}

/* ================= CLASSES ================= */
class Player {
  constructor() {
    this.x = 200; this.y = height/2;
    this.vx = 0; this.vy = 0;
    this.w = 100; this.h = 50;
  }
  applyForce(x, y) { this.vx += x; this.vy += y; }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.92; this.vy *= 0.92;
    this.x = constrain(this.x, this.w/2 + 10, width-this.w/2 - 10);
    this.y = constrain(this.y, 150, height-150);
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(1.2);
    noStroke();
    fill(255, 60, 0); 
    beginShape();
    vertex(-45, 15); vertex(-40, -10); vertex(10, -10);
    vertex(25, 0); vertex(45, 0); vertex(45, 15);
    endShape(CLOSE);
    fill(20); rect(0, 20, 90, 10);
    fill(0, 0, 0, 180); quad(-15, -8, 5, -8, 15, 0, -15, 0);
    fill(10); rect(-35, -12, 10, 5); rect(-30, -8, 2, 4);
    fill(255, 150); textSize(6); textAlign(CENTER); text('midevs', 0, 8);
    fill(0); stroke(50); strokeWeight(2);
    ellipse(-25, 25, 22, 22); ellipse(25, 25, 22, 22);
    fill(100); noStroke(); ellipse(-25, 25, 10, 10); ellipse(25, 25, 10, 10);
    pop();
  }
}

class Obstacle {
  constructor() {
    this.w = 100; this.h = 50;
    this.x = width + 100;
    this.y = random() > 0.5 ? height/2 - 80 : height/2 + 80;
    this.color = color(random(50, 150), random(50, 150), 255);
    this.label = random(positiveLabels);
  }
  update() { this.x -= gameSpeed; }
  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.color); rect(0, 0, this.w, this.h, 8);
    fill(30, 180); rect(5, -5, 50, 25, 4);
    fill(255); textSize(14); textStyle(BOLD); textAlign(CENTER, CENTER);
    text(this.label, 0, 0);
    fill(0); stroke(50); strokeWeight(2);
    ellipse(-30, 25, 22, 22); ellipse(30, 25, 22, 22);
    fill(100); noStroke(); ellipse(-30, 25, 10, 10); ellipse(30, 25, 10, 10);
    pop();
  }
  hits(p) { return dist(this.x, this.y, p.x, p.y) < (this.w/2 + p.w/2) * 0.7; }
  offscreen() { return this.x < -200; }
}

class Scenery {
  constructor() {
    this.x = width + 100;
    this.side = random() > 0.5 ? 'TOP' : 'BOT';
    this.y = this.side === 'TOP' ? random(20, 70) : random(height-70, height-20);
    this.type = random(['house', 'plant']);
  }
  update() { this.x -= gameSpeed; }
  display() {
    push(); translate(this.x, this.y);
    if (this.type === 'house') {
      fill(200, 150, 100); rect(0, 0, 60, 40);
      fill(150, 50, 50); triangle(-35, -20, 35, -20, 0, -50);
    } else {
      fill(0, 100, 0); ellipse(0, 0, 30, 40);
      fill(255, 100, 200); ellipse(0, -15, 20, 20);
    }
    pop();
  }
  offscreen() { return this.x < -100; }
}

class Particle {
  constructor(x, y) { this.x = x; this.y = y; this.alpha = 255; }
  update() { this.x -= 3; this.alpha -= 12; }
  display() { noStroke(); fill(180, this.alpha); ellipse(this.x, this.y, 8); }
}

/* ================= UI & FLOW ================= */
function drawHUD() {
  fill(255); textSize(20); textAlign(LEFT);
  text(`Distance: ${floor(score)}m`, 20, 30);
  textAlign(RIGHT);
  text(`Best: ${floor(highScore)}m`, width - 20, 30);
}

function drawTitleScreen() {
  fill(0, 150); rect(width/2, height/2, width, height);
  fill(255, 204, 0); textSize(60); textAlign(CENTER);
  text("POSITIVE RACER", width/2, height/2);
  textSize(20); fill(255); text("Click to start music and race!", width/2, height/2 + 50);
}

function drawGameOverScreen() {
  fill(200, 0, 0, 150); rect(width/2, height/2, width, height);
  fill(255); textSize(60); textAlign(CENTER);
  text("CRASHED", width/2, height/2);
  textSize(20); text("Click to retry", width/2, height/2 + 50);
}

function mousePressed() {
  startMusic(); // Combined trigger
  if (gameState !== 'PLAYING') {
    gameState = 'PLAYING';
    score = 0; gameSpeed = 6;
    obstacles = []; sceneries = [];
    player = new Player();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
