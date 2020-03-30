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
      --device, -d           Load a device profile from playwright
      --config, -c           Pass a config file to scriptwriter
      --browser, -b          Change browsers (default: chromium)
      --no-js                Disable JavaScript
      --no-csp               Bypass CSP
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
				default: false,
			},
		},
	}
);

const { config, browser, headless, csp, js, device } = cli.flags;
const file = config ? require(resolve(config)) : {};
const use = (path, fallback) => dlv(file, path, fallback);

const scriptwriter = new Scriptwriter({
	browserType: use('browserType', browser),
	launch: {
		headless: use('launch.headless', headless),
		args: use('launch.args', []),
	},
	context: {
		bypassCSP: use('context.bypassCSP', csp),
		javaScriptEnabled: use('context.javaScriptEnabled', js),
	},
	device: use('device', device),
});
scriptwriter.init();
