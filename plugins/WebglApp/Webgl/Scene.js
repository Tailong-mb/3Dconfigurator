import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { addAnimationFrameCallback, removeAnimationFrameCallback } from '@/utils/raf.js';
import { debounce } from '@/utils/debounce.js';
import { globalUniforms } from '@/plugins/WebglApp/utils/globalUniforms.js';
import { CONSTANT } from '@/utils/constant';
import { WEBGL_CONFIG } from '@/config/webgl.config.js';
import DebugPane from '../Debug/Pane';
import CustomizationPane from '../Debug/CustomizationPane';
import { loadAssets, getByname } from '../utils/assets.js';
import { ModelCustomizer } from '../utils/modelCustomizer.js';

export default class Scene {
	constructor(options) {
		this.container = options.domElement;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		const config = WEBGL_CONFIG.camera;
		this.camera = new THREE.PerspectiveCamera(config.fov, this.width / this.height, config.near, config.far);
		this.camera.position.set(config.defaultPosition.x, config.defaultPosition.y, config.defaultPosition.z);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xffffff); // Fond blanc

		const rendererConfig = WEBGL_CONFIG.renderer;
		this.renderer = new THREE.WebGLRenderer({
			antialias: rendererConfig.antialias,
			alpha: false, // Pas de transparence pour le fond blanc
			powerPreference: rendererConfig.powerPreference,
		});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(0xffffff, 1); // Fond blanc
		this.container.appendChild(this.renderer.domElement);

		this.setupLights();
		this.setupOrbitControls();
		this.setupDebugPanel();
		this.setupCustomizationPanel();
		this.resize();
		this.init();
		this.render();

		// Initialiser le système de logging de la caméra
		this.lastCameraLogTime = 0;
		this.cameraLogInterval = 1000; // Logger toutes les secondes

		// Stocker les références pour le cleanup
		this.renderCallback = this.render.bind(this);
		this.setupResize();
		addAnimationFrameCallback(this.renderCallback);
	}

	setupLights() {
		// Lumière ambiante pour un éclairage général doux
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		// Lumière directionnelle principale (simule le soleil)
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 10, 5);
		directionalLight.castShadow = false;
		this.scene.add(directionalLight);

		// Lumière directionnelle secondaire pour remplir les ombres
		const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
		fillLight.position.set(-5, 5, -5);
		this.scene.add(fillLight);

		// Lumière ponctuelle pour des reflets supplémentaires
		const pointLight = new THREE.PointLight(0xffffff, 0.5);
		pointLight.position.set(0, 8, 0);
		this.scene.add(pointLight);
	}

	setupOrbitControls() {
		// Toujours activer les contrôles pour le configurateur
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		const controlsConfig = WEBGL_CONFIG.controls;
		this.controls.enableDamping = controlsConfig.enableDamping;
		this.controls.dampingFactor = controlsConfig.dampingFactor;
		this.controls.enableZoom = true;
		this.controls.enablePan = true;
		this.controls.enableRotate = true;

		// Limiter le zoom
		if (controlsConfig.minDistance !== undefined) {
			this.controls.minDistance = controlsConfig.minDistance;
		}
		if (controlsConfig.maxDistance !== undefined) {
			this.controls.maxDistance = controlsConfig.maxDistance;
		}
	}

	setupDebugPanel() {
		if (CONSTANT.debug) {
			this.debug = new DebugPane();
		}
	}

	setupCustomizationPanel() {
		// Le panneau de customisation sera créé après le chargement du modèle
		// dans la méthode init()
		this.customizationPanel = null;
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	setupResize() {
		this.resizeHandler = debounce(() => {
			this.resize();
		}, 100);
		window.addEventListener('resize', this.resizeHandler);
	}

	async init() {
		try {
			// Charger les assets
			await loadAssets();

			// Récupérer le modèle de chaussure
			const shoeAsset = getByname('shoe');
			if (!shoeAsset || !shoeAsset.gltf) {
				console.error('Shoe model not found');
				return;
			}

			this.shoeModel = shoeAsset.gltf.scene.clone();

			// Logger la structure du modèle pour voir ce qui est customisable
			this.logModelStructure(this.shoeModel);

			// Initialiser le customizer pour permettre la modification du modèle
			this.customizer = new ModelCustomizer(this.shoeModel);
			const availableElements = this.customizer.getAvailableElements();
			console.log('🎨 ModelCustomizer initialisé. Éléments disponibles:', availableElements);

			// Centrer le modèle dans la scène AVANT de calculer les points d'intérêt
			this.centerModel(this.shoeModel);

			// Calculer les points d'intérêt pour la caméra (après le centrage)
			this.cameraTargets = this.calculateCameraTargets(this.shoeModel);

			// Créer le panneau de customisation Tweakpane
			this.customizationPanel = new CustomizationPane(this.customizer, this);

			// Exposer le customizer globalement pour faciliter les tests dans la console
			if (typeof window !== 'undefined') {
				window.shoeCustomizer = this.customizer;
				window.sceneInstance = this;
				console.log('💡 Le customizer est accessible via window.shoeCustomizer');
				console.log("💡 Les points d'intérêt de la caméra:", this.cameraTargets);
			}

			// Ajouter le modèle à la scène (déjà centré plus haut)
			this.scene.add(this.shoeModel);
		} catch (error) {
			console.error('Error loading shoe model:', error);
		}
	}

	logModelStructure(model) {
		const meshes = [];
		const materials = new Map();
		const textures = new Map();
		const groups = [];
		const namedObjects = [];

		model.traverse((child) => {
			// Collecter les objets nommés
			if (child.name && child.name !== '') {
				namedObjects.push({
					name: child.name,
					type: child.type,
					position: child.position,
					rotation: child.rotation,
					scale: child.scale,
				});
			}

			// Collecter les meshes
			if (child.isMesh) {
				const meshInfo = {
					name: child.name || 'Unnamed Mesh',
					type: child.type,
					geometry: {
						type: child.geometry?.type,
						vertices: child.geometry?.attributes?.position?.count || 0,
						faces: child.geometry?.attributes?.position?.count ? Math.floor(child.geometry.attributes.position.count / 3) : 0,
					},
					material: child.material,
					position: child.position,
					rotation: child.rotation,
					scale: child.scale,
				};
				meshes.push(meshInfo);

				// Collecter les matériaux
				const material = child.material;
				if (material) {
					const materialArray = Array.isArray(material) ? material : [material];
					materialArray.forEach((mat) => {
						if (!materials.has(mat.uuid)) {
							materials.set(mat.uuid, {
								uuid: mat.uuid,
								name: mat.name || 'Unnamed Material',
								type: mat.type,
								color: mat.color ? mat.color.getHexString() : null,
								metalness: mat.metalness,
								roughness: mat.roughness,
								emissive: mat.emissive ? mat.emissive.getHexString() : null,
								transparent: mat.transparent,
								opacity: mat.opacity,
								textures: {},
							});

							// Collecter les textures
							const textureKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];

							textureKeys.forEach((key) => {
								if (mat[key]) {
									const tex = mat[key];
									materials.get(mat.uuid).textures[key] = {
										uuid: tex.uuid,
										image: tex.image?.src || tex.image?.data || 'No image data',
									};
									if (!textures.has(tex.uuid)) {
										textures.set(tex.uuid, {
											uuid: tex.uuid,
											type: key,
											image: tex.image?.src || tex.image?.data || 'No image data',
										});
									}
								}
							});
						}
					});
				}
			}

			// Collecter les groupes
			if (child.isGroup) {
				groups.push({
					name: child.name || 'Unnamed Group',
					children: child.children.length,
				});
			}
		});

		// Afficher les informations
		console.log('📦 Objets nommés (customisables potentiels):', namedObjects);
		console.log(`\n🎨 Meshes (${meshes.length}):`, meshes);
		console.log(`\n💎 Matériaux (${materials.size}):`, Array.from(materials.values()));
		console.log(`\n🖼️ Textures (${textures.size}):`, Array.from(textures.values()));
		console.log(`\n👥 Groupes (${groups.length}):`, groups);

		// Suggestions de customisation
		console.log('\n✨ Suggestions de customisation:');
		if (namedObjects.length > 0) {
			console.log('  - Objets nommés trouvés:', namedObjects.map((obj) => obj.name).join(', '));
			console.log('    → Vous pouvez cibler ces objets par leur nom pour changer leurs matériaux/couleurs');
		}
		if (materials.size > 0) {
			console.log(`  - ${materials.size} matériau(x) unique(s) trouvé(s)`);
			console.log('    → Vous pouvez modifier les couleurs, métallicité, rugosité de chaque matériau');
		}
		if (textures.size > 0) {
			console.log(`  - ${textures.size} texture(s) trouvée(s)`);
			console.log("    → Vous pouvez remplacer les textures pour changer l'apparence");
		}

		console.groupEnd();

		// Stocker les informations pour utilisation future
		this.modelInfo = {
			meshes,
			materials: Array.from(materials.values()),
			textures: Array.from(textures.values()),
			groups,
			namedObjects,
		};
	}

	/**
	 * Calcule les points d'intérêt (camera targets) pour chaque élément du modèle
	 * @param {THREE.Object3D} model - Le modèle 3D
	 * @returns {Map<string, object>} Map des points d'intérêt par nom d'élément
	 */
	calculateCameraTargets(model) {
		const targets = new Map();
		const elementsToTarget = ['shoe', 'shoelace'];

		elementsToTarget.forEach((elementName) => {
			const element = this.customizer?.getElement(elementName);
			if (!element) {
				console.warn(`calculateCameraTargets: Élément "${elementName}" non trouvé`);
				return;
			}

			// Calculer la bounding box de l'élément dans l'espace monde
			const box = new THREE.Box3().setFromObject(element);
			const center = box.getCenter(new THREE.Vector3());
			const size = box.getSize(new THREE.Vector3());

			// Positions définies manuellement
			let cameraPosition;
			if (elementName === 'shoe') {
				cameraPosition = new THREE.Vector3(68.248, -3.159, -11.119);
			} else if (elementName === 'shoelace') {
				cameraPosition = new THREE.Vector3(1.313, 17.765, 46.719);
			} else {
				// Fallback si l'élément n'est pas reconnu
				const fovRad = (this.camera.fov * Math.PI) / 180;
				const aspect = this.width / this.height;
				const distanceX = size.x / 2 / Math.tan(fovRad / 2);
				const distanceY = size.y / 2 / (Math.tan(fovRad / 2) * aspect);
				const cameraDistance = Math.max(distanceX, distanceY) * 1.2;
				const angle = Math.PI / 6;
				cameraPosition = new THREE.Vector3(center.x + Math.sin(angle) * cameraDistance * 0.5, center.y + size.y * 0.3, center.z + Math.cos(angle) * cameraDistance * 0.6);
			}

			targets.set(elementName, {
				target: center.clone(), // Point vers lequel la caméra regarde
				position: cameraPosition, // Position de la caméra définie manuellement
				distance: cameraPosition.distanceTo(center), // Distance calculée
				size: size,
			});

			console.log(`Camera target calculé pour "${elementName}":`, {
				center: center,
				position: cameraPosition,
				distance: cameraPosition.distanceTo(center),
			});
		});

		return targets;
	}

	/**
	 * Anime la caméra vers un point d'intérêt
	 * @param {string} elementName - Nom de l'élément à viser ('overview' pour vue d'ensemble)
	 * @param {number} duration - Durée de l'animation en ms (défaut: 1000)
	 */
	async focusOnElement(elementName, duration = 1000) {
		// Vue d'ensemble
		if (elementName === 'overview') {
			const box = new THREE.Box3().setFromObject(this.shoeModel);
			const center = box.getCenter(new THREE.Vector3());

			// Position définie manuellement
			const cameraPosition = new THREE.Vector3(50.112, 27.794, 36.482);

			const target = {
				target: center.clone(), // Regarder vers le centre du modèle
				position: cameraPosition,
			};

			return this._animateCamera(target, duration);
		}

		// Point d'intérêt spécifique
		const target = this.cameraTargets?.get(elementName);
		if (!target) {
			console.warn(`Scene: Aucun point d'intérêt trouvé pour "${elementName}"`);
			return;
		}

		return this._animateCamera(target, duration);
	}

	/**
	 * Anime la caméra vers une cible avec une transition fluide
	 * @param {object} target - Objet avec position et target
	 * @param {number} duration - Durée en ms
	 */
	async _animateCamera(target, duration) {
		// Utiliser GSAP pour animer la caméra (déjà disponible dans le projet)
		const gsap = (await import('gsap')).default;

		const startPosition = this.camera.position.clone();
		const startTarget = this.controls.target.clone();

		// Désactiver temporairement les contrôles pendant l'animation
		this.controls.enabled = false;

		// Créer un objet pour l'animation
		const animData = {
			posX: startPosition.x,
			posY: startPosition.y,
			posZ: startPosition.z,
			targetX: startTarget.x,
			targetY: startTarget.y,
			targetZ: startTarget.z,
		};

		// Animation avec GSAP
		const timeline = gsap.timeline({
			onUpdate: () => {
				// Mettre à jour la position de la caméra
				this.camera.position.set(animData.posX, animData.posY, animData.posZ);

				// Mettre à jour le target des contrôles
				this.controls.target.set(animData.targetX, animData.targetY, animData.targetZ);

				// Utiliser lookAt pour s'assurer que la caméra regarde toujours vers le target
				this.camera.lookAt(animData.targetX, animData.targetY, animData.targetZ);

				// Mettre à jour les contrôles
				this.controls.update();
			},
			onComplete: () => {
				// Réactiver les contrôles après l'animation
				this.controls.enabled = true;
			},
		});

		// Animer vers la position finale avec une courbe d'easing smooth
		timeline.to(animData, {
			posX: target.position.x,
			posY: target.position.y,
			posZ: target.position.z,
			targetX: target.target.x,
			targetY: target.target.y,
			targetZ: target.target.z,
			duration: 1.5,
			ease: 'power1.inOut', // Courbe d'easing smooth
		});
	}

	centerModel(model) {
		// Créer une bounding box pour calculer le centre et la taille
		const box = new THREE.Box3().setFromObject(model);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());

		// Centrer le modèle à l'origine
		model.position.x = -center.x;
		model.position.y = -center.y;
		model.position.z = -center.z;

		// Ajuster la caméra pour voir tout le modèle correctement
		// Calculer la distance nécessaire pour voir tout le modèle
		const fovRad = (this.camera.fov * Math.PI) / 180;
		const aspect = this.width / this.height;

		// Prendre en compte à la fois la largeur et la hauteur du modèle
		const distanceX = size.x / 2 / Math.tan(fovRad / 2);
		const distanceY = size.y / 2 / (Math.tan(fovRad / 2) * aspect);

		// Position de base définie manuellement
		this.camera.position.set(12.675, 30.65, 67.268);

		// Ajuster les contrôles pour centrer sur le modèle
		if (this.controls) {
			this.controls.target.set(0, 0, 0);
			this.controls.update();
		}
	}

	/**
	 * Méthode helper pour accéder au customizer depuis l'extérieur
	 * @returns {ModelCustomizer}
	 */
	getCustomizer() {
		return this.customizer;
	}

	/**
	 * Change la couleur d'un élément du modèle
	 * @param {string} elementName - Nom de l'élément (ex: "shoe", "shoelace")
	 * @param {string|number} color - Couleur en hex (ex: "#ff0000" ou 0xff0000)
	 */
	setElementColor(elementName, color) {
		if (this.customizer) {
			this.customizer.setColor(elementName, color);
		}
	}

	/**
	 * Change la métallicité d'un élément
	 * @param {string} elementName - Nom de l'élément
	 * @param {number} metalness - Valeur entre 0 et 1
	 */
	setElementMetalness(elementName, metalness) {
		if (this.customizer) {
			this.customizer.setMetalness(elementName, metalness);
		}
	}

	/**
	 * Change la rugosité d'un élément
	 * @param {string} elementName - Nom de l'élément
	 * @param {number} roughness - Valeur entre 0 et 1
	 */
	setElementRoughness(elementName, roughness) {
		if (this.customizer) {
			this.customizer.setRoughness(elementName, roughness);
		}
	}

	render() {
		globalUniforms.uTime.value += 0.05;

		if (this.controls) {
			this.controls.update();
		}

		// Logger la position de la caméra toutes les secondes
		const now = Date.now();
		if (now - this.lastCameraLogTime >= this.cameraLogInterval) {
			if (this.camera && this.controls) {
				const pos = this.camera.position;
				const target = this.controls.target;
				console.log('📷 Camera Position:', {
					x: pos.x.toFixed(3),
					y: pos.y.toFixed(3),
					z: pos.z.toFixed(3),
				});
				console.log('🎯 Camera Target:', {
					x: target.x.toFixed(3),
					y: target.y.toFixed(3),
					z: target.z.toFixed(3),
				});
			}
			this.lastCameraLogTime = now;
		}

		this.renderer.render(this.scene, this.camera);
	}

	dispose() {
		// Nettoyer les event listeners
		if (this.resizeHandler) {
			window.removeEventListener('resize', this.resizeHandler);
			this.resizeHandler = null;
		}

		// Retirer le callback RAF
		if (this.renderCallback) {
			removeAnimationFrameCallback(this.renderCallback);
			this.renderCallback = null;
		}

		// Disposer le modèle de chaussure
		if (this.shoeModel) {
			this.shoeModel.traverse((child) => {
				if (child.isMesh) {
					if (child.geometry) {
						child.geometry.dispose();
					}
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((material) => {
								if (material.map) material.map.dispose();
								if (material.normalMap) material.normalMap.dispose();
								if (material.roughnessMap) material.roughnessMap.dispose();
								if (material.metalnessMap) material.metalnessMap.dispose();
								material.dispose();
							});
						} else {
							if (child.material.map) child.material.map.dispose();
							if (child.material.normalMap) child.material.normalMap.dispose();
							if (child.material.roughnessMap) child.material.roughnessMap.dispose();
							if (child.material.metalnessMap) child.material.metalnessMap.dispose();
							child.material.dispose();
						}
					}
				}
			});
			this.scene.remove(this.shoeModel);
			this.shoeModel = null;
		}

		// Nettoyer le renderer
		if (this.renderer) {
			this.renderer.dispose();
			if (this.renderer.domElement && this.renderer.domElement.parentNode) {
				this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
			}
			this.renderer = null;
		}

		// Nettoyer les controls
		if (this.controls) {
			this.controls.dispose();
			this.controls = null;
		}

		// Nettoyer le debug panel
		if (this.debug) {
			this.debug.dispose();
			this.debug = null;
		}

		// Nettoyer le panneau de customisation
		if (this.customizationPanel) {
			this.customizationPanel.dispose();
			this.customizationPanel = null;
		}

		// Nettoyer la scène
		if (this.scene) {
			while (this.scene.children.length > 0) {
				this.scene.remove(this.scene.children[0]);
			}
			this.scene = null;
		}

		// Nettoyer la caméra
		this.camera = null;
	}
}
