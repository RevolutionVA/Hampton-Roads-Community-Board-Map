const fs = require('fs');
const path = require('path');
const { loadLocations } = require('./locations');

function generateMarkdown(locations) {
  let markdown = '# Community Board Locations\n\n';
  markdown += '<!-- This file is auto-generated from data/locations/ - do not edit by hand. -->\n\n';
  markdown += 'Public bulletin boards in Hampton Roads, Virginia where you can post community notices.\n\n';
  markdown += '| City | Name | Address | Map | Notes |\n';
  markdown += '|------|------|---------|-----|-------|\n';

  for (const loc of locations) {
    const nameCell = loc.file ? `[${loc.name}](${loc.file})` : loc.name;
    const notesCell = (loc.notes || '').replace(/\s*\n\s*/g, ' ');
    markdown += `| ${loc.city} | ${nameCell} | ${loc.address} | [Map](${loc.google_maps_link}) | ${notesCell} |\n`;
  }

  return markdown;
}

// CLI entry point
if (require.main === module) {
  const outputPath = process.argv[2] || path.join(__dirname, '..', 'LOCATIONS.md');

  let locations;
  try {
    locations = loadLocations();
  } catch (e) {
    console.error(`❌ Failed to load locations: ${e.message}`);
    process.exit(1);
  }

  const markdown = generateMarkdown(locations);
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`✅ Generated ${outputPath} with ${locations.length} locations`);
}

module.exports = { generateMarkdown };
