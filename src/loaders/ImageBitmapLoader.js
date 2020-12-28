import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

class ImageBitmapLoader extends Loader {

	constructor( manager ) {

		if ( typeof createImageBitmap === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: createImageBitmap() not supported.' );
	
		}
	
		if ( typeof fetch === 'undefined' ) {
	
			console.warn( 'THREE.ImageBitmapLoader: fetch() not supported.' );
	
		}

		super( manager );

		Object.defineProperties( this, { isImageBitmapLoader: { value: true } } );

		this.options = { premultiplyAlpha: 'none' };

	}

	setOptionssetOptions( options ) {

		this.options = options;

		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		const fetchOptions = {};
		fetchOptions.credentials = ( this.crossOrigin === 'anonymous' ) ? 'same-origin' : 'include';

		fetch( url, fetchOptions ).then( function ( res ) {

			return res.blob();

		} ).then( function ( blob ) {

			return createImageBitmap( blob, scope.options );

		} ).then( function ( imageBitmap ) {

			Cache.add( url, imageBitmap );

			if ( onLoad ) onLoad( imageBitmap );

			scope.manager.itemEnd( url );

		} ).catch( function ( e ) {

			if ( onError ) onError( e );

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		} );

		scope.manager.itemStart( url );

	}

}

export { ImageBitmapLoader };
