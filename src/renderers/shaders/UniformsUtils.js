/**
 * Uniform Utilities
 */

export function cloneUniforms( src ) {


/* 	console.log('cloneUniforms before ' + JSON.stringify(src))
 */

	const dst = {};

	for ( const u in src ) {

		dst[ u ] = {};

		for ( const p in src[ u ] ) {

			const property = src[ u ][ p ];

			if ( property && ( property.isColor ||
				property.isMatrix3 || property.isMatrix4 ||
				property.isVector2 || property.isVector3 || property.isVector4 ||
				property.isTexture || property.isQuaternion ) ) {

				dst[ u ][ p ] = property.clone();

			} else if ( Array.isArray( property ) ) {

				dst[ u ][ p ] = property.slice();

			} else {

				dst[ u ][ p ] = property;

			}

		}

	}
/* 	console.log('cloneUniforms return ' + JSON.stringify(dst))

	if( dst.specularMap !== undefined)
		console.log('cloneUniforms return ? specularMap ' + dst.specularMap.value)
	if( dst.aoMap !== undefined)
		console.log('cloneUniforms return ? aoMap ' + dst.aoMap.value)
	if( dst.map !== undefined)
		console.log('cloneUniforms return ? map ' + dst.map.value)
	if( dst.lightMapIntensity !== undefined)
		console.log('cloneUniforms return ? lightMapIntensity ' + dst.lightMapIntensity.value)
	if( dst.fogDensity !== undefined)
		console.log('cloneUniforms return ? fogDensity ' + dst.fogDensity.value)
	if( dst.fogNear !== undefined)
		console.log('cloneUniforms return ? fogNear ' + dst.fogNear.value)
	if( dst.fogFar !== undefined)
		console.log('cloneUniforms return ? fogFar ' + dst.fogFar.value)
	if( dst.fogColor !== undefined)
		console.log('cloneUniforms return ? fogColor ' + dst.fogColor.value) */

	return dst;

}

export function mergeUniforms( uniforms ) {

 	console.log('mergeUniforms before ' + JSON.stringify(uniforms))
 

	const merged = {};

	for ( let u = 0; u < uniforms.length; u ++ ) {

		const tmp = cloneUniforms( uniforms[ u ] );

		for ( const p in tmp ) {

			merged[ p ] = tmp[ p ];

		}

	}

 	console.log('mergeUniforms return ' + JSON.stringify(merged))
 

	return merged;

}

// Legacy

const UniformsUtils = { clone: cloneUniforms, merge: mergeUniforms };

export { UniformsUtils };
