// Cylinder.js
// cse 160 - assignment 4
// pooja yalla

function drawCylinder(M, color, segments) {
  segments = segments || 12;
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  var verts = [];
  var norms = [];
  var angleStep = (2 * Math.PI) / segments;

  for (var i = 0; i < segments; i++) {
    var a1 = i * angleStep;
    var a2 = (i + 1) * angleStep;

    var x1 = Math.cos(a1) * 0.5;
    var z1 = Math.sin(a1) * 0.5;
    var x2 = Math.cos(a2) * 0.5;
    var z2 = Math.sin(a2) * 0.5;

    // top face - normal points straight up
    verts.push(0, 0.5, 0,  x1, 0.5, z1,  x2, 0.5, z2);
    norms.push(0, 1, 0,  0, 1, 0,  0, 1, 0);

    // bottom face - normal points straight down
    verts.push(0, -0.5, 0,  x2, -0.5, z2,  x1, -0.5, z1);
    norms.push(0, -1, 0,  0, -1, 0,  0, -1, 0);

    // side faces - normal points outward from center (just the x,z direction of each vertex)
    verts.push(x1, 0.5, z1,  x1, -0.5, z1,  x2, -0.5, z2);
    norms.push(x1*2, 0, z1*2,  x1*2, 0, z1*2,  x2*2, 0, z2*2);

    verts.push(x1, 0.5, z1,  x2, -0.5, z2,  x2, 0.5, z2);
    norms.push(x1*2, 0, z1*2,  x2*2, 0, z2*2,  x2*2, 0, z2*2);
  }

  var vertices = new Float32Array(verts);
  var normals = new Float32Array(norms);

  // upload positions
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // upload normals
  if (a_Normal >= 0) {
    var normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
  }

  gl.drawArrays(gl.TRIANGLES, 0, verts.length / 3);
}