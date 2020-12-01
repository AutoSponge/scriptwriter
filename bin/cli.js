#!/usr/bin/env node --experimental-repl-await

'use strict';
const { resolve } = require('path');
const meow = require('meow');
const dlv = require('dlv');
const Scriptwriter = require('../');
const cli = meow(
	`
    Usage
      $ scriptwriter [--no-headless] [--device <name>] [--config <file>]
                     [--browser <browser>] [--no-js] [--no-csp]
    Options
      --no-headless, --no-h  Run as headless=false
      --device, -d           Load a device profile from Playwright
      --config, -c           Pass a config file to Scriptwriter
      --browser, -b          Change browsers (default: chromium)
      --no-js                Disable JavaScript
      --no-csp               Bypass CSP
      --aom, -a              Launch with Accessibility Object Model (AOM) enabled
      --user, -u             Launch with a Persistent Context
    Examples
      $ scriptwriter
      $ scriptwriter --no-headless
      $ scriptwriter --device 'iPhone X'
      $ scriptwriter --config ./config.js
      $ scriptwriter -c ./config.json --no-h
      $ scriptwriter --no-js --b firefox
`,
	{
		flags: {
			headless: {
				type: 'boolean',
				default: true,
				alias: 'h',
			},
			device: {
				type: 'string',
				alias: 'd',
			},
			config: {
				type: 'string',
				alias: 'c',
			},
			browser: {
				type: 'string',
				default: 'chromium',
				alias: 'b',
			},
			js: {
				type: 'boolean',
				default: true,
			},
			csp: {
				type: 'boolean',
				default: true,
			},
			aom: {
				type: 'boolean',
				default: false,
				alias: 'a',
			},
			user: {
				type: 'string',
				default: '',
				alias: 'u',
			},
		},
	}
);

const { config, browser, headless, csp, js, device, aom, user } = cli.flags;
console.log(cli.flags);
const file = config ? require(resolve(config)) : {};
const use = (path, fallback) => dlv(file, path, fallback);
const normalizedConfig = {
	browserType: use('browserType', browser),
	userDataDir: use('userDataDir', user),
	launch: {
		headless: use('launch.headless', headless),
		args: use('launch.args', []),
		bypassCSP: use('launch.csp', !csp),
	},
	context: {
		javaScriptEnabled: use('context.javaScriptEnabled', js),
	},
	device: use('device', device),
};
const aomFlag = '--enable-blink-features=AccessibilityObjectModel';
if (aom && !normalizedConfig.launch.args.includes(aomFlag)) {
	normalizedConfig.launch.args.push(aomFlag);
}
const scriptwriter = new Scriptwriter(normalizedConfig);
scriptwriter.init();
