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

test("converts ascent meters to rounded feet", function () {
  assert.equal(converter.metersToFeet("405"), "1329");
  assert.equal(converter.metersToFeet("9"), "30");
  assert.equal(converter.metersToFeet("1,049"), "3442");
  assert.equal(converter.metersToFeet("1.049"), "3442");
  assert.equal(converter.metersToFeet("1 049"), "3442");
  assert.equal(converter.metersToFeet("-"), null);
});
