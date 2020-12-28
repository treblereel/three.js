import { Line } from './Line.js';

class LineLoop extends Line {

	constructor( geometry, material ) {

		super( geometry, material );

		Object.defineProperties(this, { isLineLoop: { value : true } } );

		this.type = 'LineLoop';

	}

}

export { LineLoop };
