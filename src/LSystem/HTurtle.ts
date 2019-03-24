import {vec2, vec3, mat4, quat} from 'gl-matrix';
import Point from './Point';
import Edge from './Edge';
import {inWater, getPopulationDensity, getTerrainElevation} from './NoiseFuncs';
import TextureFuncs from './TextureFuncs';

// turtle for the Highway construction
class HTurtle {
  point: Point; // turtle's point location
  destination: Point; // destination point of turtle
  direction: vec3 = vec3.create(); // forward movement direction
  pointArray: Point[]; // array for all the points
  edgeArray: Edge[]; // array for all edges
  upDir: vec3 = vec3.create(); // up direction
  rightDir: vec3 = vec3.create(); // right direction
  quat: quat = quat.create(); // quaternion  
  texture: TextureFuncs; // get texture data
  
  // set all the variables
  constructor(point: Point, dir: vec3, up: vec3, right: vec3, q: quat, destination: Point, texture: TextureFuncs, pointArray: Point[], edgeArray: Edge[],) {
    this.point = point;
    this.direction = vec3.fromValues(dir[0], dir[1], dir[2]);
    this.upDir = vec3.fromValues(up[0], up[1], up[2]);
    this.rightDir = vec3.fromValues(right[0], right[1], right[2]);
    this.quat = quat.fromValues(q[0], q[1], q[2], q[3]);
    this.destination = destination;
    this.texture = texture;
    this.pointArray = pointArray;
    this.edgeArray = edgeArray;
  }

  // rotate around the Y axis
  rot(degrees: number) {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.upDir, degrees * Math.PI / 180.0);

    let rotMat: mat4 = mat4.create();
    mat4.fromQuat(rotMat, q);

    vec3.transformMat4(this.direction, this.direction, rotMat);
    vec3.normalize(this.direction, this.direction);
    vec3.transformMat4(this.rightDir, this.rightDir, rotMat);
    vec3.normalize(this.rightDir, this.rightDir);

    // quat holds the rotation
    quat.rotationTo(this.quat, vec3.fromValues(0, 1, 0), this.direction);
  }

  // makes sure turtle is on land
  turtleRules(inTurtle: HTurtle) {
    // is the turtle in bounds? checking with 2000 length of texture
    if ((this.point.position[0] < 0.0) || (this.point.position[0] > 2000.0) || (this.point.position[2] < 0.0) || (this.point.position[2] > 2000.0)) {
      return null;
    }
    // checking if turtle is in proximity to the destination point    
    if (this.destination.inRadius(inTurtle.point.position, 0.5)) {
      let tempEdge = new Edge(this.point, this.destination, true);
      // add the destination and edge to arrays for the turtle 
      this.pointArray.push(this.destination);
      this.edgeArray.push(tempEdge);
      return null;
    }
    
    return inTurtle;
  }
 
  // turtle moves forward, an expansion rule
  expRule() {
    let additionalTurtles = [];   

    // make the new point
    let newPoint = new Point(vec3.fromValues(this.point.position[0], this.point.position[1], this.point.position[2]));
    let tempX = newPoint.position[0] + (0.5 * this.direction[0]);
    let tempY = newPoint.position[1] + (0.5 * this.direction[1]);
    let tempZ = newPoint.position[2] + (0.5 * this.direction[2]);
    newPoint.position = vec3.fromValues(tempX, tempY, tempZ);

    additionalTurtles.push(this.makeHTurtle(newPoint));
    return additionalTurtles;
  }

  // make a new Highway Turtle
  makeHTurtle(newPoint: Point) {
    let forwardVec: vec3 = vec3.create();
    let upVec: vec3 = vec3.create();
    let rightVec: vec3 = vec3.create();
    let quatNew: quat = quat.create();

    // copy the information in
    vec3.copy(forwardVec, this.direction);
    vec3.copy(upVec, this.upDir);   
    vec3.copy(rightVec, this.rightDir);   
    quat.copy(quatNew, this.quat);

    // make the new highway turtle
    return new HTurtle(newPoint, forwardVec, upVec, rightVec, quatNew, this.destination, this.texture, this.pointArray, this.edgeArray);
  }
  
  // gives list of turtles created
  expandTurtle(): any[] {
    let tempTurtles: any[] = this.expRule(); // hold all possible turtles
    let confirmedTurtles: any[] = []; // take the good turtles

    for (let i: number = 0.0; i < tempTurtles.length; i++) {
      // the current temporary turtle
      let curr = this.turtleRules(tempTurtles[i]);

      // Adds new highway turtle to expanded turtles returned
      if (curr) {
        let myEdge = new Edge(this.point, curr.point, true);
        // add edge
        this.edgeArray.push(myEdge);
        // add point
        this.pointArray.push(curr.point);    
        // add turtle    
        confirmedTurtles.push(curr);     
      }
    }
    return confirmedTurtles;
  }
};
export default HTurtle;