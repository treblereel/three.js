import { KeyframeTrack } from '../KeyframeTrack.js';

/**
 * A Track of numeric keyframe values.
 */

class NumberKeyframeTrack extends KeyframeTrack {

	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

		Object.assign( this, {

			ValueTypeName: 'number'

			// ValueBufferType is inherited

			// DefaultInterpolation is inherited

		} );

	}

}

export { NumberKeyframeTrack };
