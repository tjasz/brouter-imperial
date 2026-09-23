"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const converter = require("./converter.js");

function textElement(text) {
  return {
    textContent: text,
    querySelector() {
      return null;
    }
  };
}

function unitElement(text) {
  return {
    textContent: text,
    title: "",
    classList: {
      contains(className) {
        return className === "unit";
      }
    }
  };
}

test("converts BikeRouter sidebar, waypoint, analysis, and profile values", function () {
  const sidebarDistance = textElement("1.2");
  const sidebarDistanceUnit = unitElement("km");
  const maximumElevation = textElement("1,338");
  const maximumElevationUnit = unitElement("m \u26f0\ufe0f");
  const ascend = textElement("8");
  const ascendUnit = unitElement("m \u2197");
  const plainAscend = textElement("0");
  const plainAscendUnit = unitElement("m \u2197");
  const waypointDistance = textElement("2.5");
  const waypointDistanceUnit = unitElement("km");
  const waypointAscend = textElement("100");
  const waypointAscendUnit = unitElement("m");
  const analysisDistance = textElement("1.23 km");
  const analysisSpeed = textElement("40 km/h");
  const xAxis = textElement("1.20 km");
  const yAxis = textElement("1335 m");

  [
    [sidebarDistance, sidebarDistanceUnit],
    [maximumElevation, maximumElevationUnit],
    [ascend, ascendUnit],
    [plainAscend, plainAscendUnit],
    [waypointDistance, waypointDistanceUnit],
    [waypointAscend, waypointAscendUnit]
  ].forEach(function ([value, unit]) {
    value.nextElementSibling = unit;
  });

  let mutationCallback;
  const selectorResults = new Map([
    ["#sidebar-stats-value-distance", [sidebarDistance]],
    [
      [
        "#sidebar-stats-value-maximum-elevation",
        "#sidebar-stats-value-ascend",
        "#sidebar-stats-value-plain-ascend"
      ].join(", "),
      [maximumElevation, ascend, plainAscend]
    ],
    [".waypoint-stats-value-distance", [waypointDistance]],
    [".waypoint-stats-value-ascend", [waypointAscend]],
    [
      '#elevation-chart svg[aria-label="Elevation Profile"] text',
      [xAxis, yAxis]
    ],
    ["#tab_analysis .track-analysis-distance", [analysisDistance]],
    ["#tab_analysis .track-analysis-title", [analysisSpeed]]
  ]);
  const document = {
    documentElement: {},
    addEventListener() {},
    getElementById() {
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      return selectorResults.get(selector) || [];
    }
  };
  const context = {
    BRouterImperial: converter,
    document,
    MutationObserver: class {
      constructor(callback) {
        mutationCallback = callback;
      }

      observe() {}
    },
    queueMicrotask(callback) {
      callback();
    },
    setTimeout() {}
  };
  const source = [
    "common-client.js",
    "bikerouter-client.js"
  ].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"))
    .join("\n");

  vm.runInNewContext(source, context);

  assert.equal(sidebarDistance.textContent, "0.7");
  assert.equal(sidebarDistanceUnit.textContent, "mi");
  assert.equal(maximumElevation.textContent, "4,390");
  assert.equal(maximumElevationUnit.textContent, "ft \u26f0\ufe0f");
  assert.equal(ascend.textContent, "26");
  assert.equal(ascendUnit.textContent, "ft \u2197");
  assert.equal(plainAscend.textContent, "0");
  assert.equal(plainAscendUnit.textContent, "ft \u2197");
  assert.equal(waypointDistance.textContent, "1.6");
  assert.equal(waypointDistanceUnit.textContent, "mi");
  assert.equal(waypointAscend.textContent, "328");
  assert.equal(waypointAscendUnit.textContent, "ft");
  assert.equal(analysisDistance.textContent, "0.76 mi");
  assert.equal(analysisSpeed.textContent, "25 mph");
  assert.equal(xAxis.textContent, "0.75 mi");
  assert.equal(yAxis.textContent, "4,380 ft");

  sidebarDistance.textContent = "10.0";
  maximumElevation.textContent = "1500";
  xAxis.textContent = "2.00 km";
  mutationCallback();

  assert.equal(sidebarDistance.textContent, "6.2");
  assert.equal(maximumElevation.textContent, "4,921");
  assert.equal(xAxis.textContent, "1.24 mi");
  assert.equal(sidebarDistanceUnit.textContent, "mi");
  assert.equal(maximumElevationUnit.textContent, "ft \u26f0\ufe0f");
  assert.equal(ascendUnit.textContent, "ft \u2197");
  assert.equal(waypointDistanceUnit.textContent, "mi");
  assert.equal(waypointAscendUnit.textContent, "ft");
});
