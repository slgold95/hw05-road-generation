import {vec2, vec3} from 'gl-matrix';

class Point {
    // position of the point
	position: vec3 = vec3.create();

	constructor(position: vec3) {
		this.position = position;
	}
    // find proximity to nearby points within the range
	inRadius(point: vec3, radius: number) {
		return vec3.distance(point, this.position) < radius;
	}
};
export default Point;