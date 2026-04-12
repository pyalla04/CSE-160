// asg1.js
// cse 160 - assignment 1
// pooja yalla

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

var gl;
var canvas;
var a_Position;
var u_FragColor;
var u_Size;

var g_shapesList = [];
var g_drawingMode = 'point';
var g_lastX = -1;
var g_lastY = -1;

class Point {
  constructor(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
  }

  render() {
    gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], 1.0);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('failed to get webgl context');
    return false;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return true;
}

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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('failed to get u_Size');
    return false;
  }

  return true;
}

function handleClicks() {
  canvas.onmousedown = function(ev) {
    g_lastX = -1;
    g_lastY = -1;
    addShapeFromEvent(ev);
  };
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {
      addShapeFromEvent(ev);
      fillGaps(ev);
    }
  };
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
}

function setMode(mode) {
  g_drawingMode = mode;
}

function fillGaps(ev) {
  var rect = canvas.getBoundingClientRect();
  var x = ((ev.clientX - rect.left) - canvas.width/2) / (canvas.width/2);
  var y = (canvas.height/2 - (ev.clientY - rect.top)) / (canvas.height/2);

  if (g_lastX == -1) {
    g_lastX = x;
    g_lastY = y;
    return;
  }

  var steps = 5;
  for (var i = 1; i < steps; i++) {
    var t = i / steps;
    var ix = g_lastX + t * (x - g_lastX);
    var iy = g_lastY + t * (y - g_lastY);

    var r = document.getElementById('redSlider').value / 255;
    var g = document.getElementById('greenSlider').value / 255;
    var b = document.getElementById('blueSlider').value / 255;
    var size = document.getElementById('sizeSlider').value;
    var segments = parseInt(document.getElementById('segSlider').value);

    var shape;
    if (g_drawingMode == 'point') {
      shape = new Point(ix, iy, [r, g, b], size);
    } else if (g_drawingMode == 'triangle') {
      shape = new Triangle(ix, iy, [r, g, b], size);
    } else {
      shape = new Circle(ix, iy, [r, g, b], size, segments);
    }
    g_shapesList.push(shape);
  }

  g_lastX = x;
  g_lastY = y;
  renderAllShapes();
}

function addShapeFromEvent(ev) {
  var rect = canvas.getBoundingClientRect();
  var x = ((ev.clientX - rect.left) - canvas.width/2) / (canvas.width/2);
  var y = (canvas.height/2 - (ev.clientY - rect.top)) / (canvas.height/2);

  var r = document.getElementById('redSlider').value / 255;
  var g = document.getElementById('greenSlider').value / 255;
  var b = document.getElementById('blueSlider').value / 255;
  var size = document.getElementById('sizeSlider').value;
  var segments = parseInt(document.getElementById('segSlider').value);

  if (g_drawingMode == 'point') {
    g_shapesList.push(new Point(x, y, [r, g, b], size));
  } else if (g_drawingMode === 'triangle') {
    g_shapesList.push(new Triangle(x, y, [r, g, b], size));
  } else if (g_drawingMode === 'circle') {
    g_shapesList.push(new Circle(x, y, [r, g, b], size, segments));
  }

  renderAllShapes();
}

function drawPicture() {
  var pink   = [1.0, 0.4, 0.7, 1.0];
  var blue   = [0.3, 0.6, 0.9, 1.0];
  var gold   = [0.8, 0.6, 0.1, 1.0];
  var purple = [0.5, 0.2, 0.8, 1.0];

  function tri(verts, color) {
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    drawTriangle(verts);
  }

  // candle 1 - all blue body, pink cup
  tri([-0.75-0.02, -0.1,  -0.75+0.02, -0.1,  -0.75, 0.45], blue);
  tri([-0.75-0.09, -0.1,  -0.75-0.02, -0.1,  -0.75, 0.45], blue);
  tri([-0.75+0.02, -0.1,  -0.75+0.09, -0.1,  -0.75, 0.45], blue);
  tri([-0.75-0.11, -0.1,  -0.75+0.11, -0.1,  -0.75, -0.3],  pink);
  tri([-0.75-0.05, -0.3,  -0.75+0.05, -0.3,  -0.75, -0.18], pink);
  tri([-0.75-0.02,  0.45, -0.75+0.02,  0.45, -0.75,  0.57], gold);

  // candle 2 - all pink body, blue cup with purple P
  tri([-0.42-0.13, -0.1,  -0.42+0.13, -0.1,  -0.42, 0.7],  pink);
  tri([-0.42-0.02,  0.7,  -0.42+0.02,  0.7,  -0.42, 0.82], gold);
  tri([-0.42-0.13, -0.1,  -0.42+0.13, -0.1,  -0.42, -0.25], blue);
  tri([-0.42,      -0.1,  -0.42+0.13, -0.1,  -0.42, -0.25], purple);
  tri([-0.42-0.06, -0.25, -0.42+0.06, -0.25, -0.42, -0.15], blue);
  tri([-0.42+0.02, -0.25, -0.42+0.06, -0.25, -0.42, -0.15], purple);

  // candle 3 - two separate triangles with V gap, inner halves purple
  tri([-0.18, -0.1,  -0.02, -0.1,  -0.09, 0.6], blue);
  tri([-0.06, -0.1,  -0.02, -0.1,  -0.09, 0.6], purple);
  tri([0.02,  -0.1,   0.18, -0.1,   0.09, 0.6], blue);
  tri([0.02,  -0.1,   0.06, -0.1,   0.09, 0.6], purple);
  tri([-0.11, 0.6,  -0.07, 0.6,  -0.09, 0.72], gold);
  tri([0.07,  0.6,   0.11, 0.6,   0.09, 0.72], gold);
  tri([-0.18, -0.1,  0.18, -0.1,   0.0, -0.25], pink);
  tri([-0.015,-0.1,  0.015,-0.1,   0.0, -0.25], purple);
  tri([-0.08, -0.25, 0.08, -0.25,  0.0, -0.18], pink);

  // candle 4 - all pink body, blue cup
  tri([0.42-0.09, -0.1,  0.42+0.09, -0.1,  0.42, 0.45], pink);
  tri([0.42-0.11, -0.1,  0.42+0.11, -0.1,  0.42, -0.3],  blue);
  tri([0.42-0.05, -0.3,  0.42+0.05, -0.3,  0.42, -0.18], blue);
  tri([0.42-0.02,  0.45, 0.42+0.02,  0.45, 0.42,  0.57], gold);

  // candle 5 - narrow blue body, wider pink cup
  tri([0.75-0.05, -0.1,  0.75+0.05, -0.1,  0.75, 0.7],  blue);
  tri([0.75-0.13, -0.1,  0.75+0.13, -0.1,  0.75, -0.3],  pink);
  tri([0.75-0.05, -0.3,  0.75+0.05, -0.3,  0.75, -0.18], pink);
  tri([0.75-0.02,  0.7,  0.75+0.02,  0.7,  0.75,  0.82], gold);
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;
  handleClicks();
}

window.onload = main;