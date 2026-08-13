const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const {
  validateLocationFile,
  validateLocationSet,
  validateLocationsDir,
  validateReadmeInSync,
  VALID_CITIES
} = require('../scripts/validate');
const { generateTable, updateReadme, extractTable, formatNotesForReadme, START_MARKER, END_MARKER } = require('../scripts/generate-readme');
const { parseLocationFile, buildLocationFile, loadLocations, slugify, cityToSlug } = require('../scripts/locations');

const fixturesDir = path.join(__dirname, 'fixtures');

const VALID_CONTENT = `---
name: Test Library
address: 123 Main St, Norfolk, VA 23510
google_maps_link: https://maps.app.goo.gl/abc123
city: Norfolk
area: ghent
category: library
status: needs-verification
---

Front entrance.
`;

describe('parseLocationFile', () => {
  it('parses frontmatter fields and notes body', () => {
    const { fields, notes, errors } = parseLocationFile(VALID_CONTENT);
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(fields.name, 'Test Library');
    assert.strictEqual(fields.address, '123 Main St, Norfolk, VA 23510');
    assert.strictEqual(fields.google_maps_link, 'https://maps.app.goo.gl/abc123');
    assert.strictEqual(notes, 'Front entrance.');
  });

  it('keeps colons in values (URLs)', () => {
    const { fields } = parseLocationFile('---\ngoogle_maps_link: https://maps.google.com/x\n---\n');
    assert.strictEqual(fields.google_maps_link, 'https://maps.google.com/x');
  });

  it('returns empty notes when there is no body', () => {
    const { notes, errors } = parseLocationFile('---\nname: Test\n---\n');
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(notes, '');
  });

  it('preserves multi-line notes', () => {
    const { notes } = parseLocationFile('---\nname: Test\n---\n\nLine one.\n\nLine two.\n');
    assert.strictEqual(notes, 'Line one.\n\nLine two.');
  });

  it('errors on missing frontmatter', () => {
    const { errors } = parseLocationFile('just some text\n');
    assert.ok(errors.some(e => e.includes('missing frontmatter')));
  });

  it('errors on malformed frontmatter lines', () => {
    const { errors } = parseLocationFile('---\nthis is not a field\n---\n');
    assert.ok(errors.some(e => e.includes('invalid frontmatter line')));
  });

  it('errors on duplicate fields', () => {
    const { errors } = parseLocationFile('---\nname: A\nname: B\n---\n');
    assert.ok(errors.some(e => e.includes("duplicate frontmatter field 'name'")));
  });

  it('handles CRLF line endings', () => {
    const { fields, errors } = parseLocationFile(VALID_CONTENT.replace(/\n/g, '\r\n'));
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(fields.name, 'Test Library');
  });
});

describe('buildLocationFile', () => {
  it('round-trips through parseLocationFile', () => {
    const location = {
      name: 'Kroger - Granby St',
      address: '123 Granby St, Norfolk, VA 23510',
      city: 'Norfolk',
      area: 'downtown-norfolk',
      category: 'other',
      google_maps_link: 'https://maps.google.com/k',
      notes: 'Board by the pharmacy.'
    };
    const { fields, notes, errors } = parseLocationFile(buildLocationFile(location));
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(fields.name, location.name);
    assert.strictEqual(fields.address, location.address);
    assert.strictEqual(fields.city, location.city);
    assert.strictEqual(fields.area, location.area);
    assert.strictEqual(fields.category, location.category);
    assert.strictEqual(fields.status, 'needs-verification');
    assert.strictEqual(fields.google_maps_link, location.google_maps_link);
    assert.strictEqual(notes, location.notes);
  });

  it('omits notes section when notes are empty', () => {
    const content = buildLocationFile({ name: 'A', address: 'B', google_maps_link: 'https://x', notes: '' });
    assert.ok(content.endsWith('---\n'));
  });
});

describe('slugify and cityToSlug', () => {
  it('slugifies names', () => {
    assert.strictEqual(slugify('Kroger - Granby St'), 'kroger-granby-st');
    assert.strictEqual(slugify("Joe's Café #2"), 'joe-s-caf-2');
  });

  it('maps city display names to folder slugs', () => {
    assert.strictEqual(cityToSlug('Virginia Beach'), 'virginia-beach');
    assert.strictEqual(cityToSlug('Newport News'), 'newport-news');
    assert.strictEqual(cityToSlug('Atlantis'), null);
  });
});

describe('validateLocationFile', () => {
  it('accepts a valid file', () => {
    const { errors, location } = validateLocationFile('norfolk', 'test-library.md', VALID_CONTENT);
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(location.city, 'Norfolk');
    assert.strictEqual(location.notes, 'Front entrance.');
    assert.strictEqual(location.file, 'data/locations/norfolk/test-library.md');
  });

  it('accepts a file without notes', () => {
    const { errors } = validateLocationFile('norfolk', 'test.md', VALID_CONTENT.replace('name: Test Library', 'name: T'));
    assert.strictEqual(errors.length, 0);
  });

  it('rejects unknown city folders', () => {
    const { errors } = validateLocationFile('atlantis', 'test-library.md', VALID_CONTENT);
    assert.ok(errors.some(e => e.includes("unknown city folder 'atlantis'")));
  });

  it('rejects non-kebab-case filenames', () => {
    for (const bad of ['Test Library.md', 'TestLibrary.md', 'test_library.md', 'test-library.txt', '-test.md']) {
      const { errors } = validateLocationFile('norfolk', bad, VALID_CONTENT);
      assert.ok(errors.some(e => e.includes('kebab-case')), `should reject ${bad}`);
    }
  });

  it('rejects missing required fields', () => {
    const { errors } = validateLocationFile('norfolk', 'test.md', '---\nname: Test\n---\n');
    assert.ok(errors.some(e => e.includes("missing required frontmatter field 'address'")));
    assert.ok(errors.some(e => e.includes("missing required frontmatter field 'city'")));
    assert.ok(errors.some(e => e.includes("missing required frontmatter field 'area'")));
    assert.ok(errors.some(e => e.includes("missing required frontmatter field 'category'")));
    assert.ok(errors.some(e => e.includes("missing required frontmatter field 'status'")));
  });

  it('rejects http (non-https) links', () => {
    const content = VALID_CONTENT.replace('https://maps.app.goo.gl/abc123', 'http://maps.google.com');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes('https://')));
  });

  it('rejects google_maps_link URLs on non-Google hosts', () => {
    const content = VALID_CONTENT.replace('https://maps.app.goo.gl/abc123', 'https://www.openstreetmap.org/way/1545452520');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes('google.com or maps.app.goo.gl')));
  });

  it('reports malformed HTTPS google_maps_link values without throwing', () => {
    const content = VALID_CONTENT.replace('https://maps.app.goo.gl/abc123', 'https://');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes('valid URL')));
  });

  it('rejects unexpected frontmatter fields', () => {
    const content = VALID_CONTENT.replace('status: needs-verification', 'status: needs-verification\nphone: 555-1234');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes("unexpected frontmatter field 'phone'")));
  });

  it('rejects a city field that disagrees with its folder', () => {
    const content = VALID_CONTENT.replace('city: Norfolk', 'city: Hampton');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes("city 'Hampton' does not match folder 'norfolk'")));
  });

  it('rejects invalid enum values and incomplete coordinate pairs', () => {
    const content = VALID_CONTENT.replace('category: library', 'category: store').replace('status: needs-verification', 'status: unknown').replace('area: ghent', 'area: nowhere').replace('city: Norfolk', 'city: Norfolk\nlat: 36.8');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes('invalid category')));
    assert.ok(errors.some(e => e.includes('invalid status')));
    assert.ok(errors.some(e => e.includes('invalid area')));
    assert.ok(errors.some(e => e.includes('lat and lng must be provided together')));
  });

  it('rejects invalid coordinate bounds and invalid verified dates', () => {
    const content = VALID_CONTENT.replace('city: Norfolk', 'city: Norfolk\nlat: 91\nlng: -181\nverified_date: 2026-02-30');
    const { errors } = validateLocationFile('norfolk', 'test.md', content);
    assert.ok(errors.some(e => e.includes('lat must be a number between -90 and 90')));
    assert.ok(errors.some(e => e.includes('lng must be a number between -180 and 180')));
    assert.ok(errors.some(e => e.includes('verified_date must be a real date')));
  });

  describe('accepts every known city folder', () => {
    const slugs = ['chesapeake', 'hampton', 'newport-news', 'norfolk', 'portsmouth', 'suffolk', 'virginia-beach'];
    slugs.forEach(slug => {
      it(`accepts ${slug}`, () => {
        const content = VALID_CONTENT.replace('city: Norfolk', `city: ${{
          chesapeake: 'Chesapeake', hampton: 'Hampton', 'newport-news': 'Newport News',
          norfolk: 'Norfolk', portsmouth: 'Portsmouth', suffolk: 'Suffolk',
          'virginia-beach': 'Virginia Beach'
        }[slug]}`);
        const { errors, location } = validateLocationFile(slug, 'test.md', content);
        assert.strictEqual(errors.length, 0);
        assert.ok(VALID_CITIES.includes(location.city));
      });
    });
  });
});

describe('validateLocationSet', () => {
  it('accepts distinct locations', () => {
    const result = validateLocationSet([
      { name: 'A', address: '1 A St' },
      { name: 'B', address: '2 B St' }
    ]);
    assert.strictEqual(result.valid, true);
  });

  it('rejects duplicates case-insensitively', () => {
    const result = validateLocationSet([
      { name: 'Test Library', address: '123 Main St' },
      { name: 'test library', address: '123 MAIN ST' }
    ]);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Duplicate')));
  });
});

describe('validateLocationsDir', () => {
  it('validates a well-formed tree and sorts by city then name', () => {
    const result = validateLocationsDir(path.join(fixturesDir, 'valid-tree'));
    assert.strictEqual(result.valid, true, JSON.stringify(result.errors));
    assert.deepStrictEqual(result.locations.map(l => l.name), ['Alpha Place', 'No Notes Place', 'Test Library']);
    assert.deepStrictEqual(result.locations.map(l => l.city), ['Hampton', 'Norfolk', 'Norfolk']);
  });

  it('reports stray files and unknown city folders', () => {
    const result = validateLocationsDir(path.join(fixturesDir, 'invalid-tree'));
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('stray file')));
    assert.ok(result.errors.some(e => e.includes("unknown city folder 'atlantis'")));
  });
});

describe('loadLocations', () => {
  it('loads and sorts locations from a tree', () => {
    const locations = loadLocations(path.join(fixturesDir, 'valid-tree'));
    assert.strictEqual(locations.length, 3);
    assert.strictEqual(locations[0].name, 'Alpha Place');
    assert.strictEqual(locations[0].city, 'Hampton');
    assert.strictEqual(locations[0].file, 'data/locations/hampton/alpha-place.md');
  });
});

describe('generateTable', () => {
  it('generates generated-file notice and table structure', () => {
    const md = generateTable([]);
    assert.ok(md.includes('auto-generated'));
    assert.ok(md.includes('| City | Name | Address | Map | Notes |'));
    assert.ok(md.includes('|------|------|---------|-----|-------|'));
  });

  it('links the location name to its source file', () => {
    const locations = [{
      name: 'Test Library',
      address: '123 Main St, Norfolk, VA 23510',
      city: 'Norfolk',
      google_maps_link: 'https://maps.app.goo.gl/abc123',
      notes: 'Front entrance',
      file: 'data/locations/norfolk/test-library.md'
    }];
    const md = generateTable(locations);
    assert.ok(md.includes('| Norfolk | [Test Library](data/locations/norfolk/test-library.md) | 123 Main St, Norfolk, VA 23510 | [Map](https://maps.app.goo.gl/abc123) | Front entrance |'));
  });

  it('collapses multi-line notes into one table cell line', () => {
    const locations = [{
      name: 'Test',
      address: '1 A St',
      city: 'Norfolk',
      google_maps_link: 'https://x',
      notes: 'Line one.\n\nLine two.',
      file: 'data/locations/norfolk/test.md'
    }];
    const md = generateTable(locations);
    assert.ok(md.includes('| Line one. Line two. |'));
  });

  it('removes note images entirely while retaining Project Seed-style text', () => {
    const locations = [{
      name: 'Project Seed Coffee',
      address: '1 A St',
      city: 'Virginia Beach',
      google_maps_link: 'https://x',
      notes: 'Community board confirmed in person. Located near the bathroom. Bring push pins.\n\n![Community board photo](../../../images/board.jpg)',
      file: 'data/locations/virginia-beach/project-seed-coffee.md'
    }];
    const md = generateTable(locations);
    assert.ok(md.includes('| Community board confirmed in person. Located near the bathroom. Bring push pins. |'));
    assert.ok(!md.includes('!['));
    assert.ok(!md.includes('../../../images/board.jpg'));
    assert.ok(!md.includes('Community board photo'));
  });

  it('preserves ordinary Markdown links while removing images', () => {
    const locations = [{
      name: 'Test',
      address: '1 A St',
      city: 'Norfolk',
      google_maps_link: 'https://x',
      notes: 'See [posting rules](https://example.com/rules). ![Rules sign](../../../images/rules.jpg)',
      file: 'data/locations/norfolk/test.md'
    }];
    const md = generateTable(locations);
    assert.ok(md.includes('See [posting rules](https://example.com/rules).'));
    assert.ok(!md.includes('Rules sign'));
    assert.ok(!md.includes('../../../images/rules.jpg'));
  });

  it('removes images whose destinations contain balanced parentheses', () => {
    const notes = 'Before ![Board](https://example.com/foo(bar).jpg) after.';
    assert.strictEqual(formatNotesForReadme(notes), 'Before after.');
  });

  it('keeps inline image removal from merging surrounding words', () => {
    assert.strictEqual(formatNotesForReadme('before![Board](board.jpg)after'), 'before after');
  });

  it('normalizes whitespace after removing images', () => {
    const notes = 'Before  \n ![Board](board.jpg)\t  after.';
    assert.strictEqual(formatNotesForReadme(notes), 'Before after.');
  });

  it('preserves ordinary links with balanced parentheses', () => {
    const notes = 'See [the photo](https://example.com/foo(bar).jpg).';
    assert.strictEqual(formatNotesForReadme(notes), notes);
  });

  it('formats notes idempotently', () => {
    const notes = 'Before ![Board](https://example.com/foo(bar).jpg) after.';
    const formatted = formatNotesForReadme(notes);
    assert.strictEqual(formatNotesForReadme(formatted), formatted);
  });

  it('handles missing notes with empty cell', () => {
    const locations = [{
      name: 'Test',
      address: '123 Main St',
      city: 'Norfolk',
      google_maps_link: 'https://maps.google.com',
      file: 'data/locations/norfolk/test.md'
    }];
    const md = generateTable(locations);
    assert.ok(md.includes('|  |'), 'should have empty notes cell');
  });

  it('preserves location order', () => {
    const locations = [
      { name: 'Zebra Place', address: '1 Z St', city: 'Norfolk', google_maps_link: 'https://maps.google.com/z' },
      { name: 'Alpha Place', address: '1 A St', city: 'Hampton', google_maps_link: 'https://maps.google.com/a' }
    ];
    const md = generateTable(locations);
    assert.ok(md.indexOf('Zebra Place') < md.indexOf('Alpha Place'), 'should preserve input order');
  });
});

describe('updateReadme and extractTable', () => {
  const README = `# Title\n\nIntro text.\n\n## Locations\n\n${START_MARKER}\nold content\n${END_MARKER}\n\n## License\n\nPublic domain.\n`;
  const location = {
    name: 'Test Library',
    address: '123 Main St, Norfolk, VA 23510',
    city: 'Norfolk',
    google_maps_link: 'https://maps.app.goo.gl/abc123',
    notes: 'Front entrance',
    file: 'data/locations/norfolk/test-library.md'
  };

  it('replaces only the marked section', () => {
    const updated = updateReadme(README, [location]);
    assert.ok(updated.includes('Intro text.'));
    assert.ok(updated.includes('Public domain.'));
    assert.ok(updated.includes('[Test Library](data/locations/norfolk/test-library.md)'));
    assert.ok(!updated.includes('old content'));
  });

  it('is idempotent', () => {
    const locationWithImage = {
      ...location,
      notes: 'Front entrance. [Details](https://example.com).\n\n![Entrance photo](../../../images/entrance.jpg)'
    };
    const once = updateReadme(README, [locationWithImage]);
    const twice = updateReadme(once, [locationWithImage]);
    assert.strictEqual(once, twice);
    assert.ok(once.includes('[Details](https://example.com)'));
    assert.ok(!once.includes('!['));
  });

  it('throws when markers are missing', () => {
    assert.throws(() => updateReadme('# No markers here\n', [location]), /markers/);
  });

  it('extractTable returns the generated block', () => {
    const updated = updateReadme(README, [location]);
    const block = extractTable(updated);
    assert.ok(block.includes('| City | Name | Address | Map | Notes |'));
  });

  it('extractTable returns null when markers are missing', () => {
    assert.strictEqual(extractTable('# No markers\n'), null);
  });
});

describe('validateReadmeInSync', () => {
  const location = {
    name: 'Test Library',
    address: '123 Main St, Norfolk, VA 23510',
    city: 'Norfolk',
    google_maps_link: 'https://maps.app.goo.gl/abc123',
    notes: 'Front entrance',
    file: 'data/locations/norfolk/test-library.md'
  };
  const emptyReadme = `# Title\n\n${START_MARKER}\n${END_MARKER}\n`;

  function readmeFor(locations) {
    return updateReadme(emptyReadme, locations);
  }

  it('passes when the README table matches exactly', () => {
    const result = validateReadmeInSync([location], readmeFor([location]));
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('fails when markers are missing', () => {
    const result = validateReadmeInSync([location], '# No markers\n');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('markers')));
  });

  it('fails when address is wrong', () => {
    const readme = readmeFor([location]).replace('123 Main St', '456 Oak Ave');
    const result = validateReadmeInSync([location], readme);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('mismatch')));
  });

  it('fails when a row is missing', () => {
    const other = { ...location, name: 'Place B', address: '2 B St', file: 'data/locations/hampton/place-b.md', city: 'Hampton' };
    const result = validateReadmeInSync([location, other], readmeFor([location]));
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('fails when there is an extra row', () => {
    const other = { ...location, name: 'Place B', address: '2 B St', file: 'data/locations/hampton/place-b.md', city: 'Hampton' };
    const result = validateReadmeInSync([location], readmeFor([location, other]));
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('handles CRLF normalization', () => {
    const readme = readmeFor([location]).replace(/\n/g, '\r\n');
    const result = validateReadmeInSync([location], readme);
    assert.strictEqual(result.valid, true);
  });

  it('passes with empty locations', () => {
    const result = validateReadmeInSync([], readmeFor([]));
    assert.strictEqual(result.valid, true);
  });
});
