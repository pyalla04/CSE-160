// asgn4.js
// cse 160 - assignment 4
// pooja yalla

// vertex shader - passes normals and world position to fragment shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotation;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '}\n';

// fragment shader - full phong lighting: ambient + diffuse + specular
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'uniform vec3 u_LightPos;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform bool u_LightOn;\n' +
  'uniform bool u_ShowNormals;\n' +
  'uniform vec3 u_SpotLightPos;\n' +
  'uniform vec3 u_SpotLightDir;\n' +
  'uniform bool u_SpotLightOn;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  if (u_ShowNormals) {\n' +
  '    gl_FragColor = vec4(normalize(v_Normal) * 0.5 + 0.5, 1.0);\n' +
  '    return;\n' +
  '  }\n' +
  '  if (!u_LightOn && !u_SpotLightOn) {\n' +
  '    gl_FragColor = u_FragColor;\n' +
  '    return;\n' +
  '  }\n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 baseColor = vec3(u_FragColor);\n' +
  '  vec3 ambient = 0.2 * baseColor;\n' +
  '  vec3 result = ambient;\n' +
  // point light: diffuse + specular
  '  if (u_LightOn) {\n' +
  '    vec3 lightDir = normalize(u_LightPos - v_Position);\n' +
  '    float diff = max(dot(normal, lightDir), 0.0);\n' +
  '    vec3 viewDir = normalize(-v_Position);\n' +
  '    vec3 reflectDir = reflect(-lightDir, normal);\n' +
  '    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);\n' +
  '    result += diff * u_LightColor * baseColor;\n' +
  '    result += spec * u_LightColor * 0.5;\n' +
  '  }\n' +
  // spot light
  '  if (u_SpotLightOn) {\n' +
  '    vec3 spotDir = normalize(u_SpotLightPos - v_Position);\n' +
  '    float angle = dot(spotDir, normalize(-u_SpotLightDir));\n' +
  '    float cutoff = cos(radians(20.0));\n' +
  '    if (angle > cutoff) {\n' +
  '      float diff = max(dot(normal, spotDir), 0.0);\n' +
  '      result += diff * vec3(1.0, 1.0, 0.5) * baseColor;\n' +
  '    }\n' +
  '  }\n' +
  '  gl_FragColor = vec4(result, u_FragColor.a);\n' +
  '}\n';

// webgl globals
var gl;
var canvas;

// attribute locations
var a_Position;
var a_Normal;

// uniform locations
var u_FragColor;
var u_ModelMatrix;
var u_GlobalRotation;
var u_NormalMatrix;
var u_LightPos;
var u_LightColor;
var u_LightOn;
var u_ShowNormals;
var u_SpotLightPos;
var u_SpotLightDir;
var u_SpotLightOn;

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

// lighting globals
var g_lightPos = [0.0, 1.0, 2.0];
var g_lightColor = [1.0, 1.0, 1.0];
var g_lightOn = true;
var g_showNormals = false;
var g_lightAngle = 0;
var g_lightManual = false;

// spot light globals - fixed above shining straight down
var g_spotLightPos = [0.0, 2.0, 0.0];
var g_spotLightDir = [0.0, -1.0, 0.0];
var g_spotLightOn = false;

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

// compile shaders and grab all uniform/attribute locations
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to initialize shaders');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) { console.log('failed to get a_Position'); return false; }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) { console.log('failed to get a_Normal'); return false; }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) { console.log('failed to get u_FragColor'); return false; }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { console.log('failed to get u_ModelMatrix'); return false; }

  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) { console.log('failed to get u_GlobalRotation'); return false; }

  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) { console.log('failed to get u_NormalMatrix'); return false; }

  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  if (!u_LightPos) { console.log('failed to get u_LightPos'); return false; }

  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  if (!u_LightColor) { console.log('failed to get u_LightColor'); return false; }

  u_LightOn = gl.getUniformLocation(gl.program, 'u_LightOn');
  if (!u_LightOn) { console.log('failed to get u_LightOn'); return false; }

  u_ShowNormals = gl.getUniformLocation(gl.program, 'u_ShowNormals');
  if (!u_ShowNormals) { console.log('failed to get u_ShowNormals'); return false; }

  u_SpotLightPos = gl.getUniformLocation(gl.program, 'u_SpotLightPos');
  if (!u_SpotLightPos) { console.log('failed to get u_SpotLightPos'); return false; }

  u_SpotLightDir = gl.getUniformLocation(gl.program, 'u_SpotLightDir');
  if (!u_SpotLightDir) { console.log('failed to get u_SpotLightDir'); return false; }

  u_SpotLightOn = gl.getUniformLocation(gl.program, 'u_SpotLightOn');
  if (!u_SpotLightOn) { console.log('failed to get u_SpotLightOn'); return false; }

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

// animation loop - updates time, animates light, redraws every frame
function tick() {
  g_time = performance.now() / 1000.0;

  if (g_animating && !g_poking) {
    updateAnimationAngles();
  }

  // only auto-orbit the light if slider isn't controlling it
  if (!g_lightManual) {
    g_lightAngle = g_time * 1.5;
    g_lightPos[0] = 2.0 * Math.cos(g_lightAngle);
    g_lightPos[2] = 2.0 * Math.sin(g_lightAngle);
  }

  // fps counter
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

// sends all lighting uniforms to the shaders before drawing
function passLightingUniforms() {
  gl.uniform3fv(u_LightPos, g_lightPos);
  gl.uniform3fv(u_LightColor, g_lightColor);
  gl.uniform1i(u_LightOn, g_lightOn);
  gl.uniform1i(u_ShowNormals, g_showNormals);
  gl.uniform3fv(u_SpotLightPos, g_spotLightPos);
  gl.uniform3fv(u_SpotLightDir, g_spotLightDir);
  gl.uniform1i(u_SpotLightOn, g_spotLightOn);
}

// computes and sends the normal matrix for a given model matrix
// normal matrix is the inverse transpose of the model matrix
function passNormalMatrix(modelMatrix) {
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
}

// draws the entire cow scene
function renderScene() {
  var globalRotMat = new Matrix4()
    .setRotate(g_rotX, 1, 0, 0)
    .rotate(g_rotY + gAnimalGlobalRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  passLightingUniforms();

  // yellow cube at light position - big enough to actually see
  var lightM = new Matrix4();
  lightM.setTranslate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  lightM.scale(0.15, 0.15, 0.15);
  passNormalMatrix(lightM);
  drawCube(lightM, [1.0, 1.0, 0.0, 1.0]);

  // color palette
  var WHITE = [1.0, 1.0, 1.0, 1.0];
  var BLACK = [0.1, 0.1, 0.1, 1.0];
  var PINK  = [1.0, 0.75, 0.80, 1.0];
  var TAN   = [0.82, 0.70, 0.45, 1.0];
  var RED   = [0.8, 0.1, 0.1, 1.0];
  var BLUE  = [0.6, 0.8, 0.9, 1.0];

  // bunny obj model - scaled down and positioned to the left of the cow
  var modelM = new Matrix4();
  modelM.setTranslate(-0.8, -0.3, 0.0);
  modelM.scale(0.08, 0.08, 0.08);
  passNormalMatrix(modelM);
  drawModel(modelM, BLUE);

  // red sphere sitting beside the cow
  var sphereM = new Matrix4();
  sphereM.setTranslate(0.7, -0.28, 0.3);
  sphereM.scale(0.2, 0.2, 0.2);
  passNormalMatrix(sphereM);
  drawSphere(sphereM, RED);

  // body - main white base
  var M = new Matrix4();
  M.setScale(0.50, 0.30, 0.80);
  passNormalMatrix(M);
  drawCube(M, WHITE);

  // body black patch 1 - large on left side
  M = new Matrix4();
  M.setTranslate(-0.26, 0.02, 0.10);
  M.scale(0.02, 0.22, 0.40);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // body black patch 2 - medium on right back
  M = new Matrix4();
  M.setTranslate(0.26, 0.05, -0.15);
  M.scale(0.02, 0.15, 0.25);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // body black patch 3 - small on right front
  M = new Matrix4();
  M.setTranslate(0.26, -0.02, 0.20);
  M.scale(0.02, 0.10, 0.12);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // body black patch 4 - tiny on top
  M = new Matrix4();
  M.setTranslate(0.05, 0.16, -0.10);
  M.scale(0.18, 0.02, 0.15);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // body black patch 5 - medium on front top
  M = new Matrix4();
  M.setTranslate(0.0, 0.16, 0.28);
  M.scale(0.20, 0.02, 0.18);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // body black patch 6 - small on left back
  M = new Matrix4();
  M.setTranslate(-0.26, -0.05, -0.25);
  M.scale(0.02, 0.12, 0.15);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // head - white lower half
  M = new Matrix4();
  M.setTranslate(0.0, 0.12, 0.55);
  M.scale(0.30, 0.13, 0.30);
  passNormalMatrix(M);
  drawCube(M, WHITE);

  // head - black upper half
  M = new Matrix4();
  M.setTranslate(0.0, 0.23, 0.55);
  M.scale(0.30, 0.13, 0.30);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // snout - pink cylinder
  var snoutM = new Matrix4();
  snoutM.setTranslate(0.0, 0.10, 0.68);
  snoutM.rotate(90, 1, 0, 0);
  snoutM.scale(0.18, 0.08, 0.18);
  passNormalMatrix(snoutM);
  drawCylinder(snoutM, PINK);

  // left eye - white base with black pupil
  M = new Matrix4();
  M.setTranslate(-0.08, 0.20, 0.71);
  M.scale(0.07, 0.07, 0.04);
  passNormalMatrix(M);
  drawCube(M, WHITE);

  M = new Matrix4();
  M.setTranslate(-0.08, 0.20, 0.73);
  M.scale(0.04, 0.04, 0.03);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // right eye - white base with black pupil
  M = new Matrix4();
  M.setTranslate(0.08, 0.20, 0.71);
  M.scale(0.07, 0.07, 0.04);
  passNormalMatrix(M);
  drawCube(M, WHITE);

  M = new Matrix4();
  M.setTranslate(0.08, 0.20, 0.73);
  M.scale(0.04, 0.04, 0.03);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // ears - pink cubes on sides of head
  M = new Matrix4();
  M.setTranslate(-0.18, 0.33, 0.57);
  M.scale(0.07, 0.12, 0.07);
  passNormalMatrix(M);
  drawCube(M, PINK);

  M = new Matrix4();
  M.setTranslate(0.18, 0.33, 0.57);
  M.scale(0.07, 0.12, 0.07);
  passNormalMatrix(M);
  drawCube(M, PINK);

  // horns - tan cylinders
  var lhornM = new Matrix4();
  lhornM.setTranslate(-0.08, 0.32, 0.55);
  lhornM.rotate(20, 0, 0, 1);
  lhornM.scale(0.04, 0.12, 0.04);
  passNormalMatrix(lhornM);
  drawCylinder(lhornM, TAN);

  var rhornM = new Matrix4();
  rhornM.setTranslate(0.08, 0.32, 0.55);
  rhornM.rotate(-20, 0, 0, 1);
  rhornM.scale(0.04, 0.12, 0.04);
  passNormalMatrix(rhornM);
  drawCylinder(rhornM, TAN);

  // tail stick - bottom sits at top of body
  M = new Matrix4();
  M.setTranslate(0.0, 0.26, -0.40);
  M.scale(0.05, 0.22, 0.05);
  passNormalMatrix(M);
  drawCube(M, BLACK);

  // white tuft sits just above the stick
  M = new Matrix4();
  M.setTranslate(0.0, 0.37, -0.40);
  M.scale(0.09, 0.09, 0.09);
  passNormalMatrix(M);
  drawCube(M, WHITE);

  // front left leg - upper, lower, hoof
  var flUpperM = new Matrix4();
  flUpperM.setTranslate(-0.18, -0.13, 0.28);
  flUpperM.rotate(gFrontLeftUpperAngle, 1, 0, 0);
  flUpperM.translate(0, -0.125, 0);
  flUpperM.scale(0.12, 0.25, 0.12);
  passNormalMatrix(flUpperM);
  drawCube(flUpperM, WHITE);

  var flLowerM = new Matrix4();
  flLowerM.setTranslate(-0.18, -0.13, 0.28);
  flLowerM.rotate(gFrontLeftUpperAngle, 1, 0, 0);
  flLowerM.translate(0, -0.25, 0);
  flLowerM.rotate(gFrontLeftLowerAngle, 1, 0, 0);
  flLowerM.translate(0, -0.10, 0);
  flLowerM.scale(0.10, 0.20, 0.10);
  passNormalMatrix(flLowerM);
  drawCube(flLowerM, WHITE);

  var flHoofM = new Matrix4();
  flHoofM.setTranslate(-0.18, -0.13, 0.28);
  flHoofM.rotate(gFrontLeftUpperAngle, 1, 0, 0);
  flHoofM.translate(0, -0.25, 0);
  flHoofM.rotate(gFrontLeftLowerAngle, 1, 0, 0);
  flHoofM.translate(0, -0.15, 0);
  flHoofM.rotate(gFrontLeftHoofAngle, 1, 0, 0);
  flHoofM.translate(0, -0.05, 0);
  flHoofM.scale(0.12, 0.10, 0.12);
  passNormalMatrix(flHoofM);
  drawCube(flHoofM, BLACK);

  // front right leg - upper, lower, hoof
  var frUpperM = new Matrix4();
  frUpperM.setTranslate(0.18, -0.13, 0.28);
  frUpperM.rotate(gFrontRightUpperAngle, 1, 0, 0);
  frUpperM.translate(0, -0.125, 0);
  frUpperM.scale(0.12, 0.25, 0.12);
  passNormalMatrix(frUpperM);
  drawCube(frUpperM, WHITE);

  var frLowerM = new Matrix4();
  frLowerM.setTranslate(0.18, -0.13, 0.28);
  frLowerM.rotate(gFrontRightUpperAngle, 1, 0, 0);
  frLowerM.translate(0, -0.25, 0);
  frLowerM.rotate(gFrontRightLowerAngle, 1, 0, 0);
  frLowerM.translate(0, -0.10, 0);
  frLowerM.scale(0.10, 0.20, 0.10);
  passNormalMatrix(frLowerM);
  drawCube(frLowerM, WHITE);

  var frHoofM = new Matrix4();
  frHoofM.setTranslate(0.18, -0.13, 0.28);
  frHoofM.rotate(gFrontRightUpperAngle, 1, 0, 0);
  frHoofM.translate(0, -0.25, 0);
  frHoofM.rotate(gFrontRightLowerAngle, 1, 0, 0);
  frHoofM.translate(0, -0.15, 0);
  frHoofM.rotate(gFrontRightLowerAngle, 1, 0, 0);
  frHoofM.translate(0, -0.05, 0);
  frHoofM.scale(0.12, 0.10, 0.12);
  passNormalMatrix(frHoofM);
  drawCube(frHoofM, BLACK);

  // back left leg - upper, lower, hoof
  var blUpperM = new Matrix4();
  blUpperM.setTranslate(-0.18, -0.13, -0.28);
  blUpperM.rotate(gBackLeftUpperAngle, 1, 0, 0);
  blUpperM.translate(0, -0.125, 0);
  blUpperM.scale(0.12, 0.25, 0.12);
  passNormalMatrix(blUpperM);
  drawCube(blUpperM, WHITE);

  var blLowerM = new Matrix4();
  blLowerM.setTranslate(-0.18, -0.13, -0.28);
  blLowerM.rotate(gBackLeftUpperAngle, 1, 0, 0);
  blLowerM.translate(0, -0.25, 0);
  blLowerM.rotate(gBackLeftLowerAngle, 1, 0, 0);
  blLowerM.translate(0, -0.10, 0);
  blLowerM.scale(0.10, 0.20, 0.10);
  passNormalMatrix(blLowerM);
  drawCube(blLowerM, WHITE);

  var blHoofM = new Matrix4();
  blHoofM.setTranslate(-0.18, -0.13, -0.28);
  blHoofM.rotate(gBackLeftUpperAngle, 1, 0, 0);
  blHoofM.translate(0, -0.25, 0);
  blHoofM.rotate(gBackLeftLowerAngle, 1, 0, 0);
  blHoofM.translate(0, -0.15, 0);
  blHoofM.rotate(gBackLeftLowerAngle, 1, 0, 0);
  blHoofM.translate(0, -0.05, 0);
  blHoofM.scale(0.12, 0.10, 0.12);
  passNormalMatrix(blHoofM);
  drawCube(blHoofM, BLACK);

  // back right leg - upper, lower, hoof
  var brUpperM = new Matrix4();
  brUpperM.setTranslate(0.18, -0.13, -0.28);
  brUpperM.rotate(gBackRightUpperAngle, 1, 0, 0);
  brUpperM.translate(0, -0.125, 0);
  brUpperM.scale(0.12, 0.25, 0.12);
  passNormalMatrix(brUpperM);
  drawCube(brUpperM, WHITE);

  var brLowerM = new Matrix4();
  brLowerM.setTranslate(0.18, -0.13, -0.28);
  brLowerM.rotate(gBackRightUpperAngle, 1, 0, 0);
  brLowerM.translate(0, -0.25, 0);
  brLowerM.rotate(gBackRightLowerAngle, 1, 0, 0);
  brLowerM.translate(0, -0.10, 0);
  brLowerM.scale(0.10, 0.20, 0.10);
  passNormalMatrix(brLowerM);
  drawCube(brLowerM, WHITE);

  var brHoofM = new Matrix4();
  brHoofM.setTranslate(0.18, -0.13, -0.28);
  brHoofM.rotate(gBackRightUpperAngle, 1, 0, 0);
  brHoofM.translate(0, -0.25, 0);
  brHoofM.rotate(gBackRightLowerAngle, 1, 0, 0);
  brHoofM.translate(0, -0.15, 0);
  brHoofM.rotate(gBackRightLowerAngle, 1, 0, 0);
  brHoofM.translate(0, -0.05, 0);
  brHoofM.scale(0.12, 0.10, 0.12);
  passNormalMatrix(brHoofM);
  drawCube(brHoofM, BLACK);
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;

  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) { doPoke(); return; }
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

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

  document.getElementById('animBtn').addEventListener('click', function() {
    g_animating = !g_animating;
    this.textContent = g_animating ? 'Stop Animation' : 'Start Animation';
  });

  // light starts on so button says turn it off
  document.getElementById('lightBtn').addEventListener('click', function() {
    g_lightOn = !g_lightOn;
    this.textContent = g_lightOn ? 'Turn Light Off' : 'Turn Light On';
  });

  document.getElementById('normalBtn').addEventListener('click', function() {
    g_showNormals = !g_showNormals;
    this.textContent = g_showNormals ? 'Hide Normals' : 'Show Normals';
  });

  document.getElementById('spotLightBtn').addEventListener('click', function() {
    g_spotLightOn = !g_spotLightOn;
    this.textContent = g_spotLightOn ? 'Turn Spot Light Off' : 'Turn Spot Light On';
  });

  // dragging slider manually positions the light
  document.getElementById('lightSlider').addEventListener('input', function() {
    g_lightManual = true;
    var angle = parseFloat(this.value);
    g_lightPos[0] = 2.0 * Math.cos(angle);
    g_lightPos[2] = 2.0 * Math.sin(angle);
    g_lightPos[1] = 1.0;
  });

  // releasing slider resumes auto-orbit
  document.getElementById('lightSlider').addEventListener('change', function() {
    g_lightManual = false;
  });

  // slider shifts light color from white to red
  document.getElementById('lightColorSlider').addEventListener('input', function() {
    var v = parseFloat(this.value);
    g_lightColor = [v, 1.0 - v, 1.0 - v];
  });

  // load the bunny obj model asynchronously
  loadOBJ('bunny.obj');

  tick();
}