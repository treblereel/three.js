import { LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter, NearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter, RGBFormat, RGBAFormat, DepthFormat, DepthStencilFormat, UnsignedShortType, UnsignedIntType, UnsignedInt248Type, FloatType, HalfFloatType, MirroredRepeatWrapping, ClampToEdgeWrapping, RepeatWrapping } from '../../constants.js';
import { MathUtils } from '../../math/MathUtils.js';


class WebGLTextures {

	constructor( _gl, extensions, state, properties, capabilities, utils, info ) {

		this._gl = _gl;
		this.extensions = extensions;
		this.state = state;
		this.properties = properties;
		this.utils = utils;
		this.info = info;

		const wrappingToGL = {
			[ RepeatWrapping ]: _gl.REPEAT,
			[ ClampToEdgeWrapping ]: _gl.CLAMP_TO_EDGE,
			[ MirroredRepeatWrapping ]: _gl.MIRRORED_REPEAT
		};

		this.wrappingToGL = wrappingToGL;
		
		const filterToGL = {
			[ NearestFilter ]: _gl.NEAREST,
			[ NearestMipmapNearestFilter ]: _gl.NEAREST_MIPMAP_NEAREST,
			[ NearestMipmapLinearFilter ]: _gl.NEAREST_MIPMAP_LINEAR,
		
			[ LinearFilter ]: _gl.LINEAR,
			[ LinearMipmapNearestFilter ]: _gl.LINEAR_MIPMAP_NEAREST,
			[ LinearMipmapLinearFilter ]: _gl.LINEAR_MIPMAP_LINEAR
		};

		this.filterToGL = filterToGL;


		const isWebGL2 = capabilities.isWebGL2;
		this.isWebGL2 = isWebGL2;

		const maxTextures = capabilities.maxTextures;
		this.maxTextures = maxTextures;

		const maxCubemapSize = capabilities.maxCubemapSize;
		this.maxCubemapSize = maxCubemapSize;

		const maxTextureSize = capabilities.maxTextureSize;
		this.maxTextureSize = maxTextureSize;

		const maxSamples = capabilities.maxSamples;
		this.maxSamples = maxSamples;


		const _videoTextures = new WeakMap();
		this._videoTextures = _videoTextures;

		this._canvas = undefined;
		this.textureUnits = 0;

		// backwards compatibility

		this.warnedTexture2D = false;
		this.warnedTextureCube = false;

		// cordova iOS (as of 5.0) still uses UIWebView, which provides OffscreenCanvas,
		// also OffscreenCanvas.getContext("webgl"), but not OffscreenCanvas.getContext("2d")!
		// Some implementations may only implement OffscreenCanvas partially (e.g. lacking 2d).

		let useOffscreenCanvas = false;
		this.useOffscreenCanvas = useOffscreenCanvas;

		try {

			useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined'
				&& ( new OffscreenCanvas( 1, 1 ).getContext( '2d' ) ) !== null;

		} catch ( err ) {

			// Ignore any errors

		}
	}

	createCanvas( width, height ) {

		// Use OffscreenCanvas when available. Specially needed in web workers

		return this.useOffscreenCanvas ?
			new OffscreenCanvas( width, height ) :
			document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );

	}

	resizeImage( image, needsPowerOfTwo, needsNewCanvas, maxSize ) {

		let scale = 1;

		// handle case if texture exceeds max size

		if ( image.width > maxSize || image.height > maxSize ) {

			scale = maxSize / Math.max( image.width, image.height );

		}

		// only perform resize if necessary

		if ( scale < 1 || needsPowerOfTwo === true ) {

			// only perform resize for certain image types

			if ( ( typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement ) ||
				( typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ) ||
				( typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ) ) {

				const floor = needsPowerOfTwo ? MathUtils.floorPowerOfTwo : Math.floor;

				const width = floor( scale * image.width );
				const height = floor( scale * image.height );

				if ( this._canvas === undefined ) this._canvas = this.createCanvas( width, height );

				// cube textures can't reuse the same canvas

				const canvas = needsNewCanvas ? this.createCanvas( width, height ) : this._canvas;

				canvas.width = width;
				canvas.height = height;

				const context = canvas.getContext( '2d' );
				context.drawImage( image, 0, 0, width, height );

				console.warn( 'THREE.WebGLRenderer: Texture has been resized from (' + image.width + 'x' + image.height + ') to (' + width + 'x' + height + ').' );

				return canvas;

			} else {

				if ( 'data' in image ) {

					console.warn( 'THREE.WebGLRenderer: Image in DataTexture is too big (' + image.width + 'x' + image.height + ').' );

				}

				return image;

			}

		}

		return image;

	}

	isPowerOfTwo( image ) {

		return MathUtils.isPowerOfTwo( image.width ) && MathUtils.isPowerOfTwo( image.height );

	}

	textureNeedsPowerOfTwo( texture ) {

		if ( this.isWebGL2 ) return false;

		return ( texture.wrapS !== ClampToEdgeWrapping || texture.wrapT !== ClampToEdgeWrapping ) ||
			( texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter );

	}

	textureNeedsGenerateMipmaps( texture, supportsMips ) {

		return texture.generateMipmaps && supportsMips &&
			texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter;

	}

	generateMipmap( target, texture, width, height ) {

		this._gl.generateMipmap( target );

		const textureProperties = this.properties.get( texture );

		// Note: Math.log( x ) * Math.LOG2E used instead of Math.log2( x ) which is not supported by IE11
		textureProperties.__maxMipLevel = Math.log( Math.max( width, height ) ) * Math.LOG2E;

	}

	getInternalFormat( internalFormatName, glFormat, glType ) {

		if ( this.isWebGL2 === false ) return glFormat;

		if ( internalFormatName !== null ) {

			if ( this._gl[ internalFormatName ] !== undefined ) return this._gl[ internalFormatName ];

			console.warn( 'THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format \'' + internalFormatName + '\'' );

		}

		let internalFormat = glFormat;

		if ( this.glFormat === this._gl.RED ) {

			if ( glType === this._gl.FLOAT ) internalFormat = this._gl.R32F;
			if ( glType === this._gl.HALF_FLOAT ) internalFormat = this._gl.R16F;
			if ( glType === this._gl.UNSIGNED_BYTE ) internalFormat = this._gl.R8;

		}

		if ( glFormat === this._gl.RGB ) {

			if ( glType === this._gl.FLOAT ) internalFormat = this._gl.RGB32F;
			if ( glType === this._gl.HALF_FLOAT ) internalFormat = this._gl.RGB16F;
			if ( glType === this._gl.UNSIGNED_BYTE ) internalFormat = this._gl.RGB8;

		}

		if ( glFormat === this._gl.RGBA ) {

			if ( glType === this._gl.FLOAT ) internalFormat = this._gl.RGBA32F;
			if ( glType === this._gl.HALF_FLOAT ) internalFormat = this._gl.RGBA16F;
			if ( glType === this._gl.UNSIGNED_BYTE ) internalFormat = this._gl.RGBA8;

		}

		if ( internalFormat === this._gl.R16F || internalFormat === this._gl.R32F ||
			internalFormat === this._gl.RGBA16F || internalFormat === this._gl.RGBA32F ) {

				this.extensions.get( 'EXT_color_buffer_float' );

		}

		return internalFormat;

	}

	// Fallback filters for non-power-of-2 textures

	filterFallback( f ) {

		if ( f === NearestFilter || f === NearestMipmapNearestFilter || f === NearestMipmapLinearFilter ) {

			return this._gl.NEAREST;

		}

		return this._gl.LINEAR;

	}

	//

	onTextureDispose( event ) {

		const texture = event.target;

		texture.removeEventListener( 'dispose', this.onTextureDispose );

		this.deallocateTexture( texture );

		if ( texture.isVideoTexture ) {

			this._videoTextures.delete( texture );

		}

		this.info.memory.textures --;

	}

	onRenderTargetDispose( event ) {

		const renderTarget = event.target;

		renderTarget.removeEventListener( 'dispose', this.onRenderTargetDispose );

		this.deallocateRenderTarget( renderTarget );

		this.info.memory.textures --;

	}

	//

	deallocateTexture( texture ) {

		const textureProperties = this.properties.get( texture );

		if ( textureProperties.__webglInit === undefined ) return;

		this._gl.deleteTexture( textureProperties.__webglTexture );

		this.properties.remove( texture );

	}

	deallocateRenderTarget( renderTarget ) {

		const renderTargetProperties = this.properties.get( renderTarget );
		const textureProperties = this.properties.get( renderTarget.texture );

		if ( ! renderTarget ) return;

		if ( textureProperties.__webglTexture !== undefined ) {

			this._gl.deleteTexture( textureProperties.__webglTexture );

		}

		if ( renderTarget.depthTexture ) {

			renderTarget.depthTexture.dispose();

		}

		if ( renderTarget.isWebGLCubeRenderTarget ) {

			for ( let i = 0; i < 6; i ++ ) {

				this._gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer[ i ] );
				if ( renderTargetProperties.__webglDepthbuffer ) this._gl.deleteRenderbuffer( renderTargetProperties.__webglDepthbuffer[ i ] );

			}

		} else {

			this._gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer );
			if ( renderTargetProperties.__webglDepthbuffer ) this._gl.deleteRenderbuffer( renderTargetProperties.__webglDepthbuffer );
			if ( renderTargetProperties.__webglMultisampledFramebuffer ) this._gl.deleteFramebuffer( renderTargetProperties.__webglMultisampledFramebuffer );
			if ( renderTargetProperties.__webglColorRenderbuffer ) this._gl.deleteRenderbuffer( renderTargetProperties.__webglColorRenderbuffer );
			if ( renderTargetProperties.__webglDepthRenderbuffer )this. _gl.deleteRenderbuffer( renderTargetProperties.__webglDepthRenderbuffer );

		}

		this.properties.remove( renderTarget.texture );
		this.properties.remove( renderTarget );

	}

	resetTextureUnits() {

		this.textureUnits = 0;

	}

	allocateTextureUnit() {

		const textureUnit = this.textureUnits;

		if ( textureUnit >= this.maxTextures ) {

			console.warn( 'THREE.WebGLTextures: Trying to use ' + textureUnit + ' texture units while this GPU supports only ' + this.maxTextures );

		}

		this.textureUnits += 1;

		return textureUnit;

	}

	//

	setTexture2D( texture, slot ) {

		const textureProperties = this.properties.get( texture );

		if ( texture.isVideoTexture ) this.updateVideoTexture( texture );

		if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

			const image = texture.image;

			if ( image === undefined ) {

				console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is undefined' );

			} else if ( image.complete === false ) {

				console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is incomplete' );

			} else {

				this.uploadTexture( textureProperties, texture, slot );
				return;

			}

		}

		this.state.activeTexture( this._gl.TEXTURE0 + slot );
		this.state.bindTexture(this._gl.TEXTURE_2D, textureProperties.__webglTexture );

	}

	setTexture2DArray( texture, slot ) {

		const textureProperties = this.properties.get( texture );

		if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

			this.uploadTexture( textureProperties, texture, slot );
			return;

		}

		this.state.activeTexture( this._gl.TEXTURE0 + slot );
		this.state.bindTexture( this._gl.TEXTURE_2D_ARRAY, textureProperties.__webglTexture );

	}

	setTexture3D( texture, slot ) {

		const textureProperties = this.properties.get( texture );

		if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

			this.uploadTexture( textureProperties, texture, slot );
			return;

		}

		this.state.activeTexture( this._gl.TEXTURE0 + slot );
		this.state.bindTexture( this._gl.TEXTURE_3D, textureProperties.__webglTexture );

	}

	setTextureCube( texture, slot ) {

		const textureProperties = this.properties.get( texture );

		if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

			this.uploadCubeTexture( textureProperties, texture, slot );
			return;

		}

		this.state.activeTexture( this._gl.TEXTURE0 + slot );
		this.state.bindTexture( this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture );

	}

	setTextureParameters( textureType, texture, supportsMips ) {

		if ( supportsMips ) {

			this._gl.texParameteri( textureType, this._gl.TEXTURE_WRAP_S, this.wrappingToGL[ texture.wrapS ] );
			this._gl.texParameteri( textureType, this._gl.TEXTURE_WRAP_T, this.wrappingToGL[ texture.wrapT ] );

			if ( textureType === this._gl.TEXTURE_3D || textureType === this._gl.TEXTURE_2D_ARRAY ) {

				this._gl.texParameteri( textureType, this._gl.TEXTURE_WRAP_R, this.wrappingToGL[ texture.wrapR ] );

			}

			this._gl.texParameteri( textureType, this._gl.TEXTURE_MAG_FILTER, this.filterToGL[ texture.magFilter ] );
			this._gl.texParameteri( textureType, this._gl.TEXTURE_MIN_FILTER, this.filterToGL[ texture.minFilter ] );

		} else {

			this._gl.texParameteri( textureType, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE );
			this._gl.texParameteri( textureType, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE );

			if ( textureType === this._gl.TEXTURE_3D || textureType === this._gl.TEXTURE_2D_ARRAY ) {

				this._gl.texParameteri( textureType, this._gl.TEXTURE_WRAP_R, this._gl.CLAMP_TO_EDGE );

			}

			if ( texture.wrapS !== ClampToEdgeWrapping || texture.wrapT !== ClampToEdgeWrapping ) {

				console.warn( 'THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.' );

			}

			this._gl.texParameteri( textureType, this._gl.TEXTURE_MAG_FILTER, this.filterFallback( texture.magFilter ) );
			this._gl.texParameteri( textureType, this._gl.TEXTURE_MIN_FILTER, this.filterFallback( texture.minFilter ) );

			if ( texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter ) {

				console.warn( 'THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.' );

			}

		}

		const extension = this.extensions.get( 'EXT_texture_filter_anisotropic' );

		if ( extension ) {

			if ( texture.type === FloatType && this.extensions.get( 'OES_texture_float_linear' ) === null ) return;
			if ( texture.type === HalfFloatType && ( this.isWebGL2 || this.extensions.get( 'OES_texture_half_float_linear' ) ) === null ) return;

			if ( texture.anisotropy > 1 || this.properties.get( texture ).__currentAnisotropy ) {

				this._gl.texParameterf( textureType, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min( texture.anisotropy, this.capabilities.getMaxAnisotropy() ) );
				this.properties.get( texture ).__currentAnisotropy = texture.anisotropy;

			}

		}

	}

	initTexture( textureProperties, texture ) {

		if ( textureProperties.__webglInit === undefined ) {

			textureProperties.__webglInit = true;

			texture.addEventListener( 'dispose', this.onTextureDispose );

			textureProperties.__webglTexture = this._gl.createTexture();

			this.info.memory.textures ++;

		}

	}

	uploadTexture( textureProperties, texture, slot ) {

		let textureType = this._gl.TEXTURE_2D;

		if ( texture.isDataTexture2DArray ) textureType = this._gl.TEXTURE_2D_ARRAY;
		if ( texture.isDataTexture3D ) textureType = this._gl.TEXTURE_3D;

		this.initTexture( textureProperties, texture );

		this.state.activeTexture( this._gl.TEXTURE0 + slot );
		this.state.bindTexture( textureType, textureProperties.__webglTexture );

		this._gl.pixelStorei( this._gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );
		this._gl.pixelStorei( this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha );
		this._gl.pixelStorei( this._gl.UNPACK_ALIGNMENT, texture.unpackAlignment );

		const needsPowerOfTwo = this.textureNeedsPowerOfTwo( texture ) && this.isPowerOfTwo( texture.image ) === false;
		const image = this.resizeImage( texture.image, needsPowerOfTwo, false, this.maxTextureSize );

		const supportsMips = this.isPowerOfTwo( image ) || this.isWebGL2,
			glFormat = this.utils.convert( texture.format );

		let glType = this.utils.convert( texture.type ),
			glInternalFormat = this.getInternalFormat( texture.internalFormat, glFormat, this.glType );

			this.setTextureParameters( textureType, texture, supportsMips );

		let mipmap;
		const mipmaps = texture.mipmaps;

		if ( texture.isDepthTexture ) {

			// populate depth texture with dummy data

			glInternalFormat = this._gl.DEPTH_COMPONENT;

			if ( this.isWebGL2 ) {

				if ( texture.type === FloatType ) {

					glInternalFormat = this._gl.DEPTH_COMPONENT32F;

				} else if ( texture.type === UnsignedIntType ) {

					glInternalFormat = this._gl.DEPTH_COMPONENT24;

				} else if ( texture.type === UnsignedInt248Type ) {

					glInternalFormat = this._gl.DEPTH24_STENCIL8;

				} else {

					glInternalFormat = this._gl.DEPTH_COMPONENT16; // WebGL2 requires sized internalformat for glTexImage2D

				}

			} else {

				if ( texture.type === FloatType ) {

					console.error( 'WebGLRenderer: Floating point depth texture requires WebGL2.' );

				}

			}

			// validation checks for WebGL 1

			if ( texture.format === DepthFormat && glInternalFormat === this._gl.DEPTH_COMPONENT ) {

				// The error INVALID_OPERATION is generated by texImage2D if format and internalformat are
				// DEPTH_COMPONENT and type is not UNSIGNED_SHORT or UNSIGNED_INT
				// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
				if ( texture.type !== UnsignedShortType && texture.type !== UnsignedIntType ) {

					console.warn( 'THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture.' );

					texture.type = UnsignedShortType;
					glType = this.utils.convert( texture.type );

				}

			}

			if ( texture.format === DepthStencilFormat && glInternalFormat === this._gl.DEPTH_COMPONENT ) {

				// Depth stencil textures need the DEPTH_STENCIL internal format
				// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
				glInternalFormat = this._gl.DEPTH_STENCIL;

				// The error INVALID_OPERATION is generated by texImage2D if format and internalformat are
				// DEPTH_STENCIL and type is not UNSIGNED_INT_24_8_WEBGL.
				// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
				if ( texture.type !== UnsignedInt248Type ) {

					console.warn( 'THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture.' );

					texture.type = UnsignedInt248Type;
					glType = this.utils.convert( texture.type );

				}

			}

			//

			this.state.texImage2D( this._gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, null );

		} else if ( texture.isDataTexture ) {

			// use manually created mipmaps if available
			// if there are no manual mipmaps
			// set 0 level mipmap and then use GL to generate other mipmap levels

			if ( mipmaps.length > 0 && supportsMips ) {

				for ( let i = 0, il = mipmaps.length; i < il; i ++ ) {

					mipmap = mipmaps[ i ];
					this.state.texImage2D( this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );

				}

				texture.generateMipmaps = false;
				textureProperties.__maxMipLevel = mipmaps.length - 1;

			} else {

				this.state.texImage2D( this._gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, image.data );
				textureProperties.__maxMipLevel = 0;

			}

		} else if ( texture.isCompressedTexture ) {

			for ( let i = 0, il = mipmaps.length; i < il; i ++ ) {

				mipmap = mipmaps[ i ];

				if ( texture.format !== RGBAFormat && texture.format !== RGBFormat ) {

					if ( glFormat !== null ) {

						this.state.compressedTexImage2D( this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, mipmap.data );

					} else {

						console.warn( 'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()' );

					}

				} else {

					this.state.texImage2D( this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );

				}

			}

			textureProperties.__maxMipLevel = mipmaps.length - 1;

		} else if ( texture.isDataTexture2DArray ) {

			this.state.texImage3D( this._gl.TEXTURE_2D_ARRAY, 0, glInternalFormat, image.width, image.height, image.depth, 0, glFormat, glType, image.data );
			textureProperties.__maxMipLevel = 0;

		} else if ( texture.isDataTexture3D ) {

			this.state.texImage3D( this._gl.TEXTURE_3D, 0, glInternalFormat, image.width, image.height, image.depth, 0, glFormat, glType, image.data );
			textureProperties.__maxMipLevel = 0;

		} else {

			// regular Texture (image, video, canvas)

			// use manually created mipmaps if available
			// if there are no manual mipmaps
			// set 0 level mipmap and then use GL to generate other mipmap levels

			if ( mipmaps.length > 0 && supportsMips ) {

				for ( let i = 0, il = mipmaps.length; i < il; i ++ ) {

					mipmap = mipmaps[ i ];
					this.state.texImage2D( this._gl.TEXTURE_2D, i, glInternalFormat, glFormat, glType, mipmap );

				}

				texture.generateMipmaps = false;
				textureProperties.__maxMipLevel = mipmaps.length - 1;

			} else {

				this.state.texImage2D( this._gl.TEXTURE_2D, 0, glInternalFormat, glFormat, glType, image );
				textureProperties.__maxMipLevel = 0;

			}

		}

		if ( this.textureNeedsGenerateMipmaps( texture, supportsMips ) ) {

			this.generateMipmap( textureType, texture, image.width, image.height );

		}

		textureProperties.__version = texture.version;

		if ( texture.onUpdate ) texture.onUpdate( texture );

	}

	uploadCubeTexture( textureProperties, texture, slot ) {

		if ( texture.image.length !== 6 ) return;

		this.initTexture( textureProperties, texture );

		this.state.activeTexture( this._gl.TEXTURE0 + slot );
		this.state.bindTexture( this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture );

		this._gl.pixelStorei( this._gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );

		const isCompressed = ( texture && ( texture.isCompressedTexture || texture.image[ 0 ].isCompressedTexture ) );
		const isDataTexture = ( texture.image[ 0 ] && texture.image[ 0 ].isDataTexture );

		const cubeImage = [];

		for ( let i = 0; i < 6; i ++ ) {

			if ( ! isCompressed && ! isDataTexture ) {

				cubeImage[ i ] = this.resizeImage( texture.image[ i ], false, true, this.maxCubemapSize );

			} else {

				cubeImage[ i ] = isDataTexture ? texture.image[ i ].image : texture.image[ i ];

			}

		}

		const image = cubeImage[ 0 ],
			supportsMips = this.isPowerOfTwo( image ) || this.isWebGL2,
			glFormat = this.utils.convert( texture.format ),
			glType = this.utils.convert( texture.type ),
			glInternalFormat = this.getInternalFormat( texture.internalFormat, glFormat, glType );

			this.setTextureParameters( this._gl.TEXTURE_CUBE_MAP, texture, supportsMips );

		let mipmaps;

		if ( isCompressed ) {

			for ( let i = 0; i < 6; i ++ ) {

				mipmaps = cubeImage[ i ].mipmaps;

				for ( let j = 0; j < mipmaps.length; j ++ ) {

					const mipmap = mipmaps[ j ];

					if ( texture.format !== RGBAFormat && texture.format !== RGBFormat ) {

						if ( glFormat !== null ) {

							this.state.compressedTexImage2D( this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glInternalFormat, mipmap.width, mipmap.height, 0, mipmap.data );

						} else {

							console.warn( 'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()' );

						}

					} else {

						this.state.texImage2D( this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glInternalFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );

					}

				}

			}

			textureProperties.__maxMipLevel = mipmaps.length - 1;

		} else {

			mipmaps = texture.mipmaps;

			for ( let i = 0; i < 6; i ++ ) {

				if ( isDataTexture ) {

					this.state.texImage2D( this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glInternalFormat, cubeImage[ i ].width, cubeImage[ i ].height, 0, glFormat, glType, cubeImage[ i ].data );

					for ( let j = 0; j < mipmaps.length; j ++ ) {

						const mipmap = mipmaps[ j ];
						const mipmapImage = mipmap.image[ i ].image;

						this.state.texImage2D( this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j + 1, glInternalFormat, mipmapImage.width, mipmapImage.height, 0, glFormat, glType, mipmapImage.data );

					}

				} else {

					this.state.texImage2D( this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glInternalFormat, glFormat, glType, cubeImage[ i ] );

					for ( let j = 0; j < mipmaps.length; j ++ ) {

						const mipmap = mipmaps[ j ];

						this.state.texImage2D( this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j + 1, glInternalFormat, glFormat, glType, mipmap.image[ i ] );

					}

				}

			}

			textureProperties.__maxMipLevel = mipmaps.length;

		}

		if ( this.textureNeedsGenerateMipmaps( texture, supportsMips ) ) {

			// We assume images for cube map have the same size.
			this.generateMipmap( this._gl.TEXTURE_CUBE_MAP, texture, image.width, image.height );

		}

		textureProperties.__version = texture.version;

		if ( texture.onUpdate ) texture.onUpdate( texture );

	}

	// Render targets

	// Setup storage for target texture and bind it to correct framebuffer
	setupFrameBufferTexture( framebuffer, renderTarget, attachment, textureTarget ) {

		const glFormat = this.utils.convert( renderTarget.texture.format );
		const glType = this.utils.convert( renderTarget.texture.type );
		const glInternalFormat = this.getInternalFormat( renderTarget.texture.internalFormat, glFormat, glType );
		this.state.texImage2D( textureTarget, 0, glInternalFormat, renderTarget.width, renderTarget.height, 0, glFormat, glType, null );
		this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, framebuffer );
		this._gl.framebufferTexture2D( this._gl.FRAMEBUFFER, attachment, textureTarget, this.properties.get( renderTarget.texture ).__webglTexture, 0 );
		this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, null );

	}

	// Setup storage for internal depth/stencil buffers and bind to correct framebuffer
	setupRenderBufferStorage( renderbuffer, renderTarget, isMultisample ) {

		this._gl.bindRenderbuffer( this._gl.RENDERBUFFER, renderbuffer );

		if ( renderTarget.depthBuffer && ! renderTarget.stencilBuffer ) {

			let glInternalFormat = this._gl.DEPTH_COMPONENT16;

			if ( isMultisample ) {

				const depthTexture = renderTarget.depthTexture;

				if ( depthTexture && depthTexture.isDepthTexture ) {

					if ( depthTexture.type === FloatType ) {

						glInternalFormat = this._gl.DEPTH_COMPONENT32F;

					} else if ( depthTexture.type === UnsignedIntType ) {

						glInternalFormat = this._gl.DEPTH_COMPONENT24;

					}

				}

				const samples = this.getRenderTargetSamples( renderTarget );

				this._gl.renderbufferStorageMultisample( this._gl.RENDERBUFFER, samples, glInternalFormat, renderTarget.width, renderTarget.height );

			} else {

				this._gl.renderbufferStorage( this._gl.RENDERBUFFER, glInternalFormat, renderTarget.width, renderTarget.height );

			}

			this._gl.framebufferRenderbuffer( this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, renderbuffer );

		} else if ( renderTarget.depthBuffer && renderTarget.stencilBuffer ) {

			if ( isMultisample ) {

				const samples = this.getRenderTargetSamples( renderTarget );

				this._gl.renderbufferStorageMultisample( this._gl.RENDERBUFFER, samples, this._gl.DEPTH24_STENCIL8, renderTarget.width, renderTarget.height );

			} else {

				this._gl.renderbufferStorage( this._gl.RENDERBUFFER, this._gl.DEPTH_STENCIL, renderTarget.width, renderTarget.height );

			}


			this._gl.framebufferRenderbuffer( this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT, this._gl.RENDERBUFFER, renderbuffer );

		} else {

			const glFormat = this.utils.convert( renderTarget.texture.format );
			const glType = this.utils.convert( renderTarget.texture.type );
			const glInternalFormat = this.getInternalFormat( renderTarget.texture.internalFormat, glFormat, glType );

			if ( isMultisample ) {

				const samples = this.getRenderTargetSamples( renderTarget );

				this._gl.renderbufferStorageMultisample( this._gl.RENDERBUFFER, samples, glInternalFormat, renderTarget.width, renderTarget.height );

			} else {

				this._gl.renderbufferStorage( this._gl.RENDERBUFFER, glInternalFormat, renderTarget.width, renderTarget.height );

			}

		}

		this._gl.bindRenderbuffer( this._gl.RENDERBUFFER, null );

	}

	// Setup resources for a Depth Texture for a FBO (needs an extension)
	setupDepthTexture( framebuffer, renderTarget ) {

		const isCube = ( renderTarget && renderTarget.isWebGLCubeRenderTarget );
		if ( isCube ) throw new Error( 'Depth Texture with cube render targets is not supported' );

		this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, framebuffer );

		if ( ! ( renderTarget.depthTexture && renderTarget.depthTexture.isDepthTexture ) ) {

			throw new Error( 'renderTarget.depthTexture must be an instance of THREE.DepthTexture' );

		}

		// upload an empty depth texture with framebuffer size
		if ( ! this.properties.get( renderTarget.depthTexture ).__webglTexture ||
				renderTarget.depthTexture.image.width !== renderTarget.width ||
				renderTarget.depthTexture.image.height !== renderTarget.height ) {

			renderTarget.depthTexture.image.width = renderTarget.width;
			renderTarget.depthTexture.image.height = renderTarget.height;
			renderTarget.depthTexture.needsUpdate = true;

		}

		this.setTexture2D( renderTarget.depthTexture, 0 );

		const webglDepthTexture = this.properties.get( renderTarget.depthTexture ).__webglTexture;

		if ( renderTarget.depthTexture.format === DepthFormat ) {

			this._gl.framebufferTexture2D( this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.TEXTURE_2D, webglDepthTexture, 0 );

		} else if ( renderTarget.depthTexture.format === DepthStencilFormat ) {

			this._gl.framebufferTexture2D( this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT, this._gl.TEXTURE_2D, webglDepthTexture, 0 );

		} else {

			throw new Error( 'Unknown depthTexture format' );

		}

	}

	// Setup GL resources for a non-texture depth buffer
	setupDepthRenderbuffer( renderTarget ) {

		const renderTargetProperties = this.properties.get( renderTarget );

		const isCube = ( renderTarget.isWebGLCubeRenderTarget === true );

		if ( renderTarget.depthTexture ) {

			if ( isCube ) throw new Error( 'target.depthTexture not supported in Cube render targets' );

			this.setupDepthTexture( renderTargetProperties.__webglFramebuffer, renderTarget );

		} else {

			if ( isCube ) {

				renderTargetProperties.__webglDepthbuffer = [];

				for ( let i = 0; i < 6; i ++ ) {

					this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer[ i ] );
					renderTargetProperties.__webglDepthbuffer[ i ] = this._gl.createRenderbuffer();
					this.setupRenderBufferStorage( renderTargetProperties.__webglDepthbuffer[ i ], renderTarget, false );

				}

			} else {

				this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer );
				renderTargetProperties.__webglDepthbuffer = this._gl.createRenderbuffer();
				this.setupRenderBufferStorage( renderTargetProperties.__webglDepthbuffer, renderTarget, false );

			}

		}

		this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, null );

	}

	// Set up GL resources for the render target
	setupRenderTarget( renderTarget ) {

		const renderTargetProperties = this.properties.get( renderTarget );
		const textureProperties = this.properties.get( renderTarget.texture );

		renderTarget.addEventListener( 'dispose', this.onRenderTargetDispose );

		textureProperties.__webglTexture = this._gl.createTexture();

		this.info.memory.textures ++;

		const isCube = ( renderTarget.isWebGLCubeRenderTarget === true );
		const isMultisample = ( renderTarget.isWebGLMultisampleRenderTarget === true );
		const supportsMips = this.isPowerOfTwo( renderTarget ) || this.isWebGL2;

		// Handles WebGL2 RGBFormat fallback - #18858

		if ( this.isWebGL2 && renderTarget.texture.format === RGBFormat && ( renderTarget.texture.type === FloatType || renderTarget.texture.type === HalfFloatType ) ) {

			renderTarget.texture.format = RGBAFormat;

			console.warn( 'THREE.WebGLRenderer: Rendering to textures with RGB format is not supported. Using RGBA format instead.' );

		}

		// Setup framebuffer

		if ( isCube ) {

			renderTargetProperties.__webglFramebuffer = [];

			for ( let i = 0; i < 6; i ++ ) {

				renderTargetProperties.__webglFramebuffer[ i ] = this._gl.createFramebuffer();

			}

		} else {

			renderTargetProperties.__webglFramebuffer = this._gl.createFramebuffer();

			if ( isMultisample ) {

				if ( this.isWebGL2 ) {

					renderTargetProperties.__webglMultisampledFramebuffer = this._gl.createFramebuffer();
					renderTargetProperties.__webglColorRenderbuffer = this._gl.createRenderbuffer();

					this._gl.bindRenderbuffer( this._gl.RENDERBUFFER, renderTargetProperties.__webglColorRenderbuffer );

					const glFormat = this.utils.convert( renderTarget.texture.format );
					const glType = this.utils.convert( renderTarget.texture.type );
					const glInternalFormat = this.getInternalFormat( renderTarget.texture.internalFormat, glFormat, glType );
					const samples = this.getRenderTargetSamples( renderTarget );
					this._gl.renderbufferStorageMultisample( this._gl.RENDERBUFFER, samples, glInternalFormat, renderTarget.width, renderTarget.height );

					this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer );
					this._gl.framebufferRenderbuffer( this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.RENDERBUFFER, renderTargetProperties.__webglColorRenderbuffer );
					this._gl.bindRenderbuffer( this._gl.RENDERBUFFER, null );

					if ( renderTarget.depthBuffer ) {

						renderTargetProperties.__webglDepthRenderbuffer = this._gl.createRenderbuffer();
						this.setupRenderBufferStorage( renderTargetProperties.__webglDepthRenderbuffer, renderTarget, true );

					}

					this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, null );


				} else {

					console.warn( 'THREE.WebGLRenderer: WebGLMultisampleRenderTarget can only be used with WebGL2.' );

				}

			}

		}

		// Setup color buffer

		if ( isCube ) {

			this.state.bindTexture( this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture );
			this.setTextureParameters( this._gl.TEXTURE_CUBE_MAP, renderTarget.texture, supportsMips );

			for ( let i = 0; i < 6; i ++ ) {

				this.setupFrameBufferTexture( renderTargetProperties.__webglFramebuffer[ i ], renderTarget, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i );

			}

			if ( this.textureNeedsGenerateMipmaps( renderTarget.texture, supportsMips ) ) {

				this.generateMipmap( this._gl.TEXTURE_CUBE_MAP, renderTarget.texture, renderTarget.width, renderTarget.height );

			}

			this.state.bindTexture( this._gl.TEXTURE_CUBE_MAP, null );

		} else {

			this.state.bindTexture( this._gl.TEXTURE_2D, textureProperties.__webglTexture );
			this.setTextureParameters( this._gl.TEXTURE_2D, renderTarget.texture, supportsMips );
			this.setupFrameBufferTexture( renderTargetProperties.__webglFramebuffer, renderTarget, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D );

			if ( this.textureNeedsGenerateMipmaps( renderTarget.texture, supportsMips ) ) {

				this.generateMipmap( this._gl.TEXTURE_2D, renderTarget.texture, renderTarget.width, renderTarget.height );

			}

			this.state.bindTexture( this._gl.TEXTURE_2D, null );

		}

		// Setup depth and stencil buffers

		if ( renderTarget.depthBuffer ) {

			this.setupDepthRenderbuffer( renderTarget );

		}

	}

	updateRenderTargetMipmap( renderTarget ) {

		const texture = renderTarget.texture;
		const supportsMips = this.isPowerOfTwo( renderTarget ) || this.isWebGL2;

		if ( this.textureNeedsGenerateMipmaps( texture, supportsMips ) ) {

			const target = renderTarget.isWebGLCubeRenderTarget ? this._gl.TEXTURE_CUBE_MAP : this._gl.TEXTURE_2D;
			const webglTexture = this.properties.get( texture ).__webglTexture;

			this.state.bindTexture( target, webglTexture );
			this.generateMipmap( target, texture, renderTarget.width, renderTarget.height );
			this.state.bindTexture( target, null );

		}

	}

	updateMultisampleRenderTarget( renderTarget ) {

		if ( renderTarget.isWebGLMultisampleRenderTarget ) {

			if ( this.isWebGL2 ) {

				const renderTargetProperties = this.properties.get( renderTarget );

				this._gl.bindFramebuffer( this._gl.READ_FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer );
				this._gl.bindFramebuffer( this._gl.DRAW_FRAMEBUFFER, renderTargetProperties.__webglFramebuffer );

				const width = renderTarget.width;
				const height = renderTarget.height;
				let mask = this._gl.COLOR_BUFFER_BIT;

				if ( renderTarget.depthBuffer ) mask |= this._gl.DEPTH_BUFFER_BIT;
				if ( renderTarget.stencilBuffer ) mask |= this._gl.STENCIL_BUFFER_BIT;

				this._gl.blitFramebuffer( 0, 0, width, height, 0, 0, width, height, mask, this._gl.NEAREST );

				this._gl.bindFramebuffer( this._gl.FRAMEBUFFER, renderTargetProperties.__webglMultisampledFramebuffer ); // see #18905

			} else {

				console.warn( 'THREE.WebGLRenderer: WebGLMultisampleRenderTarget can only be used with WebGL2.' );

			}

		}

	}

	getRenderTargetSamples( renderTarget ) {

		return ( this.isWebGL2 && renderTarget.isWebGLMultisampleRenderTarget ) ?
			Math.min( this.maxSamples, renderTarget.samples ) : 0;

	}

	updateVideoTexture( texture ) {

		const frame = this.info.render.frame;

		// Check the last frame we updated the VideoTexture

		if ( this._videoTextures.get( texture ) !== frame ) {

			this._videoTextures.set( texture, frame );
			texture.update();

		}

	}

	safeSetTexture2D( texture, slot ) {

		if ( texture && texture.isWebGLRenderTarget ) {

			if ( this.warnedTexture2D === false ) {

				console.warn( 'THREE.WebGLTextures.safeSetTexture2D: don\'t use render targets as textures. Use their .texture property instead.' );
				this.warnedTexture2D = true;

			}

			texture = texture.texture;

		}

		this.setTexture2D( texture, slot );

	}

	safeSetTextureCube( texture, slot ) {

		if ( texture && texture.isWebGLCubeRenderTarget ) {

			if ( this.warnedTextureCube === false ) {

				console.warn( 'THREE.WebGLTextures.safeSetTextureCube: don\'t use cube render targets as textures. Use their .texture property instead.' );
				this.warnedTextureCube = true;

			}

			texture = texture.texture;

		}


		this.setTextureCube( texture, slot );

	}

}

export { WebGLTextures };
