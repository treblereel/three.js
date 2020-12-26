import { SphericalHarmonics3 } from '../math/SphericalHarmonics3.js';
import { Light } from './Light.js';

class LightProbe extends Light {

	constructor( sh, intensity ) {

		super( undefined, intensity );

		Object.defineProperty( this, 'isLightProbe', { value: true } );

		this.type = 'LightProbe';

		this.sh = ( sh !== undefined ) ? sh : new SphericalHarmonics3();

	}

	copy( source ) {

		Light.prototype.copy.call( this, source );

		this.sh.copy( source.sh );

		return this;

	}

	fromJSON( json ) {

		this.intensity = json.intensity; // TODO: Move this bit to Light.fromJSON();
		this.sh.fromArray( json.sh );

		return this;

	}

	toJSON( meta ) {

		const data = Light.prototype.toJSON.call( this, meta );

		data.object.sh = this.sh.toArray();

		return data;

	}

}

export { LightProbe };
