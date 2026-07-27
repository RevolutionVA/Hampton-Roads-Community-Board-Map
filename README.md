# Hampton Roads Community Board Map

Need to make a public posting to reach non-digital people? We have the list!

A community-maintained directory of physical bulletin boards in Hampton Roads, Virginia where you can post fliers, notices, and community announcements.

## View Locations

**[See all locations](LOCATIONS.md)**

## Cities Covered

- Norfolk
- Virginia Beach
- Chesapeake
- Suffolk
- Portsmouth
- Hampton
- Newport News

## Submit a Location

Know a spot with a community board? [Submit a new location](../../issues/new?template=new-location.yml) and we'll add it to the list!

When you submit, a pull request is automatically created for review.

## Contributing

The easiest way is the [submission form](../../issues/new?template=new-location.yml) above — no coding required.

Prefer a pull request? Each location is one small Markdown file, so adding a location means adding one file:

1. Fork this repository
2. Create `data/locations/<city>/<location-name>.md` (kebab-case, e.g. `data/locations/norfolk/ocean-view-library.md`)
3. Submit a pull request

That's it — `LOCATIONS.md` is auto-generated, so don't edit it by hand. You can optionally run `npm test` and `npm run validate` locally, but CI checks everything for you.

## Data Format

Each location file looks like this:

```markdown
---
name: Ocean View Library
address: 123 Main St, Norfolk, VA 23510
google_maps_link: https://maps.google.com/...
---

Where to find the board, any restrictions or tips.
```

The city comes from the folder name (`norfolk`, `virginia-beach`, `newport-news`, ...). The section below the `---` lines is free-form notes and is optional.

## License

This data is public domain. Use it however you like.
