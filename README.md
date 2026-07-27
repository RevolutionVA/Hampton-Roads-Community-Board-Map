# Hampton Roads Community Board Map

Need to make a public posting to reach non-digital people? We have the list!

A community-maintained directory of physical bulletin boards in Hampton Roads, Virginia where you can post fliers, notices, and community announcements.

## Locations

<!-- locations:start -->

<!-- This table is auto-generated from data/locations/ - do not edit by hand. -->

| City | Name | Address | Map | Notes |
|------|------|---------|-----|-------|
| Norfolk | [Ten Top](data/locations/norfolk/ten-top.md) | 748 Shirley Ave, Norfolk, VA 23517 | [Map](https://maps.app.goo.gl/BBA84eUKjnMxXxVb8) | Allows fliers in the windows (Ghent area) |
| Virginia Beach | [Kempsville Area Library](data/locations/virginia-beach/kempsville-area-library.md) | 832 Kempsville Rd, Virginia Beach, VA 23464 | [Map](https://maps.app.goo.gl/gQYfn8BtAkZVJSpx7) | Enter through the front door. The librarian will post flyers on the community bulletin board as long as there is a date and location listed. |
| Virginia Beach | [Regent University Library](data/locations/virginia-beach/regent-university-library.md) | 1000 Regent University Dr, Virginia Beach, VA 23464 | [Map](https://maps.app.goo.gl/TwiJYZZQB5h4mrLG6) | Parking is in the rear of the building. Enter through the front door. Walk in and ring the bell for access. Guest Services will check your ID and direct you to the left, where Print Card Services is located. Staff will accept 7 flyers and post them around campus. |
| Virginia Beach | [Town Center Coldpressed](data/locations/virginia-beach/town-center-coldpressed.md) | 168 Central Park Ave, Virginia Beach, VA 23462 | [Map](https://maps.app.goo.gl/QPpKZYKL4CdyJpCp8) | There is a section inside the door with flyers and notices.  It's requested to contact `joe.trask@tccp.cafe` before putting material there. |

<!-- locations:end -->

Covering Norfolk, Virginia Beach, Chesapeake, Suffolk, Portsmouth, Hampton, and Newport News.

## Submit a Location

Know a spot with a community board? [Submit a new location](../../issues/new?template=new-location.yml) and we'll add it to the list!

When you submit, a pull request is automatically created for review.

## Contributing

The easiest way is the [submission form](../../issues/new?template=new-location.yml) above — no coding required.

Prefer a pull request? Each location is one small Markdown file, so adding a location means adding one file:

1. Fork this repository
2. Create `data/locations/<city>/<location-name>.md` (kebab-case, e.g. `data/locations/norfolk/ocean-view-library.md`)
3. Submit a pull request

That's it — the locations table above is auto-generated, so don't edit it by hand. You can optionally run `npm test` and `npm run validate` locally, but CI checks everything for you.

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
