(function (root) {
  "use strict";

  const METERS_PER_MILE = 1609.344;
  const MARKER_INTERVAL_MILES = 5;
  const PATCHED = Symbol("brouterImperialDistanceMarkers");
  const GPX_PATCHED = Symbol("brouterImperialGpx");

  function convertEmbeddedKilometers(value) {
    return value.replace(
      /([+-]?\d+(?:[.,]\d+)?)\s*(?:km|км|公里|کیلومتر)/gi,
      function (match, distance) {
        const separator = distance.includes(",") ? "," : ".";
        const places = distance.match(/[.,](\d+)/)?.[1].length || 0;
        const miles = (Number(distance.replace(",", ".")) / 1.609344)
          .toFixed(places)
          .replace(".", separator);

        return `${miles} mi`;
      }
    );
  }

  function install(root) {
    const prototype = root.L?.DistanceMarkers?.prototype;

    if (!prototype) {
      return false;
    }

    if (prototype[PATCHED]) {
      return true;
    }

    const initialize = prototype.initialize;

    prototype.initialize = function (line, map, options) {
      const imperialOptions = Object.assign({}, options, {
        offset: MARKER_INTERVAL_MILES * METERS_PER_MILE,
        textFunction(distance) {
          return distance / METERS_PER_MILE;
        }
      });

      return initialize.call(this, line, map, imperialOptions);
    };
    prototype[PATCHED] = true;

    return true;
  }

  function installGpx(root) {
    if (typeof root.togpx !== "function") {
      return false;
    }

    if (root.togpx[GPX_PATCHED]) {
      return true;
    }

    const original = root.togpx;
    const patched = function (data, options) {
      if (typeof options?.metadata?.name === "string") {
        options = Object.assign({}, options, {
          metadata: Object.assign({}, options.metadata, {
            name: convertEmbeddedKilometers(options.metadata.name)
          })
        });
      }

      return original.call(this, data, options);
    };
    patched[GPX_PATCHED] = true;
    root.togpx = patched;

    return true;
  }

  function installWhenReady(root) {
    if (install(root) && installGpx(root)) {
      return;
    }

    const interval = root.setInterval(function () {
      if (install(root) && installGpx(root)) {
        root.clearInterval(interval);
      }
    }, 50);

    root.setTimeout(function () {
      root.clearInterval(interval);
    }, 10000);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {
      install,
      installGpx,
      installWhenReady,
      METERS_PER_MILE,
      MARKER_INTERVAL_MILES
    };
  } else {
    installWhenReady(root);
  }
})(globalThis);
