# brouter-imperial

A Firefox and Chromium extension that changes the route statistics on
[brouter.de/brouter-web](https://brouter.de/brouter-web) from metric to imperial units:

- Route distance: kilometers to miles
- Route distance markers: every 5 miles instead of every 5 kilometers
- Ascend and plain ascend: meters to feet, with comma-separated thousands
- Elevation profile axes and hover details: miles and feet

The extension watches BRouter's route statistics for DOM changes and also
checks them after clicks, pointer interactions, and touchscreen taps.

## Build

Node.js 18 or newer is required.

```text
npm run build
```

This creates unpacked extensions in `dist\chromium` and `dist\firefox`.
To also create store-ready ZIP archives in `artifacts`, run:

```text
npm run package
```

The extension supports Chromium 111 or newer, Firefox 140 or newer, and
Firefox for Android 142 or newer.

## Install in Chromium

1. Run `npm run build`.
2. Open `chrome://extensions` in Chromium, Chrome, Brave, or Edge.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this repository's `dist\chromium` folder.

## Install in Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on**.
4. Select `dist\firefox\manifest.json`.

Temporary Firefox extensions are removed when Firefox closes.

Reload any already-open brouter.de tabs after installing the extension.

## Test

Run the conversion, DOM integration, manifest, and packaging tests with:

```text
npm test
```

To run the tests and create both release archives:

```text
npm run verify
```
