import { DefaultLoadingManager } from './LoadingManager.js';

import { LoadingManager } from './LoadingManager.js';


class Loader {


		/**
	 * 
	 * @param {LoadingManager=} manager 
	 */
	constructor( manager ) {

		this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

		this.crossOrigin = 'anonymous';
		this.withCredentials = false;
		this.path = '';
		this.resourcePath = '';
		this.requestHeader = {};

	}

	/**
	 * 
	 * @param {String=} url 
	 * @param {function(*): ?=} onLoad 
	 * @param {function(*): ?=} onProgress 
	 * @param {function(*): ?=} onError 
	 */
	load( /* url, onLoad, onProgress, onError */url, onLoad, onProgress, onError) {}

	loadAsync( url, onProgress ) {

		return new Promise( function ( resolve, reject ) {

			this.load( url, resolve, onProgress, reject );

		} );

	}

	parse( /* data */ ) {}

	setCrossOrigin( crossOrigin ) {

		this.crossOrigin = crossOrigin;
		return this;

	}

	setWithCredentials( value ) {

		this.withCredentials = value;
		return this;

	}

	setPath( path ) {

		this.path = path;
		return this;

	}

	setResourcePath( resourcePath ) {

		this.resourcePath = resourcePath;
		return this;

	}

	setRequestHeader( requestHeader ) {

		this.requestHeader = requestHeader;
		return this;

	}

}

export { Loader };
