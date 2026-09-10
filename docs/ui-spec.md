# Throughline UI spec

Use this before you change `app/` files.

## Point of view

Throughline is a lockbox status desk for a sample market of 50,000 listings. Light theme. Navy header, blue accents, turquoise for available / on track. Product name is **Throughline**.

Do not restyle the whole app. Do not invent a new look.

## Layout

- Max width 80rem. Header nav: Market, Conversions, Demand, Listings, Boxes. Active route is an underline.
- Footer may link to Workshop. Do not add Workshop to the main nav.
- Panels and KPI cards are white with a light border. KPI cards use a 3px blue top rule.
- Back links use `.back-link` and include a left arrow. Listing detail returns to the page that opened it: Market, Listings, or Boxes.

## Type

- System UI sans. Do not add a display serif or Google Fonts.
- Numbers may use tabular figures. Kickers are small gray labels, not monospace.

## Component states

- Status badges: Active, Pending, Sold, Withdrawn. Keep those four words.
- Watchlist cards show address, metro, showing count, offer count, demand, and a health line. A lockbox state chip is allowed.
- Active only is a checkbox on Listings. Sold rows must not remain when it is on.
- Search empty state: "No listings match this search."
- Sort control text must match the order of the Days to offer column.
- Demand table rank 1 is the hottest ZIP. Map intensity in that row should match (High for rank 1). Clicking a row opens a detail panel above the table.
- Anonymous peer set must not show street addresses or MLS numbers.
- Each listing has a lockbox. Auto-lock follows listing status. Quiet hours and manual shutoff live on the listing.
- Market “What’s here” shows listings, open boxes, and watchlist locked, and links to Boxes.
- Conversions keeps the three rate cards and N-showing chart. A “When the box should lock” strip sits with the rates.
- Demand keeps ZIP rank, map intensity from score, and High / Medium / Low thresholds. Table rows and map dots select the same ZIP. City chips should filter both.
- Listings table includes a Box column (serial + live lock chip). Empty state colspan is 7.
- Listing detail order: header (status, lock chip, serial) → KPIs → Showings and offers | Similar listings → lockbox controls → anonymous peers.

## What not to change

- Do not restyle the product.
- Do not add authentication.
- Do not add a live lockbox API.
- Do not rename Throughline.
