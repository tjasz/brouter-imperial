(function (root) {
  "use strict";

  const METERS_PER_MILE = 1609.344;
  const MARKER_INTERVAL_MILES = 5;
  const PATCHED = Symbol("brouterImperialDistanceMarkers");

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

  function installWhenReady(root) {
    if (install(root)) {
      return;
    }

    const interval = root.setInterval(function () {
      if (install(root)) {
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
      installWhenReady,
      METERS_PER_MILE,
      MARKER_INTERVAL_MILES
    };
  } else {
    installWhenReady(root);
  }
})(globalThis);
