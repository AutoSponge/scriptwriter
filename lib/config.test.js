import test from 'ava';
import { mergeConfig } from './config.js';

test('mergeConfig deep merges nested objects', (t) => {
	const target = {
		browserType: 'chromium',
		launch: {
			headless: true,
			args: ['--mute-audio'],
		},
		context: {
			javaScriptEnabled: true,
		},
	};

	const source = {
		launch: {
			headless: false,
			args: ['--disable-gpu'],
		},
		context: {
			viewport: { width: 800, height: 600 },
		},
	};

	const result = mergeConfig(target, source);

	t.deepEqual(result, {
		browserType: 'chromium',
		launch: {
			headless: false,
			args: ['--disable-gpu'],
		},
		context: {
			javaScriptEnabled: true,
			viewport: { width: 800, height: 600 },
		},
	});
});

test('mergeConfig prefers source arrays and primitives', (t) => {
	const target = {
		launch: {
			args: ['--mute-audio'],
		},
	};

	const source = {
		launch: {
			args: ['--headless=new'],
		},
	};

	const result = mergeConfig(target, source);

	t.deepEqual(result.launch.args, ['--headless=new']);
});
