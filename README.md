# brouter-imperial

A Firefox and Chromium extension that changes route statistics on
[brouter.de/brouter-web](https://brouter.de/brouter-web),
[bikerouter.de](https://bikerouter.de), and
[brouter.m11n.de](https://brouter.m11n.de) from metric to imperial units:

- Route distance: kilometers to miles
- Route distance markers: every 5 miles instead of every 5 kilometers
- Ascend and plain ascend: meters to feet, with comma-separated thousands
- Elevation profile axes and hover details: miles and feet
- Data view segment distances and elevations: miles and feet
- Data view cost rates: cost per kilometer to cost per mile
- Analysis view distances and maximum speeds: miles and miles per hour
- Energy consumption rate: per 100 miles instead of per 100 kilometers
- No-go import radius and buffer inputs: feet, converted back to meters for BRouter
- Circle no-go radius popups and GPX metadata: kilometers to miles
- Exported route names: kilometers to miles

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

Reload any already-open supported routing tabs after installing the extension.

## Test

Run the conversion, DOM integration, manifest, and packaging tests with:

```text
npm test
```

To run the tests and create both release archives:

```text
npm run verify
```
