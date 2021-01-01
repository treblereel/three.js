import { Uint16BufferAttribute, Uint32BufferAttribute } from '../../core/BufferAttribute.js';
import { BufferGeometry } from '../../core/BufferGeometry.js';
import { arrayMax } from '../../utils.js';

class WebGLGeometries {
	
	constructor( gl, attributes, info, bindingStates ) {

		this.gl = gl;
		this.attributes = attributes;
		this.info = info;
		this.bindingStates = bindingStates;

		const geometries = new WeakMap();
		this.geometries = geometries;

		const wireframeAttributes = new WeakMap();
		this.wireframeAttributes = wireframeAttributes;

	}

	onGeometryDispose( event ) {

		const geometry = event.target;
		const buffergeometry = this.geometries.get( geometry );

		if ( buffergeometry.index !== null ) {

			this.attributes.remove( buffergeometry.index );

		}

		for ( const name in buffergeometry.attributes ) {

			this.attributes.remove( buffergeometry.attributes[ name ] );

		}

		geometry.removeEventListener( 'dispose', this.onGeometryDispose );

		this.geometries.delete( geometry );

		const attribute = this.wireframeAttributes.get( buffergeometry );

		if ( attribute ) {

			this.attributes.remove( attribute );
			this.wireframeAttributes.delete( buffergeometry );

		}

		this.bindingStates.releaseStatesOfGeometry( buffergeometry );

		if ( geometry.isInstancedBufferGeometry === true ) {

			delete geometry._maxInstanceCount;

		}

		//

		this.info.memory.geometries --;

	}

	get( object, geometry ) {

		let buffergeometry = this.geometries.get( geometry );

		if ( buffergeometry ) return buffergeometry;

		geometry.addEventListener( 'dispose', this.onGeometryDispose );

		if ( geometry.isBufferGeometry ) {

			buffergeometry = geometry;

		} else if ( geometry.isGeometry ) {

			if ( geometry._bufferGeometry === undefined ) {

				geometry._bufferGeometry = new BufferGeometry().setFromObject( object );

			}

			buffergeometry = geometry._bufferGeometry;

		}

		this.geometries.set( geometry, buffergeometry );

		this.info.memory.geometries ++;

		return buffergeometry;

	}

	update( geometry ) {

		const geometryAttributes = geometry.attributes;

		// Updating index buffer in VAO now. See WebGLBindingStates.

		for ( const name in geometryAttributes ) {

			this.attributes.update( geometryAttributes[ name ], this.gl.ARRAY_BUFFER );

		}

		// morph targets

		const morphAttributes = geometry.morphAttributes;

		for ( const name in morphAttributes ) {

			const array = morphAttributes[ name ];

			for ( let i = 0, l = array.length; i < l; i ++ ) {

				this.attributes.update( array[ i ], this.gl.ARRAY_BUFFER );

			}

		}

	}

	updateWireframeAttribute( geometry ) {

		const indices = [];

		const geometryIndex = geometry.index;
		const geometryPosition = geometry.attributes.position;
		let version = 0;

		if ( geometryIndex !== null ) {

			const array = geometryIndex.array;
			version = geometryIndex.version;

			for ( let i = 0, l = array.length; i < l; i += 3 ) {

				const a = array[ i + 0 ];
				const b = array[ i + 1 ];
				const c = array[ i + 2 ];

				indices.push( a, b, b, c, c, a );

			}

		} else {

			const array = geometryPosition.array;
			version = geometryPosition.version;

			for ( let i = 0, l = ( array.length / 3 ) - 1; i < l; i += 3 ) {

				const a = i + 0;
				const b = i + 1;
				const c = i + 2;

				indices.push( a, b, b, c, c, a );

			}

		}

		const attribute = new ( arrayMax( indices ) > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute )( indices, 1 );
		attribute.version = version;

		// Updating index buffer in VAO now. See WebGLBindingStates

		//

		const previousAttribute = this.wireframeAttributes.get( geometry );

		if ( previousAttribute ) this.attributes.remove( previousAttribute );

		//

		this.wireframeAttributes.set( geometry, attribute );

	}

	getWireframeAttribute( geometry ) {

		const currentAttribute = this.wireframeAttributes.get( geometry );

		if ( currentAttribute ) {

			const geometryIndex = geometry.index;

			if ( geometryIndex !== null ) {

				// if the attribute is obsolete, create a new one

				if ( currentAttribute.version < geometryIndex.version ) {

					this.updateWireframeAttribute( geometry );

				}

			}

		} else {

			this.updateWireframeAttribute( geometry );

		}

		return this.wireframeAttributes.get( geometry );

	}

}


export { WebGLGeometries };
