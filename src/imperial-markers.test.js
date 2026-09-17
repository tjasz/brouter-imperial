"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const imperialMarkers = require("./imperial-markers.js");

test("replaces BRouter distance marker options with five-mile markers", function () {
  let receivedOptions;
  const originalOptions = {
    offset: 5000,
    iconSize: [6, 18],
    textFunction() {
      return "kilometers";
    }
  };
  const root = {
    L: {
      DistanceMarkers: function () {}
    }
  };

  root.L.DistanceMarkers.prototype.initialize = function (line, map, options) {
    receivedOptions = options;
    return "initialized";
  };

  assert.equal(imperialMarkers.install(root), true);
  assert.equal(
    root.L.DistanceMarkers.prototype.initialize("line", "map", originalOptions),
    "initialized"
  );
  assert.equal(
    receivedOptions.offset,
    imperialMarkers.MARKER_INTERVAL_MILES * imperialMarkers.METERS_PER_MILE
  );
  assert.equal(receivedOptions.textFunction(receivedOptions.offset), 5);
  assert.deepEqual(receivedOptions.iconSize, [6, 18]);
  assert.equal(originalOptions.offset, 5000);
});

test("waits to install until Leaflet distance markers are available", function () {
  assert.equal(imperialMarkers.install({}), false);
});

test("converts circle no-go GPX metadata names to miles", function () {
  let receivedOptions;
  const root = {
    togpx(data, options) {
      receivedOptions = options;
      return "gpx";
    }
  };

  assert.equal(imperialMarkers.installGpx(root), true);
  assert.equal(
    root.togpx({}, { metadata: { name: "Boundary + 10 km", link: "url" } }),
    "gpx"
  );
  assert.equal(receivedOptions.metadata.name, "Boundary + 6 mi");
  assert.equal(receivedOptions.metadata.link, "url");
});

test("retries installation when Leaflet loads later", function () {
  let retry;
  let clearedInterval;
  const root = {
    setInterval(callback) {
      retry = callback;
      return 7;
    },
    clearInterval(interval) {
      clearedInterval = interval;
    },
    setTimeout() {}
  };

  imperialMarkers.installWhenReady(root);
  root.L = {
    DistanceMarkers: function () {}
  };
  root.togpx = function () {};
  root.L.DistanceMarkers.prototype.initialize = function () {};
  retry();

  assert.equal(clearedInterval, 7);
  assert.equal(imperialMarkers.install(root), true);
});

test("runs directly in a browser main-world context", function () {
  let retry;
  const context = {
    setInterval(callback) {
      retry = callback;
      return 7;
    },
    clearInterval() {},
    setTimeout() {}
  };
  const source = fs.readFileSync(
    path.join(__dirname, "imperial-markers.js"),
    "utf8"
  );

  vm.runInNewContext(source, context);
  context.L = {
    DistanceMarkers: function () {}
  };
  context.togpx = function () {};
  context.L.DistanceMarkers.prototype.initialize = function (
    line,
    map,
    options
  ) {
    return options;
  };
  retry();

  const options = context.L.DistanceMarkers.prototype.initialize();
  assert.equal(options.offset, 5 * imperialMarkers.METERS_PER_MILE);
  assert.equal(options.textFunction(options.offset), 5);
});

test("installs the patch only once", function () {
  const root = {
    L: {
      DistanceMarkers: function () {}
    }
  };
  const initialize = function () {};

  root.L.DistanceMarkers.prototype.initialize = initialize;
  imperialMarkers.install(root);
  const patchedInitialize = root.L.DistanceMarkers.prototype.initialize;
  imperialMarkers.install(root);

  assert.notEqual(patchedInitialize, initialize);
  assert.equal(root.L.DistanceMarkers.prototype.initialize, patchedInitialize);
});
