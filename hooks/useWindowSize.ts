import { useState, useEffect } from 'react';

/**
 * Simple hook that returns window width/height and updates on resize.
 * Named export `useWindowSize` so existing imports work.
 */
export function useWindowSize() {
	const isClient = typeof window !== 'undefined';
	const [size, setSize] = useState(() => ({
		width: isClient ? window.innerWidth : 1920,
		height: isClient ? window.innerHeight : 1080,
	}));

	useEffect(() => {
		if (!isClient) return;
		function onResize() {
			setSize({ width: window.innerWidth, height: window.innerHeight });
		}
		window.addEventListener('resize', onResize);
		// trigger once in case of hydration mismatch
		onResize();
		return () => window.removeEventListener('resize', onResize);
	}, [isClient]);

	return size;
}

export default useWindowSize;
