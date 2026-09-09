# Throughline UI spec

Use this before you change `app/` files.

## Point of view

Throughline is a field desk, not a SaaS marketing page. The surface should feel like a lockbox operations ledger: warm umber, oxide orange, bone type, hard edges, monospace figures.

Do not bring back navy/gold/teal luxury, Fraunces display type, glass headers, pill nav, orb gradients, or lifted rounded cards.

## Layout

- Dark umber background. Oxide orange for links, active nav, and chart fills. Olive for Active / High / available.
- Max width 80rem. Header nav: Market, Conversions, Demand, Listings, Boxes. Active route is an underline, not a pill.
- Footer may link to Workshop. Do not add Workshop to the main nav.
- Panels are square, 1px rules, no drop shadow.
- KPI cards use a 3px oxide left rule.
- Back links use `.back-link` and include a left arrow. Listing detail returns to the page that opened it: Market, Listings, or Boxes.

## Type

- UI and headings use the self-hosted sans face (DM Sans). Do not pair it with a display serif.
- Kickers, serials, rates, prices, and table figures use monospace.
- Page titles stay in the 1.6 to 2.15rem range. Section titles stay near 1.15rem.

## Component states

- Status badges: Active, Pending, Sold, Withdrawn. Keep those four words.
- Watchlist cards show address, metro, showing count, offer count, demand, and a health line. A lockbox state chip is allowed.
- Active only is a checkbox on Listings. Sold rows must not remain when it is on.
- Search empty state: "No listings match this search."
- Sort control text must match the order of the Days to offer column.
- Demand table rank 1 is the hottest ZIP. Map intensity in that row should match (High for rank 1). Clicking a row opens a detail panel above the table.
- Anonymous peer set must not show street addresses or MLS numbers.
- Each listing has a lockbox. Auto-lock follows listing status. Quiet hours and manual shutoff live on the listing.
- Market “What’s here” shows open vs locked boxes and links to Boxes. Watchlist may show serial plus a live lock chip.
- Conversions keeps the three rate cards and N-showing chart. A “When the box should lock” strip sits with the rates.
- Demand keeps ZIP rank, map intensity from score, and High / Medium / Low chip thresholds. Table rows and map dots select the same ZIP. City chips filter both. A Boxes by city strip sits below the table and map.
- Listings table includes a Box column (serial + live lock chip). Empty state colspan is 7. Five-digit ZIP search still returns no rows.
- Listing detail order: header (status, lock chip, serial) → KPIs → Showings and offers | Similar listings → lockbox controls → anonymous peers.

## What not to change

- Do not restyle the product to a light theme.
- Do not add authentication.
- Do not add a live SentriLock or lockbox API.
- Do not rename Throughline.
