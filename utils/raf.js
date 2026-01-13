let animationFrameId = null;
const callbacks = new Set();
let isPaused = false;
let isPageVisible = true;

// Pause automatique quand la page est cachée
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		isPageVisible = !document.hidden;
	});
}

function rafCallback() {
	if (isPaused || !isPageVisible) return;
	for (const callback of callbacks) {
		callback();
	}
}

export function startAnimationFrame() {
	if (!animationFrameId) {
		function rafLoop() {
			rafCallback();
			animationFrameId = requestAnimationFrame(rafLoop);
		}
		rafLoop();
	}
}

export function stopAnimationFrame() {
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
}

export function pauseAnimationFrame() {
	isPaused = true;
}

export function resumeAnimationFrame() {
	isPaused = false;
}

export function addAnimationFrameCallback(callback) {
	callbacks.add(callback);
}

export function removeAnimationFrameCallback(callback) {
	callbacks.delete(callback);
}
