import { ShaderMaterial, TextureLoader, Vector2, Vector4, Texture } from 'three';
import { globalUniforms } from '@/plugins/WebglApp/utils/globalUniforms.js';
import { paramsManager } from '@/plugins/WebglApp/utils/paramsManager.js';
import { CONSTANT } from '@/utils/constant';
import fragment from './fragment.glsl';
import vertex from './vertex.glsl';
import testTexture from '~/static/textures/water.jpg';

export default class PlaneTestMaterial extends ShaderMaterial {
	constructor(texture = null) {
		// Créer une texture placeholder si aucune texture n'est fournie
		const defaultTexture = texture || new Texture();

		super({
			// wireframe: true,
			uniforms: {
				time: { value: globalUniforms.uTime.value },
				uProgress: { value: paramsManager.get('uProgress') },
				uTexture: { value: defaultTexture },
				uTextureSize: { value: new Vector2(100, 100) },
				uCorners: { value: new Vector4(0, 0, 0, 0) },
				uResolution: { value: new Vector2(CONSTANT.width, CONSTANT.height) },
				uQuadSize: { value: new Vector2(300, 300) },
			},
			vertexShader: vertex,
			fragmentShader: fragment,
		});

		// Charger la texture de manière asynchrone si elle n'a pas été fournie
		if (!texture) {
			this.loadTexture(testTexture);
		}
	}

	/**
	 * Load texture asynchronously
	 * @param {string} url - Texture URL
	 * @returns {Promise<Texture>}
	 */
	loadTexture(url) {
		return new Promise((resolve, reject) => {
			const loader = new TextureLoader();
			loader.load(
				url,
				(texture) => {
					this.uniforms.uTexture.value = texture;
					// Mettre à jour la taille de la texture
					if (texture.image) {
						this.uniforms.uTextureSize.value.set(texture.image.width, texture.image.height);
					}
					resolve(texture);
				},
				undefined,
				(error) => {
					console.error(`PlaneTestMaterial: Failed to load texture ${url}`, error);
					reject(error);
				}
			);
		});
	}

	/**
	 * Set texture directly
	 * @param {Texture} texture - Three.js Texture object
	 */
	setTexture(texture) {
		this.uniforms.uTexture.value = texture;
		if (texture.image) {
			this.uniforms.uTextureSize.value.set(texture.image.width, texture.image.height);
		}
	}
}
