import { Mesh, PlaneGeometry } from 'three';
import PlaneTestMaterial from '../materials/plane/PlaneTest';

export default class PlaneTestMesh extends Mesh {
	constructor() {
		const geometry = new PlaneGeometry(300, 300, 100, 100);
		super(geometry, new PlaneTestMaterial());
	}
}
