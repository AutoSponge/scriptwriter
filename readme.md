# ✍️ Scriptwriter [![npm](https://img.shields.io/npm/v/scriptwriter?color=success)](https://www.npmjs.com/package/scriptwriter) [![GitHub last commit](https://img.shields.io/github/last-commit/autosponge/scriptwriter)](https://github.com/AutoSponge/scriptwriter)

Learn what [Playwright](https://github.com/microsoft/playwright) can do in each of the various browsers it supports. By default, Scriptwriter loads Chromium and creates a [Chrome Devtools Protocol (CDP) client](https://chromedevtools.github.io/devtools-protocol/) for more [repl](https://nodejs.org/api/repl.html) fun!

## Installation

![node](https://img.shields.io/node/v/scriptwriter?color=important)
[![npm peer dependency version](https://img.shields.io/npm/dependency-version/scriptwriter/peer/playwright)](https://github.com/microsoft/playwright/)

1. Ensure you have Node.js 24.14.0 or higher.
1. Install Playwright as a peer dependency: Scriptwriter requires `playwright@^1.60.0`.
   - For global installs: `npm i -g playwright`
   - For local project: `npm install playwright`
   - In a monorepo: install in the project's `node_modules` or a parent workspace
1. Install Scriptwriter: `npm i -g scriptwriter`.
1. Or clone this repo, install, and use `npm link` or `npm start`.

### Playwright Resolution

Scriptwriter uses a "nearest" resolution strategy to find the installed Playwright package:

1. **Current working directory** — Searches `node_modules/playwright` in the directory where `scriptwriter` is run
2. **Parent directories** — Traverses up the directory tree looking for installed Playwright
3. **Installation location** — Falls back to Playwright installed alongside Scriptwriter

This means you can:

- Run Scriptwriter from a project with its own Playwright installation
- Use a global Playwright with `scriptwriter -g`
- Use Playwright from any parent directory in a monorepo or nested project structure

## Get Started

1. `scriptwriter --no-headless` will launch the repl and Chromium.
1. Use `await` right away: `await page.goto('https://github.com')`
1. The prompt will change on load: `github.com ~>`
1. `.help` lists the global commands.
1. Pressing `Tab` twice will display autocomplete help.
1. Save and load your repl sessions!

## Dump Command

Scriptwriter now supports the `.dump` command to serialize and save objects to disk in multiple formats.

Usage:

```text
.dump <object> [type] [depth]
```

Examples:

```text
.dump page json
.dump browser ansi 2
.dump myData txt 3
```

Supported output types:

- `txt` (default): saves a plain-text `util.inspect` dump.
- `json`: saves `JSON.stringify(obj, null, '  ')` for readable JSON.
- `ansi`: saves an ANSI-colored `util.inspect` dump for terminal-style output.

For the `ansi` output type, use a suitable editor viewer such as the VS Code extension `ANSI Colors` to get proper syntax highlighting for `.ansi` files.

## Config

You can use cli flags to set the config `scriptwriter --help`:

```
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
```

### Config File

You can also load a config from a file. File values are deep-merged into the runtime config so nested `launch` and `context` options work as expected.

```json
// iphonex.json
{
	"launch": {
		"headless": true,
		"args": ["--some-blink-specific-tag-name"]
	},
	"context": {},
	"device": "iPhone X"
}
```

`scriptwriter --config iphonex.json`

### Custom Commands

You can load your own commands. Scriptwriter exposes some helpful utility functions.

- director = [node repl](https://nodejs.org/api/repl.html) instance
- scriptwriter.code = [prettier](https://prettier.io/).format
- scriptwriter.color = [kleur](https://www.npmjs.com/package/kleur)
- scriptwriter.error = [pretty-error](https://www.npmjs.com/package/pretty-error)
- scriptwriter.escapes = [ansi-escapes](https://www.npmjs.com/package/ansi-escapes)
- scriptwriter.importGlobal = [import-global](https://www.npmjs.com/package/import-global)

Example:

```js
// my-command.js
scriptwriter.completion = '.louder';
director.defineCommand('louder', {
	help: `make something louder`,
	async action(str) {
		const { log, color } = scriptwriter;
		log(color.red(`${str.toUpperCase()}!!`));
		director.displayPrompt();
	},
});
```

```js
// in the scriptwriter repl
> .load my-command.js
> .louder test
TEST!!
```

### Mac Firewall

On a mac, you may get the firewall popup.

1. Open keychain access.
1. In the top menu, choose `Keychain Access > Certificate Assistant > Create a Certificate`.
1. Name it `Playwright`.
1. Change the `Certificate Type` to `Code Signing`.
1. Click `create`.
1. Right click your new certificate and choose `Get Info`.
1. Open `Trust` disclosure.
1. Change `When using this certificate:` to `Always Trust`.
1. Start Scriptwriter.
1. When Chromium starts, right click the icon in the menu bar, choose `Options > Show in Finder`.
1. Right click Chromium and select `New Terminal Here`.
1. In the terminal type `pwd` and copy the path.
1. Use the following to assign the certificate: `sudo codesign -s Playwright -f <PATH_TO_CHROMIUM> --deep`.

## Similar Projects

- [🐺 QA Wolf](https://www.qawolf.com/)
- [Try Playwright](https://try.playwright.tech/)
