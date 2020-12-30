import { WebGLRenderTarget } from './WebGLRenderTarget.js';

class WebGLMultisampleRenderTarget extends WebGLRenderTarget {

	constructor( width, height, options ) {

		super( width, height, options );

		//Object.defineProperty( this, 'isWebGLMultisampleRenderTarget', { value: true } );

		/** @const */
		var isWebGLMultisampleRenderTarget = true;
		this.isWebGLMultisampleRenderTarget = isWebGLMultisampleRenderTarget;

		this.samples = 4;

	}

	copy( source ) {

		super.copy( source );

		this.samples = source.samples;

		return this;

	}

}

export { WebGLMultisampleRenderTarget };
