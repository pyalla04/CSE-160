// camera.js
// cse 160 - assignment 3
// pooja yalla

class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([16, 1, 28]);
    this.at  = new Vector3([16, 1, 16]);
    this.up  = new Vector3([0, 1, 0]);
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
  }

  moveForward(speed) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  moveBackwards(speed) {
    var b = new Vector3();
    b.set(this.eye);
    b.sub(this.at);
    b.normalize();
    b.mul(speed);
    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  moveLeft(speed) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    var s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    var s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  panLeft(alpha) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    var rot = new Matrix4();
    rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    var f_prime = rot.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateView();
  }

  panRight(alpha) {
    this.panLeft(-alpha);
  }

  panUp(alpha) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    var right = Vector3.cross(f, this.up);
    right.normalize();
    var rot = new Matrix4();
    rot.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);
    var f_prime = rot.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateView();
  }

  panDown(alpha) {
    this.panUp(-alpha);
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }
}