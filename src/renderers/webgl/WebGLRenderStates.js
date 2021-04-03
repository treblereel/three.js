import { WebGLLights } from './WebGLLights.js';

class WebGLRenderState {

	constructor( extensions, capabilities ) {

		this.lights = new WebGLLights( extensions, capabilities );

		this.lightsArray = [];
		this.shadowsArray = [];

		this.state = {
			lightsArray: this.lightsArray,
			shadowsArray: this.shadowsArray,
	
			lights: this.lights
		};

	}	

	init() {

		this.lightsArray.length = 0;
		this.shadowsArray.length = 0;

	}

	pushLight( light ) {

		this.lightsArray.push( light );

	}

	pushShadow( shadowLight ) {

		this.shadowsArray.push( shadowLight );

	}

	setupLights() {

		this.lights.setup( this.lightsArray );

	}

	setupLightsView( camera ) {

		this.lights.setupView( this.lightsArray, camera );

	}

}

class WebGLRenderStates {

	constructor( extensions, capabilities ) {

		this.extensions = extensions;
		this.capabilities = capabilities;

		this.renderStates = new WeakMap();
	}	

	get( scene = undefined, renderCallDepth = 0 ) {

		let renderState;

		if ( this.renderStates.has( scene ) === false ) {

			renderState = new WebGLRenderState( this.extensions, this.capabilities );
			this.renderStates.set( scene, [ renderState ] );

		} else {

			if ( renderCallDepth >= this.renderStates.get( scene ).length ) {

				renderState = new WebGLRenderState( this.extensions, this.capabilities );
				this.renderStates.get( scene ).push( renderState );

			} else {

				renderState = this.renderStates.get( scene )[ renderCallDepth ];

			}

		}

		return renderState;

	}

	dispose() {

		this.renderStates = new WeakMap();

	}

}


export { WebGLRenderStates };
