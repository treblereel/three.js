import { Light } from './Light.js';

class AmbientLight extends Light {

	constructor( color, intensity ) {

		super( color, intensity );

		//Object.defineProperties( this, { isAmbientLight: { value: true } } );

		/** @const */
		var isAmbientLight = true;
		this.isAmbientLight = isAmbientLight;

		this.type = 'AmbientLight';

	}

}

export { AmbientLight };
