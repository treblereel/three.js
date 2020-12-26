import { KeyframeTrack } from '../KeyframeTrack.js';

/**
 * A Track of keyframe values that represent color.
 */

class ColorKeyframeTrack extends KeyframeTrack {

	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

		Object.assign( this, {

			constructor: ColorKeyframeTrack,

			ValueTypeName: 'color'

			// ValueBufferType is inherited

			// DefaultInterpolation is inherited

			// Note: Very basic implementation and nothing special yet.
			// However, this is the place for color space parameterization.

		} );

	}

}

export { ColorKeyframeTrack };
