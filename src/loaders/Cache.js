const files = {};

class _Cache {

	constructor() {

		this.enabled = false;

	}

	add( key, file ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Adding key:', key );

		files[ key ] = file;

	}

	get( key ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Checking key:', key );

		return files[ key ];

	}

	remove( key ) {

		delete files[ key ];

	}

	clear() {

		this.files = {};

	}

}





const Cache = new _Cache();


export { Cache };
