const fs = require('fs');
const path = require('path');
const { loadLocations } = require('./locations');

const START_MARKER = '<!-- locations:start -->';
const END_MARKER = '<!-- locations:end -->';

const README_PATH = path.join(__dirname, '..', 'README.md');

// README is a compact text directory. Supporting photos remain available on
// individual location pages, but complete Markdown image constructs do not
// belong in table cells. Ordinary Markdown links are intentionally preserved.
function stripInlineMarkdownImages(markdown) {
  let result = '';

  for (let index = 0; index < markdown.length;) {
    if (markdown[index] !== '!' || markdown[index + 1] !== '[') {
      result += markdown[index++];
      continue;
    }

    let cursor = index + 2;
    let escaped = false;
    for (; cursor < markdown.length; cursor++) {
      const char = markdown[cursor];
      if (!escaped && char === ']') break;
      if (!escaped && char === '\\') escaped = true;
      else escaped = false;
    }

    if (cursor >= markdown.length || markdown[cursor + 1] !== '(') {
      result += markdown[index++];
      continue;
    }

    cursor += 2;
    let depth = 1;
    escaped = false;
    for (; cursor < markdown.length && depth > 0; cursor++) {
      const char = markdown[cursor];
      if (char === '\n' || char === '\r') break;
      if (!escaped && char === '(') depth++;
      else if (!escaped && char === ')') depth--;
      if (!escaped && char === '\\') escaped = true;
      else escaped = false;
    }

    if (depth !== 0) {
      result += markdown[index++];
      continue;
    }

    // Collapse only whitespace adjacent to the removed image. This prevents
    // inline images from merging words without rewriting unrelated note text.
    result = result.replace(/[ \t]+$/, '');
    while (markdown[cursor] === ' ' || markdown[cursor] === '\t') cursor++;
    if (result && !/\s$/.test(result) && cursor < markdown.length && !/\s/.test(markdown[cursor])) {
      result += ' ';
    }
    index = cursor;
  }

  return result;
}

function formatNotesForReadme(notes) {
  return stripInlineMarkdownImages(notes || '')
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
