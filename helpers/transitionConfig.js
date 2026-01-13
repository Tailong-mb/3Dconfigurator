import gsap from 'gsap';

import { useTransitionComposable } from '@/composables/transition-composable';

const { toggleTransitionComplete } = useTransitionComposable();

const pageTransition = {
	name: 'page-transiton',
	mode: 'out-in',
	onEnter: (el, done) => {
		gsap.timeline({
			paused: true,
			onComplete() {
				toggleTransitionComplete(true);
				done();
			},
		})
			.fromTo(el, { alpha: 0 }, { alpha: 1, duration: 1 })
			.play();
	},
	onLeave: (el, done) => {
		toggleTransitionComplete(false);
		gsap.timeline({ paused: true, onComplete: done }).to(el, { alpha: 0, duration: 1 }).play();
	},
};

export default pageTransition;
