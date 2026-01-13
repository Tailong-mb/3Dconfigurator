import { Pane } from 'tweakpane';

/**
 * Panneau de customisation pour le modèle 3D
 * Permet de modifier les couleurs, métallicité, rugosité des éléments
 */
export default class CustomizationPane extends Pane {
	constructor(customizer, scene = null) {
		super({ title: '🎨 Customisation', expanded: true });

		this.customizer = customizer;
		this.scene = scene;
		this.params = {};

		// Obtenir tous les éléments disponibles
		const availableElements = customizer.getAvailableElements();

		// Filtrer pour éviter les doublons (ne garder que les parents, pas les meshes enfants)
		const customizableElements = this._filterUniqueElements(availableElements, customizer);

		if (customizableElements.length === 0) {
			this.addBinding({ message: 'Aucun élément customisable trouvé' }, 'message');
			return;
		}

		// Créer un dossier pour chaque élément customisable
		customizableElements.forEach((elementName) => {
			const elementInfo = customizer.getElementInfo(elementName);
			if (!elementInfo || elementInfo.materials.length === 0) return;

			// Récupérer les valeurs par défaut du premier matériau
			const firstMaterial = elementInfo.materials[0];
			// Convertir la couleur hex en format avec # pour Tweakpane
			const defaultColor = firstMaterial.color ? `#${firstMaterial.color}` : '#ffffff';
			const defaultMetalness = firstMaterial.metalness !== undefined ? firstMaterial.metalness : 0;
			const defaultRoughness = firstMaterial.roughness !== undefined ? firstMaterial.roughness : 1;

			// Initialiser les paramètres pour cet élément
			this.params[elementName] = {
				color: defaultColor,
				metalness: defaultMetalness,
				roughness: defaultRoughness,
			};

			// Créer un dossier pour cet élément
			const folder = this.addFolder({
				title: this._formatElementName(elementName),
				expanded: true,
			});

			// Contrôle de couleur
			folder
				.addBinding(this.params[elementName], 'color', {
					label: 'Couleur',
					view: 'color',
				})
				.on('change', (ev) => {
					customizer.setColor(elementName, ev.value);
				});

			// Contrôle de métallicité
			folder
				.addBinding(this.params[elementName], 'metalness', {
					label: 'Métallicité',
					min: 0,
					max: 1,
					step: 0.01,
				})
				.on('change', (ev) => {
					customizer.setMetalness(elementName, ev.value);
				});

			// Contrôle de rugosité
			folder
				.addBinding(this.params[elementName], 'roughness', {
					label: 'Rugosité',
					min: 0,
					max: 1,
					step: 0.01,
				})
				.on('change', (ev) => {
					customizer.setRoughness(elementName, ev.value);
				});
		});

		// Ajouter un bouton de réinitialisation
		this.addButton({ title: '🔄 Réinitialiser' }).on('click', () => {
			this.reset();
		});

		// Ajouter une section pour la navigation de la caméra
		if (this.scene && this.scene.cameraTargets) {
			const cameraFolder = this.addFolder({ title: '📷 Navigation Caméra', expanded: false });

			// Boutons pour zoomer sur chaque élément
			this.scene.cameraTargets.forEach((target, elementName) => {
				const elementLabel = this._formatElementName(elementName);
				cameraFolder.addButton({ title: `🔍 Focus: ${elementLabel}` }).on('click', () => {
					this.scene.focusOnElement(elementName);
				});
			});

			// Bouton pour revenir à la vue d'ensemble
			cameraFolder.addButton({ title: "🌐 Vue d'ensemble" }).on('click', () => {
				if (this.scene) {
					this.scene.focusOnElement('overview', 1500);
				}
			});
		}
	}

	/**
	 * Filtre les éléments pour ne garder que "shoe" et "shoelace"
	 * @param {Array<string>} elements - Liste de tous les éléments
	 * @param {ModelCustomizer} customizer - Instance du customizer
	 * @returns {Array<string>} Liste filtrée avec uniquement shoe et shoelace
	 */
	_filterUniqueElements(elements, customizer) {
		// Ne garder que les deux éléments principaux
		return elements.filter((name) => name === 'shoe' || name === 'shoelace');
	}

	/**
	 * Formate le nom de l'élément pour l'affichage
	 * @param {string} name - Nom de l'élément
	 * @returns {string} Nom formaté
	 */
	_formatElementName(name) {
		const names = {
			shoe: '👟 Chaussure',
			shoelace: '👔 Lacets',
		};
		return names[name] || name;
	}

	/**
	 * Réinitialise tous les paramètres aux valeurs par défaut
	 */
	reset() {
		Object.keys(this.params).forEach((elementName) => {
			const elementInfo = this.customizer.getElementInfo(elementName);
			if (elementInfo && elementInfo.materials.length > 0) {
				const firstMaterial = elementInfo.materials[0];
				const defaultColor = firstMaterial?.color ? `#${firstMaterial.color}` : '#ffffff';
				const defaultMetalness = firstMaterial?.metalness !== undefined ? firstMaterial.metalness : 0;
				const defaultRoughness = firstMaterial?.roughness !== undefined ? firstMaterial.roughness : 1;

				this.params[elementName].color = defaultColor;
				this.params[elementName].metalness = defaultMetalness;
				this.params[elementName].roughness = defaultRoughness;

				this.customizer.setColor(elementName, defaultColor);
				this.customizer.setMetalness(elementName, defaultMetalness);
				this.customizer.setRoughness(elementName, defaultRoughness);
			}
		});

		// Rafraîchir le panneau
		this.refresh();
	}
}
