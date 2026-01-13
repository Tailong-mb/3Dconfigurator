import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const lenis = new Lenis({
	smooth: true,
	wheelMultiplier: 1,
	touchMultiplier: 2,
	infinite: false,
	touchStartMultiplier: 2,
	touchStartThreshold: 10,
	touchMultiplier: 1,
	smoothTouch: false,
	anchors: true,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
	lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

let anchorLinks = [];

const onLinkClick = (event) => {
	if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) {
		return;
	}

	const link = event.currentTarget;
	const href = link.href;

	const [pathname, anchor] = href.split('#');

	try {
		const linkUrl = new URL(pathname);
		const currentPath = window.location.pathname.replace(/\/$/, '');
		const linkPath = linkUrl.pathname.replace(/\/$/, '');

		if (linkPath === currentPath || pathname === '' || pathname === window.location.href.split('#')[0]) {
			event.preventDefault();

			if (anchor) {
				lenis.scrollTo(`#${anchor}`);
				window.location.hash = anchor;
			} else {
				lenis.scrollTo(0);
			}
		}
	} catch (e) {
		if (href.startsWith('#')) {
			event.preventDefault();
			const target = href.substring(1);
			if (target) {
				lenis.scrollTo(`#${target}`);
				window.location.hash = target;
			} else {
				lenis.scrollTo(0);
			}
		}
	}
};

const afterSwap = () => {
	anchorLinks.forEach((link) => {
		link.removeEventListener('click', onLinkClick);
	});

	const allLinks = [...document.querySelectorAll('a[href]')];
	anchorLinks = allLinks.filter((link) => {
		const href = link.href;
		return href.includes('#') && (href.includes('/#') || href.startsWith('#'));
	});

	anchorLinks.forEach((link) => {
		link.addEventListener('click', onLinkClick);
	});
};

if (import.meta.client) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', afterSwap);
	} else {
		afterSwap();
	}
}

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.hook('page:finish', () => {
		if (import.meta.client) {
			afterSwap();
		}
	});

	nuxtApp.provide('lenis', lenis);
});
