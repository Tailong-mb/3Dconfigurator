import * as THREE from 'three';

/**
 * Classe utilitaire pour customiser les modèles 3D
 * Permet de modifier les couleurs, matériaux, textures des éléments du modèle
 */
export class ModelCustomizer {
	constructor(model) {
		this.model = model;
		this.elements = new Map(); // Cache des éléments trouvés par nom
		this.materials = new Map(); // Cache des matériaux
		this._indexModel();
	}

	/**
	 * Indexe le modèle pour retrouver rapidement les éléments
	 */
	_indexModel() {
		this.model.traverse((child) => {
			if (child.name && child.name !== '') {
				this.elements.set(child.name, child);
			}

			if (child.isMesh && child.material) {
				const materials = Array.isArray(child.material) ? child.material : [child.material];
				materials.forEach((material) => {
					if (!this.materials.has(material.uuid)) {
						this.materials.set(material.uuid, {
							material,
							meshes: [],
						});
					}
					this.materials.get(material.uuid).meshes.push(child);
				});
			}
		});
	}

	/**
	 * Trouve un élément par son nom
	 * @param {string} name - Nom de l'élément
	 * @returns {THREE.Object3D|null}
	 */
	getElement(name) {
		return this.elements.get(name) || null;
	}

	/**
	 * Trouve tous les meshes d'un élément par son nom
	 * @param {string} name - Nom de l'élément
	 * @returns {Array<THREE.Mesh>}
	 */
	getMeshes(name) {
		const element = this.getElement(name);
		if (!element) return [];

		const meshes = [];
		element.traverse((child) => {
			if (child.isMesh) {
				meshes.push(child);
			}
		});
		return meshes;
	}

	/**
	 * Change la couleur d'un élément
	 * @param {string} elementName - Nom de l'élément (ex: "shoe", "shoelace")
	 * @param {string|number} color - Couleur en hex (ex: "#ff0000" ou 0xff0000)
	 */
	setColor(elementName, color) {
		const meshes = this.getMeshes(elementName);
		if (meshes.length === 0) {
			console.warn(`ModelCustomizer: Aucun mesh trouvé pour "${elementName}"`);
			return;
		}

		const threeColor = new THREE.Color(color);

		meshes.forEach((mesh) => {
			if (mesh.material) {
				const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
				materials.forEach((material) => {
					if (material.color) {
						material.color.copy(threeColor);
					}
				});
			}
		});

		console.log(`ModelCustomizer: Couleur de "${elementName}" changée en`, threeColor.getHexString());
	}

	/**
	 * Change la métallicité d'un élément
	 * @param {string} elementName - Nom de l'élément
	 * @param {number} metalness - Valeur entre 0 et 1
	 */
	setMetalness(elementName, metalness) {
		const meshes = this.getMeshes(elementName);
		if (meshes.length === 0) {
			console.warn(`ModelCustomizer: Aucun mesh trouvé pour "${elementName}"`);
			return;
		}

		meshes.forEach((mesh) => {
			if (mesh.material) {
				const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
				materials.forEach((material) => {
					if (material.metalness !== undefined) {
						material.metalness = Math.max(0, Math.min(1, metalness));
					}
				});
			}
		});
	}

	/**
	 * Change la rugosité d'un élément
	 * @param {string} elementName - Nom de l'élément
	 * @param {number} roughness - Valeur entre 0 et 1
	 */
	setRoughness(elementName, roughness) {
		const meshes = this.getMeshes(elementName);
		if (meshes.length === 0) {
			console.warn(`ModelCustomizer: Aucun mesh trouvé pour "${elementName}"`);
			return;
		}

		meshes.forEach((mesh) => {
			if (mesh.material) {
				const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
				materials.forEach((material) => {
					if (material.roughness !== undefined) {
						material.roughness = Math.max(0, Math.min(1, roughness));
					}
				});
			}
		});
	}

	/**
	 * Remplace une texture d'un élément
	 * @param {string} elementName - Nom de l'élément
	 * @param {string} textureType - Type de texture ('map', 'normalMap', 'roughnessMap', etc.)
	 * @param {string|THREE.Texture} texture - URL de la texture ou objet Texture Three.js
	 */
	async setTexture(elementName, textureType, texture) {
		const meshes = this.getMeshes(elementName);
		if (meshes.length === 0) {
			console.warn(`ModelCustomizer: Aucun mesh trouvé pour "${elementName}"`);
			return;
		}

		let threeTexture;
		if (typeof texture === 'string') {
			// Charger la texture depuis une URL
			const loader = new THREE.TextureLoader();
			threeTexture = await new Promise((resolve, reject) => {
				loader.load(
					texture,
					(resolvedTexture) => {
						resolvedTexture.flipY = false; // GLB utilise généralement flipY = false
						resolve(resolvedTexture);
					},
					undefined,
					reject
				);
			});
		} else if (texture instanceof THREE.Texture) {
			threeTexture = texture;
		} else {
			console.error('ModelCustomizer: Texture invalide');
			return;
		}

		meshes.forEach((mesh) => {
			if (mesh.material) {
				const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
				materials.forEach((material) => {
					// Disposer l'ancienne texture si elle existe
					if (material[textureType]) {
						material[textureType].dispose();
					}
					material[textureType] = threeTexture;
					material.needsUpdate = true;
				});
			}
		});

		console.log(`ModelCustomizer: Texture "${textureType}" de "${elementName}" remplacée`);
	}

	/**
	 * Retourne la liste de tous les éléments nommés disponibles
	 * @returns {Array<string>}
	 */
	getAvailableElements() {
		return Array.from(this.elements.keys());
	}

	/**
	 * Retourne les informations sur un élément
	 * @param {string} elementName - Nom de l'élément
	 * @returns {object|null}
	 */
	getElementInfo(elementName) {
		const element = this.getElement(elementName);
		if (!element) return null;

		const meshes = this.getMeshes(elementName);
		const materials = new Set();

		meshes.forEach((mesh) => {
			if (mesh.material) {
				const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
				mats.forEach((mat) => {
					materials.add({
						uuid: mat.uuid,
						name: mat.name,
						type: mat.type,
						color: mat.color ? mat.color.getHexString() : null,
						metalness: mat.metalness,
						roughness: mat.roughness,
					});
				});
			}
		});

		return {
			name: elementName,
			type: element.type,
			position: element.position,
			rotation: element.rotation,
			scale: element.scale,
			meshes: meshes.length,
			materials: Array.from(materials),
		};
	}
}
