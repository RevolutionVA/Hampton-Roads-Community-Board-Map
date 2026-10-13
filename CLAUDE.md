# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hampton Roads Community Board Map - A resource for locating physical community bulletin boards for public postings in the Hampton Roads, Virginia area. The goal is to help reach people who may not be digitally connected.

## Data Structure

Each location is one Markdown file at `data/locations/<city-slug>/<location-slug>.md`. City slugs are the kebab-cased city names: `norfolk`, `virginia-beach`, `chesapeake`, `suffolk`, `portsmouth`, `hampton`, `newport-news`. The required `city` field must match the folder.

```markdown
---
name: Location Name
address: Full address with ZIP
city: Norfolk
area: ghent
category: other
status: needs-verification
google_maps_link: https://maps.google.com/...
---

Free-form notes: where to find the board, restrictions, tips. Optional.
```

Frontmatter is flat `key: value` pairs parsed by `scripts/locations.js` (no YAML library). Required fields are `name`, `address`, `city`, `area`, `category`, and `status`. Optional fields are `google_maps_link`, `lat`, `lng`, `board_type`, and `verified_date`; other fields are rejected. See `CONTRIBUTING.md` for accepted values.

Status is `needs-verification`, `verified`, or `no-board`. Research and automated intake remain `needs-verification`. Only human in-person findings establish `verified`. A reviewed direct staff statement that no public board exists can also establish `no-board`; identify that evidence basis and its date in the notes, omit `verified_date` for staff-only confirmation, and never fabricate an outcome or visit date. Keep `no-board` records in the data and duplicate checks, but exclude them from the generated README table. Check existing records and issues before planning another visit. Update the same record if a later human visit changes the outcome.

## Commands

```bash
npm test          # Run validation tests
npm run validate  # Validate data/locations/ and the README table
npm run generate  # Regenerate the README locations table
```

## Files

- `data/locations/` - Source data: one Markdown file per location, in city folders
- `README.md` - Contains the locations table between `<!-- locations:start -->` / `<!-- locations:end -->` markers; that section is auto-generated (never edit it by hand)
- `scripts/locations.js` - Shared core: city slugs, frontmatter parser/serializer, file walker/loader
- `scripts/generate-readme.js` - Regenerates the README locations table from the location files
- `scripts/validate.js` - Validation logic (used by tests and CI)
- `tests/validate.test.js` - Test suite for validation
- `tests/fixtures/` - Test data trees (valid-tree, invalid-tree)

## GitHub Actions

### Issue to PR (`issue-to-pr.yml`)
Triggers when an issue with "new-location" label is opened/edited:
1. Parses form fields from issue body
2. Validates required fields and city name
3. Writes a new file `data/locations/<city-slug>/<name-slug>.md` with `status: needs-verification` and no visit date (fails politely if it already exists, including `no-board` records)
4. Regenerates the README locations table
5. Creates PR linking to the issue (or force-updates the existing PR branch on issue edits)
6. Comments on issue with PR link

### README check (`sync-readme.yml`)
Runs on PRs that modify location data, README, or its generator scripts. It regenerates the locations table in a read-only checkout and fails with a remediation command if the committed README is stale. It does not push into contributor branches, so it works safely for PRs from forks.

### Validation (`validate-locations.yml`)
Runs on PRs that modify location files, README, scripts, or tests:
- Runs test suite (`npm test`)
- Validates `data/locations/` and README table sync (`npm run validate`)

