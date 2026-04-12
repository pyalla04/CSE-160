// Circle.js
// cse 160 - assignment 1
// pooja yalla

class Circle {
  constructor(x, y, color, size, segments) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.segments = segments;
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], 1.0);
    var r = this.size / 200;
    var angleStep = (2 * Math.PI) / this.segments;
    for (var i = 0; i < this.segments; i++) {
      var a1 = i * angleStep;
      var a2 = (i + 1) * angleStep;
      drawTriangle([
        this.x, this.y,
        this.x + r * Math.cos(a1), this.y + r * Math.sin(a1),
        this.x + r * Math.cos(a2), this.y + r * Math.sin(a2)
      ]);
    }
  }
}