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

1. Fork this repository
2. Add locations to `data/locations.json`
3. Update `LOCATIONS.md` with matching table rows
4. Run `npm test` to validate
5. Submit a pull request

## Data Format

Each location in `data/locations.json`:

```json
{
  "name": "Location Name",
  "address": "Full address with ZIP",
  "city": "Norfolk",
  "google_maps_link": "https://maps.google.com/...",
  "notes": "Where to find the board"
}
```

## License

This data is public domain. Use it however you like.
