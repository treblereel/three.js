const THREE = {
	UniformsLib: {
        sprite: {
            diffuse: {
                value: {
                    r: {},
                    g: {},
                    b: {},
                    isColor: {}
                }
            },
            opacity: {
                value: {}
            },
            center: {
                value: {
                    x: {},
                    y: {},
                    isVector2: {},
                    fromAttribute: function () {},
                    distanceToManhattan: function () {},
                    lengthManhattan: function () {}
                }
            },
            rotation: {
                value: {}
            },
            map: {
                value: function () {}
            },
            alphaMap: {
                value: function () {}
            },
            uvTransform: {
                value: {
                    elements: {
                        "0": {},
                        "1": {},
                        "2": {},
                        "3": {},
                        "4": {},
                        "5": {},
                        "6": {},
                        "7": {},
                        "8": {}
                    },
                    isMatrix3: {},
                    flattenToArrayOffset: function () {},
                    multiplyVector3: function () {},
                    multiplyVector3Array: function () {},
                    applyToBufferAttribute: function () {},
                    applyToVector3Array: function () {},
                    getInverse: function () {}
                }
            },
        },
    },
};
