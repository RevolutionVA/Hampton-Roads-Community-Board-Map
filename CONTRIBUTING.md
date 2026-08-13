# Contributing a Location

The easiest option is the repository's **Submit New Location** issue form. You can also open a pull request:

1. Copy `data/locations/_TEMPLATE.md` into the matching city folder and give it a kebab-case filename.
2. Replace the example values and retain the human-readable note below the frontmatter.
3. Run `npm test`, `npm run generate`, and `npm run validate`.
4. Commit the location file and any generated README update, then open a pull request.

## Schema

Required fields:

- `name`: business or place name.
- `address`: complete known address. Do not invent omitted details.
- `city`: one of Chesapeake, Hampton, Newport News, Norfolk, Portsmouth, Suffolk, or Virginia Beach; it must match the city folder.
- `area`: the slug from the repository's matching `area:*` label.
- `category`: `coffee-shop`, `restaurant`, `library`, `community-center`, `convenience-store`, or `other`.
- `status`: `needs-verification` or `verified`.

Optional fields:

- `google_maps_link`: an HTTPS map URL.
- `lat` and `lng`: real geocoded coordinates; include both or omit both.
- `board_type`: `window`, `bulletin-board`, `magnetic`, or `other`.
- `verified_date`: the date of an actual in-person verification in `YYYY-MM-DD` format.

Verification is a human step. New entries default to `status: needs-verification`; automation must not mark a board `verified` or add `verified_date`. A person may set those fields only after confirming the board in person. Omit unknown optional fields rather than using empty strings or `null`.
