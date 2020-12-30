import { PerspectiveCamera } from './PerspectiveCamera.js';

class ArrayCamera extends PerspectiveCamera {

	constructor( array = [] ) {

		super();

		//Object.defineProperty( this, 'isArrayCamera', { value: true } );

		/** @const */
		var isArrayCamera = true;
		this.isArrayCamera = isArrayCamera;

		this.cameras = array;

	}

}


export { ArrayCamera };
