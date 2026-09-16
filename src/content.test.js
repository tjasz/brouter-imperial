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

test("converts elevation profile axes and hover values after redraws", function () {
  const xAxis = textElement("10.00 km");
  const yAxis = textElement("400 m");
  const horizontalLine = textElement("300 m");
  const hoverDistance = textElement(" 6.3 km");
  const hoverElevation = textElement(" 405 m");
  const hoverSegment = textElement(" 1.0 km");
  const hoverValues = {
    "heightgraph.distance": hoverDistance,
    "heightgraph.height": hoverElevation,
    "heightgraph.blockdistance": hoverSegment
  };
  let mutationCallback;
  const document = {
    documentElement: {},
    addEventListener() {},
    getElementById(id) {
      const value = hoverValues[id];

      return value
        ? {
            querySelector() {
              return value;
            }
          }
        : null;
    },
    querySelectorAll(selector) {
      if (selector === "#elevation-chart .x.axis .tick text") {
        return [xAxis];
      }

      if (selector.includes(".y.axis")) {
        return [yAxis, horizontalLine];
      }

      return [];
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
    }
  };
  const source = fs.readFileSync(path.join(__dirname, "content.js"), "utf8");

  vm.runInNewContext(source, context);

  assert.equal(xAxis.textContent, "6.21 mi");
  assert.equal(yAxis.textContent, "1,312 ft");
  assert.equal(horizontalLine.textContent, "984 ft");
  assert.equal(hoverDistance.textContent, " 3.9 mi");
  assert.equal(hoverElevation.textContent, " 1,329 ft");
  assert.equal(hoverSegment.textContent, " 0.6 mi");

  xAxis.textContent = "5.00 km";
  hoverElevation.textContent = " 500 m";
  mutationCallback();

  assert.equal(xAxis.textContent, "3.11 mi");
  assert.equal(hoverElevation.textContent, " 1,640 ft");
});
