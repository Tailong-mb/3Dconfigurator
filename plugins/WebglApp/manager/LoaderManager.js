import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextureLoader } from 'three';
import { WEBGL_CONFIG } from '@/config/webgl.config.js';

export default class LoaderManager {
	#assets;
	#textureLoader = new TextureLoader();
	#GLTFLoader = new GLTFLoader();
	#OBJLoader = new OBJLoader();
	#DRACOLoader = new DRACOLoader();
	#FontLoader = new FontLoader();

	constructor() {
		this.#assets = {};
		// Configurer DRACO loader avec le chemin de la config
		this.#DRACOLoader.setDecoderPath(WEBGL_CONFIG.draco.decoderPath);
		this.#GLTFLoader.setDRACOLoader(this.#DRACOLoader);
	}

	get assets() {
		return this.#assets;
	}

	set assets(value) {
		this.#assets = value;
	}

	get(name) {
		return this.#assets[name];
	}

	/**
	 * Check if an asset is already loaded
	 * @param {string} name - Asset name
	 * @param {string} type - Asset type (texture, gltf, img, font, obj)
	 * @returns {boolean}
	 */
	isLoaded(name, type) {
		return this.#assets[name] && this.#assets[name][type] !== undefined;
	}

	load = (data, onProgress) =>
		new Promise((resolve, reject) => {
			// Filtrer les assets déjà chargés (cache)
			const uncached = data.filter((item) => {
				const { name, gltf, texture, img, font, obj } = item;
				if (gltf && this.isLoaded(name, 'gltf')) return false;
				if (texture && this.isLoaded(name, 'texture')) return false;
				if (img && this.isLoaded(name, 'img')) return false;
				if (font && this.isLoaded(name, 'font')) return false;
				if (obj && this.isLoaded(name, 'obj')) return false;
				return true;
			});

			if (uncached.length === 0) {
				resolve();
				return;
			}

			const promises = [];
			let loadedCount = 0;
			const totalCount = uncached.length;

			const updateProgress = () => {
				loadedCount++;
				if (onProgress) {
					onProgress({
						loaded: loadedCount,
						total: totalCount,
						progress: loadedCount / totalCount,
					});
				}
			};

			for (let i = 0; i < uncached.length; i++) {
				const { name, gltf, texture, img, font, obj } = uncached[i];

				if (!this.#assets[name]) {
					this.#assets[name] = {};
				}

				if (gltf) {
					promises.push(
						this.loadGLTF(gltf, name)
							.then(() => updateProgress())
							.catch(reject)
					);
				}

				if (texture) {
					promises.push(
						this.loadTexture(texture, name)
							.then(() => updateProgress())
							.catch(reject)
					);
				}

				if (img) {
					promises.push(
						this.loadImage(img, name)
							.then(() => updateProgress())
							.catch(reject)
					);
				}

				if (font) {
					promises.push(
						this.loadFont(font, name)
							.then(() => updateProgress())
							.catch(reject)
					);
				}

				if (obj) {
					promises.push(
						this.loadObj(obj, name)
							.then(() => updateProgress())
							.catch(reject)
					);
				}
			}

			Promise.all(promises)
				.then(() => resolve())
				.catch((error) => {
					console.error('LoaderManager: Error loading assets', error);
					reject(error);
				});
		});

	loadGLTF(url, name) {
		// Vérifier le cache
		if (this.isLoaded(name, 'gltf')) {
			return Promise.resolve(this.#assets[name].gltf);
		}

		return new Promise((resolve, reject) => {
			this.#GLTFLoader.load(
				url,
				(result) => {
					this.#assets[name].gltf = result;
					resolve(result);
				},
				(progress) => {
					// Progress callback optionnel
					if (progress.total > 0) {
						const percent = (progress.loaded / progress.total) * 100;
						// Peut être utilisé pour un loader UI
					}
				},
				(error) => {
					console.error(`LoaderManager: Failed to load GLTF ${url}`, error);
					reject(new Error(`Failed to load GLTF: ${url}`));
				}
			);
		});
	}

	loadTexture(url, name) {
		// Vérifier le cache
		if (this.isLoaded(name, 'texture')) {
			return Promise.resolve(this.#assets[name].texture);
		}

		if (!this.#assets[name]) {
			this.#assets[name] = {};
		}

		return new Promise((resolve, reject) => {
			this.#textureLoader.load(
				url,
				(result) => {
					this.#assets[name].texture = result;
					resolve(result);
				},
				undefined,
				(error) => {
					console.error(`LoaderManager: Failed to load texture ${url}`, error);
					reject(new Error(`Failed to load texture: ${url}`));
				}
			);
		});
	}

	loadImage(url, name) {
		// Vérifier le cache
		if (this.isLoaded(name, 'img')) {
			return Promise.resolve(this.#assets[name].img);
		}

		if (!this.#assets[name]) {
			this.#assets[name] = {};
		}

		return new Promise((resolve, reject) => {
			const image = new Image();

			image.onload = () => {
				this.#assets[name].img = image;
				resolve(image);
			};

			image.onerror = (error) => {
				console.error(`LoaderManager: Failed to load image ${url}`, error);
				reject(new Error(`Failed to load image: ${url}`));
			};

			image.src = url;
		});
	}

	loadFont(url, name) {
		// Vérifier le cache
		if (this.isLoaded(name, 'font')) {
			return Promise.resolve(this.#assets[name].font);
		}

		if (!this.#assets[name]) {
			this.#assets[name] = {};
		}

		return new Promise((resolve, reject) => {
			this.#FontLoader.load(
				url,
				(font) => {
					this.#assets[name].font = font;
					resolve(font);
				},
				undefined,
				(error) => {
					console.error(`LoaderManager: Failed to load font ${url}`, error);
					reject(new Error(`Failed to load font: ${url}`));
				}
			);
		});
	}

	// https://threejs.org/docs/#examples/en/loaders/OBJLoader
	loadObj(url, name) {
		// Vérifier le cache
		if (this.isLoaded(name, 'obj')) {
			return Promise.resolve(this.#assets[name].obj);
		}

		if (!this.#assets[name]) {
			this.#assets[name] = {};
		}

		return new Promise((resolve, reject) => {
			this.#OBJLoader.load(
				url,
				(object) => {
					this.#assets[name].obj = object;
					resolve(object);
				},
				(progress) => {
					// Progress callback optionnel
					if (progress.total > 0) {
						const percent = (progress.loaded / progress.total) * 100;
						// Peut être utilisé pour un loader UI
					}
				},
				(error) => {
					console.error(`LoaderManager: Failed to load OBJ ${url}`, error);
					reject(new Error(`Failed to load OBJ: ${url}`));
				}
			);
		});
	}
}
