// Cube.js
// cse 160 - assignment 3
// pooja yalla

var g_vertexBuffer = null;

class Cube {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -1;
    this.topTextureNum = -1;
  }

  render() {
    var rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    if (g_vertexBuffer == null) {
      g_vertexBuffer = gl.createBuffer();
    }

    gl.uniform1i(u_texColorWeight, this.textureNum);
    drawFace(g_vertexBuffer, [
      -0.5, -0.5,  0.5,  0.0, 0.0,
       0.5, -0.5,  0.5,  1.0, 0.0,
       0.5,  0.5,  0.5,  1.0, 1.0,
      -0.5, -0.5,  0.5,  0.0, 0.0,
       0.5,  0.5,  0.5,  1.0, 1.0,
      -0.5,  0.5,  0.5,  0.0, 1.0,
    ]); // front

    drawFace(g_vertexBuffer, [
       0.5, -0.5, -0.5,  0.0, 0.0,
      -0.5, -0.5, -0.5,  1.0, 0.0,
      -0.5,  0.5, -0.5,  1.0, 1.0,
       0.5, -0.5, -0.5,  0.0, 0.0,
      -0.5,  0.5, -0.5,  1.0, 1.0,
       0.5,  0.5, -0.5,  0.0, 1.0,
    ]); // back

    drawFace(g_vertexBuffer, [
      -0.5, -0.5, -0.5,  0.0, 0.0,
      -0.5, -0.5,  0.5,  1.0, 0.0,
      -0.5,  0.5,  0.5,  1.0, 1.0,
      -0.5, -0.5, -0.5,  0.0, 0.0,
      -0.5,  0.5,  0.5,  1.0, 1.0,
      -0.5,  0.5, -0.5,  0.0, 1.0,
    ]); // left

    drawFace(g_vertexBuffer, [
       0.5, -0.5,  0.5,  0.0, 0.0,
       0.5, -0.5, -0.5,  1.0, 0.0,
       0.5,  0.5, -0.5,  1.0, 1.0,
       0.5, -0.5,  0.5,  0.0, 0.0,
       0.5,  0.5, -0.5,  1.0, 1.0,
       0.5,  0.5,  0.5,  0.0, 1.0,
    ]); // right

    drawFace(g_vertexBuffer, [
      -0.5, -0.5, -0.5,  0.0, 0.0,
       0.5, -0.5, -0.5,  1.0, 0.0,
       0.5, -0.5,  0.5,  1.0, 1.0,
      -0.5, -0.5, -0.5,  0.0, 0.0,
       0.5, -0.5,  0.5,  1.0, 1.0,
      -0.5, -0.5,  0.5,  0.0, 1.0,
    ]); // bottom

    gl.uniform1i(u_texColorWeight, this.topTextureNum);
    drawFace(g_vertexBuffer, [
      -0.5,  0.5,  0.5,  0.0, 0.0,
       0.5,  0.5,  0.5,  1.0, 0.0,
       0.5,  0.5, -0.5,  1.0, 1.0,
      -0.5,  0.5,  0.5,  0.0, 0.0,
       0.5,  0.5, -0.5,  1.0, 1.0,
      -0.5,  0.5, -0.5,  0.0, 1.0,
    ]); // top
  }
}

function drawFace(buf, verts) {
  var data = new Float32Array(verts);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

  var FSIZE = data.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}