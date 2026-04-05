function main() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('failed to retrieve the canvas element');
    return;
  }

  var ctx = canvas.getContext('2d');

  // fill the canvas with black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // create vector v1 and draw it in red
  var v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, 'red');
}

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // center of the canvas is the origin
  var cx = canvas.width / 2;
  var cy = canvas.height / 2;

  // scale by 20 to make vectors visible
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + v.elements[0] * 20, cy - v.elements[1] * 20);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // clear the canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // read v1 inputs and draw in red
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, 'red');

  // read v2 inputs and draw in blue
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, 'blue');
}

function angleBetween(v1, v2) {
  // use dot product definition to find angle: dot(v1,v2) = |v1| * |v2| * cos(angle)
  var dot = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  var angle = Math.acos(dot / (mag1 * mag2));
  // convert from radians to degrees
  return angle * (180 / Math.PI);
}

function areaTriangle(v1, v2) {
  // area of triangle = half the magnitude of the cross product
  var cross = Vector3.cross(v1, v2);
  return cross.magnitude() / 2;
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // clear the canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // read v1 and v2 inputs
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, 'red');

  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, 'blue');

  // read operation and scalar
  var op = document.getElementById('operation').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  // perform the selected operation and draw result in green
  if (op === 'add') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (op === 'sub') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, 'green');
  } else if (op === 'mul') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.mul(scalar);
    var v4 = new Vector3([x2, y2, 0]);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'div') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.div(scalar);
    var v4 = new Vector3([x2, y2, 0]);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'magnitude') {
    // print magnitudes to console and draw normalized vectors in green
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();
    console.log('Magnitude v1: ' + mag1);
    console.log('Magnitude v2: ' + mag2);
    var v3 = new Vector3([x1, y1, 0]);
    v3.normalize();
    var v4 = new Vector3([x2, y2, 0]);
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'normalize') {
    // normalize v1 and v2 and draw in green
    var v3 = new Vector3([x1, y1, 0]);
    v3.normalize();
    var v4 = new Vector3([x2, y2, 0]);
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'anglebetween') {
    // calculate and print angle between v1 and v2
    var angle = angleBetween(v1, v2);
    console.log('Angle between v1 and v2: ' + angle + ' degrees');
  } else if (op === 'area') {
    // calculate and print area of triangle formed by v1 and v2
    var area = areaTriangle(v1, v2);
    console.log('Area of triangle: ' + area);
  }
}