const fs = require('fs');
const path = require('path');

const CITY_SLUGS = {
  'chesapeake': 'Chesapeake',
  'hampton': 'Hampton',
  'newport-news': 'Newport News',
  'norfolk': 'Norfolk',
  'portsmouth': 'Portsmouth',
  'suffolk': 'Suffolk',
  'virginia-beach': 'Virginia Beach'
};

const VALID_CITIES = Object.values(CITY_SLUGS);

const REQUIRED_FIELDS = ['name', 'address', 'google_maps_link'];

const LOCATIONS_DIR = path.join(__dirname, '..', 'data', 'locations');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cityToSlug(city) {
  const slug = Object.keys(CITY_SLUGS).find(s => CITY_SLUGS[s] === city);
  return slug || null;
}

// Parses a location file: flat `key: value` frontmatter between --- markers,
// followed by free-form notes. No YAML library needed.
function parseLocationFile(content) {
  const errors = [];
  const normalized = content.replace(/\r\n/g, '\n');

  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { fields: {}, notes: '', errors: ['missing frontmatter (file must start with --- and contain a closing ---)'] };
  }

  const fields = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const lineMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!lineMatch) {
      errors.push(`invalid frontmatter line: "${line}" (expected "key: value")`);
      continue;
    }
    const [, key, value] = lineMatch;
    if (key in fields) {
      errors.push(`duplicate frontmatter field '${key}'`);
      continue;
    }
    fields[key] = value.trim();
  }

  return { fields, notes: match[2].trim(), errors };
}

// Serializes a location back to file content (used by the issue-to-PR workflow).
function buildLocationFile({ name, address, google_maps_link, notes }) {
  let content = '---\n';
  content += `name: ${name}\n`;
  content += `address: ${address}\n`;
  content += `google_maps_link: ${google_maps_link}\n`;
  content += '---\n';
  if (notes && notes.trim()) {
    content += `\n${notes.trim()}\n`;
  }
  return content;
}

// Walks data/locations and returns every entry as
// { citySlug, filename, relPath, content } without validating anything.
// relPath is repo-relative with forward slashes (used for markdown links).
function walkLocationFiles(dir = LOCATIONS_DIR) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const cityEntry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!cityEntry.isDirectory()) {
      files.push({ citySlug: null, filename: cityEntry.name, relPath: `data/locations/${cityEntry.name}`, content: null });
      continue;
    }
    const cityDir = path.join(dir, cityEntry.name);
    for (const file of fs.readdirSync(cityDir).sort((a, b) => a.localeCompare(b))) {
      files.push({
        citySlug: cityEntry.name,
        filename: file,
        relPath: `data/locations/${cityEntry.name}/${file}`,
        content: fs.readFileSync(path.join(cityDir, file), 'utf8')
      });
    }
  }
  return files;
}

// Loads all locations as plain objects, sorted by city then name.
// Throws on unparseable files — use validate.js for friendly errors.
function loadLocations(dir = LOCATIONS_DIR) {
  const locations = walkLocationFiles(dir).map(file => {
    const { fields, notes, errors } = parseLocationFile(file.content || '');
    if (file.citySlug === null || errors.length > 0) {
      throw new Error(`${file.relPath}: ${file.citySlug === null ? 'stray file (locations must live in a city folder)' : errors.join('; ')}`);
    }
    return {
      name: fields.name || '',
      address: fields.address || '',
      city: CITY_SLUGS[file.citySlug] || file.citySlug,
      google_maps_link: fields.google_maps_link || '',
      notes,
      file: file.relPath
    };
  });

  locations.sort((a, b) => {
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    return a.name.localeCompare(b.name);
  });
  return locations;
}

module.exports = {
  CITY_SLUGS,
  VALID_CITIES,
  REQUIRED_FIELDS,
  LOCATIONS_DIR,
  slugify,
  cityToSlug,
  parseLocationFile,
  buildLocationFile,
  walkLocationFiles,
  loadLocations
};
