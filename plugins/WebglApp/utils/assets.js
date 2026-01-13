import LoaderManager from '@/plugins/WebglApp/manager/LoaderManager.js';
import water from '~/static/textures/water.jpg';

const assetManager = new LoaderManager();

export async function loadAssets() {
	await assetManager.load([{ name: 'water', texture: water }]);

	return assetManager.assets;
}

export function getAsset(name) {
	return assetManager.assets[name].texture;
}

export function getByname(name) {
	return assetManager.get(name);
}
