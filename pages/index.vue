<template>
	<div>
		<div id="container" ref="canvas"></div>
	</div>
</template>

<script setup>
import transitionConfig from '@/helpers/transitionConfig';
import Scene from '@/plugins/WebglApp/Webgl/Scene';
import { onMounted, onBeforeUnmount, ref } from 'vue';

const canvas = ref(null);
let sceneInstance = null;

definePageMeta({
	pageTransition: transitionConfig,
});

onMounted(() => {
	sceneInstance = new Scene({
		domElement: canvas.value,
	});
});

onBeforeUnmount(() => {
	if (sceneInstance && typeof sceneInstance.dispose === 'function') {
		sceneInstance.dispose();
		sceneInstance = null;
	}
});
</script>

<style scoped lang="scss">
canvas {
	display: block;
}
#container {
	height: 100vh;
	width: 100vw;
	background: #ffffff;
}
</style>
