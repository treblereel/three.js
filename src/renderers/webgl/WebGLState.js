import { NotEqualDepth, GreaterDepth, GreaterEqualDepth, EqualDepth, LessEqualDepth, LessDepth, AlwaysDepth, NeverDepth, CullFaceFront, CullFaceBack, CullFaceNone, DoubleSide, BackSide, CustomBlending, MultiplyBlending, SubtractiveBlending, AdditiveBlending, NoBlending, NormalBlending, AddEquation, SubtractEquation, ReverseSubtractEquation, MinEquation, MaxEquation, ZeroFactor, OneFactor, SrcColorFactor, SrcAlphaFactor, SrcAlphaSaturateFactor, DstColorFactor, DstAlphaFactor, OneMinusSrcColorFactor, OneMinusSrcAlphaFactor, OneMinusDstColorFactor, OneMinusDstAlphaFactor } from '../../constants.js';
import { Vector4 } from '../../math/Vector4.js';


class ColorBuffer {

	/**
	 * 
	 * @param {WebGLState} state
	 */
	constructor(state) {

		this.state = state;

		this.locked = false;

		const color = new Vector4();
		this.color = color;
		this.currentColorMask = null;
		const currentColorClear = new Vector4(0, 0, 0, 0);
		this.currentColorClear = currentColorClear;
	}

	setMask(colorMask) {

		if (this.currentColorMask !== colorMask && !this.locked) {

			this.state.gl.colorMask(colorMask, colorMask, colorMask, colorMask);
			this.currentColorMask = colorMask;

		}

	}

	setLocked(lock) {

		this.locked = lock;

	}

	setClear(r, g, b, a, premultipliedAlpha) {

		if (premultipliedAlpha === true) {

			r *= a; g *= a; b *= a;

		}

		this.color.set(r, g, b, a);

		if (this.currentColorClear.equals(this.color) === false) {

			this.state.gl.clearColor(r, g, b, a);
			this.currentColorClear.copy(this.color);

		}

	}

	reset() {

		this.locked = false;

		this.currentColorMask = null;
		this.currentColorClear.set(- 1, 0, 0, 0); // set to invalid state

	}

}


class DepthBuffer {

	/**
	 * 
	 * @param {WebGLState} state
	 */
	constructor(state) {

		this.state = state;

		this.locked = false;

		this.currentDepthMask = null;
		this.currentDepthFunc = null;
		this.currentDepthClear = null;

	}

	setTest(depthTest) {

		if (depthTest) {

			this.state.enable(this.state.gl.DEPTH_TEST);

		} else {

			this.state.disable(this.state.gl.DEPTH_TEST);

		}

	}

	setMask(depthMask) {

		if (this.currentDepthMask !== depthMask && !this.locked) {

			this.state.gl.depthMask(depthMask);
			this.currentDepthMask = depthMask;

		}

	}

	setFunc(depthFunc) {

		if (this.currentDepthFunc !== depthFunc) {

			const gl = this.state.gl;

			if (depthFunc) {

				switch (depthFunc) {

					case NeverDepth:

						gl.depthFunc(gl.NEVER);
						break;

					case AlwaysDepth:

						gl.depthFunc(gl.ALWAYS);
						break;

					case LessDepth:

						gl.depthFunc(gl.LESS);
						break;

					case LessEqualDepth:

						gl.depthFunc(gl.LEQUAL);
						break;

					case EqualDepth:

						gl.depthFunc(gl.EQUAL);
						break;

					case GreaterEqualDepth:

						gl.depthFunc(gl.GEQUAL);
						break;

					case GreaterDepth:

						gl.depthFunc(gl.GREATER);
						break;

					case NotEqualDepth:

						gl.depthFunc(gl.NOTEQUAL);
						break;

					default:

						gl.depthFunc(gl.LEQUAL);

				}

			} else {

				gl.depthFunc(gl.LEQUAL);

			}

			this.currentDepthFunc = depthFunc;

		}

	}

	setLocked(lock) {

		this.locked = lock;

	}

	setClear(depth) {

		if (this.currentDepthClear !== depth) {

			this.state.gl.clearDepth(depth);
			this.currentDepthClear = depth;

		}

	}

	reset() {

		this.locked = false;

		this.currentDepthMask = null;
		this.currentDepthFunc = null;
		this.currentDepthClear = null;

	}

}

class StencilBuffer {

	/**
	 * 
	 * @param {WebGLState} state
	 */
	constructor(state) {

		this.state = state;

		this.locked = false;

		this.currentStencilMask = null;
		this.currentStencilFunc = null;
		this.currentStencilRef = null;
		this.currentStencilFuncMask = null;
		this.currentStencilFail = null;
		this.currentStencilZFail = null;
		this.currentStencilZPass = null;
		this.currentStencilClear = null;

	}

	setTest(stencilTest) {

		if (!this.locked) {

			if (stencilTest) {

				this.state.enable(this.state.gl.STENCIL_TEST);

			} else {

				this.state.disable(this.state.gl.STENCIL_TEST);

			}

		}

	}

	setMask(stencilMask) {

		if (this.currentStencilMask !== stencilMask && !this.locked) {

			this.state.gl.stencilMask(stencilMask);
			this.currentStencilMask = stencilMask;

		}

	}

	setFunc(stencilFunc, stencilRef, stencilMask) {

		if (this.currentStencilFunc !== stencilFunc ||
			this.currentStencilRef !== stencilRef ||
			this.currentStencilFuncMask !== stencilMask) {

			this.state.gl.stencilFunc(stencilFunc, stencilRef, stencilMask);

			this.currentStencilFunc = stencilFunc;
			this.currentStencilRef = stencilRef;
			this.currentStencilFuncMask = stencilMask;

		}

	}

	setOp(stencilFail, stencilZFail, stencilZPass) {

		if (this.currentStencilFail !== stencilFail ||
			this.currentStencilZFail !== stencilZFail ||
			this.currentStencilZPass !== stencilZPass) {

			this.state.gl.stencilOp(stencilFail, stencilZFail, stencilZPass);

			this.currentStencilFail = stencilFail;
			this.currentStencilZFail = stencilZFail;
			this.currentStencilZPass = stencilZPass;

		}

	}

	setLocked(lock) {

		this.locked = lock;

	}

	setClear(stencil) {

		if (this.currentStencilClear !== stencil) {

			this.state.gl.clearStencil(stencil);
			this.currentStencilClear = stencil;

		}

	}

	reset() {

		this.locked = false;

		this.currentStencilMask = null;
		this.currentStencilFunc = null;
		this.currentStencilRef = null;
		this.currentStencilFuncMask = null;
		this.currentStencilFail = null;
		this.currentStencilZFail = null;
		this.currentStencilZPass = null;
		this.currentStencilClear = null;

	}

}



class WebGLState {

	constructor(gl, extensions, capabilities) {

		this.gl = gl;
		this.extensions = extensions;
		this.capabilities = capabilities;

		const isWebGL2 = capabilities.isWebGL2;

		const colorBuffer = new ColorBuffer(this);
		const depthBuffer = new DepthBuffer(this);
		const stencilBuffer = new StencilBuffer(this);

		this.colorBuffer = colorBuffer;
		this.depthBuffer = depthBuffer;
		this.stencilBuffer = stencilBuffer;

		this.buffers = {
			color: colorBuffer,
			depth: depthBuffer,
			stencil: stencilBuffer
		}

		this.enabledCapabilities = {};

		this.currentProgram = null;

		this.currentBlendingEnabled = null;
		this.currentBlending = null;
		this.currentBlendEquation = null;
		this.currentBlendSrc = null;
		this.currentBlendDst = null;
		this.currentBlendEquationAlpha = null;
		this.currentBlendSrcAlpha = null;
		this.currentBlendDstAlpha = null;
		this.currentPremultipledAlpha = false;

		this.currentFlipSided = null;
		this.currentCullFace = null;

		this.currentLineWidth = null;

		this.currentPolygonOffsetFactor = null;
		this.currentPolygonOffsetUnits = null;

		const maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
		this.maxTextures = maxTextures;

		this.lineWidthAvailable = false;
		this.version = 0;
		const glVersion = gl.getParameter(gl.VERSION);

		if (glVersion.indexOf('WebGL') !== - 1) {

			this.version = parseFloat(/^WebGL (\d)/.exec(glVersion)[1]);
			this.lineWidthAvailable = (this.version >= 1.0);

		} else if (glVersion.indexOf('OpenGL ES') !== - 1) {

			this.version = parseFloat(/^OpenGL ES (\d)/.exec(glVersion)[1]);
			this.lineWidthAvailable = (this.version >= 2.0);

		}

		this.currentTextureSlot = null;
		this.currentBoundTextures = {};

		const currentScissor = new Vector4();
		this.currentScissor = currentScissor;

		const currentViewport = new Vector4();
		this.currentViewport = currentViewport;


		function createTexture(type, target, count) {

			const data = new Uint8Array(4); // 4 is required to match default unpack alignment of 4.
			const texture = gl.createTexture();

			gl.bindTexture(type, texture);
			gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			for (let i = 0; i < count; i++) {

				gl.texImage2D(target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

			}

			return texture;

		}

		const emptyTextures = {};
		emptyTextures[gl.TEXTURE_2D] = createTexture(gl.TEXTURE_2D, gl.TEXTURE_2D, 1);
		emptyTextures[gl.TEXTURE_CUBE_MAP] = createTexture(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 6);
		this.emptyTextures = emptyTextures;	
		// init

		colorBuffer.setClear(0, 0, 0, 1);
		depthBuffer.setClear(1);
		stencilBuffer.setClear(0);

		this.enable(gl.DEPTH_TEST);
		depthBuffer.setFunc(LessEqualDepth);

		this.setFlipSided(false);
		this.setCullFace(CullFaceBack);
		this.enable(gl.CULL_FACE);

		this.setBlending(NoBlending);

		//
		const equationToGL = {
			[AddEquation]: gl.FUNC_ADD,
			[SubtractEquation]: gl.FUNC_SUBTRACT,
			[ReverseSubtractEquation]: gl.FUNC_REVERSE_SUBTRACT
		};
		this.equationToGL = equationToGL;

		if (isWebGL2) {

			equationToGL[MinEquation] = gl.MIN;
			equationToGL[MaxEquation] = gl.MAX;

		} else {

			const extension = extensions.get('EXT_blend_minmax');

			if (extension !== null) {

				equationToGL[MinEquation] = extension.MIN_EXT;
				equationToGL[MaxEquation] = extension.MAX_EXT;

			}

		}

		const factorToGL = {
			[ZeroFactor]: gl.ZERO,
			[OneFactor]: gl.ONE,
			[SrcColorFactor]: gl.SRC_COLOR,
			[SrcAlphaFactor]: gl.SRC_ALPHA,
			[SrcAlphaSaturateFactor]: gl.SRC_ALPHA_SATURATE,
			[DstColorFactor]: gl.DST_COLOR,
			[DstAlphaFactor]: gl.DST_ALPHA,
			[OneMinusSrcColorFactor]: gl.ONE_MINUS_SRC_COLOR,
			[OneMinusSrcAlphaFactor]: gl.ONE_MINUS_SRC_ALPHA,
			[OneMinusDstColorFactor]: gl.ONE_MINUS_DST_COLOR,
			[OneMinusDstAlphaFactor]: gl.ONE_MINUS_DST_ALPHA
		};
		this.factorToGL = factorToGL;

	}

	enable(id) {

		if (this.enabledCapabilities[id] !== true) {

			this.gl.enable(id);
			this.enabledCapabilities[id] = true;

		}

	}

	disable(id) {

		if (this.enabledCapabilities[id] !== false) {

			this.gl.disable(id);
			this.enabledCapabilities[id] = false;

		}

	}

	useProgram(program) {

		if (this.currentProgram !== program) {

			this.gl.useProgram(program);

			this.currentProgram = program;

			return true;

		}

		return false;

	}

	setBlending(blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha, premultipliedAlpha) {

		let gl = this.gl;
		
		if (blending === NoBlending) {

			if (this.currentBlendingEnabled) {

				this.disable(gl.BLEND);
				this.currentBlendingEnabled = false;

			}

			return;

		}

		if (!this.currentBlendingEnabled) {

			this.enable(gl.BLEND);
			this.currentBlendingEnabled = true;

		}

		if (blending !== CustomBlending) {

			if (blending !== this.currentBlending || premultipliedAlpha !== this.currentPremultipledAlpha) {

				if (this.currentBlendEquation !== AddEquation || this.currentBlendEquationAlpha !== AddEquation) {

					this.gl.blendEquation(gl.FUNC_ADD);

					this.currentBlendEquation = AddEquation;
					this.currentBlendEquationAlpha = AddEquation;

				}

				if (premultipliedAlpha) {

					switch (blending) {

						case NormalBlending:
							gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
							break;

						case AdditiveBlending:
							gl.blendFunc(gl.ONE, gl.ONE);
							break;

						case SubtractiveBlending:
							gl.blendFuncSeparate(gl.ZERO, gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
							break;

						case MultiplyBlending:
							gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.SRC_ALPHA);
							break;

						default:
							console.error('THREE.WebGLState: Invalid blending: ', blending);
							break;

					}

				} else {

					switch (blending) {

						case NormalBlending:
							gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
							break;

						case AdditiveBlending:
							gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
							break;

						case SubtractiveBlending:
							gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
							break;

						case MultiplyBlending:
							gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
							break;

						default:
							console.error('THREE.WebGLState: Invalid blending: ', blending);
							break;

					}

				}

				this.currentBlendSrc = null;
				this.currentBlendDst = null;
				this.currentBlendSrcAlpha = null;
				this.currentBlendDstAlpha = null;

				this.currentBlending = blending;
				this.currentPremultipledAlpha = premultipliedAlpha;

			}

			return;

		}

		// custom blending

		blendEquationAlpha = blendEquationAlpha || blendEquation;
		blendSrcAlpha = blendSrcAlpha || blendSrc;
		blendDstAlpha = blendDstAlpha || blendDst;

		if (blendEquation !== this.currentBlendEquation || blendEquationAlpha !== this.currentBlendEquationAlpha) {

			this.gl.blendEquationSeparate(this.equationToGL[blendEquation], this.equationToGL[blendEquationAlpha]);

			this.currentBlendEquation = blendEquation;
			this.currentBlendEquationAlpha = blendEquationAlpha;

		}

		if (blendSrc !== this.currentBlendSrc || blendDst !== this.currentBlendDst || blendSrcAlpha !== this.currentBlendSrcAlpha || blendDstAlpha !== this.currentBlendDstAlpha) {

			this.gl.blendFuncSeparate(this.factorToGL[blendSrc], this.factorToGL[blendDst], this.factorToGL[blendSrcAlpha], this.factorToGL[blendDstAlpha]);

			this.currentBlendSrc = blendSrc;
			this.currentBlendDst = blendDst;
			this.currentBlendSrcAlpha = blendSrcAlpha;
			this.currentBlendDstAlpha = blendDstAlpha;

		}

		this.currentBlending = blending;
		this.currentPremultipledAlpha = null;

	}

	setMaterial(material, frontFaceCW) {

		material.side === DoubleSide
			? this.disable(this.gl.CULL_FACE)
			: this.enable(this.gl.CULL_FACE);

		let flipSided = (material.side === BackSide);
		if (frontFaceCW) flipSided = !flipSided;

		this.setFlipSided(flipSided);

		(material.blending === NormalBlending && material.transparent === false)
			? this.setBlending(NoBlending)
			: this.setBlending(material.blending, material.blendEquation, material.blendSrc, material.blendDst, material.blendEquationAlpha, material.blendSrcAlpha, material.blendDstAlpha, material.premultipliedAlpha);

		this.depthBuffer.setFunc(material.depthFunc);
		this.depthBuffer.setTest(material.depthTest);
		this.depthBuffer.setMask(material.depthWrite);
		this.colorBuffer.setMask(material.colorWrite);

		const stencilWrite = material.stencilWrite;
		this.stencilBuffer.setTest(stencilWrite);
		if (stencilWrite) {

			this.stencilBuffer.setMask(material.stencilWriteMask);
			this.stencilBuffer.setFunc(material.stencilFunc, material.stencilRef, material.stencilFuncMask);
			this.stencilBuffer.setOp(material.stencilFail, material.stencilZFail, material.stencilZPass);

		}

		this.setPolygonOffset(material.polygonOffset, material.polygonOffsetFactor, material.polygonOffsetUnits);

	}

	//

	setFlipSided(flipSided) {

		if (this.currentFlipSided !== flipSided) {

			if (flipSided) {

				this.gl.frontFace(this.gl.CW);

			} else {

				this.gl.frontFace(this.gl.CCW);

			}

			this.currentFlipSided = flipSided;

		}

	}

	setCullFace(cullFace) {

		if (cullFace !== CullFaceNone) {

			this.enable(this.gl.CULL_FACE);

			if (cullFace !== this.currentCullFace) {

				if (cullFace === CullFaceBack) {

					this.gl.cullFace(this.gl.BACK);

				} else if (cullFace === CullFaceFront) {

					this.gl.cullFace(this.gl.FRONT);

				} else {

					this.gl.cullFace(this.gl.FRONT_AND_BACK);

				}

			}

		} else {

			this.disable(this.gl.CULL_FACE);

		}

		this.currentCullFace = cullFace;

	}

	setLineWidth(width) {

		if (width !== this.currentLineWidth) {

			if (this.lineWidthAvailable) this.gl.lineWidth(width);

			this.currentLineWidth = width;

		}

	}

	setPolygonOffset(polygonOffset, factor, units) {

		if (polygonOffset) {

			this.enable(this.gl.POLYGON_OFFSET_FILL);

			if (this.currentPolygonOffsetFactor !== factor || this.currentPolygonOffsetUnits !== units) {

				this.gl.polygonOffset(factor, units);

				this.currentPolygonOffsetFactor = factor;
				this.currentPolygonOffsetUnits = units;

			}

		} else {

			this.disable(this.gl.POLYGON_OFFSET_FILL);

		}

	}

	setScissorTest(scissorTest) {

		if (scissorTest) {

			this.enable(this.gl.SCISSOR_TEST);

		} else {

			this.disable(this.gl.SCISSOR_TEST);

		}

	}

	// texture

	activeTexture(webglSlot) {

		if (webglSlot === undefined) webglSlot = this.gl.TEXTURE0 + this.maxTextures - 1;

		if (this.currentTextureSlot !== webglSlot) {

			this.gl.activeTexture(webglSlot);
			this.currentTextureSlot = webglSlot;

		}

	}

	bindTexture(webglType, webglTexture) {

		if (this.currentTextureSlot === null) {

			this.activeTexture();

		}

		let boundTexture = this.currentBoundTextures[this.currentTextureSlot];

		if (boundTexture === undefined) {

			boundTexture = { type: undefined, texture: undefined };
			this.currentBoundTextures[this.currentTextureSlot] = boundTexture;

		}

		if (boundTexture.type !== webglType || boundTexture.texture !== webglTexture) {

			this.gl.bindTexture(webglType, webglTexture || this.emptyTextures[webglType]);

			boundTexture.type = webglType;
			boundTexture.texture = webglTexture;

		}

	}

	unbindTexture() {

		const boundTexture = this.currentBoundTextures[this.currentTextureSlot];

		if (boundTexture !== undefined && boundTexture.type !== undefined) {

			this.gl.bindTexture(boundTexture.type, null);

			boundTexture.type = undefined;
			boundTexture.texture = undefined;

		}

	}

	compressedTexImage2D() {

		try {

			this.gl.compressedTexImage2D.apply(this.gl, arguments);

		} catch (error) {

			console.error('THREE.WebGLState:', error);

		}

	}

	texImage2D() {

		try {

			this.gl.texImage2D.apply(this.gl, arguments);

		} catch (error) {

			console.error('THREE.WebGLState:', error);

		}

	}

	texImage3D() {

		try {

			this.gl.texImage3D.apply(this.gl, arguments);

		} catch (error) {

			console.error('THREE.WebGLState:', error);

		}

	}

	//

	scissor(scissor) {

		if (this.currentScissor.equals(scissor) === false) {

			this.gl.scissor(scissor.x, scissor.y, scissor.z, scissor.w);
			this.currentScissor.copy(scissor);

		}

	}

	viewport(viewport) {

		if (this.currentViewport.equals(viewport) === false) {

			this.gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
			this.currentViewport.copy(viewport);

		}

	}

	//

	reset() {

		this.enabledCapabilities = {};

		this.currentTextureSlot = null;
		this.currentBoundTextures = {};

		this.currentProgram = null;

		this.currentBlendingEnabled = null;
		this.currentBlending = null;
		this.currentBlendEquation = null;
		this.currentBlendSrc = null;
		this.currentBlendDst = null;
		this.currentBlendEquationAlpha = null;
		this.currentBlendSrcAlpha = null;
		this.currentBlendDstAlpha = null;
		this.currentPremultipledAlpha = false;

		this.currentFlipSided = null;
		this.currentCullFace = null;

		this.currentLineWidth = null;

		this.currentPolygonOffsetFactor = null;
		this.currentPolygonOffsetUnits = null;

		this.colorBuffer.reset();
		this.depthBuffer.reset();
		this.stencilBuffer.reset();

	}

}

export { WebGLState };
