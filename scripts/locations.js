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
const REQUIRED_FIELDS = ['name', 'address', 'city', 'area', 'category', 'status'];
const VALID_FIELDS = [...REQUIRED_FIELDS, 'google_maps_link', 'lat', 'lng', 'board_type', 'verified_date'];
const VALID_AREAS = [
  'bayside', 'bennetts-creek', 'berkley-campostella', 'broad-creek', 'buckroe-fox-hill',
  'cavalier-manor', 'centerville', 'chuckatuck', 'churchland', 'coliseum-central', 'cradock',
  'deep-creek', 'denbigh', 'downtown-hampton', 'downtown-newport-news', 'downtown-norfolk',
  'downtown-suffolk', 'fort-eustis', 'ghent', 'grassfield', 'great-bridge', 'great-neck',
  'greenbrier', 'harbour-view', 'hickory', 'hilltop', 'hilton', 'holland', 'indian-river',
  'kempsville', 'kiln-creek', 'kings-fork', 'little-creek', 'lynnhaven', 'midtown-newport-news',
  'midtown-portsmouth', 'military-circle', 'ocean-view', 'oceanfront', 'odu-larchmont',
  'olde-towne', 'oyster-point', 'phoebus', 'princess-anne', 'pungo', 'red-mill', 'shore-drive',
  'south-norfolk', 'town-center', 'victory-crossing', 'wards-corner', 'western-branch', 'wythe'
];
const VALID_CATEGORIES = ['coffee-shop', 'restaurant', 'library', 'community-center', 'convenience-store', 'other'];
const VALID_BOARD_TYPES = ['window', 'bulletin-board', 'magnetic', 'other'];
const VALID_STATUSES = ['needs-verification', 'verified'];

const LOCATIONS_DIR = path.join(__dirname, '..', 'data', 'locations');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function cityToSlug(city) {
  return Object.keys(CITY_SLUGS).find(s => CITY_SLUGS[s] === city) || null;
}

function parseLocationFile(content) {
  const errors = [];
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fields: {}, notes: '', errors: ['missing frontmatter (file must start with --- and contain a closing ---)'] };

  const fields = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
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

function buildLocationFile({ name, address, city, area, category, status = 'needs-verification', google_maps_link, lat, lng, board_type, verified_date, notes }) {
  const values = { name, address, city, area, lat, lng, category, board_type, status, verified_date, google_maps_link };
  let content = '---\n';
  for (const key of VALID_FIELDS) {
    if (values[key] !== undefined && values[key] !== null && String(values[key]).trim() !== '') content += `${key}: ${values[key]}\n`;
  }
  content += '---\n';
  if (notes && notes.trim()) content += `\n${notes.trim()}\n`;
  return content;
}

function walkLocationFiles(dir = LOCATIONS_DIR) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const cityEntry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (cityEntry.name === '_TEMPLATE.md') continue;
    if (!cityEntry.isDirectory()) {
      files.push({ citySlug: null, filename: cityEntry.name, relPath: `data/locations/${cityEntry.name}`, content: null });
      continue;
    }
    const cityDir = path.join(dir, cityEntry.name);
    for (const file of fs.readdirSync(cityDir).sort((a, b) => a.localeCompare(b))) {
      files.push({ citySlug: cityEntry.name, filename: file, relPath: `data/locations/${cityEntry.name}/${file}`, content: fs.readFileSync(path.join(cityDir, file), 'utf8') });
    }
  }
  return files;
}

function loadLocations(dir = LOCATIONS_DIR) {
  const locations = walkLocationFiles(dir).map(file => {
    const { fields, notes, errors } = parseLocationFile(file.content || '');
    if (file.citySlug === null || errors.length > 0) throw new Error(`${file.relPath}: ${file.citySlug === null ? 'stray file (locations must live in a city folder)' : errors.join('; ')}`);
    return { ...fields, city: fields.city || CITY_SLUGS[file.citySlug] || file.citySlug, notes, file: file.relPath };
  });
  locations.sort((a, b) => a.city !== b.city ? a.city.localeCompare(b.city) : a.name.localeCompare(b.name));
  return locations;
}

module.exports = {
  CITY_SLUGS, VALID_CITIES, REQUIRED_FIELDS, VALID_FIELDS, VALID_AREAS, VALID_CATEGORIES,
  VALID_BOARD_TYPES, VALID_STATUSES, LOCATIONS_DIR, slugify, cityToSlug, parseLocationFile,
  buildLocationFile, walkLocationFiles, loadLocations
};
