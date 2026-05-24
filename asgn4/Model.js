// Model.js
// cse 160 - assignment 4
// pooja yalla

var g_modelVertices = null;
var g_modelNormals = null;
var g_modelReady = false;

// loads and parses the obj file then stores the vertex and normal arrays
function loadOBJ(filename) {
  var req = new XMLHttpRequest();
  req.open('GET', filename, true);
  req.onload = function() {
    if (req.status === 200) {
      parseOBJ(req.responseText);
      g_modelReady = true;
    } else {
      console.log('failed to load obj: ' + filename);
    }
  };
  req.send();
}

// parses obj text and builds flat vertex/normal arrays for gl.drawArrays
function parseOBJ(text) {
  var positions = [];
  var normals = [];
  var verts = [];
  var norms = [];

  var lines = text.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    var parts = line.split(/\s+/);

    if (parts[0] === 'v') {
      // vertex position
      positions.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      ]);
    } else if (parts[0] === 'vn') {
      // vertex normal
      normals.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      ]);
    } else if (parts[0] === 'f') {
      // face - format is vertIndex//normalIndex for each of 3 corners
      for (var j = 1; j <= 3; j++) {
        var indices = parts[j].split('//');
        var vIdx = parseInt(indices[0]) - 1; // obj indices start at 1
        var nIdx = parseInt(indices[1]) - 1;
        verts.push(positions[vIdx][0], positions[vIdx][1], positions[vIdx][2]);
        norms.push(normals[nIdx][0], normals[nIdx][1], normals[nIdx][2]);
      }
    }
  }

  g_modelVertices = new Float32Array(verts);
  g_modelNormals = new Float32Array(norms);
  console.log('loaded obj: ' + (verts.length / 3) + ' vertices');
}

// draws the loaded obj model with the given matrix and color
function drawModel(M, color) {
  if (!g_modelReady) return;

  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  // upload positions
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, g_modelVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // upload normals
  if (a_Normal >= 0) {
    var normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_modelNormals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
  }

  gl.drawArrays(gl.TRIANGLES, 0, g_modelVertices.length / 3);
}