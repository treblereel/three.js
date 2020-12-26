import { InterpolateLinear } from '../../constants.js';
import { KeyframeTrack } from '../KeyframeTrack.js';
import { QuaternionLinearInterpolant } from '../../math/interpolants/QuaternionLinearInterpolant.js';

/**
 * A Track of quaternion keyframe values.
 */

class QuaternionKeyframeTrack extends KeyframeTrack {

	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

		Object.assign( this, {

			ValueTypeName: 'quaternion',

			// ValueBufferType is inherited

			DefaultInterpolation: InterpolateLinear,

			InterpolantFactoryMethodSmooth: undefined // not yet implemented

		} );

	}

	InterpolantFactoryMethodLinear( result ) {

		return new QuaternionLinearInterpolant( this.times, this.values, this.getValueSize(), result );

	}

}

export { QuaternionKeyframeTrack };
