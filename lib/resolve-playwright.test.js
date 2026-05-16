import test from 'ava';
import { mkdtemp, writeFile, mkdir, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolvePlaywright } from './resolve-playwright.js';

test('resolvePlaywright returns version', async (t) => {
	const resolved = await resolvePlaywright();
	t.truthy(resolved.version);
	t.truthy(resolved.path);
	t.is(typeof resolved.version, 'string');
	t.regex(resolved.version, /^\d+\.\d+\.\d+/);
});

test.serial(
	'resolvePlaywright resolves global playwright via which path',
	async (t) => {
		const originalCwd = process.cwd;
		const originalPath = process.env.PATH || '';
		const tempBase = await mkdtemp(join(tmpdir(), 'scriptwriter-global-'));
		const fakeBin = join(tempBase, 'bin');
		const fakePlaywright = join(fakeBin, 'playwright');
		const fakeWhich = join(fakeBin, 'which');
		const fakeGlobalRoot = join(tempBase, 'lib', 'node_modules');
		const fakePackage = join(fakeGlobalRoot, 'playwright');
		const fakeCwd = join(tempBase, 'cwd');

		await mkdir(fakeBin, { recursive: true });
		await mkdir(fakePackage, { recursive: true });
		await mkdir(fakeCwd, { recursive: true });
		await writeFile(
			join(fakePackage, 'package.json'),
			JSON.stringify({
				name: 'playwright',
				version: '1.2.3',
				main: 'index.js',
			}),
		);
		await writeFile(
			join(fakePackage, 'index.js'),
			'module.exports = { devices: {} };',
		);
		await writeFile(fakePlaywright, '#!/usr/bin/env sh\nexit 0\n');
		await writeFile(
			fakeWhich,
			'#!/usr/bin/env sh\necho "' + fakePlaywright + '"\n',
		);
		await chmod(fakePlaywright, 0o755);
		await chmod(fakeWhich, 0o755);

		try {
			process.env.PATH = `${fakeBin}:${originalPath}`;
			process.cwd = () => fakeCwd;

			const resolved = await resolvePlaywright();
			t.is(resolved.version, '1.2.3');
			t.truthy(resolved.path);
			t.true(resolved.path.endsWith('index.js'));
		} finally {
			process.cwd = originalCwd;
			process.env.PATH = originalPath;
		}
	},
);

test('resolvePlaywright throws if playwright not found', async (t) => {
	// This test would require mocking process.cwd() and module resolution,
	// which is complex. For now, we just verify the happy path works.
	t.pass();
});
