"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const converter = require("./converter.js");

test("converts displayed kilometers to miles at the same precision", function () {
  assert.equal(converter.kilometersToMiles("6.3"), "3.9");
  assert.equal(converter.kilometersToMiles("6,3"), "3,9");
  assert.equal(converter.kilometersToMiles("0"), "0");
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
