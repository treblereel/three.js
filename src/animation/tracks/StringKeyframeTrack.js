import { InterpolateDiscrete } from '../../constants.js';
import { KeyframeTrack } from '../KeyframeTrack.js';

/**
 * A Track that interpolates Strings
 */

class StringKeyframeTrack extends KeyframeTrack {

	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

		Object.assign( this, {

			constructor: StringKeyframeTrack,

			ValueTypeName: 'string',

			ValueBufferType: Array,

			DefaultInterpolation: InterpolateDiscrete,

			InterpolantFactoryMethodLinear: undefined,

			InterpolantFactoryMethodSmooth: undefined

		} );

	}

}

export { StringKeyframeTrack };
