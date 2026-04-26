// Cylinder.js
// cse 160 - assignment 2
// pooja yalla

function drawCylinder(M, color, segments) {
  segments = segments || 12;
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  var verts = [];
  var angleStep = (2 * Math.PI) / segments;

  for (var i = 0; i < segments; i++) {
    var a1 = i * angleStep;
    var a2 = (i + 1) * angleStep;

    var x1 = Math.cos(a1) * 0.5;
    var z1 = Math.sin(a1) * 0.5;
    var x2 = Math.cos(a2) * 0.5;
    var z2 = Math.sin(a2) * 0.5;

    // top face triangle
    verts.push(0, 0.5, 0,  x1, 0.5, z1,  x2, 0.5, z2);
    // bottom face triangle
    verts.push(0, -0.5, 0,  x2, -0.5, z2,  x1, -0.5, z1);
    // side face - two triangles
    verts.push(x1, 0.5, z1,  x1, -0.5, z1,  x2, -0.5, z2);
    verts.push(x1, 0.5, z1,  x2, -0.5, z2,  x2, 0.5, z2);
  }

  var vertices = new Float32Array(verts);
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, verts.length / 3);
}