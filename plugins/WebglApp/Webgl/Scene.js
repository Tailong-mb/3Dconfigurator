import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { addAnimationFrameCallback, removeAnimationFrameCallback } from '@/utils/raf.js';
import { debounce } from '@/utils/debounce.js';
import { globalUniforms } from '@/plugins/WebglApp/utils/globalUniforms.js';
import { CONSTANT } from '@/utils/constant';
import { WEBGL_CONFIG } from '@/config/webgl.config.js';
import { paramsManager } from '../utils/paramsManager.js';
import DebugPane from '../Debug/Pane';
import PlaneTestMesh from './meshs/PlaneTest';

export default class Scene {
	constructor(options) {
		this.container = options.domElement;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		const config = WEBGL_CONFIG.camera;
		this.camera = new THREE.PerspectiveCamera(config.fov, this.width / this.height, config.near, config.far);
		this.camera.position.set(config.defaultPosition.x, config.defaultPosition.y, config.defaultPosition.z);

		this.camera.fov = (2 * Math.atan(this.height / 2 / 6) * 180) / Math.PI;

		this.scene = new THREE.Scene();

		const rendererConfig = WEBGL_CONFIG.renderer;
		this.renderer = new THREE.WebGLRenderer({
			antialias: rendererConfig.antialias,
			alpha: rendererConfig.alpha,
			powerPreference: rendererConfig.powerPreference,
		});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.container.appendChild(this.renderer.domElement);

		this.setupOrbitControls();
		this.setupDebugPanel();
		this.resize();
		this.addObjects();
		this.render();

		// Stocker les références pour le cleanup
		this.renderCallback = this.render.bind(this);
		this.setupResize();
		addAnimationFrameCallback(this.renderCallback);
	}

	setupOrbitControls() {
		if (CONSTANT.orbit) {
			this.controls = new OrbitControls(this.camera, this.renderer.domElement);
			const controlsConfig = WEBGL_CONFIG.controls;
			this.controls.enableDamping = controlsConfig.enableDamping;
			this.controls.dampingFactor = controlsConfig.dampingFactor;
		}
	}

	setupDebugPanel() {
		if (CONSTANT.debug) {
			this.debug = new DebugPane();
		}
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

	addObjects() {
		this.mesh = new PlaneTestMesh();
		this.mesh.position.x = 3;
		this.scene.add(this.mesh);

		if (this.mesh.material) {
			paramsManager.bindUniform('uProgress', this.mesh.material.uniforms.uProgress);
		}
	}

	render() {
		globalUniforms.uTime.value += 0.05;

		if (this.mesh && this.mesh.material) {
			this.mesh.material.uniforms.uResolution.value.set(this.width, this.height);
		}

		if (this.controls) {
			this.controls.update();
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

		// Disposer les objets Three.js
		if (this.mesh) {
			if (this.mesh.geometry) {
				this.mesh.geometry.dispose();
			}
			if (this.mesh.material) {
				// Disposer toutes les textures du material
				Object.keys(this.mesh.material.uniforms).forEach((uniformName) => {
					const uniform = this.mesh.material.uniforms[uniformName];
					if (uniform.value && uniform.value.dispose) {
						uniform.value.dispose();
					}
				});
				this.mesh.material.dispose();
			}
			this.scene.remove(this.mesh);
			this.mesh = null;
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
