# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hampton Roads Community Board Map - A resource for locating physical community bulletin boards for public postings in the Hampton Roads, Virginia area. The goal is to help reach people who may not be digitally connected.

## Data Structure

Each location is one Markdown file at `data/locations/<city-slug>/<location-slug>.md`. City slugs are the kebab-cased city names: `norfolk`, `virginia-beach`, `chesapeake`, `suffolk`, `portsmouth`, `hampton`, `newport-news`. The city is derived from the folder — there is no `city` field in the file.

```markdown
---
name: Location Name
address: Full address with ZIP
google_maps_link: https://maps.google.com/...
---

Free-form notes: where to find the board, restrictions, tips. Optional.
```

Frontmatter is flat `key: value` pairs parsed by `scripts/locations.js` (no YAML library). `name`, `address`, and `google_maps_link` are required; anything else is rejected.

## Commands

```bash
npm test        # Run validation tests
npm run validate  # Validate locations.json and LOCATIONS.md
```

## Files

- `data/locations/` - Source data: one Markdown file per location, in city folders
- `LOCATIONS.md` - Auto-generated table view of all locations (never edit by hand)
- `scripts/locations.js` - Shared core: city slugs, frontmatter parser/serializer, file walker/loader
- `scripts/generate-markdown.js` - Generates LOCATIONS.md from the location files
- `scripts/validate.js` - Validation logic (used by tests and CI)
- `tests/validate.test.js` - Test suite for validation
- `tests/fixtures/` - Test data trees (valid-tree, invalid-tree)

## GitHub Actions

### Issue to PR (`issue-to-pr.yml`)
Triggers when an issue with "new-location" label is opened/edited:
1. Parses form fields from issue body
2. Validates required fields and city name
3. Writes a new file `data/locations/<city-slug>/<name-slug>.md` (fails politely if it already exists)
4. Regenerates `LOCATIONS.md` table
5. Creates PR linking to the issue (or force-updates the existing PR branch on issue edits)
6. Comments on issue with PR link

### Validation (`validate-locations.yml`)
Runs on PRs that modify location files or tests:
- Runs test suite (`npm test`)
- Validates `data/locations/` and `LOCATIONS.md` sync (`npm run validate`)
