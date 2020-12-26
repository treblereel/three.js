import { PerspectiveCamera } from './PerspectiveCamera.js';

class ArrayCamera extends PerspectiveCamera {

	constructor( array = [] ) {

		super();

		Object.defineProperty( this, 'isArrayCamera', { value: true } );

		this.cameras = array;

	}

}


export { ArrayCamera };
