class WebGLExtensions {

	constructor( gl ) {

		this.gl = gl;

		const extensions = {};
		this.extensions = extensions;

	}

	has( name ) {

			if ( this.extensions[ name ] !== undefined ) {

				return this.extensions[ name ] !== null;

			}

			let extension;

			switch ( name ) {

				case 'WEBGL_depth_texture':
					extension = this.gl.getExtension( 'WEBGL_depth_texture' ) || this.gl.getExtension( 'MOZ_WEBGL_depth_texture' ) || this.gl.getExtension( 'WEBKIT_WEBGL_depth_texture' );
					break;

				case 'EXT_texture_filter_anisotropic':
					extension = this.gl.getExtension( 'EXT_texture_filter_anisotropic' ) || this.gl.getExtension( 'MOZ_EXT_texture_filter_anisotropic' ) || this.gl.getExtension( 'WEBKIT_EXT_texture_filter_anisotropic' );
					break;

				case 'WEBGL_compressed_texture_s3tc':
					extension = this.gl.getExtension( 'WEBGL_compressed_texture_s3tc' ) || this.gl.getExtension( 'MOZ_WEBGL_compressed_texture_s3tc' ) || this.gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_s3tc' );
					break;

				case 'WEBGL_compressed_texture_pvrtc':
					extension = this.gl.getExtension( 'WEBGL_compressed_texture_pvrtc' ) || this.gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_pvrtc' );
					break;

				default:
					extension = this.gl.getExtension( name );

			}

			this.extensions[ name ] = extension;

			return extension !== null;

		}

		get( name ) {

			if ( ! this.has( name ) ) {

				console.warn( 'THREE.WebGLRenderer: ' + name + ' extension not supported.' );

			}

			return this.extensions[ name ];

		}

}


export { WebGLExtensions };
