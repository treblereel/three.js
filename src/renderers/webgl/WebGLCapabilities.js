class WebGLCapabilities {


	constructor( gl, extensions, parameters ) {

		this.gl = gl;
		this.extensions = extensions;
		this.parameters = parameters;

		this.maxAnisotropy = undefined;


		/* eslint-disable no-undef */
		const isWebGL2 = ( typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ) ||
			( typeof WebGL2ComputeRenderingContext !== 'undefined' && gl instanceof WebGL2ComputeRenderingContext );
		/* eslint-enable no-undef */

		let precision = parameters.precision !== undefined ? parameters.precision : 'highp';
		const maxPrecision = this.getMaxPrecision( precision );

		if ( maxPrecision !== precision ) {

			console.warn( 'THREE.WebGLRenderer:', precision, 'not supported, using', maxPrecision, 'instead.' );
			precision = maxPrecision;

		}

		const logarithmicDepthBuffer = parameters.logarithmicDepthBuffer === true;

		const maxTextures = gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS );
		const maxVertexTextures = gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
		const maxTextureSize = gl.getParameter( gl.MAX_TEXTURE_SIZE );
		const maxCubemapSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE );

		const maxAttributes = gl.getParameter( gl.MAX_VERTEX_ATTRIBS );
		const maxVertexUniforms = gl.getParameter( gl.MAX_VERTEX_UNIFORM_VECTORS );
		const maxVaryings = gl.getParameter( gl.MAX_VARYING_VECTORS );
		const maxFragmentUniforms = gl.getParameter( gl.MAX_FRAGMENT_UNIFORM_VECTORS );

		const vertexTextures = maxVertexTextures > 0;
		const floatFragmentTextures = isWebGL2 || !! extensions.get( 'OES_texture_float' );
		const floatVertexTextures = vertexTextures && floatFragmentTextures;

		const maxSamples = isWebGL2 ? gl.getParameter( gl.MAX_SAMPLES ) : 0;

		this.isWebGL2 = isWebGL2;

		this.precision = precision,
		this.logarithmicDepthBuffer = logarithmicDepthBuffer;

		this.maxTextures = maxTextures;
		this.maxVertexTextures = maxVertexTextures;
		this.maxTextureSize = maxTextureSize;
		this.maxCubemapSize = maxCubemapSize;

		this.maxAttributes = maxAttributes;
		this.maxVertexUniforms = maxVertexUniforms;
		this.maxVaryings = maxVaryings;
		this.maxFragmentUniforms = maxFragmentUniforms;

		this.vertexTextures = vertexTextures;
		this.floatFragmentTextures = floatFragmentTextures;
		this.floatVertexTextures = floatVertexTextures;

		this.maxSamples = maxSamples;
	}

	getMaxAnisotropy() {

		if ( this.maxAnisotropy !== undefined ) return this.maxAnisotropy;

		const extension = this.extensions.get( 'EXT_texture_filter_anisotropic' );

		if ( extension !== null ) {

			this.maxAnisotropy = this.gl.getParameter( extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT );

		} else {

			this.maxAnisotropy = 0;

		}

		return this.maxAnisotropy;

	}

	getMaxPrecision( precision ) {

		if ( precision === 'highp' ) {

			if ( this.gl.getShaderPrecisionFormat( this.gl.VERTEX_SHADER, this.gl.HIGH_FLOAT ).precision > 0 &&
			this.gl.getShaderPrecisionFormat( this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT ).precision > 0 ) {

				return 'highp';

			}

			precision = 'mediump';

		}

		if ( precision === 'mediump' ) {

			if ( this.gl.getShaderPrecisionFormat( this.gl.VERTEX_SHADER, this.gl.MEDIUM_FLOAT ).precision > 0 &&
				 this.gl.getShaderPrecisionFormat( this.gl.FRAGMENT_SHADER, this.gl.MEDIUM_FLOAT ).precision > 0 ) {

				return 'mediump';

			}

		}

		return 'lowp';

	}

}


export { WebGLCapabilities };
