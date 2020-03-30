const EventEmitter = require('events');
const repl = require('repl');
const assert = require('assert');
const dlv = require('dlv');
const { resolve } = require('path');
const { readdir } = require('fs').promises;
const importGlobal = require('import-global');
const playwright = importGlobal('playwright');
const PrettyError = require('pretty-error');

const EVENTS_PATH = resolve(__dirname, 'events');
const EVENTS_DIR = readdir(EVENTS_PATH);
const EVENT_ASSIGN = 'assign';
const EVENT_ENTER = 'enter';

const config = new Map();
const company = new Map();
const completions = new Set();
const prettyError = new PrettyError();

process.on('unhandledRejection', error => {	
	console.log(prettyError.render(error));
});

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
module.exports = class Scriptwriter extends EventEmitter {
	/**
	 * @param {config} config
	 */
	constructor(initialConfig = defaultConfig) {
		super();
		Object.entries(initialConfig).map(([k, v]) => config.set(k, v));
		this.on(EVENT_ASSIGN, this.register.bind(this));
		this.replServer = null;
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
	 */
	assign(obj) {
		Object.entries(obj).forEach(([name, value]) => {
			company.set(name, value);
			this.emit(EVENT_ASSIGN, name);
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
		assert.ok(assigned, `${assigned} not loaded.`);
		this.completion = assignment;
		if (!assigned.emit) return;
		const listings = await EVENTS_DIR;
		for (const list of listings) {
			/* istanbul ignore if */
			if (list.endsWith('.test.js')) continue;
			const [role, event] = list.replace(/\.js$/, '').split('.');
			if (assignment !== role) continue;
			const file = resolve(EVENTS_PATH, list);
			const handler = require(file);
			const handle = handler.bind(null, this);
			assigned[handler.once ? 'once' : 'on'](event, handle);
		}
		assigned.emit(EVENT_ENTER);
	}
	/**
	 * Resets company and completions.
	 * Recycles the replServer.
	 * Assigns the director (replServer), playwright, and browser
	 */
	async init() {
		company.clear();
		completions.clear();
		repl._builtinLibs.forEach(completions.add, completions);
		const completer = this.completer.bind(this);
		if (!this.replServer) {
			this.replServer = repl.start({
				prompt: '> ',
				useColors: true,
				preview: true,
				completer,
			});
		}
		Object.keys(repl.repl.commands).forEach(key => completions.add(`.${key}`));
		const director = this.replServer;
		await this.assign({ director });
		const { browserType, launch } = this.config;
		const browser = await playwright[browserType].launch(launch);
		await this.assign({ playwright, browser });
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
				completions = this.completions.flatMap(c => {
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
				.flatMap(c => {
					if (c === 'constructor') return [];
					if (typeof c !== 'string') return [];
					return [`${line.replace(/\.[^\.]*$/, '')}.${c}`];
				})
				.sort();
		}
		const hits = completions.filter(c => c.startsWith(line));
		if (hits.length === 1 && hits[0] === line) return [[], line];
		return [hits.length ? hits : completions, line];
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
		console.log(prettyError.render(...args))
	}
};
