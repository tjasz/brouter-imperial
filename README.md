# brouter-imperial

A Chromium extension that changes the route statistics on
[brouter.de/brouter-web](https://brouter.de/brouter-web) from metric to imperial units:

- Route distance: kilometers to miles
- Ascend and plain ascend: meters to feet

The extension watches BRouter's route statistics for DOM changes and also
checks them after clicks, pointer interactions, and touchscreen taps.

## Install

1. Open `chrome://extensions` in Chromium, Chrome, Brave, or Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this repository's folder.

Reload any already-open brouter.de tabs after installing the extension.

## Test

With Node.js 18 or newer:

```text
node --test converter.test.js
```
