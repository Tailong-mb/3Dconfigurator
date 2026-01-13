export const CONSTANT = {
	get orbit() {
		if (typeof window === 'undefined') return false;
		return new URLSearchParams(window.location.search).has('orbit');
	},
	get debug() {
		if (typeof window === 'undefined') return false;
		return new URLSearchParams(window.location.search).has('debug');
	},
	get width() {
		return typeof window !== 'undefined' ? window.innerWidth : 1920;
	},
	get height() {
		return typeof window !== 'undefined' ? window.innerHeight : 1080;
	},
};
