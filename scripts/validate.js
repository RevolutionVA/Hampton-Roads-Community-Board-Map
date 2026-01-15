const fs = require('fs');
const path = require('path');

const VALID_CITIES = [
  'Norfolk',
  'Virginia Beach',
  'Chesapeake',
  'Suffolk',
  'Portsmouth',
  'Hampton',
  'Newport News'
];

const VALID_FIELDS = ['name', 'address', 'city', 'google_maps_link', 'notes'];

function validateLocations(locations) {
  const errors = [];

  if (!Array.isArray(locations)) {
    return { valid: false, errors: ['locations.json must be an array'] };
  }

  locations.forEach((loc, index) => {
    const prefix = `Location ${index + 1} (${loc.name || 'unnamed'})`;

    // Required fields
    if (!loc.name || typeof loc.name !== 'string') {
      errors.push(`${prefix}: missing or invalid 'name'`);
    }
    if (!loc.address || typeof loc.address !== 'string') {
      errors.push(`${prefix}: missing or invalid 'address'`);
    }
    if (!loc.city || typeof loc.city !== 'string') {
      errors.push(`${prefix}: missing or invalid 'city'`);
    } else if (!VALID_CITIES.includes(loc.city)) {
      errors.push(`${prefix}: invalid city '${loc.city}'. Must be one of: ${VALID_CITIES.join(', ')}`);
    }
    if (!loc.google_maps_link || typeof loc.google_maps_link !== 'string') {
      errors.push(`${prefix}: missing or invalid 'google_maps_link'`);
    } else if (!loc.google_maps_link.startsWith('https://')) {
      errors.push(`${prefix}: google_maps_link must start with https://`);
    }

    // Notes is optional but must be string if present
    if (loc.notes !== undefined && typeof loc.notes !== 'string') {
      errors.push(`${prefix}: 'notes' must be a string`);
    }

    // Check for unexpected fields
    Object.keys(loc).forEach(key => {
      if (!VALID_FIELDS.includes(key)) {
        errors.push(`${prefix}: unexpected field '${key}'`);
      }
    });
  });

  // Check for duplicates
  const seen = new Set();
  locations.forEach(loc => {
    const key = `${loc.name}|${loc.address}`.toLowerCase();
    if (seen.has(key)) {
      errors.push(`Duplicate location: ${loc.name} at ${loc.address}`);
    }
    seen.add(key);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateMarkdownInSync(locations, markdownContent) {
  const missing = [];

  for (const loc of locations) {
    if (!markdownContent.includes(loc.name)) {
      missing.push(loc.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

// CLI entry point
if (require.main === module) {
  const locationsPath = process.argv[2] || path.join(__dirname, '..', 'data', 'locations.json');
  const mdPath = process.argv[3] || path.join(__dirname, '..', 'LOCATIONS.md');

  let locations;
  try {
    const content = fs.readFileSync(locationsPath, 'utf8');
    locations = JSON.parse(content);
  } catch (e) {
    console.error(`❌ Failed to read/parse ${locationsPath}: ${e.message}`);
    process.exit(1);
  }

  const result = validateLocations(locations);

  if (!result.valid) {
    console.error('❌ Validation failed:\n');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Check markdown sync
  try {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const syncResult = validateMarkdownInSync(locations, mdContent);

    if (!syncResult.valid) {
      console.error('❌ LOCATIONS.md is out of sync. Missing:\n');
      syncResult.missing.forEach(n => console.error(`  - ${n}`));
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ Failed to read ${mdPath}: ${e.message}`);
    process.exit(1);
  }

  console.log(`✅ Validated ${locations.length} locations successfully`);
  process.exit(0);
}

module.exports = {
  validateLocations,
  validateMarkdownInSync,
  VALID_CITIES,
  VALID_FIELDS
};
