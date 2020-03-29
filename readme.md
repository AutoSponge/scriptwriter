# ✍️ Scriptwriter

Learn what [Playwright](https://github.com/microsoft/playwright) can do in each of the various browsers it supports. By default, Scriptwriter loads Chromium and creates a [Chrome Devtools Protocol (CDP) client](https://chromedevtools.github.io/devtools-protocol/) for more [repl](https://nodejs.org/api/repl.html) fun!

## Installation

1. Ensure you have node 10.15.0 or higher.
1. Install Playwright globally: `npm i -g playwright` (tested with [0.12.1](https://github.com/microsoft/playwright/releases/tag/v0.12.1)).
1. Install Scriptwriter: `npm i -g scriptwriter`.
1. Or clone this repo and use `npm link` or `npm start`.

## Get Started

1. `scriptwriter --no-headless` will launch the repl and Chromium.
1. Use `await` right away: `await page.goto('https://github.com')`
1. The prompt will change on load: `github.com ~>`
1. `.help` lists the global commands.
1. Pressing `Tab` twice will display autocomplete help.
1. Save and load your repl sessions!

## Config

You can use cli flags to set the config `scriptwriter --help`:

```
  Usage
    $ scriptwriter [--no-headless] [--device <name>] [--config <file>]
                   [--browser <browser>] [--no-js] [--no-csp]
  Options
    --no-headless, --no-h  Run as headless=false
    --device, -d           Load a device profile from Playwright
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
```

### Config File

You can also load a config from a file.

```
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