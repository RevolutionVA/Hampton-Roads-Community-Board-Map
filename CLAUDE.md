# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hampton Roads Community Board Map - A resource for locating physical community bulletin boards for public postings in the Hampton Roads, Virginia area. The goal is to help reach people who may not be digitally connected.

## Data Structure

Locations are stored in `data/locations.json` as an array of objects:

```json
{
  "name": "Location Name",
  "address": "Full address with ZIP",
  "city": "Norfolk|Virginia Beach|Chesapeake|Suffolk|Portsmouth|Hampton|Newport News",
  "google_maps_link": "https://maps.google.com/...",
  "notes": "Where to find the board"
}
```

## Commands

```bash
npm test        # Run validation tests
npm run validate  # Validate locations.json and LOCATIONS.md
```

## Files

- `data/locations.json` - Source data for all locations
- `LOCATIONS.md` - Human-readable table view of all locations
- `scripts/validate.js` - Validation logic (used by tests and CI)
- `tests/validate.test.js` - Test suite for validation
- `tests/fixtures/` - Test data files

## GitHub Actions

### Issue to PR (`issue-to-pr.yml`)
Triggers when an issue with "new-location" label is opened/edited:
1. Parses form fields from issue body
2. Validates required fields and city name
3. Adds entry to `locations.json` (sorted by city, then name)
4. Regenerates `LOCATIONS.md` table
5. Creates PR linking to the issue
6. Comments on issue with PR link

### Validation (`validate-locations.yml`)
Runs on PRs that modify location files or tests:
- Runs test suite (`npm test`)
- Validates `locations.json` and `LOCATIONS.md` (`npm run validate`)
