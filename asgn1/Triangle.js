// Triangle.js
// cse 160 - assignment 1
// pooja yalla

function drawTriangle(verts) {
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('failed to create buffer');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disableVertexAttribArray(a_Position);
}

class Triangle {
  constructor(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], 1.0);
    var s = this.size / 200;
    drawTriangle([
      this.x,       this.y + s,
      this.x - s,   this.y - s,
      this.x + s,   this.y - s
    ]);
  }
}