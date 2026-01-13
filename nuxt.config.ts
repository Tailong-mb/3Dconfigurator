import glsl from 'vite-plugin-glsl';
import * as sass from 'sass';

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
	ssr: false,
	devtools: { enabled: false },

	build: {
		transpile: ['three', 'gsap'],
	},

	plugins: [
		{ src: '~/plugins/gsap.js', mode: 'client', ssr: false },
		{ src: '~/plugins/lenis.js', mode: 'client', ssr: false },
	],

	vite: {
		plugins: [glsl()],
		build: {
			rollupOptions: {
				onwarn(warning: any, warn: any) {
					if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
						return;
					}
					warn(warning);
				},
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/scss/mixins.scss" as *; @use "@/assets/scss/variables.scss" as *;@use "@/assets/scss/fonts.scss" as *;@use "@/assets/scss/reset.scss" as *;',
					implementation: sass,
					api: 'modern-compiler', // or "modern"
				},
			},
		},
	},

	compatibilityDate: '2024-10-24',
});
