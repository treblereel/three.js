class WebGLObjects {


	constructor( gl, geometries, attributes, info ) {

		this.gl = gl;
		this.geometries = geometries;
		this.attributes = attributes;
		this.info = info;

		this.updateMap = new WeakMap();
	}

	update( object ) {

		const frame = this.info.render.frame;

		const geometry = object.geometry;
		const buffergeometry = this.geometries.get( object, geometry );

		// Update once per frame

		if ( this.updateMap.get( buffergeometry ) !== frame ) {

			if ( geometry.isGeometry ) {

				buffergeometry.updateFromObject( object );

			}

			this.geometries.update( buffergeometry );

			this.updateMap.set( buffergeometry, frame );

		}

		if ( object.isInstancedMesh ) {

			if ( object.hasEventListener( 'dispose', this._onInstancedMeshDispose ) === false ) {

				object.addEventListener( 'dispose', this._onInstancedMeshDispose );

			}

			this.attributes.update( object.instanceMatrix, this.gl.ARRAY_BUFFER );

			if ( object.instanceColor !== null ) {

				this.attributes.update( object.instanceColor, this.gl.ARRAY_BUFFER );

			}

		}

		return buffergeometry;

	}

	dispose() {

		this.updateMap = new WeakMap();

	}

	_onInstancedMeshDispose( event ) {

		const instancedMesh = event.target;

		instancedMesh.removeEventListener( 'dispose', this.onInstancedMeshDispose );

		this.attributes.remove( instancedMesh.instanceMatrix );

		if ( instancedMesh.instanceColor !== null ) this.attributes.remove( instancedMesh.instanceColor );

	}

}


export { WebGLObjects };
