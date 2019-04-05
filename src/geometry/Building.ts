import {vec2, vec3, mat4, quat} from 'gl-matrix';
import TextureFuncs from '../Lsystem/TextureFuncs';
import Block from './Block';

class Building {
	height: number;	
	width: number;
	growProbability: number;
	texture: TextureFuncs;

	constructor(textureData: Uint8Array) {
		this.height = 5;
		this.width = Math.floor(Math.random() * 6.0) + 20.0; // random values between 20 and 26		
		this.growProbability = 0.2;
		this.texture = new TextureFuncs(textureData);
	}

	// build the building
	buildFunc(x: number, y: number) {
		// sample the population density from the texture
		let populationTerm: number = this.texture.samplePopDensityFromTexture(x, y);
		// building height based on population density
		let height = this.height * (populationTerm * populationTerm * populationTerm);
		// array to hold all the blocks
		let blockArray: Block[] = [];
		blockArray.push(new Block(vec2.fromValues(x, y), Math.random() * Math.PI, height, this.width));
		height -= 2.0;
		// while building height not negative (space to grow down)
		while (height > 0.0) {
			// if value is less than the probability threshold to grow the building
			if ((Math.random() * 2.0) < this.growProbability) {
				let i: number = Math.floor(Math.random() * blockArray.length);
				// random corner
				let temp: vec2 = blockArray[i].getBlockCorner();
				blockArray.push(new Block(temp, Math.random() * Math.PI, height, this.width / 2.0));
			}
			height -= 2.0; // lower the building down until < 0, then stop
		}
		// need VBO data
		let data: mat4[] = [];
		for (let i: number = 0.0; i < blockArray.length; i++) {
			data.push(blockArray[i].makeTransformationMatrix());
		}
		return data;
	}
};
export default Building;
