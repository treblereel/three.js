import { BufferAttribute } from './BufferAttribute.js';

class InstancedBufferAttribute extends BufferAttribute {

	constructor( array, itemSize, normalized, meshPerAttribute ) {

		if ( typeof ( normalized ) === 'number' ) {

			meshPerAttribute = normalized;

			normalized = false;

			console.error( 'THREE.InstancedBufferAttribute: The constructor now expects normalized as the third argument.' );

		}

		super( array, itemSize, normalized );

		//Object.defineProperty( this, 'isInstancedBufferAttribute', { value: true } );

		/** @const */
		var isInstancedBufferAttribute = true;
		this.isInstancedBufferAttribute = isInstancedBufferAttribute;
		
	}

	copy( source ) {

		super.copy( source );

		this.meshPerAttribute = source.meshPerAttribute;

		return this;

	}

	toJSON()	{

		const data = super.toJSON();

		data.meshPerAttribute = this.meshPerAttribute;

		data.isInstancedBufferAttribute = true;

		return data;

	}

}



export { InstancedBufferAttribute };
