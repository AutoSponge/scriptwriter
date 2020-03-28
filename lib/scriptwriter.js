const EventEmitter = require('events');
const repl = require('repl');
const assert = require('assert');
const dlv = require('dlv');
const { resolve } = require('path');
const { readdir } = require('fs').promises;
const { isString } = require('./utils');
const importGlobal = require('import-global');
const playwright = importGlobal('playwright');

const EVENTS_PATH = resolve(process.cwd(), 'lib/events');
const EVENTS_DIR = readdir(EVENTS_PATH);
const EVENT_ASSIGN = 'assign';
const EVENT_ENTER = 'enter';

const config = new Map();
const company = new Map();
const completions = new Set();

module.exports = class Scriptwriter extends EventEmitter {
	constructor(initialConfig = {}) {
		super();
		Object.entries(initialConfig).map(([k, v]) => config.set(k, v));
		this.on(EVENT_ASSIGN, this.register.bind(this));
		this.replServer = null;
	}

	get company() {
		return Object.fromEntries(company);
	}

	get completions() {
		return Array.from(completions).sort();
	}

	set completion(str) {
		completions.add(str);
	}

	get config() {
		return Object.fromEntries(config);
	}

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

	async register(assignment) {
		const assigned = company.get(assignment);
		assert.ok(assigned, `${assigned} not loaded.`);
		this.completion = assignment;
		if (!assigned.emit) return;
		const listings = await EVENTS_DIR;
		for (const list of listings) {
			if (list.endsWith('.test.js')) continue;
			const [role, event] = list.replace(/\.js$/, '').split('.');
			if (assignment !== role) continue;
			const file = resolve(EVENTS_PATH, list);
			const handle = require(file).bind(null, this);
			assigned.on(event, handle);
		}
		assigned.emit(EVENT_ENTER);
	}

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

	completer(line) {
		let completions = this.completions;
		complex: if (line.substring(1).match(/[\s\.]/)) {
			const jsonPath = dlv(line.match(/\S+$/), [0]);
			completions = [];
			if (!jsonPath || jsonPath.match(/\(/)) break complex;
			const chunks = jsonPath.split('.');
			completions = this.completions;
			chunks.pop();
			if (!chunks.length) break complex;
			const obj = dlv(this.company, chunks);
			if (!obj) break complex;
			completions = Reflect.ownKeys(obj)
				.concat(Reflect.ownKeys(Reflect.getPrototypeOf(obj)))
				.flatMap(c => {
					if (!isString(c)) return [];
					if (c === 'constructor') return [];
					return [`${line.replace(/\.[^\.]*$/, '')}.${c}`];
				})
				.sort();
		}
		const hits = completions.filter(c => c.startsWith(line));
		return [hits.length ? hits : completions, line];
	}
};
