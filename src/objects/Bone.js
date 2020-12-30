import { Object3D } from '../core/Object3D.js';

class Bone extends Object3D {

	constructor() {

		super();

		Object.defineProperty( this, 'isBone', { value: true } );

		/** @const */
		var isBone =  true;
		this.isBone = isBone;

		this.type = 'Bone';

	}

}


export { Bone };
