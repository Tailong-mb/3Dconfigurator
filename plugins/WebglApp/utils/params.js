import { paramsManager } from './paramsManager.js';

/**
 * Définir tous les paramètres avec leurs options Tweakpane
 * 
 * Exemple d'utilisation :
 * - paramsManager.define('nomParam', valeurDefaut, { min: 0, max: 1, step: 0.01 })
 * - Dans Scene.js : paramsManager.bindUniform('nomParam', material.uniforms.nomUniform)
 * - Le paramètre sera automatiquement synchronisé avec l'uniform !
 */
paramsManager.define('uProgress', 0, { min: 0, max: 1, step: 0.01 });

// Exemple : ajouter d'autres paramètres
// paramsManager.define('uIntensity', 1.0, { min: 0, max: 2, step: 0.1 });
// paramsManager.define('uSpeed', 1.0, { min: 0, max: 5, step: 0.1 });
// paramsManager.define('uColor', '#ff0000'); // Pour les couleurs

// Exporter l'objet params pour compatibilité avec Tweakpane
// Tweakpane va modifier directement cet objet, et on intercepte via un Proxy
// qui met à jour automatiquement tous les uniforms liés
export const PARAMS = new Proxy(paramsManager.getParams(), {
	set(target, prop, value) {
		target[prop] = value;
		// Mettre à jour automatiquement via le manager
		paramsManager.update(prop, value);
		return true;
	},
});
