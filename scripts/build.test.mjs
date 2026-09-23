import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildScript = path.join(root, "scripts", "build.mjs");
const packagedFiles = [
  "bikerouter-client.js",
  "brouter-client.js",
  "common-client.js",
  "converter.js",
  "icon.png",
  "imperial-markers.js",
  "manifest.json"
];

function runBuild() {
  const result = spawnSync(process.execPath, [buildScript, "--package"], {
    cwd: root,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function zipEntries(data) {
  const entries = [];
  let offset = 0;

  while (data.readUInt32LE(offset) === 0x04034b50) {
    const size = data.readUInt32LE(offset + 18);
    const nameLength = data.readUInt16LE(offset + 26);
    const extraLength = data.readUInt16LE(offset + 28);
    const nameStart = offset + 30;

    entries.push(data.toString("utf8", nameStart, nameStart + nameLength));
    offset = nameStart + nameLength + extraLength + size;
  }

  return entries;
}

function hash(data) {
  return createHash("sha256").update(data).digest("hex");
}

test("builds valid, deterministic Chromium and Firefox packages", async function () {
  runBuild();

  const chromiumManifest = await readJson(
    path.join(root, "dist", "chromium", "manifest.json")
  );
  const firefoxManifest = await readJson(
    path.join(root, "dist", "firefox", "manifest.json")
  );
  const packageJson = await readJson(path.join(root, "package.json"));

  assert.equal(chromiumManifest.version, packageJson.version);
  assert.equal(firefoxManifest.version, packageJson.version);
  assert.deepEqual(
    chromiumManifest.content_scripts,
    firefoxManifest.content_scripts
  );
  assert.equal(chromiumManifest.content_scripts[0].world, "MAIN");
  assert.equal(chromiumManifest.content_scripts[0].run_at, "document_start");
  assert.deepEqual(
    chromiumManifest.content_scripts[1].js,
    ["converter.js", "common-client.js", "brouter-client.js"]
  );
  assert.deepEqual(
    chromiumManifest.content_scripts[3].js,
    ["converter.js", "common-client.js", "bikerouter-client.js"]
  );
  assert.equal(chromiumManifest.minimum_chrome_version, "111");
  assert.equal(chromiumManifest.browser_specific_settings, undefined);
  assert.equal(firefoxManifest.minimum_chrome_version, undefined);
  assert.equal(
    firefoxManifest.browser_specific_settings.gecko.strict_min_version,
    "140.0"
  );
  assert.equal(
    firefoxManifest.browser_specific_settings.gecko_android.strict_min_version,
    "142.0"
  );
  assert.deepEqual(
    firefoxManifest.browser_specific_settings.gecko
      .data_collection_permissions.required,
    ["none"]
  );

  for (const browser of ["chromium", "firefox"]) {
    for (const file of packagedFiles) {
      assert.equal(
        (await stat(path.join(root, "dist", browser, file))).isFile(),
        true
      );
    }

    const archive = path.join(
      root,
      "artifacts",
      `brouter-imperial-${chromiumManifest.version}-${browser}.zip`
    );
    const firstBuild = await readFile(archive);

    assert.deepEqual(zipEntries(firstBuild).sort(), packagedFiles);
    runBuild();
    assert.equal(hash(await readFile(archive)), hash(firstBuild));
  }
});
