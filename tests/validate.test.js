const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { validateLocations, validateMarkdownInSync, VALID_CITIES } = require('../scripts/validate');

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

describe('validateMarkdownInSync', () => {
  it('passes when all locations are in markdown', () => {
    const locations = [
      { name: 'Library A' },
      { name: 'Library B' }
    ];
    const markdown = '| Library A | ... |\n| Library B | ... |';
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.missing.length, 0);
  });

  it('fails when location is missing from markdown', () => {
    const locations = [
      { name: 'Library A' },
      { name: 'Library B' }
    ];
    const markdown = '| Library A | ... |';
    const result = validateMarkdownInSync(locations, markdown);
    assert.strictEqual(result.valid, false);
    assert.ok(result.missing.includes('Library B'));
  });

  it('passes with empty locations', () => {
    const result = validateMarkdownInSync([], '# Locations');
    assert.strictEqual(result.valid, true);
  });
});
