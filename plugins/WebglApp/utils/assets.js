import LoaderManager from '@/plugins/WebglApp/manager/LoaderManager.js';
import water from '~/static/textures/water.jpg';

const assetManager = new LoaderManager();

export async function loadAssets() {
	// Les fichiers dans public/ sont servis depuis la racine
	// Pas besoin de baseUrl, le chemin relatif fonctionne
	const shoeModelPath = '/models/air_jordan_1.glb';

	await assetManager.load([
		{ name: 'water', texture: water },
		{ name: 'shoe', gltf: shoeModelPath },
	]);

	return assetManager.assets;
}

export function getAsset(name) {
	return assetManager.assets[name].texture;
}

export function getByname(name) {
	return assetManager.get(name);
}
