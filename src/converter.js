(function (root, factory) {
  const converter = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = converter;
  } else {
    root.BRouterImperial = converter;
  }
})(globalThis, function () {
  "use strict";

  const MILES_PER_KILOMETER = 0.621371192237334;
  const FEET_PER_METER = 3.28083989501312;

  function parseNumber(value) {
    const match = value.trim().match(/^([+-]?\d+(?:[.,]\d+)?)/);

    if (!match) {
      return null;
    }

    const number = Number(match[1].replace(",", "."));
    return Number.isFinite(number) ? number : null;
  }

  function decimalPlaces(value) {
    const match = value.trim().match(/^[+-]?\d+([.,])(\d+)/);
    return match ? match[2].length : 0;
  }

  function decimalSeparator(value) {
    return value.includes(",") && !value.includes(".") ? "," : ".";
  }

  function formatDecimal(value, places, separator) {
    const formatted = value.toFixed(places);
    return separator === "," ? formatted.replace(".", ",") : formatted;
  }

  function kilometersToMiles(value) {
    const kilometers = parseNumber(value);

    if (kilometers === null) {
      return null;
    }

    return formatDecimal(
      kilometers * MILES_PER_KILOMETER,
      decimalPlaces(value),
      decimalSeparator(value)
    );
  }

  function metersToMiles(value) {
    const meters = parseNumber(value);

    if (meters === null) {
      return null;
    }

    return formatDecimal(
      meters * MILES_PER_KILOMETER / 1000,
      2,
      decimalSeparator(value)
    );
  }

  function metersToFeet(value) {
    const trimmed = value.trim();
    const groupedInteger = /^[+-]?\d{1,3}(?:[.,\s]\d{3})+$/.test(trimmed);
    const meters = groupedInteger
      ? Number(trimmed.replace(/[.,\s]/g, ""))
      : parseNumber(trimmed);

    if (meters === null) {
      return null;
    }

    return String(Math.round(meters * FEET_PER_METER)).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );
  }

  function kilometerTitleToMiles(value) {
    const match = value.trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*km$/i);

    if (!match) {
      return null;
    }

    const miles = kilometersToMiles(match[1]);
    return miles === null ? null : `${miles} mi`;
  }

  function kilometerTextToMiles(value) {
    const match = value.match(
      /^(\s*)([+-]?\d+(?:[.,]\d+)?)\s*km(\s*)$/i
    );

    if (!match) {
      return null;
    }

    const miles = kilometersToMiles(match[2]);
    return miles === null ? null : `${match[1]}${miles} mi${match[3]}`;
  }

  function meterTextToFeet(value) {
    const match = value.match(
      /^(\s*)([+-]?\d+(?:[.,\s]\d{3})*(?:[.,]\d+)?)\s*m(\s*)$/i
    );

    if (!match) {
      return null;
    }

    const feet = metersToFeet(match[2]);
    return feet === null ? null : `${match[1]}${feet} ft${match[3]}`;
  }

  return {
    kilometersToMiles,
    kilometerTitleToMiles,
    kilometerTextToMiles,
    meterTextToFeet,
    metersToMiles,
    metersToFeet
  };
});
