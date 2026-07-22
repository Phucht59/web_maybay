import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = join(projectRoot, "src", "assets", "travel-information");
const dataRoot = join(projectRoot, "src", "features", "travel-information", "data");
const registryPath = join(dataRoot, "travelImageRegistry.js");
const travelDataPath = join(projectRoot, "src", "features", "travel-information", "travelInformationData.js");
const imageExtensions = new Set([".webp", ".jpg", ".jpeg", ".png", ".svg"]);

function collectImageFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? collectImageFiles(path) : imageExtensions.has(extname(name).toLowerCase()) ? [path] : [];
  });
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function objectValues(source, constantName) {
  const match = source.match(new RegExp(`const ${constantName} = Object\\.freeze\\(\\{([\\s\\S]*?)\\n\\}\\);`));
  if (!match) return [];
  return [...match[1].matchAll(/^\s*"?[^"\n:]+"?:\s*"([^"]+)"/gm)].map((entry) => entry[1]);
}

const registrySource = readFileSync(registryPath, "utf8");
const dataSource = readFileSync(travelDataPath, "utf8");
const importPaths = new Map(
  [...registrySource.matchAll(/^import\s+(\w+)\s+from\s+"([^"]+)";/gm)]
    .map((match) => [match[1], resolve(dirname(registryPath), match[2])]),
);
const registryEntries = [...registrySource.matchAll(/^\s+"([^"]+)": image\((\w+),\s*"([^"]*)",\s*"([^"]+)"/gm)]
  .map((match) => ({ key: match[1], file: importPaths.get(match[2]), alt: match[3], usage: match[4] }));
const imageFiles = collectImageFiles(assetRoot);
const filesByHash = new Map();
for (const file of imageFiles) {
  const hash = hashFile(file);
  filesByHash.set(hash, [...(filesByHash.get(hash) || []), file]);
}

const duplicateHashGroups = [...filesByHash.values()].filter((files) => files.length > 1);
const missingImages = registryEntries.filter((entry) => !entry.file || !existsSync(entry.file));
const missingAlt = registryEntries.filter((entry) => !entry.alt.trim());
const sourceToKeys = new Map();
for (const entry of registryEntries) sourceToKeys.set(entry.file, [...(sourceToKeys.get(entry.file) || []), entry.key]);
const duplicateSourceMappings = [...sourceToKeys.entries()].filter(([, keys]) => keys.length > 1);
const altToKeys = new Map();
for (const entry of registryEntries) altToKeys.set(entry.alt, [...(altToKeys.get(entry.alt) || []), entry.key]);
const duplicateAltGroups = [...altToKeys.entries()].filter(([alt, keys]) => alt && keys.length > 1);

const overviewKey = dataSource.match(/export const TRAVEL_OVERVIEW[\s\S]*?imageKey:\s*"([^"]+)"/)?.[1];
const groupKeys = objectValues(dataSource, "GROUP_IMAGE_KEYS");
const articleKeys = objectValues(dataSource, "ARTICLE_IMAGE_KEYS");
const primaryKeys = [overviewKey, ...groupKeys, ...articleKeys].filter(Boolean);
const primaryCounts = new Map();
for (const key of primaryKeys) primaryCounts.set(key, (primaryCounts.get(key) || 0) + 1);
const duplicatePrimaryMappings = [...primaryCounts.entries()].filter(([, count]) => count > 1);
const unknownPrimaryKeys = primaryKeys.filter((key) => !registryEntries.some((entry) => entry.key === key));
const articleFiles = readdirSync(dataRoot).filter((name) => name.endsWith("Data.js"));
const articleSlugs = articleFiles.flatMap((name) => [...readFileSync(join(dataRoot, name), "utf8").matchAll(/article\(\{\s*slug:\s*"([^"]+)"/g)].map((match) => match[1]));
const missingArticleMappings = articleSlugs.filter((slug) => !dataSource.includes(`"${slug}":`));

console.log("TRAVEL IMAGE AUDIT\n");
console.log(`Total image files: ${imageFiles.length}`);
console.log(`Registry image keys: ${registryEntries.length}`);
console.log(`Primary visuals: ${primaryKeys.length}`);
console.log(`Duplicate file hashes: ${duplicateHashGroups.length}`);
console.log(`Duplicate primary mappings: ${duplicatePrimaryMappings.length}`);
console.log(`Duplicate source mappings: ${duplicateSourceMappings.length}`);
console.log(`Missing images: ${missingImages.length}`);
console.log(`Missing article mappings: ${missingArticleMappings.length}`);
console.log(`Missing alt text: ${missingAlt.length}`);
console.log(`Duplicate alt text groups: ${duplicateAltGroups.length}`);

for (const files of duplicateHashGroups) {
  console.log("\nDUPLICATE HASH FOUND\n");
  for (const file of files) console.log(`- ${file.replace(`${projectRoot}\\`, "")}`);
  console.log("These files contain the same image content.");
}
for (const [file, keys] of duplicateSourceMappings) console.log(`\nDUPLICATE SOURCE: ${keys.join(", ")} -> ${file}`);
for (const [key, count] of duplicatePrimaryMappings) console.log(`\nDUPLICATE PRIMARY KEY: ${key} used ${count} times`);
for (const entry of missingImages) console.log(`\nMISSING IMAGE: ${entry.key} -> ${entry.file || "unresolved import"}`);
for (const slug of missingArticleMappings) console.log(`\nMISSING ARTICLE IMAGE: ${slug}`);
for (const key of unknownPrimaryKeys) console.log(`\nUNKNOWN PRIMARY KEY: ${key}`);
for (const entry of missingAlt) console.log(`\nMISSING ALT: ${entry.key}`);
for (const [alt, keys] of duplicateAltGroups) console.log(`\nDUPLICATE ALT: "${alt}" -> ${keys.join(", ")}`);

const failed = registryEntries.length !== 35 || primaryKeys.length !== 35 || duplicateHashGroups.length > 0 || duplicatePrimaryMappings.length > 0 || duplicateSourceMappings.length > 0 || missingImages.length > 0 || missingArticleMappings.length > 0 || unknownPrimaryKeys.length > 0 || missingAlt.length > 0 || duplicateAltGroups.length > 0;
console.log(`\nRESULT: ${failed ? "FAIL" : "PASS"}`);
process.exitCode = failed ? 1 : 0;
