import { KeyframeTrack } from '../KeyframeTrack.js';

/**
 * A Track of vectored keyframe values.
 */

class VectorKeyframeTrack extends KeyframeTrack {

	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

		Object.assign( this, {

			ValueTypeName: 'vector'

			// ValueBufferType is inherited

			// DefaultInterpolation is inherited

		} );

	}

}

export { VectorKeyframeTrack };
