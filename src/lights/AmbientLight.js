import { Light } from './Light.js';

class AmbientLight extends Light {

	constructor( color, intensity ) {

		super( color, intensity );

		Object.defineProperty( this, 'isAmbientLight', { value: true } );

		this.type = 'AmbientLight';

	}

}

export { AmbientLight };
