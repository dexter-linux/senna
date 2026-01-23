/**
 * Senna Racer: Multi-Lane Pro Edition
 * Features:
 * - Redesigned Player: High-fidelity McLaren Senna side profile.
 * - Lane Logic: Two lanes with opposing traffic directions.
 * - Variety: Cars, Trucks, and Bikes with improved visuals.
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

const positiveLabels = ['HOPE', 'JOY', 'PEACE', 'LOVE', 'COURAGE', 'UNITY'];

/* ================= PRELOAD & SETUP ================= */
function preload() {
  soundFormats('mp3');
  // bgSong = loadSound('song.mp3'); // Uncomment if file exists
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
  noStroke();
  
  // Grass/Dirt
  fill(34, 139, 34);
  rect(width/2, 50, width, 100); 
  rect(width/2, height-50, width, 100); 

  // Road
  fill(50);
  rect(width/2, height/2, width, height - 200);

  // Lane Divider
  stroke(255, 255, 0);
  strokeWeight(4);
  line(0, height/2, width, height/2);

  // Moving Road Lines
  stroke(255, 200);
  strokeWeight(3);
  bgOffset -= gameSpeed;
  if (bgOffset < -100) bgOffset = 0;
  for (let x = bgOffset; x < width; x += 100) {
    line(x + 20, height/2 - 80, x + 70, height/2 - 80);
    line(x + 20, height/2 + 80, x + 70, height/2 + 80);
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

  // Balanced Spawning: 2 per lane roughly
  if (frameCount % 45 === 0) {
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
  let moveForce = 0.8;
  if (keyIsDown(UP_ARROW)) player.applyForce(0, -moveForce);
  if (keyIsDown(DOWN_ARROW)) player.applyForce(0, moveForce);
  if (keyIsDown(LEFT_ARROW)) player.applyForce(-moveForce, 0);
  if (keyIsDown(RIGHT_ARROW)) player.applyForce(moveForce, 0);
}

/* ================= CLASSES ================= */

class Player {
  constructor() {
    this.x = 200; this.y = height/2 + 50;
    this.vx = 0; this.vy = 0;
    this.w = 110; this.h = 40;
  }

  applyForce(x, y) { this.vx += x; this.vy += y; }

  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.93; this.vy *= 0.93; // Friction
    this.x = constrain(this.x, 60, width - 60);
    this.y = constrain(this.y, height/2 - 150, height/2 + 150);
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();

    // Body Color (Senna Orange)
    fill(255, 69, 0);
    
    // Bottom Chassis
    rect(0, 5, 100, 15, 2);
    
    // Aerodynamic Profile (Matches Image)
    beginShape();
    vertex(-55, 12);  // Front Splitter
    vertex(-50, 0);   // Hood
    vertex(-10, -12); // Windshield Base
    vertex(20, -12);  // Roof
    vertex(45, 5);    // Rear Deck
    vertex(50, 12);   // Rear Bumper
    endShape(CLOSE);

    // The Rear Wing (High mounted)
    fill(20);
    rect(45, -5, 5, 15); // Wing Support
    rect(48, -12, 15, 4, 2); // Main Wing

    // Cockpit Window
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
    
    // Top lane moves LEFT (approaching), Bot lane moves RIGHT (with player)
    if (this.lane === 'TOP') {
      this.x = width + 150;
      this.y = height/2 - 60;
      this.speedMult = 1.2; // Incoming traffic is faster
      this.dir = -1;
    } else {
      this.x = -150;
      this.y = height/2 + 60;
      this.speedMult = 0.4; // Outgoing traffic is slower
      this.dir = 1;
    }

    this.color = color(random(100, 255), random(100, 255), random(100, 255));
    this.label = random(positiveLabels);

    // Dimensions based on type
    if (this.type === 'truck') { this.w = 140; this.h = 60; }
    else if (this.type === 'bike') { this.w = 40; this.h = 20; }
    else { this.w = 90; this.h = 45; }
  }

  update() {
    // Top lane obstacles move faster relative to ground
    this.x += (gameSpeed * this.speedMult) * this.dir;
    // Offset for top lane to simulate closing speed
    if (this.lane === 'TOP') this.x -= gameSpeed; 
  }

  display() {
    push();
    translate(this.x, this.y);
    if (this.dir === -1) scale(-1, 1); // Flip if coming from right

    noStroke();
    fill(this.color);

    if (this.type === 'truck') {
      rect(0, -10, this.w, this.h, 4); // Cargo
      fill(this.color.levels[0]-40, this.color.levels[1]-40, this.color.levels[2]-40);
      rect(50, 0, 40, 40, 2); // Cab
    } else if (this.type === 'bike') {
      rect(0, 0, this.w, this.h, 10); // Frame
      fill(20); rect(5, -10, 10, 15); // Rider
    } else {
      rect(0, 0, this.w, this.h, 8); // Car body
      fill(30, 150); rect(10, -10, 40, 20, 5); // Window
    }

    // Wheels
    fill(0);
    ellipse(-this.w/3, this.h/2, 20, 20);
    ellipse(this.w/3, this.h/2, 20, 20);

    // Label
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);
    text(this.label, 0, 0);
    pop();
  }

  hits(p) {
    return dist(this.x, this.y, p.x, p.y) < (this.w/2 + p.w/2) * 0.8;
  }

  offscreen() {
    return (this.dir === -1 && this.x < -200) || (this.dir === 1 && this.x > width + 200);
  }
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
  update() { this.x -= 3; this.alpha -= 10; }
  display() { noStroke(); fill(200, this.alpha); ellipse(this.x, this.y, 10); }
}

/* ================= UI & FLOW ================= */
function drawHUD() {
  fill(0, 100); rect(100, 40, 180, 50, 10);
  fill(255); textSize(20); textAlign(LEFT);
  text(`SCORE: ${floor(score)}`, 30, 45);
  textAlign(RIGHT);
  text(`BEST: ${floor(highScore)}`, width - 30, 45);
}

function drawTitleScreen() {
  fill(0, 180); rect(width/2, height/2, width, height);
  fill(255, 204, 0); textSize(60); textAlign(CENTER);
  text("SENNA RACER", width/2, height/2 - 20);
  fill(255); textSize(20);
  text("Use ARROW KEYS to dodge traffic", width/2, height/2 + 30);
  text("CLICK TO START", width/2, height/2 + 80);
}

function drawGameOverScreen() {
  fill(150, 0, 0, 180); rect(width/2, height/2, width, height);
  fill(255); textSize(60); textAlign(CENTER);
  text("CRASHED", width/2, height/2);
  textSize(25); text(`Final Score: ${score}`, width/2, height/2 + 50);
  textSize(20); text("Click to restart", width/2, height/2 + 90);
}

function mousePressed() {
  if (gameState !== 'PLAYING') {
    gameState = 'PLAYING';
    score = 0; gameSpeed = 7;
    obstacles = []; sceneries = [];
    player = new Player();
    if (bgSong && !bgSong.isPlaying()) {
      userStartAudio();
      bgSong.loop();
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
