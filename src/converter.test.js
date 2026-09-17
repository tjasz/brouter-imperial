"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const converter = require("./converter.js");

test("converts displayed kilometers to miles at the same precision", function () {
  assert.equal(converter.kilometersToMiles("6.3"), "3.9");
  assert.equal(converter.kilometersToMiles("6,3"), "3,9");
  assert.equal(converter.kilometersToMiles("0"), "0");
});

test("converts Data view distances from meters to miles", function () {
  assert.equal(converter.metersToMiles("89"), "0.06");
  assert.equal(converter.metersToMiles("1000"), "0.62");
  assert.equal(converter.metersToMiles("1000,5"), "0,62");
  assert.equal(converter.metersToMiles("-"), null);
});

test("converts the precise distance title to miles", function () {
  assert.equal(converter.kilometerTitleToMiles("6.323 km"), "3.929 mi");
  assert.equal(converter.kilometerTitleToMiles("not available"), null);
});

test("converts profile distance labels to miles", function () {
  assert.equal(converter.kilometerTextToMiles("6.3 km"), "3.9 mi");
  assert.equal(converter.kilometerTextToMiles(" 6.3 km"), " 3.9 mi");
  assert.equal(converter.kilometerTextToMiles("10.00 km"), "6.21 mi");
  assert.equal(converter.kilometerTextToMiles("6.3 mi"), null);
});

test("converts ascent meters to rounded feet", function () {
  assert.equal(converter.metersToFeet("405"), "1,329");
  assert.equal(converter.metersToFeet("9"), "30");
  assert.equal(converter.metersToFeet("1,049"), "3,442");
  assert.equal(converter.metersToFeet("1.049"), "3,442");
  assert.equal(converter.metersToFeet("1 049"), "3,442");
  assert.equal(converter.metersToFeet("-"), null);
});

test("converts profile elevation labels to feet", function () {
  assert.equal(converter.meterTextToFeet("405 m"), "1,329 ft");
  assert.equal(converter.meterTextToFeet(" 405 m"), " 1,329 ft");
  assert.equal(converter.meterTextToFeet("-10 m"), "-33 ft");
  assert.equal(converter.meterTextToFeet("405 ft"), null);
});

test("converts no-go form values between meters and feet", function () {
  assert.equal(converter.metersToFeet("20"), "66");
  assert.equal(converter.feetToMeters("66"), "20.1168");
  assert.equal(converter.feetToMeters("-"), null);
});

test("converts energy and cost rates to imperial distance rates", function () {
  assert.equal(converter.per100KilometersToPer100Miles("2.50"), "4.02");
  assert.equal(converter.per100KilometersToPer100Miles("2,50"), "4,02");
  assert.equal(converter.costPerKilometerToCostPerMile("100"), "160.93");
});

test("converts analysis speeds to miles per hour", function () {
  assert.equal(
    converter.kilometersPerHourTextToMilesPerHour("50 km/h"),
    "31 mph"
  );
  assert.equal(
    converter.kilometersPerHourTextToMilesPerHour("12.5 km/h"),
    "7.8 mph"
  );
  assert.equal(converter.kilometersPerHourTextToMilesPerHour("31 mph"), null);
});

test("converts embedded kilometer distances and export-name units", function () {
  assert.equal(
    converter.embeddedKilometersToMiles("Boundary + 10 km"),
    "Boundary + 6 mi"
  );
  assert.equal(
    converter.kilometerUnitToMiles("Berlin - Potsdam (16.2km)"),
    "Berlin - Potsdam (16.2mi)"
  );
  assert.equal(
    converter.kilometerUnitToMiles("起點 ->終點(6.2公里)"),
    "起點 ->終點(6.2mi)"
  );
});
