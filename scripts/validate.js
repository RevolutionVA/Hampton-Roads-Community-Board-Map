const fs = require('fs');
const path = require('path');
const { generateMarkdown } = require('./generate-markdown');
const {
  CITY_SLUGS,
  VALID_CITIES,
  REQUIRED_FIELDS,
  LOCATIONS_DIR,
  parseLocationFile,
  walkLocationFiles
} = require('./locations');

const VALID_FIELDS = [...REQUIRED_FIELDS];

const FILENAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

// Validates a single location file. Returns { errors, location } where
// location is null when the file could not be parsed into one.
function validateLocationFile(citySlug, filename, content) {
  const prefix = `data/locations/${citySlug}/${filename}`;
  const errors = [];

  if (!(citySlug in CITY_SLUGS)) {
    errors.push(`${prefix}: unknown city folder '${citySlug}'. Must be one of: ${Object.keys(CITY_SLUGS).join(', ')}`);
  }

  if (!FILENAME_PATTERN.test(filename)) {
    errors.push(`${prefix}: filename must be kebab-case and end in .md (e.g. ocean-view-library.md)`);
  }

  const { fields, notes, errors: parseErrors } = parseLocationFile(content);
  parseErrors.forEach(e => errors.push(`${prefix}: ${e}`));

  for (const field of REQUIRED_FIELDS) {
    if (!fields[field]) {
      errors.push(`${prefix}: missing required frontmatter field '${field}'`);
    }
  }

  if (fields.google_maps_link && !fields.google_maps_link.startsWith('https://')) {
    errors.push(`${prefix}: google_maps_link must start with https://`);
  }

  Object.keys(fields).forEach(key => {
    if (!VALID_FIELDS.includes(key)) {
      errors.push(`${prefix}: unexpected frontmatter field '${key}' (city comes from the folder name, notes go below the frontmatter)`);
    }
  });

  const location = {
    name: fields.name || '',
    address: fields.address || '',
    city: CITY_SLUGS[citySlug] || citySlug,
    google_maps_link: fields.google_maps_link || '',
    notes,
    file: prefix
  };

  return { errors, location };
}

// Cross-file checks: duplicate name+address pairs.
function validateLocationSet(locations) {
  const errors = [];
  const seen = new Set();
  locations.forEach(loc => {
    const key = `${loc.name}|${loc.address}`.toLowerCase();
    if (seen.has(key)) {
      errors.push(`Duplicate location: ${loc.name} at ${loc.address}`);
    }
    seen.add(key);
  });
  return { valid: errors.length === 0, errors };
}

// Validates the whole data/locations tree.
function validateLocationsDir(dir = LOCATIONS_DIR) {
  const errors = [];
  const locations = [];

  for (const file of walkLocationFiles(dir)) {
    if (file.citySlug === null) {
      errors.push(`${file.relPath}: stray file (locations must live in a city folder like data/locations/norfolk/)`);
      continue;
    }
    const result = validateLocationFile(file.citySlug, file.filename, file.content);
    errors.push(...result.errors);
    locations.push(result.location);
  }

  locations.sort((a, b) => {
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    return a.name.localeCompare(b.name);
  });

  errors.push(...validateLocationSet(locations).errors);

  return { valid: errors.length === 0, errors, locations };
}

function validateMarkdownInSync(locations, markdownContent) {
  const expected = generateMarkdown(locations);
  const normalize = (s) => s.replace(/\r\n/g, '\n').trimEnd();
  const expectedNorm = normalize(expected);
  const actualNorm = normalize(markdownContent);

  if (expectedNorm === actualNorm) {
    return { valid: true, errors: [] };
  }

  const expectedLines = expectedNorm.split('\n');
  const actualLines = actualNorm.split('\n');
  const errors = [];

  const maxLen = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < maxLen; i++) {
    const exp = expectedLines[i];
    const act = actualLines[i];
    if (exp === undefined) {
      errors.push(`Line ${i + 1}: unexpected extra line: "${act}"`);
    } else if (act === undefined) {
      errors.push(`Line ${i + 1}: missing expected line: "${exp}"`);
    } else if (exp !== act) {
      errors.push(`Line ${i + 1}: mismatch\n  expected: "${exp}"\n  actual:   "${act}"`);
    }
  }

  return { valid: false, errors };
}

// CLI entry point
if (require.main === module) {
  const locationsDir = process.argv[2] || LOCATIONS_DIR;
  const mdPath = process.argv[3] || path.join(__dirname, '..', 'LOCATIONS.md');

  const result = validateLocationsDir(locationsDir);

  if (!result.valid) {
    console.error('❌ Validation failed:\n');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Check markdown sync
  try {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const syncResult = validateMarkdownInSync(result.locations, mdContent);

    if (!syncResult.valid) {
      console.error('❌ LOCATIONS.md is out of sync with data/locations/:\n');
      syncResult.errors.forEach(e => console.error(`  - ${e}`));
      console.error('\nRun "npm run generate" to regenerate LOCATIONS.md');
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ Failed to read ${mdPath}: ${e.message}`);
    process.exit(1);
  }

  console.log(`✅ Validated ${result.locations.length} locations successfully`);
  process.exit(0);
}

module.exports = {
  validateLocationFile,
  validateLocationSet,
  validateLocationsDir,
  validateMarkdownInSync,
  VALID_CITIES,
  VALID_FIELDS
};
