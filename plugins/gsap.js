import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase);
gsap.config({ force3D: true });
gsap.defaults({
	ease: 'none',
});

CustomEase.create('immg.zoomIn', '0.9, 0.0, 0.4, 1.0');
CustomEase.create('immg.zoomOut', '0.4, 0.0, 0.1, 1.0');
CustomEase.create('immg.posIn', '0.4, 0.0, 0.1, 1.0');
CustomEase.create('immg.posOut', '0.9, 0.0, 0.4, 1.0');
CustomEase.create('immg.expoOut', '0.14, 1.0, 0.34, 1.0');
CustomEase.create('immg.expoIn', '0.66, 0.0, 0.86, 0.0');

export default defineNuxtPlugin(() => {});
