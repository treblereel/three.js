import { WebGLLights } from './WebGLLights.js';

class WebGLRenderState {

	constructor( extensions, capabilities ) {

		this.extensions = extensions;
		this.capabilities = capabilities;

		const lights = new WebGLLights( extensions, capabilities );

		const lightsArray = [];
		const shadowsArray = [];

		this.lights = lights;
		this.lightsArray = lightsArray;
		this.shadowsArray = shadowsArray;

		const state = {
			lightsArray: lightsArray,
			shadowsArray: shadowsArray,
	
			lights: lights
		};

		this.state = state;

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

		let renderStates = new WeakMap();
		this.renderStates = renderStates;

	}

	get( scene, renderCallDepth = 0 ) {

		let renderState;

		if ( this.renderStates.has( scene ) === false ) {

			renderState = new WebGLRenderState( this.extensions, this.capabilities );
			this.renderStates.set( scene, [] );
			this.renderStates.get( scene ).push( renderState );

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
