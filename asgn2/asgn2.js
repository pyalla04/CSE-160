// asgn2.js
// cse 160 - assignment 2
// pooja yalla

// vertex shader - applies global rotation and model matrix to each vertex
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotation;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;\n' +
  '}\n';

// fragment shader - sets color from uniform
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// webgl globals
var gl;
var canvas;
var a_Position;
var u_FragColor;
var u_ModelMatrix;
var u_GlobalRotation;

// joint angle globals for all legs
var gAnimalGlobalRotation = 0;
var gFrontLeftUpperAngle = 0;
var gFrontLeftLowerAngle = 0;
var gFrontLeftHoofAngle = 0;
var gFrontRightUpperAngle = 0;
var gFrontRightLowerAngle = 0;
var gBackLeftUpperAngle = 0;
var gBackLeftLowerAngle = 0;
var gBackRightUpperAngle = 0;
var gBackRightLowerAngle = 0;

// animation globals
var g_time = 0;
var g_animating = false;
var g_poking = false;

// fps globals
var g_lastFPSTime = 0;
var g_frameCount = 0;

// mouse rotation globals
var g_mouseDown = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;
var g_rotX = 0;
var g_rotY = 0;

// initialize webgl context and enable depth testing
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('failed to get webgl context');
    return false;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.53, 0.81, 0.98, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  return true;
}

// compile shaders and connect js variables to glsl uniforms and attributes
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to initialize shaders');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('failed to get a_Position');
    return false;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('failed to get u_FragColor');
    return false;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('failed to get u_ModelMatrix');
    return false;
  }

  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) {
    console.log('failed to get u_GlobalRotation');
    return false;
  }

  return true;
}

// update all joint angles based on current time for walking animation
function updateAnimationAngles() {
  gFrontLeftUpperAngle  =  30 * Math.sin(g_time * 2);
  gFrontLeftLowerAngle  =  20 * Math.sin(g_time * 2 + Math.PI);
  gFrontLeftHoofAngle   =  15 * Math.sin(g_time * 2);
  gFrontRightUpperAngle = -30 * Math.sin(g_time * 2);
  gFrontRightLowerAngle = -20 * Math.sin(g_time * 2 + Math.PI);
  gBackLeftUpperAngle   = -30 * Math.sin(g_time * 2);
  gBackLeftLowerAngle   = -20 * Math.sin(g_time * 2 + Math.PI);
  gBackRightUpperAngle  =  30 * Math.sin(g_time * 2);
  gBackRightLowerAngle  =  20 * Math.sin(g_time * 2 + Math.PI);
}

// poke animation - triggered by shift+click, makes all legs kick out like jumping
function doPoke() {
  var pokeTime = performance.now() / 1000.0;
  g_poking = true;
  var pokeInterval = setInterval(function() {
    var elapsed = (performance.now() / 1000.0) - pokeTime;
    if (elapsed > 2.0) {
      // reset all angles when poke animation ends
      clearInterval(pokeInterval);
      g_poking = false;
      gFrontLeftUpperAngle  = 0;
      gFrontLeftLowerAngle  = 0;
      gFrontRightUpperAngle = 0;
      gFrontRightLowerAngle = 0;
      gBackLeftUpperAngle   = 0;
      gBackLeftLowerAngle   = 0;
      gBackRightUpperAngle  = 0;
      gBackRightLowerAngle  = 0;
      return;
    }
    // all 4 legs kick out simultaneously
    var kick = 45 * Math.abs(Math.sin(elapsed * 8));
    gFrontLeftUpperAngle  = -kick;
    gFrontLeftLowerAngle  =  kick;
    gFrontRightUpperAngle = -kick;
    gFrontRightLowerAngle =  kick;
    gBackLeftUpperAngle   =  kick;
    gBackLeftLowerAngle   = -kick;
    gBackRightUpperAngle  =  kick;
    gBackRightLowerAngle  = -kick;
  }, 16);
}

// animation loop - updates time, fps counter, and redraws scene every frame
function tick() {
  g_time = performance.now() / 1000.0;

  // only update animation angles if animating and not poking
  if (g_animating && !g_poking) {
    updateAnimationAngles();
  }

  // calculate and display fps every second
  g_frameCount++;
  var now = performance.now();
  if (now - g_lastFPSTime >= 1000) {
    document.getElementById('fps').textContent = 'FPS: ' + g_frameCount;
    g_frameCount = 0;
    g_lastFPSTime = now;
  }

  renderScene();
  requestAnimationFrame(tick);
}

// draws the entire cow scene - all drawing happens here
function renderScene() {
  // apply global rotation from slider and mouse drag
  var globalRotMat = new Matrix4()
    .setRotate(g_rotX, 1, 0, 0)
    .rotate(g_rotY + gAnimalGlobalRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // color palette
  var WHITE = [1.0, 1.0, 1.0, 1.0];
  var BLACK = [0.1, 0.1, 0.1, 1.0];
  var PINK  = [1.0, 0.75, 0.80, 1.0];
  var TAN   = [0.82, 0.70, 0.45, 1.0];

  // body - main white base
  var M = new Matrix4();
  M.setScale(0.50, 0.30, 0.80);
  drawCube(M, WHITE);

  // body black patch 1 - large on left side
  M = new Matrix4();
  M.setTranslate(-0.26, 0.02, 0.10);
  M.scale(0.02, 0.22, 0.40);
  drawCube(M, BLACK);

  // body black patch 2 - medium on right back
  M = new Matrix4();
  M.setTranslate(0.26, 0.05, -0.15);
  M.scale(0.02, 0.15, 0.25);
  drawCube(M, BLACK);

  // body black patch 3 - small on right front
  M = new Matrix4();
  M.setTranslate(0.26, -0.02, 0.20);
  M.scale(0.02, 0.10, 0.12);
  drawCube(M, BLACK);

  // body black patch 4 - tiny on top
  M = new Matrix4();
  M.setTranslate(0.05, 0.16, -0.10);
  M.scale(0.18, 0.02, 0.15);
  drawCube(M, BLACK);

  // body black patch 5 - medium on front top
  M = new Matrix4();
  M.setTranslate(0.0, 0.16, 0.28);
  M.scale(0.20, 0.02, 0.18);
  drawCube(M, BLACK);

  // body black patch 6 - small on left back
  M = new Matrix4();
  M.setTranslate(-0.26, -0.05, -0.25);
  M.scale(0.02, 0.12, 0.15);
  drawCube(M, BLACK);

  // head - white lower half
  M = new Matrix4();
  M.setTranslate(0.0, 0.12, 0.55);
  M.scale(0.30, 0.13, 0.30);
  drawCube(M, WHITE);

  // head - black upper half
  M = new Matrix4();
  M.setTranslate(0.0, 0.23, 0.55);
  M.scale(0.30, 0.13, 0.30);
  drawCube(M, BLACK);

  // snout - pink cylinder (non-cube primitive)
  var snoutM = new Matrix4();
  snoutM.setTranslate(0.0, 0.10, 0.68);
  snoutM.rotate(90, 1, 0, 0);
  snoutM.scale(0.18, 0.08, 0.18);
  drawCylinder(snoutM, PINK);

  // left eye - white base with black pupil
  M = new Matrix4();
  M.setTranslate(-0.08, 0.20, 0.71);
  M.scale(0.07, 0.07, 0.04);
  drawCube(M, WHITE);

  M = new Matrix4();
  M.setTranslate(-0.08, 0.20, 0.73);
  M.scale(0.04, 0.04, 0.03);
  drawCube(M, BLACK);

  // right eye - white base with black pupil
  M = new Matrix4();
  M.setTranslate(0.08, 0.20, 0.71);
  M.scale(0.07, 0.07, 0.04);
  drawCube(M, WHITE);

  M = new Matrix4();
  M.setTranslate(0.08, 0.20, 0.73);
  M.scale(0.04, 0.04, 0.03);
  drawCube(M, BLACK);

  // ears - pink cubes on sides of head
  M = new Matrix4();
  M.setTranslate(-0.18, 0.33, 0.57);
  M.scale(0.07, 0.12, 0.07);
  drawCube(M, PINK);

  M = new Matrix4();
  M.setTranslate(0.18, 0.33, 0.57);
  M.scale(0.07, 0.12, 0.07);
  drawCube(M, PINK);

  // horns - tan cylinders on top of head (non-cube primitive)
  var lhornM = new Matrix4();
  lhornM.setTranslate(-0.08, 0.32, 0.55);
  lhornM.rotate(20, 0, 0, 1);
  lhornM.scale(0.04, 0.12, 0.04);
  drawCylinder(lhornM, TAN);

  var rhornM = new Matrix4();
  rhornM.setTranslate(0.08, 0.32, 0.55);
  rhornM.rotate(-20, 0, 0, 1);
  rhornM.scale(0.04, 0.12, 0.04);
  drawCylinder(rhornM, TAN);

  // tail - black stick with white tuft
  M = new Matrix4();
  M.setTranslate(0.0, 0.20, -0.44);
  M.scale(0.05, 0.22, 0.05);
  drawCube(M, BLACK);

  M = new Matrix4();
  M.setTranslate(0.0, 0.32, -0.44);
  M.scale(0.09, 0.09, 0.09);
  drawCube(M, WHITE);

  // front left leg - upper, lower, hoof (3-level joint chain)
  var flUpperM = new Matrix4();
  flUpperM.setTranslate(-0.18, -0.13, 0.28);
  flUpperM.rotate(gFrontLeftUpperAngle, 1, 0, 0);
  flUpperM.translate(0, -0.125, 0);
  flUpperM.scale(0.12, 0.25, 0.12);
  drawCube(flUpperM, WHITE);

  var flLowerM = new Matrix4();
  flLowerM.setTranslate(-0.18, -0.13, 0.28);
  flLowerM.rotate(gFrontLeftUpperAngle, 1, 0, 0);
  flLowerM.translate(0, -0.25, 0);
  flLowerM.rotate(gFrontLeftLowerAngle, 1, 0, 0);
  flLowerM.translate(0, -0.10, 0);
  flLowerM.scale(0.10, 0.20, 0.10);
  drawCube(flLowerM, WHITE);

  var flHoofM = new Matrix4();
  flHoofM.setTranslate(-0.18, -0.13, 0.28);
  flHoofM.rotate(gFrontLeftUpperAngle, 1, 0, 0);
  flHoofM.translate(0, -0.25, 0);
  flHoofM.rotate(gFrontLeftLowerAngle, 1, 0, 0);
  flHoofM.translate(0, -0.20, 0);
  flHoofM.rotate(gFrontLeftHoofAngle, 1, 0, 0);
  flHoofM.translate(0, -0.06, 0);
  flHoofM.scale(0.12, 0.10, 0.12);
  drawCube(flHoofM, BLACK);

  // front right leg - upper, lower, hoof
  var frUpperM = new Matrix4();
  frUpperM.setTranslate(0.18, -0.13, 0.28);
  frUpperM.rotate(gFrontRightUpperAngle, 1, 0, 0);
  frUpperM.translate(0, -0.125, 0);
  frUpperM.scale(0.12, 0.25, 0.12);
  drawCube(frUpperM, WHITE);

  var frLowerM = new Matrix4();
  frLowerM.setTranslate(0.18, -0.13, 0.28);
  frLowerM.rotate(gFrontRightUpperAngle, 1, 0, 0);
  frLowerM.translate(0, -0.25, 0);
  frLowerM.rotate(gFrontRightLowerAngle, 1, 0, 0);
  frLowerM.translate(0, -0.10, 0);
  frLowerM.scale(0.10, 0.20, 0.10);
  drawCube(frLowerM, WHITE);

  var frHoofM = new Matrix4();
  frHoofM.setTranslate(0.18, -0.13, 0.28);
  frHoofM.rotate(gFrontRightUpperAngle, 1, 0, 0);
  frHoofM.translate(0, -0.25, 0);
  frHoofM.rotate(gFrontRightLowerAngle, 1, 0, 0);
  frHoofM.translate(0, -0.20, 0);
  frHoofM.translate(0, -0.06, 0);
  frHoofM.scale(0.12, 0.10, 0.12);
  drawCube(frHoofM, BLACK);

  // back left leg - upper, lower, hoof
  var blUpperM = new Matrix4();
  blUpperM.setTranslate(-0.18, -0.13, -0.28);
  blUpperM.rotate(gBackLeftUpperAngle, 1, 0, 0);
  blUpperM.translate(0, -0.125, 0);
  blUpperM.scale(0.12, 0.25, 0.12);
  drawCube(blUpperM, WHITE);

  var blLowerM = new Matrix4();
  blLowerM.setTranslate(-0.18, -0.13, -0.28);
  blLowerM.rotate(gBackLeftUpperAngle, 1, 0, 0);
  blLowerM.translate(0, -0.25, 0);
  blLowerM.rotate(gBackLeftLowerAngle, 1, 0, 0);
  blLowerM.translate(0, -0.10, 0);
  blLowerM.scale(0.10, 0.20, 0.10);
  drawCube(blLowerM, WHITE);

  var blHoofM = new Matrix4();
  blHoofM.setTranslate(-0.18, -0.13, -0.28);
  blHoofM.rotate(gBackLeftUpperAngle, 1, 0, 0);
  blHoofM.translate(0, -0.25, 0);
  blHoofM.rotate(gBackLeftLowerAngle, 1, 0, 0);
  blHoofM.translate(0, -0.20, 0);
  blHoofM.translate(0, -0.06, 0);
  blHoofM.scale(0.12, 0.10, 0.12);
  drawCube(blHoofM, BLACK);

  // back right leg - upper, lower, hoof
  var brUpperM = new Matrix4();
  brUpperM.setTranslate(0.18, -0.13, -0.28);
  brUpperM.rotate(gBackRightUpperAngle, 1, 0, 0);
  brUpperM.translate(0, -0.125, 0);
  brUpperM.scale(0.12, 0.25, 0.12);
  drawCube(brUpperM, WHITE);

  var brLowerM = new Matrix4();
  brLowerM.setTranslate(0.18, -0.13, -0.28);
  brLowerM.rotate(gBackRightUpperAngle, 1, 0, 0);
  brLowerM.translate(0, -0.25, 0);
  brLowerM.rotate(gBackRightLowerAngle, 1, 0, 0);
  brLowerM.translate(0, -0.10, 0);
  brLowerM.scale(0.10, 0.20, 0.10);
  drawCube(brLowerM, WHITE);

  var brHoofM = new Matrix4();
  brHoofM.setTranslate(0.18, -0.13, -0.28);
  brHoofM.rotate(gBackRightUpperAngle, 1, 0, 0);
  brHoofM.translate(0, -0.25, 0);
  brHoofM.rotate(gBackRightLowerAngle, 1, 0, 0);
  brHoofM.translate(0, -0.20, 0);
  brHoofM.translate(0, -0.06, 0);
  brHoofM.scale(0.12, 0.10, 0.12);
  drawCube(brHoofM, BLACK);
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;

  // mouse down - start rotation or trigger poke on shift+click
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) { doPoke(); return; }
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  // mouse move - update rotation angles while dragging
  canvas.onmousemove = function(ev) {
    if (!g_mouseDown) return;
    var dx = ev.clientX - g_lastMouseX;
    var dy = ev.clientY - g_lastMouseY;
    g_rotY += dx * 0.5;
    g_rotX += dy * 0.5;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  canvas.onmouseup = function() { g_mouseDown = false; };

  // slider event listeners - update angle and redraw
  document.getElementById('globalRotSlider').addEventListener('input', function() {
    gAnimalGlobalRotation = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('frontLeftUpperSlider').addEventListener('input', function() {
    gFrontLeftUpperAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('frontLeftLowerSlider').addEventListener('input', function() {
    gFrontLeftLowerAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('frontLeftHoofSlider').addEventListener('input', function() {
    gFrontLeftHoofAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('frontRightUpperSlider').addEventListener('input', function() {
    gFrontRightUpperAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('frontRightLowerSlider').addEventListener('input', function() {
    gFrontRightLowerAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('backLeftUpperSlider').addEventListener('input', function() {
    gBackLeftUpperAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('backLeftLowerSlider').addEventListener('input', function() {
    gBackLeftLowerAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('backRightUpperSlider').addEventListener('input', function() {
    gBackRightUpperAngle = parseFloat(this.value);
    renderScene();
  });

  document.getElementById('backRightLowerSlider').addEventListener('input', function() {
    gBackRightLowerAngle = parseFloat(this.value);
    renderScene();
  });

  // toggle animation on/off
  document.getElementById('animBtn').addEventListener('click', function() {
    g_animating = !g_animating;
    this.textContent = g_animating ? 'Stop Animation' : 'Start Animation';
  });

  tick();
}