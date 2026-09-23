(function () {
  "use strict";

  const converter = globalThis.BRouterImperial;
  const client = globalThis.BRouterImperialClient;

  function updateUnit(element, text, title) {
    const unit = element.nextElementSibling;

    if (
      !unit?.classList.contains("unit") &&
      !unit?.classList.contains("waypoint-stats-unit")
    ) {
      return;
    }

    const currentText = unit.textContent;
    const metricUnit = currentText.match(/^(?:km|m)(\b.*)$/);

    if (metricUnit) {
      unit.textContent = `${text}${metricUnit[1]}`;
    }

    if (unit.title && unit.title !== title) {
      unit.title = title;
    }
  }

  function convertValue(selector, convert, unitText, unitTitle) {
    document.querySelectorAll(selector).forEach(function (element) {
      client.convertBareElementText(element, convert);
      updateUnit(element, unitText, unitTitle);
    });
  }

  function convertSidebarStats() {
    convertValue(
      "#sidebar-stats-value-distance",
      converter.kilometersToMiles,
      "mi",
      "miles"
    );
    convertValue(
      [
        "#sidebar-stats-value-maximum-elevation",
        "#sidebar-stats-value-ascend",
        "#sidebar-stats-value-plain-ascend"
      ].join(", "),
      converter.metersToFeet,
      "ft",
      "feet"
    );
  }

  function convertWaypointStats() {
    convertValue(
      ".waypoint-stats-value-distance",
      converter.kilometersToMiles,
      "mi",
      "miles"
    );
    convertValue(
      ".waypoint-stats-value-ascend",
      converter.metersToFeet,
      "ft",
      "feet"
    );
  }

  function convertElevationProfile() {
    document
      .querySelectorAll(
        '#elevation-chart svg[aria-label="Elevation Profile"] text'
      )
      .forEach(function (element) {
        client.convertElementText(element, converter.kilometerTextToMiles);
        client.convertElementText(element, converter.meterTextToFeet);
      });
  }

  function convertElevationLegend() {
    document
      .querySelectorAll("#elevation-chart .elevation-legend span")
      .forEach(function (element) {
        client.convertElementText(
          element,
          converter.embeddedKilometersPerHourToMilesPerHour
        );
      });
  }

  client.install({
    convertPage() {
      convertSidebarStats();
      convertWaypointStats();
      convertElevationProfile();
      convertElevationLegend();
    }
  });
})();
