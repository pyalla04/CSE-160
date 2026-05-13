// asgn3.js
// cse 160 - assignment 3
// pooja yalla

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_texColorWeight;
  void main() {
    if (u_texColorWeight == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_texColorWeight == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_texColorWeight == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_texColorWeight == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    }
  }
`;

var gl, canvas;
var a_Position, a_UV;
var u_FragColor, u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
var u_Sampler0, u_Sampler1, u_Sampler2, u_texColorWeight;
var camera;
var g_worldMap = [];
var g_lastFPSTime = performance.now();
var g_frameCount = 0;
var g_mouseDown = false;
var g_lastMouseX = -1;
var g_lastMouseY = -1;
var g_clickStartX = 0;
var g_clickStartY = 0;
var g_time = 0;

var g_storyIndex = 0;
var g_storyLines = [
  'Welcome to the world of the Blocky Cow!',
  'Use WASD to walk around and explore the open grassy fields.',
  'Look around! colorful flowers and bushes of all sizes dot the landscape.',
  'Clouds of different shapes drift across the sky above.',
  'At the center of the world stands the Great Mountain, rising block by block.',
  'A sacred water ring surrounds the mountain base. To protect the Blocky Cow, of course.',
  'At the very peak of the mountain, the Blocky Cow stands. She has been around even before the creation of this world!',
  'Left click to place a block in front of you. Right click to remove one.',
  'The world is yours to explore and even shape. Enjoy roaming around Blocky World!'
];

function nextStory() {
  g_storyIndex = (g_storyIndex + 1) % g_storyLines.length;
  document.getElementById('story').textContent = g_storyLines[g_storyIndex];
  if (g_storyIndex === g_storyLines.length - 1) {
    document.getElementById('next-btn').textContent = 'Restart ›';
  } else {
    document.getElementById('next-btn').textContent = 'Next ›';
  }
}

var g_flowers = [
  [3,  10, 1.0, 0.2, 0.2],
  [5,  18, 1.0, 0.9, 0.0],
  [8,  8,  1.0, 0.4, 0.8],
  [12, 28, 1.0, 0.2, 0.2],
  [20, 28, 1.0, 0.9, 0.0],
  [24, 10, 1.0, 0.4, 0.8],
  [28, 20, 1.0, 0.2, 0.2],
  [3,  24, 1.0, 0.9, 0.0],
  [22, 3,  1.0, 0.4, 0.8],
  [10, 22, 1.0, 0.2, 0.2],
  [28, 8,  1.0, 0.9, 0.0],
  [6,  3,  1.0, 0.4, 0.8],
];

var g_bushes = [
  [4,  4,  0.8],
  [6,  26, 2.5],
  [26, 5,  1.2],
  [25, 26, 3.0],
  [10, 4,  0.6],
  [4,  14, 2.8],
  [27, 15, 1.0],
  [14, 28, 2.2],
  [22, 10, 0.7],
  [8,  22, 3.2],
  [28, 28, 1.5],
  [2,  2,  2.8],
];

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) { console.log('failed to get webgl context'); return; }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.53, 0.81, 0.98, 1.0);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to init shaders');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
}

function initTextures() {
  var image0 = new Image();
  var image1 = new Image();
  var image2 = new Image();
  image0.onload = function() { loadTexture(image0, u_Sampler0, gl.TEXTURE0, 0); };
  image1.onload = function() { loadTexture(image1, u_Sampler1, gl.TEXTURE1, 1); };
  image2.onload = function() { loadTexture(image2, u_Sampler2, gl.TEXTURE2, 2); };
  image0.src = 'wall.png';
  image1.src = 'grass.png';
  image2.src = 'water.jpg';
}

function loadTexture(image, u_Sampler, texUnit, unitNum) {
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(texUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler, unitNum);
  renderScene();
}

function generateTerrain() {
  for (var i = 0; i < 32; i++) {
    g_worldMap.push([]);
    for (var j = 0; j < 32; j++) {
      g_worldMap[i].push(0);
    }
  }

  for (var x = 0; x < 32; x++) {
    for (var z = 0; z < 32; z++) {
      var dx = x - 16;
      var dz = z - 16;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < 3)       g_worldMap[x][z] = 8;
      else if (dist < 5)  g_worldMap[x][z] = 6;
      else if (dist < 7)  g_worldMap[x][z] = 4;
      else if (dist < 9)  g_worldMap[x][z] = 2;
      else if (dist < 10) g_worldMap[x][z] = 1;
    }
  }
}

function getBlockInFront() {
  var e = camera.eye.elements;
  var a = camera.at.elements;
  var fx = a[0] - e[0];
  var fz = a[2] - e[2];
  var len = Math.sqrt(fx*fx + fz*fz);
  fx = fx/len;
  fz = fz/len;
  var bx = Math.floor(e[0] + fx * 2);
  var bz = Math.floor(e[2] + fz * 2);
  bx = Math.max(0, Math.min(31, bx));
  bz = Math.max(0, Math.min(31, bz));
  return [bx, bz];
}

function drawBush(x, z, scale) {
  var b1 = new Cube();
  b1.textureNum = -1;
  b1.topTextureNum = -1;
  b1.color = [0.1, 0.5, 0.1, 1.0];
  b1.matrix.setTranslate(x, -0.65, z);
  b1.matrix.scale(scale, 0.4, scale);
  b1.render();

  var b2 = new Cube();
  b2.textureNum = -1;
  b2.topTextureNum = -1;
  b2.color = [0.12, 0.55, 0.12, 1.0];
  b2.matrix.setTranslate(x, -0.25, z);
  b2.matrix.scale(scale * 0.75, 0.4, scale * 0.75);
  b2.render();

  var b3 = new Cube();
  b3.textureNum = -1;
  b3.topTextureNum = -1;
  b3.color = [0.15, 0.6, 0.15, 1.0];
  b3.matrix.setTranslate(x, 0.15, z);
  b3.matrix.scale(scale * 0.45, 0.4, scale * 0.45);
  b3.render();
}

function drawCloud(x, y, z, parts) {
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    var c = new Cube();
    c.textureNum = -1;
    c.topTextureNum = -1;
    c.color = [1.0, 1.0, 1.0, 1.0];
    c.matrix.setTranslate(x + p[0], y + p[1], z + p[2]);
    c.matrix.scale(p[3], p[4], p[5]);
    c.render();
  }
}

function drawCowPart(parentMatrix, localMatrix, color) {
  var c = new Cube();
  c.textureNum = -1;
  c.topTextureNum = -1;
  c.color = color;
  c.matrix = new Matrix4(parentMatrix).multiply(localMatrix);
  c.render();
}

function drawCow(parentM) {
  var t = g_time;
  var flUpper =  30 * Math.sin(t * 2);
  var flLower =  20 * Math.sin(t * 2 + Math.PI);
  var frUpper = -30 * Math.sin(t * 2);
  var frLower = -20 * Math.sin(t * 2 + Math.PI);
  var blUpper = -30 * Math.sin(t * 2);
  var blLower = -20 * Math.sin(t * 2 + Math.PI);
  var brUpper =  30 * Math.sin(t * 2);
  var brLower =  20 * Math.sin(t * 2 + Math.PI);

  var WHITE = [1.0, 1.0, 1.0, 1.0];
  var BLACK = [0.1, 0.1, 0.1, 1.0];
  var PINK  = [1.0, 0.75, 0.80, 1.0];
  var TAN   = [0.82, 0.70, 0.45, 1.0];

  var M = new Matrix4().setScale(0.50, 0.30, 0.80);
  drawCowPart(parentM, M, WHITE);
  M = new Matrix4().setTranslate(-0.26, 0.02, 0.10).scale(0.02, 0.22, 0.40);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.26, 0.05, -0.15).scale(0.02, 0.15, 0.25);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.05, 0.16, -0.10).scale(0.18, 0.02, 0.15);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.0, 0.16, 0.28).scale(0.20, 0.02, 0.18);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.0, 0.12, 0.55).scale(0.30, 0.13, 0.30);
  drawCowPart(parentM, M, WHITE);
  M = new Matrix4().setTranslate(0.0, 0.23, 0.55).scale(0.30, 0.13, 0.30);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.0, 0.10, 0.70).scale(0.18, 0.08, 0.08);
  drawCowPart(parentM, M, PINK);
  M = new Matrix4().setTranslate(-0.08, 0.20, 0.71).scale(0.07, 0.07, 0.04);
  drawCowPart(parentM, M, WHITE);
  M = new Matrix4().setTranslate(-0.08, 0.20, 0.73).scale(0.04, 0.04, 0.03);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.08, 0.20, 0.71).scale(0.07, 0.07, 0.04);
  drawCowPart(parentM, M, WHITE);
  M = new Matrix4().setTranslate(0.08, 0.20, 0.73).scale(0.04, 0.04, 0.03);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(-0.18, 0.33, 0.57).scale(0.07, 0.12, 0.07);
  drawCowPart(parentM, M, PINK);
  M = new Matrix4().setTranslate(0.18, 0.33, 0.57).scale(0.07, 0.12, 0.07);
  drawCowPart(parentM, M, PINK);
  M = new Matrix4().setTranslate(-0.08, 0.38, 0.55).scale(0.04, 0.12, 0.04);
  drawCowPart(parentM, M, TAN);
  M = new Matrix4().setTranslate(0.08, 0.38, 0.55).scale(0.04, 0.12, 0.04);
  drawCowPart(parentM, M, TAN);
  M = new Matrix4().setTranslate(0.0, 0.20, -0.44).scale(0.05, 0.22, 0.05);
  drawCowPart(parentM, M, BLACK);
  M = new Matrix4().setTranslate(0.0, 0.32, -0.44).scale(0.09, 0.09, 0.09);
  drawCowPart(parentM, M, WHITE);

  var flUpperM = new Matrix4().setTranslate(-0.18, -0.13, 0.28)
    .rotate(flUpper, 1, 0, 0).translate(0, -0.125, 0).scale(0.12, 0.25, 0.12);
  drawCowPart(parentM, flUpperM, WHITE);
  var flLowerM = new Matrix4().setTranslate(-0.18, -0.13, 0.28)
    .rotate(flUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(flLower, 1, 0, 0).translate(0, -0.10, 0).scale(0.10, 0.20, 0.10);
  drawCowPart(parentM, flLowerM, WHITE);
  var flHoofM = new Matrix4().setTranslate(-0.18, -0.13, 0.28)
    .rotate(flUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(flLower, 1, 0, 0).translate(0, -0.26, 0).scale(0.12, 0.10, 0.12);
  drawCowPart(parentM, flHoofM, BLACK);

  var frUpperM = new Matrix4().setTranslate(0.18, -0.13, 0.28)
    .rotate(frUpper, 1, 0, 0).translate(0, -0.125, 0).scale(0.12, 0.25, 0.12);
  drawCowPart(parentM, frUpperM, WHITE);
  var frLowerM = new Matrix4().setTranslate(0.18, -0.13, 0.28)
    .rotate(frUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(frLower, 1, 0, 0).translate(0, -0.10, 0).scale(0.10, 0.20, 0.10);
  drawCowPart(parentM, frLowerM, WHITE);
  var frHoofM = new Matrix4().setTranslate(0.18, -0.13, 0.28)
    .rotate(frUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(frLower, 1, 0, 0).translate(0, -0.26, 0).scale(0.12, 0.10, 0.12);
  drawCowPart(parentM, frHoofM, BLACK);

  var blUpperM = new Matrix4().setTranslate(-0.18, -0.13, -0.28)
    .rotate(blUpper, 1, 0, 0).translate(0, -0.125, 0).scale(0.12, 0.25, 0.12);
  drawCowPart(parentM, blUpperM, WHITE);
  var blLowerM = new Matrix4().setTranslate(-0.18, -0.13, -0.28)
    .rotate(blUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(blLower, 1, 0, 0).translate(0, -0.10, 0).scale(0.10, 0.20, 0.10);
  drawCowPart(parentM, blLowerM, WHITE);
  var blHoofM = new Matrix4().setTranslate(-0.18, -0.13, -0.28)
    .rotate(blUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(blLower, 1, 0, 0).translate(0, -0.26, 0).scale(0.12, 0.10, 0.12);
  drawCowPart(parentM, blHoofM, BLACK);

  var brUpperM = new Matrix4().setTranslate(0.18, -0.13, -0.28)
    .rotate(brUpper, 1, 0, 0).translate(0, -0.125, 0).scale(0.12, 0.25, 0.12);
  drawCowPart(parentM, brUpperM, WHITE);
  var brLowerM = new Matrix4().setTranslate(0.18, -0.13, -0.28)
    .rotate(brUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(brLower, 1, 0, 0).translate(0, -0.10, 0).scale(0.10, 0.20, 0.10);
  drawCowPart(parentM, brLowerM, WHITE);
  var brHoofM = new Matrix4().setTranslate(0.18, -0.13, -0.28)
    .rotate(brUpper, 1, 0, 0).translate(0, -0.25, 0)
    .rotate(brLower, 1, 0, 0).translate(0, -0.26, 0).scale(0.12, 0.10, 0.12);
  drawCowPart(parentM, brHoofM, BLACK);
}

function drawFlower(x, z, r, g, b) {
  var stem = new Cube();
  stem.textureNum = -1;
  stem.topTextureNum = -1;
  stem.color = [0.1, 0.7, 0.1, 1.0];
  stem.matrix.setTranslate(x, -0.6, z);
  stem.matrix.scale(0.1, 0.4, 0.1);
  stem.render();

  var petal = new Cube();
  petal.textureNum = -1;
  petal.topTextureNum = -1;
  petal.color = [r, g, b, 1.0];
  petal.matrix.setTranslate(x, -0.3, z);
  petal.matrix.scale(0.3, 0.15, 0.3);
  petal.render();
}

function keydown(ev) {
  var speed = 0.2;
  if (ev.keyCode == 87) {
    camera.moveForward(speed);
    camera.eye.elements[1] = 0.5;
    camera.at.elements[1] = 0.5;
    camera.updateView();
  }
  if (ev.keyCode == 83) {
    camera.moveBackwards(speed);
    camera.eye.elements[1] = 0.5;
    camera.at.elements[1] = 0.5;
    camera.updateView();
  }
  if (ev.keyCode == 65) camera.moveLeft(speed);
  if (ev.keyCode == 68) camera.moveRight(speed);
  if (ev.keyCode == 81) camera.panLeft(5);
  if (ev.keyCode == 69) camera.panRight(5);
}

function mousemove(ev) {
  if (!g_mouseDown) return;
  var dx = ev.clientX - g_lastMouseX;
  var dy = ev.clientY - g_lastMouseY;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
  if (dx != 0) camera.panLeft(-dx * 0.2);
  if (dy != 0) camera.panUp(dy * 0.2);
}

function tick() {
  g_time = performance.now() / 1000.0;
  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  g_frameCount++;
  var now = performance.now();
  if (now - g_lastFPSTime >= 1000) {
    document.getElementById('fps').textContent = 'FPS: ' + g_frameCount;
    g_frameCount = 0;
    g_lastFPSTime = now;
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  // sky
  var sky = new Cube();
  sky.textureNum = -1;
  sky.topTextureNum = -1;
  sky.color = [0.53, 0.81, 0.98, 1.0];
  sky.matrix.setScale(1000, 1000, 1000);
  sky.render();

  // clouds
  drawCloud(5,  18, 5,  [[0,0,0, 6,2,3], [3,0.5,0, 4,3,2], [-2,0.5,1, 3,2,2]]);
  drawCloud(20, 20, 8,  [[0,0,0, 8,2,4], [-3,1,0, 4,3,3], [4,0.5,1, 3,2,2]]);
  drawCloud(10, 22, 20, [[0,0,0, 5,2,3], [2,1,0, 3,3,2], [-2,0.5,0, 4,2,3]]);
  drawCloud(25, 19, 25, [[0,0,0, 7,2,3], [3,1,1, 3,3,2], [-3,0.5,0, 4,2,2]]);
  drawCloud(3,  21, 15, [[0,0,0, 5,2,4], [2,1,0, 4,3,2], [-2,0.5,1, 3,2,2]]);
  drawCloud(18, 20, 3,  [[0,0,0, 9,2,3], [-4,1,0, 4,3,2], [4,0.5,0, 5,2,3]]);
  drawCloud(28, 18, 12, [[0,0,0, 5,2,3], [2,1,0, 3,3,2], [-2,0.5,1, 4,2,2]]);
  drawCloud(12, 23, 28, [[0,0,0, 7,2,4], [3,1,0, 4,3,2], [-3,0.5,1, 3,2,3]]);

  // ground
  var ground = new Cube();
  ground.textureNum = 1;
  ground.topTextureNum = 1;
  ground.matrix.setTranslate(16, -1, 16);
  ground.matrix.scale(32, 0.1, 32);
  ground.render();

  // terrain blocks
  for (var x = 0; x < 32; x++) {
    for (var z = 0; z < 32; z++) {
      var height = g_worldMap[x][z];
      if (height > 0) {
        for (var y = 0; y < height; y++) {
          var wall = new Cube();
          wall.textureNum = 0;
          wall.topTextureNum = 1;
          wall.matrix.setTranslate(x, y - 0.5, z);
          wall.render();
        }
      }
    }
  }

  // ring of water around base of mountain
  for (var x = 0; x < 32; x++) {
    for (var z = 0; z < 32; z++) {
      var dx = x - 16;
      var dz = z - 16;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist >= 10 && dist < 12) {
        var water = new Cube();
        water.textureNum = 2;
        water.topTextureNum = 2;
        water.matrix.setTranslate(x, -0.94, z);
        water.matrix.scale(1, 0.12, 1);
        water.render();
      }
    }
  }

  // bushes
  for (var i = 0; i < g_bushes.length; i++) {
    var b = g_bushes[i];
    drawBush(b[0], b[1], b[2]);
  }

  // flowers
  for (var i = 0; i < g_flowers.length; i++) {
    var f = g_flowers[i];
    drawFlower(f[0], f[1], f[2], f[3], f[4]);
  }

  // cow on top of mountain
  var cowM = new Matrix4()
    .setTranslate(16, 8.5, 16)
    .scale(2, 2, 2);
  drawCow(cowM);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initTextures();
  generateTerrain();

  camera = new Camera();
  document.onkeydown = keydown;
  canvas.onmousemove = mousemove;

  canvas.onmousedown = function(ev) {
    if (ev.button === 2) {
      var b = getBlockInFront();
      g_worldMap[b[0]][b[1]] = Math.max(g_worldMap[b[0]][b[1]] - 1, 0);
      return;
    }
    if (ev.button === 0) {
      g_mouseDown = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
      g_clickStartX = ev.clientX;
      g_clickStartY = ev.clientY;
    }
  };

  canvas.onmouseup = function(ev) {
    if (ev.button === 0) {
      var dx = Math.abs(ev.clientX - g_clickStartX);
      var dy = Math.abs(ev.clientY - g_clickStartY);
      if (dx < 3 && dy < 3) {
        var b = getBlockInFront();
        g_worldMap[b[0]][b[1]] = Math.min(g_worldMap[b[0]][b[1]] + 1, 8);
      }
      g_mouseDown = false;
    }
  };

  canvas.addEventListener('contextmenu', function(ev) {
    ev.preventDefault();
  });

  tick();
}