import fs from 'node:fs/promises';
import { dirname, join, sep, resolve } from 'node:path';
import { createRequire } from 'node:module';
import process from 'node:process';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const require = createRequire(import.meta.url);

async function resolvePackage(rootPath) {
	const playwrightPath = require.resolve('playwright', {
		paths: [rootPath],
	});
	const packageJsonPath = require.resolve('playwright/package.json', {
		paths: [rootPath],
	});
	const content = await fs.readFile(packageJsonPath, 'utf8');
	const { version } = JSON.parse(content);
	return { path: playwrightPath, version };
}

function getGlobalModuleRoots(playwrightExecutablePath) {
	const roots = new Set();
	const execDir = dirname(playwrightExecutablePath);

	roots.add(resolve(execDir, '..', 'lib', 'node_modules'));
	roots.add(resolve(execDir, '..', 'node_modules'));
	roots.add(resolve(execDir, '..', '..', 'lib', 'node_modules'));
	roots.add(resolve(execDir, '..', '..', 'node_modules'));

	const marker = `${sep}node_modules${sep}playwright${sep}`;
	const packageMarkerIndex = playwrightExecutablePath.indexOf(marker);
	if (packageMarkerIndex !== -1) {
		roots.add(
			playwrightExecutablePath.slice(
				0,
				packageMarkerIndex + `${sep}node_modules`.length,
			),
		);
	}

	return Array.from(roots);
}

async function getGlobalPlaywrightPath() {
	if (process.platform === 'win32') return null;
	try {
		const { stdout } = await execFile('which', ['playwright']);
		const globalExecutable = stdout.toString().trim();
		if (!globalExecutable) return null;
		const resolvedPath = await fs.realpath(globalExecutable);
		for (const root of getGlobalModuleRoots(resolvedPath)) {
			try {
				return await resolvePackage(root);
			} catch {
				// Continue to the next candidate root
			}
		}
	} catch {
		// If which fails or the global path cannot be resolved, continue silently.
	}
	return null;
}

/**
 * Resolve the nearest installed playwright package.
 * Searches in this order:
 * 1. Current working directory (cwd)
 * 2. Up the directory tree from cwd
 * 3. Global `playwright` executable path via `which playwright`
 *
 * @returns {Promise<{path: string, version: string}>}
 * @throws {Error} If playwright cannot be resolved
 */
export async function resolvePlaywright() {
	const searchPaths = [process.cwd()];

	// Add parent directories up to root
	let current = process.cwd();
	while (current !== dirname(current)) {
		current = dirname(current);
		searchPaths.push(current);
	}

	for (const basePath of searchPaths) {
		try {
			return await resolvePackage(basePath);
		} catch {
			// Continue to next search path.
		}
	}

	const globalResolved = await getGlobalPlaywrightPath();
	if (globalResolved) {
		return globalResolved;
	}

	throw new Error(
		'Could not resolve playwright. Ensure it is installed as a peer dependency. ' +
			'Run `npm install playwright` in your project or globally.',
	);
}
