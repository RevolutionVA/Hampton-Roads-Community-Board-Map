const fs = require('fs');
const path = require('path');
const { loadLocations } = require('./locations');

const START_MARKER = '<!-- locations:start -->';
const END_MARKER = '<!-- locations:end -->';

const README_PATH = path.join(__dirname, '..', 'README.md');

// README is a compact text directory. Supporting photos remain available on
// individual location pages, but complete Markdown image constructs do not
// belong in table cells. Ordinary Markdown links are intentionally preserved.
function formatNotesForReadme(notes) {
  return (notes || '')
    .replace(/!\[[^\]]*\]\([^\r\n)]*\)/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

// Generates just the table block that lives between the README markers.
function generateTable(locations) {
  let markdown = '<!-- This table is auto-generated from data/locations/ - do not edit by hand. -->\n\n';
  markdown += '| City | Name | Address | Map | Notes |\n';
  markdown += '|------|------|---------|-----|-------|\n';

  for (const loc of locations) {
    const nameCell = loc.file ? `[${loc.name}](${loc.file})` : loc.name;
    const notesCell = formatNotesForReadme(loc.notes);
    markdown += `| ${loc.city} | ${nameCell} | ${loc.address} | [Map](${loc.google_maps_link}) | ${notesCell} |\n`;
  }

  return markdown;
}

// Replaces the marked section of the README with a freshly generated table.
// Throws if the markers are missing.
function updateReadme(readmeContent, locations) {
  const normalized = readmeContent.replace(/\r\n/g, '\n');
  const startIdx = normalized.indexOf(START_MARKER);
  const endIdx = normalized.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`README is missing the ${START_MARKER} / ${END_MARKER} markers`);
  }

  const before = normalized.slice(0, startIdx + START_MARKER.length);
  const after = normalized.slice(endIdx);
  return `${before}\n\n${generateTable(locations)}\n${after}`;
}

// Extracts the generated block between the markers, or null if markers are missing.
function extractTable(readmeContent) {
  const normalized = readmeContent.replace(/\r\n/g, '\n');
  const startIdx = normalized.indexOf(START_MARKER);
  const endIdx = normalized.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;
  return normalized.slice(startIdx + START_MARKER.length, endIdx).trim();
}

// CLI entry point
if (require.main === module) {
  const readmePath = process.argv[2] || README_PATH;

  let locations;
  try {
    locations = loadLocations();
  } catch (e) {
    console.error(`❌ Failed to load locations: ${e.message}`);
    process.exit(1);
  }

  let readme;
  try {
    readme = fs.readFileSync(readmePath, 'utf8');
  } catch (e) {
    console.error(`❌ Failed to read ${readmePath}: ${e.message}`);
    process.exit(1);
  }

  let updated;
  try {
    updated = updateReadme(readme, locations);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  fs.writeFileSync(readmePath, updated, 'utf8');
  console.log(`✅ Updated ${readmePath} with ${locations.length} locations`);
}

module.exports = { generateTable, updateReadme, extractTable, formatNotesForReadme, START_MARKER, END_MARKER, README_PATH };
