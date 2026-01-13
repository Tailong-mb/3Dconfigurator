export const WEBGL_CONFIG = {
	renderer: {
		antialias: true,
		alpha: true,
		powerPreference: 'high-performance',
	},
	camera: {
		fov: 30,
		near: 0.1,
		far: 1000,
		defaultPosition: {
			x: 0,
			y: 0,
			z: 6,
		},
	},
	controls: {
		enableDamping: true,
		dampingFactor: 0.05,
	},
	debug: {
		enabled: false,
	},
	draco: {
		decoderPath: 'https://www.gstatic.com/draco/v1/decoders/',
	},
};
