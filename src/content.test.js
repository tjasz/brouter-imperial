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
    textElement("dist."),
    textElement("$/km")
  ];
  const lowerDataHeadings = [
    sizingHeading("Longitude"),
    sizingHeading("elev."),
    sizingHeading("dist."),
    sizingHeading("$/km")
  ];
  const dataCells = [
    textElement("8468340"),
    textElement("101"),
    textElement("89"),
    textElement("100")
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
  const analysisSpeed = textElement("50 km/h");
  const meanEnergy = textElement("2.50");
  const energyLabel = textElement("Energy per 100 km");
  const trackName = {
    value: "Berlin - Potsdam (6.2km), elev. gain 328 m"
  };
  const hoverValues = {
    "heightgraph.distance": hoverDistance,
    "heightgraph.height": hoverElevation,
    "heightgraph.blockdistance": hoverSegment
  };
  const directElements = {
    meanenergy: meanEnergy,
    trackname: trackName
  };
  let mutationCallback;
  const document = {
    documentElement: {},
    addEventListener() {},
    getElementById(id) {
      if (directElements[id]) {
        return directElements[id];
      }

      const value = hoverValues[id];

      return value
        ? {
            querySelector() {
              return value;
            }
          }
        : null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "#tab_data table") {
        return [upperDataTable, lowerDataTable];
      }

      if (selector === "#tab_analysis .track-analysis-distance") {
        return [analysisDistance];
      }

      if (selector === "#tab_analysis .track-analysis-title") {
        return [analysisSpeed];
      }

      if (selector === '[data-i18n="footer.energy-per-100km"]') {
        return [energyLabel];
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
  const source = ["common-client.js", "brouter-client.js"]
    .map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"))
    .join("\n");

  vm.runInNewContext(source, context);

  assert.equal(upperDataHeadings[1].textContent, "elev. (ft)");
  assert.equal(upperDataHeadings[2].textContent, "dist. (mi)");
  assert.equal(lowerDataHeadings[1].textContent, "elev. (ft)");
  assert.equal(lowerDataHeadings[2].textContent, "dist. (mi)");
  assert.equal(upperDataHeadings[3].textContent, "$/mi");
  assert.equal(lowerDataHeadings[3].textContent, "$/mi");
  assert.ok(lowerDataHeadings[1].querySelector(".dataTables_sizing"));
  assert.ok(lowerDataHeadings[2].querySelector(".dataTables_sizing"));
  assert.equal(dataCells[1].textContent, "331");
  assert.equal(dataCells[2].textContent, "0.06");
  assert.equal(dataCells[3].textContent, "160.93");
  assert.equal(analysisDistance.textContent, "6.21 mi");
  assert.equal(analysisSpeed.textContent, "31 mph");
  assert.equal(xAxis.textContent, "6.21 mi");
  assert.equal(yAxis.textContent, "1,312 ft");
  assert.equal(horizontalLine.textContent, "984 ft");
  assert.equal(hoverDistance.textContent, " 3.9 mi");
  assert.equal(hoverElevation.textContent, " 1,329 ft");
  assert.equal(hoverSegment.textContent, " 0.6 mi");
  assert.equal(meanEnergy.textContent, "4.02");
  assert.equal(energyLabel.textContent, "Energy per 100 mi");
  assert.equal(
    trackName.value,
    "Berlin - Potsdam (6.2mi), elev. gain 328 ft"
  );

  xAxis.textContent = "5.00 km";
  hoverElevation.textContent = " 500 m";
  dataCells[1].textContent = "200";
  dataCells[2].textContent = "1000";
  dataCells[3].textContent = "50";
  analysisDistance.textContent = "5.00 km";
  analysisSpeed.textContent = "80 km/h";
  meanEnergy.textContent = "3.00";
  mutationCallback();

  assert.equal(dataCells[1].textContent, "656");
  assert.equal(dataCells[2].textContent, "0.62");
  assert.equal(dataCells[3].textContent, "80.47");
  assert.equal(analysisDistance.textContent, "3.11 mi");
  assert.equal(analysisSpeed.textContent, "50 mph");
  assert.equal(xAxis.textContent, "3.11 mi");
  assert.equal(hoverElevation.textContent, " 1,640 ft");
  assert.equal(meanEnergy.textContent, "4.83");

  mutationCallback();

  assert.equal(dataCells[1].textContent, "656");
  assert.equal(dataCells[2].textContent, "0.62");
  assert.equal(dataCells[3].textContent, "80.47");
});

test("displays no-go inputs and circle popups in imperial units", function () {
  const queued = [];
  const listeners = {};
  const radius = { value: "20", defaultValue: "20", dataset: {} };
  const buffer = { value: "0", defaultValue: "0", dataset: {} };
  const radiusLabel = textElement("No-go radius for points (in meters):");
  const bufferLabel = textElement("Buffer no-go areas (in meters):");
  const radiusText = { nodeType: 3, textContent: "Boundary + 10 km" };
  const lineBreak = { nodeType: 1, childNodes: [] };
  const paragraph = { childNodes: [radiusText, lineBreak] };
  const popup = {
    querySelector(selector) {
      return selector === "#remove-ringgo-marker" ? {} : null;
    },
    querySelectorAll(selector) {
      return selector === "p" ? [paragraph] : [];
    }
  };
  const document = {
    documentElement: {},
    addEventListener(name, callback) {
      listeners[name] ||= [];
      listeners[name].push(callback);
    },
    getElementById(id) {
      return { nogoRadius: radius, nogoBuffer: buffer }[id] || null;
    },
    querySelector(selector) {
      return {
        'label[for="nogoRadius"]': radiusLabel,
        'label[for="nogoBuffer"]': bufferLabel
      }[selector] || null;
    },
    querySelectorAll(selector) {
      return selector === ".leaflet-popup-content" ? [popup] : [];
    }
  };
  const context = {
    BRouterImperial: converter,
    document,
    MutationObserver: class {
      observe() {}
    },
    queueMicrotask(callback) {
      queued.push(callback);
    },
    setTimeout() {}
  };
  const source = ["common-client.js", "brouter-client.js"]
    .map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"))
    .join("\n");

  vm.runInNewContext(source, context);
  queued.shift()();

  assert.equal(radius.value, "66");
  assert.equal(buffer.value, "0");
  assert.equal(radiusLabel.textContent, "No-go radius for points (in feet):");
  assert.equal(bufferLabel.textContent, "Buffer no-go areas (in feet):");
  assert.equal(radiusText.textContent, "Boundary + 6 mi");
  assert.equal(paragraph.childNodes[1], lineBreak);

});

test("converts an asynchronously generated export name after the modal opens", function () {
  let modalShown = false;
  let mutationCallback;
  let pollingCallback;
  const trackName = { value: "" };
  const document = {
    documentElement: {},
    addEventListener() {},
    getElementById(id) {
      if (id === "trackname") {
        return trackName;
      }

      if (id === "export") {
        return {
          classList: {
            contains(className) {
              return className === "show" && modalShown;
            }
          }
        };
      }

      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
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
    },
    setTimeout(callback) {
      pollingCallback = callback;
    }
  };
  const source = ["common-client.js", "brouter-client.js"]
    .map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"))
    .join("\n");

  vm.runInNewContext(source, context);
  modalShown = true;
  mutationCallback();
  trackName.value = "Seattle (6.4km), elev. gain 100 m";
  pollingCallback();

  assert.equal(trackName.value, "Seattle (6.4mi), elev. gain 100 ft");
});

test("polls asynchronously generated names while BikeRouter's export dialog is open", function () {
  let dialogOpen = false;
  let mutationCallback;
  let pollingCallback;
  const trackName = { value: "" };
  const document = {
    documentElement: {},
    addEventListener() {},
    getElementById(id) {
      if (id === "trackname") {
        return trackName;
      }

      if (id === "export-dialog") {
        return {
          hasAttribute(attribute) {
            return attribute === "open" && dialogOpen;
          }
        };
      }

      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
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
    },
    setTimeout(callback) {
      pollingCallback = callback;
    }
  };
  const source = ["common-client.js", "bikerouter-client.js"]
    .map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"))
    .join("\n");

  vm.runInNewContext(source, context);
  dialogOpen = true;
  mutationCallback();
  trackName.value = "Millcreek - 0.7 mi, elev. gain 26 m";
  pollingCallback();

  assert.equal(
    trackName.value,
    "Millcreek - 0.7 mi, elev. gain 26 ft"
  );
});
