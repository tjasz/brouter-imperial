(function () {
  "use strict";

  const converter = globalThis.BRouterImperial;
  const states = new Map();
  let conversionScheduled = false;

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
    convertProfile();
  }

  function scheduleConversion() {
    if (conversionScheduled) {
      return;
    }

    conversionScheduled = true;
    queueMicrotask(convertStats);
  }

  const observer = new MutationObserver(scheduleConversion);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["title"],
    childList: true,
    characterData: true,
    subtree: true
  });

  ["click", "pointerup", "touchend"].forEach(function (eventName) {
    document.addEventListener(eventName, scheduleConversion, {
      capture: true,
      passive: true
    });
  });

  scheduleConversion();
})();
