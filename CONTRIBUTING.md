# Contributing a Location

The easiest option is the repository's **Submit New Location** issue form. You can also open a pull request:

1. Check the existing files in `data/locations/` and open issues before planning a visit or adding a location. Records with `status: no-board` are kept there but omitted from the README table.
2. For a new location, copy `data/locations/_TEMPLATE.md` into the matching city folder and give it a kebab-case filename. Update the existing file when reporting a change at the same location.
3. Replace the example values and retain the human-readable note below the frontmatter.
4. Run `npm test`, `npm run generate`, and `npm run validate`.
5. Commit the location file and any generated README update, then open a pull request.

## Schema

Required fields:

- `name`: business or place name.
- `address`: complete known address. Do not invent omitted details.
- `city`: one of Chesapeake, Hampton, Newport News, Norfolk, Portsmouth, Suffolk, or Virginia Beach; it must match the city folder.
- `area`: the slug from the repository's matching `area:*` label.
- `category`: `coffee-shop`, `restaurant`, `library`, `community-center`, `convenience-store`, or `other`.
- `status`: `needs-verification`, `verified`, or `no-board`.

Optional fields:

- `google_maps_link`: an HTTPS Google Maps URL on `google.com` or `maps.app.goo.gl`.
- `lat` and `lng`: real geocoded coordinates; include both or omit both.
- `board_type`: `window`, `bulletin-board`, `magnetic`, or `other`.
- `verified_date`: the date of an actual in-person verification in `YYYY-MM-DD` format, including a visit that confirmed no board. Omit it if the visit date is unknown; do not substitute the issue or PR date.

Omit unknown optional fields rather than using empty strings or `null`.

## Verification outcomes

- `needs-verification`: a candidate or researched lead awaiting reviewed confirmation. General online research alone does not establish an available posting location.
- `verified`: an available community posting location confirmed through a reviewed in-person report or direct staff confirmation. State the evidence basis and confirmation date in the notes; staff confirmation does not imply an in-person visit.
- `no-board`: no public community bulletin board exists at this location, confirmed either in person or directly by the location's staff. Retain the location file so contributors can avoid repeating the same visit or outreach; it is excluded from the README table. State the evidence basis explicitly in the notes.

Verification is a human step. Automated issue intake always creates `status: needs-verification`, without `verified_date`, even if a submission includes a claimed status or date. A person must review the report or direct staff confirmation before setting `verified` or `no-board`. Keep the evidence method and date explicit in the notes. `verified_date` remains reserved for an actual in-person visit; omit it for staff-only confirmation.

For a no-board finding, update the existing record (or add one if the location only exists as an issue), describe the finding and whether it came from an in-person visit or direct staff confirmation in the notes, and link the report when available. Omit `board_type` when there is no board. For staff-only confirmation, record its date and method in the notes and omit `verified_date`; that field is reserved for an actual visit. For example, after an actual visit on the date shown:

```yaml
status: no-board
verified_date: 2026-08-25
```

Keep the record rather than deleting it or creating a second entry. If a later reviewed in-person report or direct staff confirmation establishes that a board is now available, update that same record to `verified` and explain the change and evidence basis in the notes. Record `verified_date` only for a known actual visit. Do not infer a new outcome from silence, an old report, or general online research. A direct, current staff statement that there is no public board can support a reviewed `no-board` record; it must remain clearly distinguished from a visit.
