(function (root) {
  "use strict";

  const converter = root.BRouterImperial;
  const states = new Map();
  const elementStates = new WeakMap();
  const inputStates = new WeakMap();
  let conversionScheduled = false;
  let exportPolling = false;
  let convertPage = function () {};

  const fields = [
    {
      id: "distance",
      convert: converter.kilometersToMiles,
      convertTitle: converter.kilometerTitleToMiles,
      unitIndex: 0,
      unitText: "mi",
      unitTitle: "miles"
    },
    {
      id: "ascend",
      convert: converter.metersToFeet,
      unitIndex: 0,
      unitText: "ft",
      unitTitle: "feet"
    },
    {
      id: "plainascend",
      convert: converter.metersToFeet,
      unitIndex: 1,
      unitText: "ft",
      unitTitle: "feet"
    }
  ];

  function updateUnit(element, field) {
    const units = element.parentElement?.querySelectorAll("abbr");
    const unit = units?.[field.unitIndex];

    if (!unit) {
      return;
    }

    if (unit.textContent !== field.unitText) {
      unit.textContent = field.unitText;
    }

    if (unit.title !== field.unitTitle) {
      unit.title = field.unitTitle;
    }
  }

  function convertField(field) {
    const element = document.getElementById(field.id);

    if (!element) {
      return;
    }

    const previous = states.get(field.id);
    const isNewElement = previous?.element !== element;
    const state = isNewElement ? { element } : previous;
    const currentText = element.textContent.trim();

    if (isNewElement || currentText !== state.renderedText) {
      const convertedText = field.convert(currentText);

      if (convertedText !== null) {
        element.textContent = convertedText;
        state.renderedText = convertedText;
      } else {
        state.renderedText = currentText;
      }
    }

    if (field.convertTitle) {
      const currentTitle = element.getAttribute("title");

      if (isNewElement || currentTitle !== state.renderedTitle) {
        const convertedTitle = currentTitle
          ? field.convertTitle(currentTitle)
          : null;

        if (convertedTitle !== null) {
          element.setAttribute("title", convertedTitle);
          state.renderedTitle = convertedTitle;
        } else {
          state.renderedTitle = currentTitle;
        }
      }
    }

    updateUnit(element, field);
    states.set(field.id, state);
  }

  function convertElementText(element, convert) {
    const convertedText = convert(element.textContent);

    if (convertedText !== null && convertedText !== element.textContent) {
      element.textContent = convertedText;
    }
  }

  function convertBareElementText(element, convert) {
    const previous = elementStates.get(element);
    const currentText = element.textContent.trim();

    if (!previous || currentText !== previous.renderedText) {
      const convertedText = convert(currentText);
      const renderedText = convertedText === null ? currentText : convertedText;

      if (renderedText !== currentText) {
        element.textContent = renderedText;
      }

      elementStates.set(element, { renderedText });
    }
  }

  function dataColumnIndex(headings, names) {
    return headings.findIndex(function (heading) {
      return names.includes(heading.textContent.trim().toLowerCase());
    });
  }

  function updateDataHeading(heading, text) {
    const sizing = heading.querySelector(".dataTables_sizing");
    const content = sizing || heading;

    if (content.textContent !== text) {
      content.textContent = text;
    }
  }

  function convertData() {
    document.querySelectorAll("#tab_data table").forEach(function (table) {
      const headings = Array.from(table.querySelectorAll("thead th"));
      const elevationIndex = dataColumnIndex(headings, [
        "elev.",
        "elev. (ft)",
        "elevation"
      ]);
      const distanceIndex = dataColumnIndex(headings, [
        "dist.",
        "dist. (mi)",
        "distance"
      ]);
      const costIndex = dataColumnIndex(headings, ["$/km", "$/mi"]);

      table.querySelectorAll("tbody tr").forEach(function (row) {
        const cells = row.querySelectorAll("td");

        if (elevationIndex >= 0 && cells[elevationIndex]) {
          convertBareElementText(
            cells[elevationIndex],
            converter.metersToFeet
          );
        }

        if (distanceIndex >= 0 && cells[distanceIndex]) {
          convertBareElementText(
            cells[distanceIndex],
            converter.metersToMiles
          );
        }

        if (costIndex >= 0 && cells[costIndex]) {
          convertBareElementText(
            cells[costIndex],
            converter.costPerKilometerToCostPerMile
          );
        }
      });

      if (elevationIndex >= 0) {
        updateDataHeading(headings[elevationIndex], "elev. (ft)");
      }

      if (distanceIndex >= 0) {
        updateDataHeading(headings[distanceIndex], "dist. (mi)");
      }

      if (costIndex >= 0) {
        updateDataHeading(headings[costIndex], "$/mi");
      }
    });
  }

  function convertAnalysis() {
    document
      .querySelectorAll("#tab_analysis .track-analysis-distance")
      .forEach(function (element) {
        convertElementText(element, converter.kilometerTextToMiles);
      });

    document
      .querySelectorAll("#tab_analysis .track-analysis-title")
      .forEach(function (element) {
        convertElementText(
          element,
          converter.kilometersPerHourTextToMilesPerHour
        );
      });
  }

  function convertEnergy() {
    const meanEnergy = document.getElementById("meanenergy");

    if (meanEnergy) {
      convertBareElementText(
        meanEnergy,
        converter.per100KilometersToPer100Miles
      );
    }

    document
      .querySelectorAll('[data-i18n="footer.energy-per-100km"]')
      .forEach(function (label) {
        if (label.textContent !== "Energy per 100 mi") {
          label.textContent = "Energy per 100 mi";
        }
      });
  }

  function convertNogoInput(input) {
    const previous = inputStates.get(input);

    if (!previous) {
      const metricValue = input.value;
      const renderedValue = converter.metersToInputFeet(metricValue);

      if (renderedValue !== null) {
        input.value = renderedValue;
        inputStates.set(input, {
          metricValue,
          renderedValue
        });
        input.dataset.brouterImperialMeters = metricValue;
        input.dataset.brouterImperialRenderedFeet = renderedValue;
      }

      return;
    }

    if (input.value !== previous.renderedValue) {
      inputStates.set(input, {
        metricValue: null,
        renderedValue: input.value
      });
      input.dataset.brouterImperialMeters = "";
      input.dataset.brouterImperialRenderedFeet = input.value;
    }
  }

  function convertNogoInputs() {
    [
      ["nogoRadius", "No-go radius for points (in feet):"],
      ["nogoBuffer", "Buffer no-go areas (in feet):"]
    ].forEach(function ([id, labelText]) {
      const input = document.getElementById(id);

      if (!input) {
        return;
      }

      convertNogoInput(input);
      const label = document.querySelector(`label[for="${id}"]`);

      if (label && label.textContent.trim() !== labelText) {
        label.textContent = labelText;
      }
    });
  }

  function convertCirclePopup() {
    function convertTextNodes(node) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          const converted = converter.embeddedKilometersToMiles(
            child.textContent
          );

          if (converted !== null) {
            child.textContent = converted;
          }
        } else {
          convertTextNodes(child);
        }
      });
    }

    document
      .querySelectorAll(".leaflet-popup-content")
      .forEach(function (popup) {
        if (!popup.querySelector("#remove-ringgo-marker")) {
          return;
        }

        popup.querySelectorAll("p").forEach(function (paragraph) {
          convertTextNodes(paragraph);
        });
      });
  }

  function convertExportName() {
    const trackName = document.getElementById("trackname");

    if (!trackName) {
      return;
    }

    const converted = converter.metricUnitsToImperial(trackName.value);

    if (converted !== null) {
      trackName.value = converted;
    }
  }

  function isExportOpen() {
    const classicModal = document.getElementById("export");
    const dialog = document.getElementById("export-dialog");

    return Boolean(
      classicModal?.classList.contains("show") ||
      dialog?.hasAttribute("open")
    );
  }

  function pollExportName() {
    if (!isExportOpen()) {
      exportPolling = false;
      return;
    }

    convertExportName();
    setTimeout(pollExportName, 100);
  }

  function startExportPolling() {
    if (!exportPolling && isExportOpen()) {
      exportPolling = true;
      pollExportName();
    }
  }

  function convertProfile() {
    document
      .querySelectorAll("#elevation-chart .x.axis .tick text")
      .forEach(function (element) {
        convertElementText(element, converter.kilometerTextToMiles);
      });

    document
      .querySelectorAll(
        "#elevation-chart .y.axis .tick text, " +
          "#elevation-chart .horizontalLineText"
      )
      .forEach(function (element) {
        convertElementText(element, converter.meterTextToFeet);
      });

    [
      ["heightgraph.distance", converter.kilometerTextToMiles],
      ["heightgraph.height", converter.meterTextToFeet],
      ["heightgraph.blockdistance", converter.kilometerTextToMiles]
    ].forEach(function ([id, convert]) {
      const value = document.getElementById(id)?.querySelector("tspan");

      if (value) {
        convertElementText(value, convert);
      }
    });
  }

  function convertStats() {
    conversionScheduled = false;
    fields.forEach(convertField);
    convertData();
    convertAnalysis();
    convertProfile();
    convertEnergy();
    convertNogoInputs();
    convertCirclePopup();
    convertExportName();
    startExportPolling();
    convertPage();
  }

  function scheduleConversion() {
    if (conversionScheduled) {
      return;
    }

    conversionScheduled = true;
    queueMicrotask(convertStats);
  }

  function install(options = {}) {
    convertPage = options.convertPage || convertPage;

    const observer = new MutationObserver(scheduleConversion);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "open", "title"],
      childList: true,
      characterData: true,
      subtree: true
    });

    ["click", "pointerup", "touchend"].forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        scheduleConversion();
      }, {
        capture: true,
        passive: true
      });
    });

    ["input", "change"].forEach(function (eventName) {
      document.addEventListener(eventName, scheduleConversion, true);
    });

    scheduleConversion();
  }

  root.BRouterImperialClient = {
    convertBareElementText,
    convertElementText,
    install
  };
})(globalThis);
