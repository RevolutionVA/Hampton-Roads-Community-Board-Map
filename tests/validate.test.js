const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { validateLocations, validateMarkdownInSync, VALID_CITIES } = require('../scripts/validate');
const { generateMarkdown } = require('../scripts/generate-markdown');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

describe('validateLocations', () => {
  describe('valid inputs', () => {
    it('accepts empty array', () => {
      const result = validateLocations(loadFixture('valid-empty.json'));
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('accepts single valid location', () => {
      const result = validateLocations(loadFixture('valid-single.json'));
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('accepts multiple valid locations', () => {
      const result = validateLocations(loadFixture('valid-multiple.json'));
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('accepts location without notes field', () => {
      const locations = [{
        name: 'Test',
        address: '123 Main St',
        city: 'Norfolk',
        google_maps_link: 'https://maps.google.com'
      }];
      const result = validateLocations(locations);
      assert.strictEqual(result.valid, true);
    });

    it('accepts location with empty notes', () => {
      const locations = [{
        name: 'Test',
        address: '123 Main St',
        city: 'Norfolk',
        google_maps_link: 'https://maps.google.com',
        notes: ''
      }];
      const result = validateLocations(locations);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects non-array input', () => {
      const result = validateLocations(loadFixture('invalid-not-array.json'));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('must be an array')));
    });

    it('rejects missing name', () => {
      const result = validateLocations(loadFixture('invalid-missing-name.json'));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes("'name'")));
    });

    it('rejects invalid city', () => {
      const result = validateLocations(loadFixture('invalid-bad-city.json'));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('invalid city')));
    });

    it('rejects http (non-https) links', () => {
      const result = validateLocations(loadFixture('invalid-http-link.json'));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('https://')));
    });

    it('rejects duplicate locations', () => {
      const result = validateLocations(loadFixture('invalid-duplicate.json'));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Duplicate')));
    });

    it('rejects unexpected fields', () => {
      const result = validateLocations(loadFixture('invalid-extra-field.json'));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes("unexpected field 'phone'")));
    });

    it('rejects missing address', () => {
      const locations = [{
        name: 'Test',
        city: 'Norfolk',
        google_maps_link: 'https://maps.google.com'
      }];
      const result = validateLocations(locations);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes("'address'")));
    });

    it('rejects missing google_maps_link', () => {
      const locations = [{
        name: 'Test',
        address: '123 Main St',
        city: 'Norfolk'
      }];
      const result = validateLocations(locations);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes("'google_maps_link'")));
    });
  });

  describe('city validation', () => {
    VALID_CITIES.forEach(city => {
      it(`accepts ${city}`, () => {
        const locations = [{
          name: 'Test',
          address: '123 Main St',
          city: city,
          google_maps_link: 'https://maps.google.com'
        }];
        const result = validateLocations(locations);
        assert.strictEqual(result.valid, true);
      });
    });
  });
});

describe('generateMarkdown', () => {
  it('generates header and table structure', () => {
    const md = generateMarkdown([]);
    assert.ok(md.startsWith('# Community Board Locations'));
    assert.ok(md.includes('| City | Name | Address | Map | Notes |'));
    assert.ok(md.includes('|------|------|---------|-----|-------|'));
  });

  it('generates rows for locations', () => {
    const locations = [{
      name: 'Test Library',
      address: '123 Main St, Norfolk, VA 23510',
      city: 'Norfolk',
      google_maps_link: 'https://maps.app.goo.gl/abc123',
      notes: 'Front entrance'
    }];
    const md = generateMarkdown(locations);
    assert.ok(md.includes('| Norfolk | Test Library | 123 Main St, Norfolk, VA 23510 | [Map](https://maps.app.goo.gl/abc123) | Front entrance |'));
  });

  it('handles missing notes with empty cell', () => {
    const locations = [{
      name: 'Test',
      address: '123 Main St',
      city: 'Norfolk',
      google_maps_link: 'https://maps.google.com'
    }];
    const md = generateMarkdown(locations);
    assert.ok(md.includes('|  |'), 'should have empty notes cell');
  });

  it('preserves location order', () => {
    const locations = [
      { name: 'Zebra Place', address: '1 Z St', city: 'Norfolk', google_maps_link: 'https://maps.google.com/z' },
      { name: 'Alpha Place', address: '1 A St', city: 'Hampton', google_maps_link: 'https://maps.google.com/a' }
    ];
    const md = generateMarkdown(locations);
    const zebraIndex = md.indexOf('Zebra Place');
    const alphaIndex = md.indexOf('Alpha Place');
    assert.ok(zebraIndex < alphaIndex, 'should preserve input order');
  });
});

describe('validateMarkdownInSync', () => {
  it('passes when markdown matches exactly', () => {
    const locations = [{
      name: 'Test Library',
      address: '123 Main St, Norfolk, VA 23510',
      city: 'Norfolk',
      google_maps_link: 'https://maps.app.goo.gl/abc123',
      notes: 'Front entrance'
    }];
    const markdown = generateMarkdown(locations);
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('fails when address is wrong', () => {
    const locations = [{
      name: 'Test Library',
      address: '123 Main St, Norfolk, VA 23510',
      city: 'Norfolk',
      google_maps_link: 'https://maps.app.goo.gl/abc123',
      notes: 'Front entrance'
    }];
    let markdown = generateMarkdown(locations);
    markdown = markdown.replace('123 Main St', '456 Oak Ave');
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('mismatch')));
  });

  it('fails when a row is missing', () => {
    const locations = [
      { name: 'Place A', address: '1 A St', city: 'Norfolk', google_maps_link: 'https://maps.google.com/a', notes: '' },
      { name: 'Place B', address: '2 B St', city: 'Hampton', google_maps_link: 'https://maps.google.com/b', notes: '' }
    ];
    // Generate markdown with only the first location
    const markdown = generateMarkdown([locations[0]]);
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('fails when there is an extra row', () => {
    const locations = [
      { name: 'Place A', address: '1 A St', city: 'Norfolk', google_maps_link: 'https://maps.google.com/a', notes: '' }
    ];
    // Generate markdown with an extra location
    const markdown = generateMarkdown([
      ...locations,
      { name: 'Place B', address: '2 B St', city: 'Hampton', google_maps_link: 'https://maps.google.com/b', notes: '' }
    ]);
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('handles CRLF normalization', () => {
    const locations = [{
      name: 'Test',
      address: '123 Main St',
      city: 'Norfolk',
      google_maps_link: 'https://maps.google.com',
      notes: 'Test'
    }];
    const markdown = generateMarkdown(locations).replace(/\n/g, '\r\n');
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, true);
  });

  it('passes with empty locations', () => {
    const markdown = generateMarkdown([]);
    const result = validateMarkdownInSync([], markdown);
    assert.strictEqual(result.valid, true);
  });
});
