import { CubeReflectionMapping, CubeRefractionMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping } from '../../constants.js';
import { WebGLCubeRenderTarget } from '../WebGLCubeRenderTarget.js';

class WebGLCubeMaps {

	constructor( renderer ) {

		this.renderer = renderer;

		this.cubemaps = new WeakMap();
	}

	 mapTextureMapping( texture, mapping ) {

		if ( mapping === EquirectangularReflectionMapping ) {

			texture.mapping = CubeReflectionMapping;

		} else if ( mapping === EquirectangularRefractionMapping ) {

			texture.mapping = CubeRefractionMapping;

		}

		return texture;

	}

	get( texture ) {

		if ( texture && texture.isTexture ) {

			const mapping = texture.mapping;

			if ( mapping === EquirectangularReflectionMapping || mapping === EquirectangularRefractionMapping ) {

				if ( this.cubemaps.has( texture ) ) {

					const cubemap = this.cubemaps.get( texture ).texture;
					return this.mapTextureMapping( cubemap, texture.mapping );

				} else {

					const image = texture.image;

					if ( image && image.height > 0 ) {

						const currentRenderList = this.renderer.getRenderList();
						const currentRenderTarget = this.enderer.getRenderTarget();

						const renderTarget = new WebGLCubeRenderTarget( image.height / 2 );
						renderTarget.fromEquirectangularTexture( this.renderer, texture );
						this.cubemaps.set( texture, renderTarget );

						this.renderer.setRenderTarget( currentRenderTarget );
						this.renderer.setRenderList( currentRenderList );

						texture.addEventListener( 'dispose', this.onTextureDispose );

						return this.mapTextureMapping( renderTarget.texture, texture.mapping );

					} else {

						// image not yet ready. try the conversion next frame

						return null;

					}

				}

			}

		}

		return texture;

	}

	onTextureDispose( event ) {

		const texture = event.target;

		texture.removeEventListener( 'dispose', this.onTextureDispose );

		const cubemap = this.cubemaps.get( texture );

		if ( cubemap !== undefined ) {

			this.cubemaps.delete( texture );
			cubemap.dispose();

		}

	}

	dispose() {

		this.cubemaps = new WeakMap();

	}

}

export { WebGLCubeMaps };
