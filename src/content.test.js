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

function sizingHeading(text) {
  let sizing = textElement(text);
  let plainText = "";

  return {
    get textContent() {
      return sizing ? sizing.textContent : plainText;
    },
    set textContent(value) {
      plainText = value;
      sizing = null;
    },
    querySelector(selector) {
      return selector === ".dataTables_sizing" ? sizing : null;
    }
  };
}

test("converts Data, Analysis, and elevation profile values after redraws", function () {
  const xAxis = textElement("10.00 km");
  const yAxis = textElement("400 m");
  const horizontalLine = textElement("300 m");
  const hoverDistance = textElement(" 6.3 km");
  const hoverElevation = textElement(" 405 m");
  const hoverSegment = textElement(" 1.0 km");
  const upperDataHeadings = [
    textElement("Longitude"),
    textElement("elev."),
    textElement("dist.")
  ];
  const lowerDataHeadings = [
    sizingHeading("Longitude"),
    sizingHeading("elev."),
    sizingHeading("dist.")
  ];
  const dataCells = [
    textElement("8468340"),
    textElement("101"),
    textElement("89")
  ];
  function dataTable(headings, rows) {
    return {
      querySelectorAll(selector) {
        if (selector === "thead th") {
          return headings;
        }

        if (selector === "tbody tr") {
          return rows;
        }

        return [];
      }
    };
  }
  const upperDataTable = dataTable(upperDataHeadings, []);
  const lowerDataTable = dataTable(lowerDataHeadings, [
    {
      querySelectorAll() {
        return dataCells;
      }
    }
  ]);
  const analysisDistance = textElement("10.00 km");
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
      if (selector === "#tab_data table") {
        return [upperDataTable, lowerDataTable];
      }

      if (selector === "#tab_analysis .track-analysis-distance") {
        return [analysisDistance];
      }

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

  assert.equal(upperDataHeadings[1].textContent, "elev. (ft)");
  assert.equal(upperDataHeadings[2].textContent, "dist. (mi)");
  assert.equal(lowerDataHeadings[1].textContent, "elev. (ft)");
  assert.equal(lowerDataHeadings[2].textContent, "dist. (mi)");
  assert.ok(lowerDataHeadings[1].querySelector(".dataTables_sizing"));
  assert.ok(lowerDataHeadings[2].querySelector(".dataTables_sizing"));
  assert.equal(dataCells[1].textContent, "331");
  assert.equal(dataCells[2].textContent, "0.06");
  assert.equal(analysisDistance.textContent, "6.21 mi");
  assert.equal(xAxis.textContent, "6.21 mi");
  assert.equal(yAxis.textContent, "1,312 ft");
  assert.equal(horizontalLine.textContent, "984 ft");
  assert.equal(hoverDistance.textContent, " 3.9 mi");
  assert.equal(hoverElevation.textContent, " 1,329 ft");
  assert.equal(hoverSegment.textContent, " 0.6 mi");

  xAxis.textContent = "5.00 km";
  hoverElevation.textContent = " 500 m";
  dataCells[1].textContent = "200";
  dataCells[2].textContent = "1000";
  analysisDistance.textContent = "5.00 km";
  mutationCallback();

  assert.equal(dataCells[1].textContent, "656");
  assert.equal(dataCells[2].textContent, "0.62");
  assert.equal(analysisDistance.textContent, "3.11 mi");
  assert.equal(xAxis.textContent, "3.11 mi");
  assert.equal(hoverElevation.textContent, " 1,640 ft");

  mutationCallback();

  assert.equal(dataCells[1].textContent, "656");
  assert.equal(dataCells[2].textContent, "0.62");
});
