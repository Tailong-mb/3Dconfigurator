import { Pane } from 'tweakpane';
import { PARAMS } from '../utils/params';
import { paramsManager } from '../utils/paramsManager.js';

export default class DebugPane extends Pane {
	constructor() {
		super({ title: 'Debug' });

		// Ajouter automatiquement tous les paramètres définis dans paramsManager
		const params = paramsManager.getParams();
		const paramDefs = paramsManager.paramDefs || {};

		Object.keys(params).forEach((key) => {
			const options = paramDefs[key]?.options || {};
			this.addBinding(PARAMS, key, options);
		});
	}
}
