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
  const KILOMETERS_PER_MILE = 1 / MILES_PER_KILOMETER;

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

  function metersToInputFeet(value) {
    const meters = parseNumber(value);

    if (meters === null) {
      return null;
    }

    return String(Math.round(meters * FEET_PER_METER));
  }

  function feetToMeters(value) {
    const feet = parseNumber(value);

    if (feet === null) {
      return null;
    }

    return String(Number((feet / FEET_PER_METER).toFixed(6)));
  }

  function per100KilometersToPer100Miles(value) {
    const per100Kilometers = parseNumber(value);

    if (per100Kilometers === null) {
      return null;
    }

    return formatDecimal(
      per100Kilometers * KILOMETERS_PER_MILE,
      decimalPlaces(value),
      decimalSeparator(value)
    );
  }

  function costPerKilometerToCostPerMile(value) {
    const costPerKilometer = parseNumber(value);

    if (costPerKilometer === null) {
      return null;
    }

    return formatDecimal(
      costPerKilometer * KILOMETERS_PER_MILE,
      2,
      decimalSeparator(value)
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

  function kilometersPerHourTextToMilesPerHour(value) {
    const match = value.match(
      /^(\s*)([+-]?\d+(?:[.,]\d+)?)\s*km\/h(\s*)$/i
    );

    if (!match) {
      return null;
    }

    const kilometersPerHour = parseNumber(match[2]);
    const milesPerHour = formatDecimal(
      kilometersPerHour * MILES_PER_KILOMETER,
      decimalPlaces(match[2]),
      decimalSeparator(match[2])
    );

    return `${match[1]}${milesPerHour} mph${match[3]}`;
  }

  function embeddedKilometersToMiles(value) {
    let converted = false;
    const result = value.replace(
      /([+-]?\d+(?:[.,]\d+)?)\s*(?:km|км|公里|کیلومتر)/gi,
      function (match, distance) {
        const miles = kilometersToMiles(distance);

        if (miles === null) {
          return match;
        }

        converted = true;
        return `${miles} mi`;
      }
    );

    return converted ? result : null;
  }

  function kilometerUnitToMiles(value) {
    const result = value.replace(
      /(\d+(?:[.,]\d+)?)(\s*)(?:km|км|公里|کیلومتر)/gi,
      "$1$2mi"
    );

    return result === value ? null : result;
  }

  function metricUnitsToImperial(value) {
    const result = value
      .replace(
        /(\d+(?:[.,]\d+)?)(\s*)(?:km|км|公里|کیلومتر)/gi,
        "$1$2mi"
      )
      .replace(/(\d+(?:[.,]\d+)?)(\s*)m\b/gi, "$1$2ft");

    return result === value ? null : result;
  }

  return {
    costPerKilometerToCostPerMile,
    embeddedKilometersToMiles,
    feetToMeters,
    kilometersPerHourTextToMilesPerHour,
    kilometersToMiles,
    kilometerTitleToMiles,
    kilometerTextToMiles,
    kilometerUnitToMiles,
    meterTextToFeet,
    metricUnitsToImperial,
    metersToMiles,
    metersToFeet,
    metersToInputFeet,
    per100KilometersToPer100Miles
  };
});
