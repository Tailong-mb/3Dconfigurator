/**
 * Paramètres Manager - Système réactif pour gérer les paramètres Tweakpane
 * et les synchroniser automatiquement avec les uniforms Three.js
 */
export class ParamsManager {
	constructor() {
		this.params = {};
		this.paramDefs = {}; // Stocker les définitions avec options
		this.uniformBindings = new Map(); // Map des bindings param -> uniform
		this.callbacks = new Map(); // Map des callbacks par param
	}

	/**
	 * Définir un paramètre avec ses options
	 * @param {string} name - Nom du paramètre
	 * @param {any} defaultValue - Valeur par défaut
	 * @param {object} options - Options pour Tweakpane (min, max, step, etc.)
	 * @returns {object} Référence au paramètre (pour binding)
	 */
	define(name, defaultValue, options = {}) {
		this.params[name] = defaultValue;
		this.paramDefs[name] = {
			name,
			defaultValue,
			options,
		};
		return this.paramDefs[name];
	}

	/**
	 * Lier un paramètre à un uniform Three.js
	 * @param {string} paramName - Nom du paramètre
	 * @param {object} uniform - Uniform Three.js (ex: material.uniforms.uProgress)
	 */
	bindUniform(paramName, uniform) {
		if (!this.uniformBindings.has(paramName)) {
			this.uniformBindings.set(paramName, []);
		}
		this.uniformBindings.get(paramName).push(uniform);

		// Mettre à jour immédiatement
		uniform.value = this.params[paramName];
	}

	/**
	 * Lier un paramètre à plusieurs uniforms
	 * @param {string} paramName - Nom du paramètre
	 * @param {array} uniforms - Array d'uniforms Three.js
	 */
	bindUniforms(paramName, uniforms) {
		uniforms.forEach((uniform) => this.bindUniform(paramName, uniform));
	}

	/**
	 * Enregistrer un callback qui sera appelé quand un paramètre change
	 * @param {string} paramName - Nom du paramètre
	 * @param {function} callback - Fonction callback(value, paramName)
	 */
	onChange(paramName, callback) {
		if (!this.callbacks.has(paramName)) {
			this.callbacks.set(paramName, []);
		}
		this.callbacks.get(paramName).push(callback);
	}

	/**
	 * Mettre à jour un paramètre (appelé par Tweakpane)
	 * @param {string} name - Nom du paramètre
	 * @param {any} value - Nouvelle valeur
	 */
	update(name, value) {
		if (this.params[name] === undefined) {
			console.warn(`ParamsManager: Parameter "${name}" not defined`);
			return;
		}

		this.params[name] = value;

		// Mettre à jour tous les uniforms liés
		const uniforms = this.uniformBindings.get(name);
		if (uniforms) {
			uniforms.forEach((uniform) => {
				uniform.value = value;
			});
		}

		// Appeler tous les callbacks
		const callbacks = this.callbacks.get(name);
		if (callbacks) {
			callbacks.forEach((callback) => callback(value, name));
		}
	}

	/**
	 * Obtenir la valeur d'un paramètre
	 * @param {string} name - Nom du paramètre
	 * @returns {any} Valeur du paramètre
	 */
	get(name) {
		return this.params[name];
	}

	/**
	 * Obtenir tous les paramètres (pour Tweakpane)
	 * @returns {object} Objet avec tous les paramètres
	 */
	getParams() {
		return this.params;
	}

	/**
	 * Mettre à jour tous les uniforms avec les valeurs actuelles
	 * Utile pour réinitialiser après un changement de material
	 */
	syncAll() {
		this.uniformBindings.forEach((uniforms, paramName) => {
			const value = this.params[paramName];
			uniforms.forEach((uniform) => {
				uniform.value = value;
			});
		});
	}
}

// Instance singleton
export const paramsManager = new ParamsManager();
