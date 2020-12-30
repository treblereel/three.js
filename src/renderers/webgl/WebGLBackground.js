import { BackSide, FrontSide, CubeUVReflectionMapping } from '../../constants.js';
import { BoxBufferGeometry } from '../../geometries/BoxBufferGeometry.js';
import { PlaneBufferGeometry } from '../../geometries/PlaneBufferGeometry.js';
import { ShaderMaterial } from '../../materials/ShaderMaterial.js';
import { Color } from '../../math/Color.js';
import { Mesh } from '../../objects/Mesh.js';
import { ShaderLib } from '../shaders/ShaderLib.js';
import { cloneUniforms } from '../shaders/UniformsUtils.js';

class WebGLBackground {

	constructor( renderer, cubemaps, state, objects, premultipliedAlpha ) {

		this.renderer = renderer;
		this.cubemaps = cubemaps;
		this.state = state;
		this.objects = objects;
		this.premultipliedAlpha = premultipliedAlpha;

		this.clearColor = new Color( 0x000000 );
		this.clearAlpha = 0;

		this.planeMesh = undefined;
		this.boxMesh = undefined;

		this.currentBackground = null;
		this.currentBackgroundVersion = 0;
		this.currentTonemapping = null;

	}

	render( renderList, scene, camera, forceClear ) {

		let background = scene.isScene === true ? scene.background : null;

		if ( background && background.isTexture ) {

			background = this.cubemaps.get( background );

		}

		// Ignore background in AR
		// TODO: Reconsider this.

		const xr = this.renderer.xr;
		const session = xr.getSession && xr.getSession();

		if ( session && session.environmentBlendMode === 'additive' ) {

			background = null;

		}

		if ( background === null ) {

			this.setClear( this.clearColor, this.clearAlpha );

		} else if ( background && background.isColor ) {

			this.setClear( background, 1 );
			forceClear = true;

		}

		if ( this.renderer.autoClear || forceClear ) {

			this.renderer.clear( this.renderer.autoClearColor, this.renderer.autoClearDepth, this.renderer.autoClearStencil );

		}

		if ( background && ( background.isCubeTexture || background.isWebGLCubeRenderTarget || background.mapping === CubeUVReflectionMapping ) ) {

			if ( this.boxMesh === undefined ) {

				this.boxMesh = new Mesh(
					new BoxBufferGeometry( 1, 1, 1 ),
					new ShaderMaterial( {
						name: 'BackgroundCubeMaterial',
						uniforms: cloneUniforms( ShaderLib.cube.uniforms ),
						vertexShader: ShaderLib.cube.vertexShader,
						fragmentShader: ShaderLib.cube.fragmentShader,
						side: BackSide,
						depthTest: false,
						depthWrite: false,
						fog: false
					} )
				);

				this.boxMesh.geometry.deleteAttribute( 'normal' );
				this.boxMesh.geometry.deleteAttribute( 'uv' );

				this.boxMesh.onBeforeRender = function ( renderer, scene, camera ) {

					this.matrixWorld.copyPosition( camera.matrixWorld );

				};

				// enable code injection for non-built-in material
				Object.defineProperty( this.boxMesh.material, 'envMap', {

					get: function () {

						return this.uniforms.envMap.value;

					}

				} );

				this.objects.update( this.boxMesh );

			}

			if ( background.isWebGLCubeRenderTarget ) {

				// TODO Deprecate

				background = background.texture;

			}

			this.boxMesh.material.uniforms.envMap.value = background;
			this.boxMesh.material.uniforms.flipEnvMap.value = ( background.isCubeTexture && background._needsFlipEnvMap ) ? - 1 : 1;

			if ( this.currentBackground !== background ||
				this.currentBackgroundVersion !== background.version ||
				this.currentTonemapping !== this.renderer.toneMapping ) {

					this.boxMesh.material.needsUpdate = true;

					this.currentBackground = background;
					this.currentBackgroundVersion = background.version;
					this.currentTonemapping = this.renderer.toneMapping;

			}

			// push to the pre-sorted opaque render list
			renderList.unshift( this.boxMesh, this.boxMesh.geometry, this.boxMesh.material, 0, 0, null );

		} else if ( background && background.isTexture ) {

			if ( this.planeMesh === undefined ) {

				this.planeMesh = new Mesh(
					new PlaneBufferGeometry( 2, 2 ),
					new ShaderMaterial( {
						name: 'BackgroundMaterial',
						uniforms: cloneUniforms( ShaderLib.background.uniforms ),
						vertexShader: ShaderLib.background.vertexShader,
						fragmentShader: ShaderLib.background.fragmentShader,
						side: FrontSide,
						depthTest: false,
						depthWrite: false,
						fog: false
					} )
				);

				this.planeMesh.geometry.deleteAttribute( 'normal' );

				// enable code injection for non-built-in material
				Object.defineProperty( this.planeMesh.material, 'map', {

					get: function () {

						return this.uniforms.t2D.value;

					}

				} );

				this.objects.update( this.planeMesh );

			}

			this.planeMesh.material.uniforms.t2D.value = background;

			if ( background.matrixAutoUpdate === true ) {

				background.updateMatrix();

			}

			this.planeMesh.material.uniforms.uvTransform.value.copy( background.matrix );

			if ( this.currentBackground !== background ||
				this.currentBackgroundVersion !== background.version ||
				this.currentTonemapping !== this.renderer.toneMapping ) {

					this.planeMesh.material.needsUpdate = true;

					this.currentBackground = background;
					this.currentBackgroundVersion = background.version;
					this.currentTonemapping = this.renderer.toneMapping;

			}


			// push to the pre-sorted opaque render list
			renderList.unshift( this.planeMesh, this.planeMesh.geometry, this.planeMesh.material, 0, 0, null );

		}

	}

	setClear( color, alpha ) {

		this.state.buffers.color.setClear( color.r, color.g, color.b, alpha, this.premultipliedAlpha );

		return {

			getClearColor: function () {

				return this.clearColor;

			},
			setClearColor: function ( color, alpha = 1 ) {

				this.clearColor.set( color );
				this.clearAlpha = alpha;
				this.setClear( this.clearColor, this.clearAlpha );

			},
			getClearAlpha: function () {

				return this.clearAlpha;

			},
			setClearAlpha: function ( alpha ) {

				this.clearAlpha = alpha;
				this.setClear( this.clearColor, this.clearAlpha );

			},
			render: this.render

		}
	}	

}


export { WebGLBackground };
