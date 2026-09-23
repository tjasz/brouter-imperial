import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "src");
const outputDirectory = path.join(root, "dist");
const artifactDirectory = path.join(root, "artifacts");
const runtimeFiles = [
  "bikerouter-client.js",
  "brouter-client.js",
  "common-client.js",
  "converter.js",
  "icon.png",
  "imperial-markers.js"
];
const browsers = ["chromium", "firefox"];

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function buildBrowser(browser, baseManifest) {
  const browserDirectory = path.join(outputDirectory, browser);
  const overlay = await readJson(
    path.join(sourceDirectory, `manifest.${browser}.json`)
  );
  const manifest = { ...baseManifest, ...overlay };

  await rm(browserDirectory, { recursive: true, force: true });
  await mkdir(browserDirectory, { recursive: true });
  await Promise.all(
    runtimeFiles.map((file) =>
      copyFile(
        path.join(sourceDirectory, file),
        path.join(browserDirectory, file)
      )
    )
  );
  await writeFile(
    path.join(browserDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  return { browser, browserDirectory, manifest };
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }

  return value >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

async function createZip(file, entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name.replaceAll("\\", "/"));
    const data = await readFile(entry.file);
    const checksum = crc32(data);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x21, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x21, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, name);

    localOffset += localHeader.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);

  await writeFile(file, Buffer.concat([...localParts, centralDirectory, end]));
}

async function packageBrowser(build) {
  const name = `brouter-imperial-${build.manifest.version}-${build.browser}.zip`;
  const entries = ["manifest.json", ...runtimeFiles]
    .sort()
    .map((entry) => ({
      name: entry,
      file: path.join(build.browserDirectory, entry)
    }));

  await mkdir(artifactDirectory, { recursive: true });
  await createZip(path.join(artifactDirectory, name), entries);
}

const baseManifest = await readJson(
  path.join(sourceDirectory, "manifest.base.json")
);
const builds = await Promise.all(
  browsers.map((browser) => buildBrowser(browser, baseManifest))
);

if (process.argv.includes("--package")) {
  await rm(artifactDirectory, { recursive: true, force: true });
  await Promise.all(builds.map(packageBrowser));
}

console.log(
  `Built ${browsers.join(" and ")} extension${process.argv.includes("--package") ? " packages" : "s"}.`
);
