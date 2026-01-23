/**
 * Senna Racer: Multi-Lane Pro Edition (Refined Lanes)
 * Features:
 * - Redesigned Player: High-fidelity McLaren Senna side profile.
 * - Lane Logic: Two lanes with opposing traffic directions.
 * - Variety: Cars, Trucks, and Bikes with improved visuals.
 * - Physics: Wider lanes for better maneuverability.
 */

/* ================= GLOBAL VARIABLES ================= */
let gameState = 'TITLE';
let player;
let obstacles = [];
let sceneries = [];
let particles = [];
let score = 0;
let highScore = 0;
let gameSpeed = 7;
let bgOffset = 0;
let bgSong;

// Lane center-lines for precise movement
const LANE_WIDTH = 150; 
const TOP_LANE_Y = -75; // Offset from center
const BOT_LANE_Y = 75;  // Offset from center

const positiveLabels = ['HOPE', 'JOY', 'PEACE', 'LOVE', 'COURAGE', 'UNITY'];

/* ================= PRELOAD & SETUP ================= */
function preload() {
  soundFormats('mp3');
}

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
  let roadHeight = LANE_WIDTH * 2 + 60; // Total road width
  
  // Grass/Dirt
  noStroke();
  fill(34, 139, 34);
  rect(width/2, (height - roadHeight)/4, width, (height - roadHeight)/2); 
  rect(width/2, height - (height - roadHeight)/4, width, (height - roadHeight)/2); 

  // Road Surface
  fill(50);
  rect(width/2, height/2, width, roadHeight);

  // Center Lane Divider (Solid Yellow)
  stroke(255, 255, 0);
  strokeWeight(6);
  line(0, height/2, width, height/2);

  // Moving Dashed White Lines
  stroke(255, 200);
  strokeWeight(3);
  bgOffset -= gameSpeed;
  if (bgOffset < -100) bgOffset = 0;
  
  for (let x = bgOffset; x < width; x += 100) {
    // Top lane dash
    line(x + 20, height/2 + TOP_LANE_Y, x + 70, height/2 + TOP_LANE_Y);
    // Bottom lane dash
    line(x + 20, height/2 + BOT_LANE_Y, x + 70, height/2 + BOT_LANE_Y);
  }
}

/* ================= GAMEPLAY logic ================= */
function playGame() {
  player.update();
  player.display();

  // Exhaust particles
  if (frameCount % 2 === 0) particles.push(new Particle(player.x - 55, player.y + 10));
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // Balanced Spawning
  if (frameCount % 50 === 0) {
    let lane = random() > 0.5 ? 'TOP' : 'BOT';
    obstacles.push(new Obstacle(lane));
  }
  
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
      gameSpeed += 0.02;
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
  let moveForce = 0.9;
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -moveForce);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, moveForce);
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-moveForce, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(moveForce, 0);
}

/* ================= CLASSES ================= */

class Player {
  constructor() {
    this.x = 200; 
    this.y = height/2 + BOT_LANE_Y;
    this.vx = 0; this.vy = 0;
    this.w = 110; this.h = 40;
  }

  applyForce(x, y) { this.vx += x; this.vy += y; }

  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.92; this.vy *= 0.92; 
    
    // Constraint to road surface only
    this.x = constrain(this.x, 60, width - 60);
    this.y = constrain(this.y, height/2 - LANE_WIDTH + 20, height/2 + LANE_WIDTH - 20);
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();

    // Body Color (Senna Orange)
    fill(255, 69, 0);
    rect(0, 5, 100, 15, 2);
    
    beginShape();
    vertex(-55, 12);  // Front Splitter
    vertex(-50, 0);   // Hood
    vertex(-10, -12); // Windshield
    vertex(20, -12);  // Roof
    vertex(45, 5);    // Rear Deck
    vertex(50, 12);   // Rear Bumper
    endShape(CLOSE);

    // Rear Wing
    fill(20);
    rect(45, -5, 5, 15); 
    rect(48, -12, 15, 4, 2); 

    // Window
    fill(30, 200);
    quad(-5, -10, 20, -10, 25, 2, -10, 2);

    // Wheels
    fill(10);
    stroke(50);
    strokeWeight(2);
    ellipse(-35, 12, 24, 24);
    ellipse(35, 12, 24, 24);
    
    // Rims
    fill(100);
    noStroke();
    ellipse(-35, 12, 10, 10);
    ellipse(35, 12, 10, 10);
    pop();
  }
}

class Obstacle {
  constructor(lane) {
    this.lane = lane;
    this.type = random(['car', 'truck', 'bike']);
    
    if (this.lane === 'TOP') {
      this.x = width + 150;
      this.y = height/2 + (TOP_LANE_Y / 2) - 30; // Centered in top lane
      this.speedMult = 1.3; 
      this.dir = -1;
    } else {
      this.x = -150;
      this.y = height/2 + (BOT_LANE_Y / 2) + 30; // Centered in bottom lane
      this.speedMult = 0.4; 
      this.dir = 1;
    }

    this.color = color(random(80, 200), random(80, 200), random(80, 200));
    this.label = random(positiveLabels);

    if (this.type === 'truck') { this.w = 150; this.h = 65; }
    else if (this.type === 'bike') { this.w = 50; this.h = 25; }
    else { this.w = 100; this.h = 50; }
  }

  update() {
    this.x += (gameSpeed * this.speedMult) * this.dir;
    if (this.lane === 'TOP') this.x -= gameSpeed; 
  }

  display() {
    push();
    translate(this.x, this.y);
    if (this.dir === -1) scale(-1, 1); 

    noStroke();
    fill(this.color);

    if (this.type === 'truck') {
      rect(0, -5, this.w, this.h, 4); 
      fill(50); rect(this.w/2 - 20, 5, 30, 40, 2); // Cab
    } else if (this.type === 'bike') {
      rect(0, 0, this.w, this.h, 12); 
      fill(20); rect(0, -12, 12, 18); // Rider
    } else {
      rect(0, 0, this.w, this.h, 10); 
      fill(30, 150); rect(10, -10, 45, 25, 5); 
    }

    fill(0);
    ellipse(-this.w/3, this.h/2, 22, 22);
    ellipse(this.w/3, this.h/2, 22, 22);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(BOLD);
    text(this.label, 0, 0);
    pop();
  }

  hits(p) {
    // Using a refined collision box that accounts for the car's shape
    let hitW = (this.w + p.w) * 0.4;
    let hitH = (this.h + p.h) * 0.4;
    return (abs(this.x - p.x) < hitW && abs(this.y - p.y) < hitH);
  }

  offscreen() {
    return (this.dir === -1 && this.x < -250) || (this.dir === 1 && this.x > width + 250);
  }
}

class Scenery {
  constructor() {
    this.x = width + 100;
    this.side = random() > 0.5 ? 'TOP' : 'BOT';
    this.y = this.side === 'TOP' ? random(20, 80) : random(height-80, height-20);
    this.type = random(['house', 'plant']);
  }
  update() { this.x -= gameSpeed; }
  display() {
    push(); translate(this.x, this.y);
    if (this.type === 'house') {
      fill(180, 130, 90); rect(0, 0, 70, 50);
      fill(120, 40, 40); triangle(-40, -25, 40, -25, 0, -60);
    } else {
      fill(20, 100, 20); ellipse(0, 0, 40, 50);
      fill(255, 100, 200); ellipse(0, -20, 25, 25);
    }
    pop();
  }
  offscreen() { return this.x < -100; }
}

class Particle {
  constructor(x, y) { this.x = x; this.y = y; this.alpha = 255; }
  update() { this.x -= 4; this.alpha -= 12; }
  display() { noStroke(); fill(220, this.alpha); ellipse(this.x, this.y, 12); }
}

/* ================= UI & FLOW ================= */
function drawHUD() {
  fill(0, 150); rect(110, 50, 180, 60, 15);
  fill(255); textSize(22); textAlign(LEFT);
  text(`SCORE: ${floor(score)}`, 40, 58);
  textAlign(RIGHT);
  fill(255, 200, 0);
  text(`BEST: ${floor(highScore)}`, width - 40, 50);
}

function drawTitleScreen() {
  fill(0, 200); rect(width/2, height/2, width, height);
  fill(255, 69, 0); textSize(70); textAlign(CENTER); textStyle(BOLD);
  text("SENNA RACER", width/2, height/2 - 30);
  fill(255); textSize(24); textStyle(NORMAL);
  text("Dodge Opposing Traffic!", width/2, height/2 + 40);
  fill(255, 200, 0);
  text("CLICK TO START", width/2, height/2 + 100);
}

function drawGameOverScreen() {
  fill(100, 0, 0, 200); rect(width/2, height/2, width, height);
  fill(255); textSize(60); textAlign(CENTER); textStyle(BOLD);
  text("CRASHED", width/2, height/2);
  textSize(30); text(`SCORE: ${score}`, width/2, height/2 + 60);
  textSize(20); textStyle(NORMAL);
  text("Click to restart the race", width/2, height/2 + 110);
}

function mousePressed() {
  if (gameState !== 'PLAYING') {
    gameState = 'PLAYING';
    score = 0; gameSpeed = 7;
    obstacles = []; sceneries = [];
    player = new Player();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
