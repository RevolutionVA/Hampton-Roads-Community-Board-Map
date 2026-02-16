const fs = require('fs');
const path = require('path');

function generateMarkdown(locations) {
  let markdown = '# Community Board Locations\n\n';
  markdown += 'Public bulletin boards in Hampton Roads, Virginia where you can post community notices.\n\n';
  markdown += '| City | Name | Address | Map | Notes |\n';
  markdown += '|------|------|---------|-----|-------|\n';

  for (const loc of locations) {
    const notesCell = loc.notes || '';
    markdown += `| ${loc.city} | ${loc.name} | ${loc.address} | [Map](${loc.google_maps_link}) | ${notesCell} |\n`;
  }

  return markdown;
}

// CLI entry point
if (require.main === module) {
  const locationsPath = process.argv[2] || path.join(__dirname, '..', 'data', 'locations.json');
  const outputPath = process.argv[3] || path.join(__dirname, '..', 'LOCATIONS.md');

  let locations;
  try {
    const content = fs.readFileSync(locationsPath, 'utf8');
    locations = JSON.parse(content);
  } catch (e) {
    console.error(`❌ Failed to read/parse ${locationsPath}: ${e.message}`);
    process.exit(1);
  }

  const markdown = generateMarkdown(locations);
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`✅ Generated ${outputPath} with ${locations.length} locations`);
}

module.exports = { generateMarkdown };
