<template>
	<NuxtPage />
</template>

<script setup>
import { onMounted } from 'vue';
import Stats from 'stats-gl';
import { addAnimationFrameCallback, startAnimationFrame } from '@/utils/raf';
import { useTransitionComposable } from '@/composables/transition-composable';
import { CONSTANT } from '@/utils/constant';

const { toggleTransitionComplete } = useTransitionComposable();

function initStats() {
	const stats = new Stats({
		logsPerSecond: 20,
		samplesLog: 100,
		samplesGraph: 10,
		precision: 2,
		horizontal: false,
		minimal: false,
		mode: 0,
	});
	document.body.appendChild(stats.dom);
	stats.begin();
	addAnimationFrameCallback(() => {
		stats.update();
	});
}

onMounted(() => {
	if (CONSTANT.debug) {
		initStats();
	}
	startAnimationFrame();
	toggleTransitionComplete(true);
});
</script>

<style lang="scss">
html {
	font-size: calc(max(100vw / 360, 1px));

	@include tablet {
		font-size: calc(max(100vw / 768, 1px));
	}

	@include desktop {
		font-size: calc(max(100vw / 1025, 1px));
	}

	@include large {
		font-size: calc(min(1px, 100vh / 800));
	}
}
</style>
