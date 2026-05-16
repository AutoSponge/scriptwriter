import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import * as repl from 'repl';
import * as assert from 'assert';
import dlv from 'dlv';
import color from 'kleur';
import { resolve, dirname } from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { importGlobal } from 'import-global';
import { resolvePlaywright } from './resolve-playwright.js';
import PrettyError from 'pretty-error';
import ansiEscapes from 'ansi-escapes';
import syncPrettier from '@prettier/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = resolve(__dirname, 'events');
const COMMANDS_PATH = resolve(__dirname, 'commands');
const EVENT_ASSIGN = 'assign';
const EVENT_ENTER = 'enter';

const config = new Map();
const company = new Map();
const completions = new Set();
const prettyError = new PrettyError();

process.on('unhandledRejection', (error) => {
	console.log(prettyError.render(error));
});

export async function loadPlaywright() {
	let playwright;
	try {
		const resolved = await resolvePlaywright();
		const module = await import(pathToFileURL(resolved.path).href);
		playwright = module.default ?? module;
	} catch {
		try {
			playwright = importGlobal('playwright');
		} catch (error) {
			throw new Error(
				'Could not load Playwright. Install it locally or globally as a peer dependency.' +
					' Run `npm install playwright` in your project or install globally and retry.',
			);
		}
	}
	return playwright;
}

/**
 * @typedef {Object} config
 * @property {string} browserType
 * @property {string} device
 * @property {Object} launch
 * @property {boolean} launch.headless
 * @property {string[]} launch.args
 * @property {Object} context
 * @property {boolean} context.bypassCSP
 * @property {boolean} context.javaScriptEnabled
 */
const defaultConfig = { browserType: 'chromium', launch: {} };

/**
 * @extends EventEmitter
 */
export default class Scriptwriter extends EventEmitter {
	/**
	 * @param {config} initialConfig
	 */
	constructor(initialConfig = defaultConfig) {
		super();
		console.log();
		Object.entries(initialConfig).map(([k, v]) => config.set(k, v));
		this.playwright = null;
		this.log = this.log.bind(this);
		this.error = this.error.bind(this);
		this.on(EVENT_ASSIGN, this.register.bind(this));
		this.replServer = null;
		this.browser = null;
		this.color = color;
		this.escapes = ansiEscapes;
		this.importGlobal = importGlobal;
	}
	/**
	 * @return {Object} company
	 */
	get company() {
		return Object.fromEntries(company);
	}
	/**
	 * @return {string[]} completions
	 */
	get completions() {
		return Array.from(completions).sort();
	}
	/**
	 * Adds a completion to the internal Set.
	 * @param {string} completion
	 */
	set completion(completion) {
		completions.add(completion);
		return completion;
	}
	/**
	 * @return {config} config
	 */
	get config() {
		return Object.fromEntries(config);
	}
	/**
	 * Assigns the properties of the parameter object
	 * to the replServer.context (and the "playbill").
	 * @param {Object} obj
	 * @param {boolean} silent will not emit events
	 */
	assign(obj, silent) {
		Object.entries(obj).forEach(([name, value]) => {
			company.set(name, value);
			if (!silent) {
				this.emit(EVENT_ASSIGN, name);
			}
			const director = company.get('director');
			if (director) {
				director.context[name] = value;
			}
		});
	}
	/**
	 * Subscribes relevant event handlers from ./events.
	 * @param {string} assignment
	 * @fires EventEmitter#enter
	 */
	async register(assignment) {
		const assigned = company.get(assignment);
		assert.ok(assigned, `${assignment} not loaded.`);
		this.completion = assignment;
		if (!assigned.emit) return;
		const listings = await readdir(EVENTS_PATH);
		for (const list of listings) {
			/* istanbul ignore if */
			if (list.endsWith('.test.js')) continue;
			const [role, event] = list.replace(/\.js$/, '').split('.');
			if (assignment !== role) continue;
			const file = resolve(EVENTS_PATH, list);
			const module = await import(file);
			const handler = module.default;
			const handle = handler.bind(null, this);
			assigned[handler.once ? 'once' : 'on'](event, handle);
		}
		assigned.emit(EVENT_ENTER);
	}
	/**
	 * loads commands from folder
	 */
	async defineCommands() {
		const listings = await readdir(COMMANDS_PATH);
		for (const list of listings) {
			/* istanbul ignore if */
			if (list.endsWith('.test.js')) continue;
			const file = resolve(COMMANDS_PATH, list);
			const module = await import(file);
			const { command, name } = module;
			this.completion = `.${name}`;
			this.replServer.defineCommand(name, command);
		}
	}
	/**
	 * Resets company and completions.
	 * Recycles the replServer.
	 * Assigns the director (replServer), playwright, and browser
	 */
	async init() {
		company.clear();
		completions.clear();
		const builtinLibs = [
			'assert',
			'buffer',
			'child_process',
			'cluster',
			'crypto',
			'dgram',
			'dns',
			'domain',
			'events',
			'fs',
			'http',
			'https',
			'net',
			'os',
			'path',
			'punycode',
			'querystring',
			'readline',
			'stream',
			'string_decoder',
			'timers',
			'tls',
			'tty',
			'url',
			'util',
			'v8',
			'vm',
			'zlib',
		];
		builtinLibs.forEach(completions.add, completions);
		const completer = this.completer.bind(this);
		if (!this.replServer) {
			const testMode = process.env.NODE_ENV === 'test';
			const input = testMode ? new PassThrough() : process.stdin;
			const output = testMode ? new PassThrough() : process.stdout;
			if (testMode) {
				this._testReplInput = input;
				this._testReplOutput = output;
			}
			this.replServer = repl.start({
				prompt: '> ',
				useColors: true,
				preview: true,
				completer,
				input,
				output,
				terminal: !testMode,
			});
		}
		const director = this.replServer;
		await this.assign({ director });
		Object.keys(this.replServer.commands).forEach((key) =>
			completions.add(`.${key}`),
		);
		await this.assign({ scriptwriter: this });
		const playwright = await loadPlaywright();
		const { browserType, launch, userDataDir, device } = this.config;
		device && assert(playwright.devices[device], `unknown device "${device}".`);
		let browser;
		if (!!userDataDir) {
			browser = await playwright[browserType].launchPersistentContext(
				userDataDir,
				launch,
			);
		} else {
			browser = await playwright[browserType].launch(launch);
		}
		this.browser = browser;
		await this.assign({ playwright });
		await this.assign({ browser });
		const originalClose = director.close.bind(director);
		director.close = (...args) => {
			const browser = this.browser;
			const cleanupRepl = () => {
				if (this._testReplInput) {
					this._testReplInput.end();
					this._testReplInput = null;
				}
				if (this._testReplOutput) {
					this._testReplOutput.end();
					this._testReplOutput = null;
				}
				return originalClose(...args);
			};
			if (browser) {
				this.browser = null;
				return browser
					.close()
					.then(cleanupRepl)
					.catch(() => cleanupRepl());
			}
			return cleanupRepl();
		};
		director.displayPrompt();
	}
	/**
	 * Parses the incoming repl line for expandable namespaces
	 * known to the company.
	 * @param {string} line
	 */
	completer(line) {
		let completions = this.completions;
		// line has a space or . in it
		complex: if (line.substring(1).match(/[\s\.]/)) {
			completions = [];
			const jsonPath = dlv(line.match(/\S+$/), [0]);
			// the last chunk of syntax started an invocation
			if (!jsonPath || jsonPath.match(/\(/)) break complex;
			const chunks = jsonPath.split('.');
			const last = chunks.pop();
			// there's only one token
			if (!chunks.length) {
				completions = this.completions.flatMap((c) => {
					return c.startsWith(last) ? `${line}${c.substring(last.length)}` : [];
				});
				break complex;
			}
			const obj = dlv(this.replServer.context, chunks);
			completions = [];
			// not an object in scope
			if (!obj) break complex;
			completions = Reflect.ownKeys(obj)
				.concat(Reflect.ownKeys(Reflect.getPrototypeOf(obj) || {}))
				.flatMap((c) => {
					if (c === 'constructor') return [];
					if (typeof c !== 'string') return [];
					return [`${line.replace(/\.[^\.]*$/, '')}.${c}`];
				})
				.sort();
		}
		const hits = completions.filter((c) => c.startsWith(line));
		if (hits.length === 1 && hits[0] === line) return [[], line];
		return [hits.length ? hits : completions, line];
	}
	/**
	 * @param {string} str
	 * @param {Object} options
	 * @returns {string}
	 */
	code(str, options = { parser: 'babel' }) {
		return syncPrettier.format(str, options);
	}
	/**
	 * @param  {...any} args
	 */
	log(...args) {
		this.emit('log', args);
		if (process.env.NODE_ENV === 'test') return;
		/* istanbul ignore next */
		console.log(...args);
	}
	/**
	 * @param  {...any} args
	 */
	error(...args) {
		this.emit('error', args);
		if (process.env.NODE_ENV === 'test') return;
		console.log(prettyError.render(...args));
	}
}
