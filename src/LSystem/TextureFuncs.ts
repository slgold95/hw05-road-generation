class TextureFuncs {
	data: Uint8Array;

	constructor(textureData: Uint8Array) {
		this.data = textureData;
	}
	// noise term for population density, between 0 and 1
	getPopDensityNoise(xVal: number, yVal: number): number {
			let x = Math.floor(xVal);
			let y = Math.floor(yVal);    
			return this.data[y * 2000 + x + 2.0] / 255; // +2 to offset
	}	

	// noise term for water, between 0 and 1
	getWaterNoise(xVal: number, yVal: number): number {
		let x = Math.floor(xVal);
		let y = Math.floor(yVal);   		
		return this.data[y * 2000 + x] / 255;	
	}
};
export default TextureFuncs;