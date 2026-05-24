// Cube.js
// cse 160 - assignment 4
// pooja yalla

function drawCube(M, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  // 6 faces, 2 triangles each, 3 vertices each = 36 vertices total
  var vertices = new Float32Array([
    // front
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // back
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
    // left
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    // right
     0.5, -0.5, -0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // top
    -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
    // bottom
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,
  ]);

  // each face points straight out in one direction, all 6 vertices on that face share the same normal
  var normals = new Float32Array([
    // front face points toward +z
     0, 0, 1,   0, 0, 1,   0, 0, 1,
     0, 0, 1,   0, 0, 1,   0, 0, 1,
    // back face points toward -z
     0, 0,-1,   0, 0,-1,   0, 0,-1,
     0, 0,-1,   0, 0,-1,   0, 0,-1,
    // left face points toward -x
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    // right face points toward +x
     1, 0, 0,   1, 0, 0,   1, 0, 0,
     1, 0, 0,   1, 0, 0,   1, 0, 0,
    // top face points toward +y
     0, 1, 0,   0, 1, 0,   0, 1, 0,
     0, 1, 0,   0, 1, 0,   0, 1, 0,
    // bottom face points toward -y
     0,-1, 0,   0,-1, 0,   0,-1, 0,
     0,-1, 0,   0,-1, 0,   0,-1, 0,
  ]);

  // upload positions
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // upload normals (guard in case shader doesn't have a_Normal yet)
  if (a_Normal >= 0) {
    var normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
  }

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}