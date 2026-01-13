import { reactive, computed, readonly } from 'vue';

// No transition to start, set default to true.
const transitionState = reactive({
	transitionComplete: false,
});

export const useTransitionComposable = () => {
	const toggleTransitionComplete = (value) => {
		transitionState.transitionComplete = value;
	};

	const isTransitioning = computed(() => !transitionState.transitionComplete);

	return {
		transitionState: readonly(transitionState),
		toggleTransitionComplete,
		isTransitioning,
	};
};
