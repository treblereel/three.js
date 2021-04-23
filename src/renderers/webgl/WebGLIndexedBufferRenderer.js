import { WebGLExtensions } from './WebGLExtensions.js';
import { WebGLInfo } from './WebGLInfo.js';
import { WebGLCapabilities } from './WebGLCapabilities.js';

class WebGLIndexedBufferRenderer {

	/**
	 * 
	 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
	 * @param {WebGLExtensions} extensions 
	 * @param {WebGLInfo} info 
	 * @param {WebGLCapabilities} capabilities 
	 */
	constructor( gl, extensions, info, capabilities ) {

		this.gl = gl;
		this.extensions = extensions;
		this.info = info;
		this.capabilities = capabilities;

		this.isWebGL2 = capabilities.isWebGL2;

		this.mode = null;
		this.type = null;
		this.bytesPerElement = null;

	}
	

	setMode( value ) {

		this.mode = value;

	}

	setIndex( value ) {

		this.type = value.type;
		this.bytesPerElement = value.bytesPerElement;

	}

	render( start, count ) {

		this.gl.drawElements( this.mode, count, this.type, start * this.bytesPerElement );

		this.info.update( count, this.mode, 1 );

	}

	renderInstances( start, count, primcount ) {

		if ( primcount === 0 ) return;

		let extension, methodName;

		if ( this.isWebGL2 ) {

			extension = this.gl;
			methodName = 'drawElementsInstanced';

		} else {

			extension = this.extensions.get( 'ANGLE_instanced_arrays' );
			methodName = 'drawElementsInstancedANGLE';

			if ( extension === null ) {

				console.error( 'THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.' );
				return;

			}

		}

		//TODO
		extension[ methodName ]( this.mode, count, this.type, start * this.bytesPerElement, primcount );

		this.info.update( count, this.mode, primcount );

	}

}


export { WebGLIndexedBufferRenderer };
