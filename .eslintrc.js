module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2022: true,
	},
	extends: ['plugin:nuxt/recommended', 'plugin:vue/vue3-recommended'],
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
	},
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'vue/multi-word-component-names': 'off',
		'vue/no-v-html': 'off',
		indent: ['error', 'tab'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		'comma-dangle': ['error', 'es5'],
	},
};
