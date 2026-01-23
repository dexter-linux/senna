/**
 * Senna Racer: Multi-Lane Pro Edition (Refined Clearance)
 * Features:
 * - Optimized Clearance: Expanded road height to fit large trucks comfortably.
 * - Redesigned Player: High-fidelity McLaren Senna side profile.
 * - Balanced Spawning: Prevents unavoidable truck walls.
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

// MATHEMATICAL ROAD CONSTANTS
// Increased ROAD_HEIGHT to 440 to ensure large trucks (h=70) have plenty of buffer
const ROAD_HEIGHT = 440; 
const LANE_HEIGHT = ROAD_HEIGHT / 2; 
const TOP_LANE_CENTER = -LANE_HEIGHT / 2; 
const BOT_LANE_CENTER = LANE_HEIGHT / 2;  

const positiveLabels = ['HOPE', 'JOY', 'PEACE', 'LOVE', 'COURAGE', 'UNITY'];

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
  
  // Grass/Dirt
  noStroke();
  fill(34, 139, 34);
  rect(width/2, height/2, width, height); 

  // Road Surface
  fill(50);
  rect(width/2, height/2, width, ROAD_HEIGHT);

  // Road Shoulders
  fill(30);
  rect(width/2, height/2 - ROAD_HEIGHT/2 + 5, width, 10);
  rect(width/2, height/2 + ROAD_HEIGHT/2 - 5, width, 10);

  // Center Lane Divider (Double Solid Yellow)
  stroke(255, 215, 0);
  strokeWeight(4);
  line(0, height/2 - 4, width, height/2 - 4);
  line(0, height/2 + 4, width, height/2 + 4);

  // Moving Dashed White Lines
  stroke(255, 255, 255, 180);
  strokeWeight(3);
  bgOffset -= gameSpeed;
  if (bgOffset < -100) bgOffset = 0;
  
  for (let x = bgOffset; x < width; x += 100) {
    line(x + 20, height/2 + TOP_LANE_CENTER, x + 70, height/2 + TOP_LANE_CENTER);
    line(x + 20, height/2 + BOT_LANE_CENTER, x + 70, height/2 + BOT_LANE_CENTER);
  }
}

/* ================= GAMEPLAY logic ================= */
function playGame() {
  player.update();
  player.display();

  if (frameCount % 2 === 0) particles.push(new Particle(player.x - 55, player.y + 10));
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // Increased spawn timer slightly to allow maneuvering around wider trucks
  if (frameCount % 55 === 0) {
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
      gameSpeed += 0.015;
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
  let moveForce = 1.1; // Slightly increased agility
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -moveForce);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, moveForce);
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-moveForce, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(moveForce, 0);
}

/* ================= CLASSES ================= */

class Player {
  constructor() {
    this.x = 200; 
    this.y = height/2 + BOT_LANE_CENTER;
    this.vx = 0; this.vy = 0;
    this.w = 110; this.h = 40;
  }

  applyForce(x, y) { this.vx += x; this.vy += y; }

  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.91; this.vy *= 0.91; 
    
    // Constraint: Allow a small buffer from the road edges to prevent visual clipping
    this.x = constrain(this.x, 60, width - 60);
    this.y = constrain(this.y, height/2 - ROAD_HEIGHT/2 + 25, height/2 + ROAD_HEIGHT/2 - 25);
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, 69, 0);
    rect(0, 5, 100, 15, 2);
    beginShape();
    vertex(-55, 12); vertex(-50, 0); vertex(-10, -12); vertex(20, -12); vertex(45, 5); vertex(50, 12);   
    endShape(CLOSE);
    fill(20); rect(45, -5, 5, 15); rect(48, -12, 20, 4, 2); 
    fill(30, 220); quad(-5, -10, 20, -10, 25, 2, -10, 2);
    fill(10); stroke(50); strokeWeight(2);
    ellipse(-35, 12, 24, 24); ellipse(35, 12, 24, 24);
    fill(120); noStroke(); ellipse(-35, 12, 10, 10); ellipse(35, 12, 10, 10);
    pop();
  }
}

class Obstacle {
  constructor(lane) {
    this.lane = lane;
    this.type = random(['car', 'truck', 'bike']);
    
    if (this.lane === 'TOP') {
      this.x = width + 200;
      this.y = height/2 + TOP_LANE_CENTER; 
      this.speedMult = 1.4; 
      this.dir = -1;
    } else {
      this.x = -200;
      this.y = height/2 + BOT_LANE_CENTER; 
      this.speedMult = 0.5; 
      this.dir = 1;
    }

    this.color = color(random(70, 180), random(70, 180), random(70, 255));
    this.label = random(positiveLabels);

    // Adjusted sizes: Trucks are wide but now fit in the 220px lane height
    if (this.type === 'truck') { this.w = 170; this.h = 75; }
    else if (this.type === 'bike') { this.w = 55; this.h = 25; }
    else { this.w = 110; this.h = 55; }
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
      fill(40); rect(this.w/2 - 25, 5, 35, 45, 2); 
    } else if (this.type === 'bike') {
      rect(0, 0, this.w, this.h, 15); 
      fill(20); rect(0, -15, 15, 20); 
    } else {
      rect(0, 0, this.w, this.h, 10); 
      fill(30, 180); rect(10, -10, 50, 30, 5); 
    }

    fill(0);
    ellipse(-this.w/3, this.h/2, 24, 24);
    ellipse(this.w/3, this.h/2, 24, 24);
    fill(255); textAlign(CENTER, CENTER); textSize(14); textStyle(BOLD);
    text(this.label, 0, 0);
    pop();
  }

  hits(p) {
    // Tightened collision box (0.38 mult) so the visual "gap" between lanes is respected
    let hitW = (this.w + p.w) * 0.38;
    let hitH = (this.h + p.h) * 0.38;
    return (abs(this.x - p.x) < hitW && abs(this.y - p.y) < hitH);
  }

  offscreen() {
    return (this.dir === -1 && this.x < -350) || (this.dir === 1 && this.x > width + 350);
  }
}

class Scenery {
  constructor() {
    this.x = width + 100;
    this.side = random() > 0.5 ? 'TOP' : 'BOT';
    this.y = this.side === 'TOP' ? random(20, height/2 - ROAD_HEIGHT/2 - 20) : random(height/2 + ROAD_HEIGHT/2 + 20, height-20);
    this.type = random(['house', 'plant']);
  }
  update() { this.x -= gameSpeed; }
  display() {
    push(); translate(this.x, this.y);
    if (this.type === 'house') {
      fill(180, 140, 100); rect(0, 0, 70, 55);
      fill(130, 50, 50); triangle(-40, -28, 40, -28, 0, -65);
    } else {
      fill(34, 100, 34); ellipse(0, 0, 45, 60);
      fill(255, 105, 180); ellipse(0, -25, 30, 30);
    }
    pop();
  }
  offscreen() { return this.x < -100; }
}

class Particle {
  constructor(x, y) { this.x = x; this.y = y; this.alpha = 255; }
  update() { this.x -= 4; this.alpha -= 15; }
  display() { noStroke(); fill(240, this.alpha); ellipse(this.x, this.y, 10); }
}

/* ================= UI & FLOW ================= */
function drawHUD() {
  fill(0, 150); 
  rect(width/2, 40, 300, 60, 20);
  fill(255); textSize(24); textAlign(CENTER, CENTER);
  text(`SCORE: ${floor(score)}   |   BEST: ${floor(highScore)}`, width/2, 40);
}

function drawTitleScreen() {
  fill(0, 210); rect(width/2, height/2, width, height);
  fill(255, 69, 0); textSize(80); textAlign(CENTER); textStyle(BOLD);
  text("SENNA RACER", width/2, height/2 - 40);
  fill(255); textSize(24); textStyle(NORMAL);
  text("USE ARROW KEYS", width/2, height/2 + 30);
  fill(255, 215, 0);
  text("CLICK TO RACE", width/2, height/2 + 90);
}

function drawGameOverScreen() {
  fill(120, 0, 0, 220); rect(width/2, height/2, width, height);
  fill(255); textSize(70); textAlign(CENTER); textStyle(BOLD);
  text("TOTAL CRASH", width/2, height/2 - 20);
  textSize(35); fill(255, 215, 0);
  text(`SCORE: ${score}`, width/2, height/2 + 50);
  textSize(20); fill(255); textStyle(NORMAL);
  text("CLICK TO RETRY", width/2, height/2 + 110);
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
