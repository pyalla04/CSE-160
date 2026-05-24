// Sphere.js
// cse 160 - assignment 4
// pooja yalla

function drawSphere(M, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  var verts = [];
  var norms = [];

  // use latitude/longitude loops to generate sphere triangles
  var rows = 13;
  var cols = 13;

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var phi1 = (i / rows) * Math.PI;
      var phi2 = ((i + 1) / rows) * Math.PI;
      var theta1 = (j / cols) * 2 * Math.PI;
      var theta2 = ((j + 1) / cols) * 2 * Math.PI;

      // 4 corners of this grid cell on the sphere surface
      var x1 = Math.sin(phi1) * Math.cos(theta1);
      var y1 = Math.cos(phi1);
      var z1 = Math.sin(phi1) * Math.sin(theta1);

      var x2 = Math.sin(phi2) * Math.cos(theta1);
      var y2 = Math.cos(phi2);
      var z2 = Math.sin(phi2) * Math.sin(theta1);

      var x3 = Math.sin(phi1) * Math.cos(theta2);
      var y3 = Math.cos(phi1);
      var z3 = Math.sin(phi1) * Math.sin(theta2);

      var x4 = Math.sin(phi2) * Math.cos(theta2);
      var y4 = Math.cos(phi2);
      var z4 = Math.sin(phi2) * Math.sin(theta2);

      // for a unit sphere centered at origin, normal = position
      // triangle 1
      verts.push(x1, y1, z1,  x2, y2, z2,  x3, y3, z3);
      norms.push(x1, y1, z1,  x2, y2, z2,  x3, y3, z3);

      // triangle 2
      verts.push(x3, y3, z3,  x2, y2, z2,  x4, y4, z4);
      norms.push(x3, y3, z3,  x2, y2, z2,  x4, y4, z4);
    }
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