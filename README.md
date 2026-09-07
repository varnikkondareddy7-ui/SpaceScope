# SpaceScope V10.6

Image-only repair using verified Tiangong and NASA Bennu URLs. Everything else is unchanged.

# SpaceScope V10.5

Image-only repair: Tiangong and asteroid/Bennu images replaced with verified direct Wikimedia file URLs. Everything else remains unchanged from V10.4.

# SpaceScope V10.4

Compare-page cache-proof fix plus asteroid image repair. Everything else remains based on V10.3.

# SpaceScope V10.3

Compare-page-only update. Everything else from V10.2 is unchanged.

# SpaceScope V10.2

Fixes the two remaining unstyled pages: the homepage and mission profile pages. The homepage template now matches its CSS, and mission profiles now use a fully styled hero, gallery, facts, engineering, anatomy, instruments, and timeline layout.

# SpaceScope V10.1

Homepage-only repair for V10. Adds the missing homepage visual styles while leaving the rest of V10 unchanged.

# SpaceScope V10

V10 restores a polished panel/card visual system across every page, fixes raw browser-default Explore/Live controls, replaces the confusing How It Works section with Spacecraft Systems, and swaps the broken Earth/Moon imagery with stable public image sources.

# SpaceScope V9

V9 is a simplification pass after V8 became over-designed. It fixes the stuck orbital modal, removes overlapping image/text layouts, uses real planet imagery, simplifies navigation, reduces visual patterns, and rewrites How Spacecraft Work around six clear engineering problems.

# SpaceScope V8

V8 is a full dark, image-heavy redesign. It simplifies the product around Explore, Live, Missions, Where Is Everything, How Spacecraft Work, Compare, Records, Timeline, and Signal Delay. The homepage, mission pages, system guide, and supporting pages were all reformatted to use a consistent cinematic space visual system.

# SpaceScope V7

V7 turns SpaceScope into a broader interactive space product. It adds SpaceScope Live, Where Is Everything, Space Records, a global mission timeline, richer comparison, mission galleries, mission anatomy, record/firsts sections, a renamed How Spacecraft Work experience, stronger navigation, and a richer NASA-inspired editorial homepage.

# SpaceScope V6

NASA-inspired editorial redesign. Main 3D atlas now uses only official NASA Eyes embeds, including the documented ISS current-position view.

# SpaceScope V5

V5 rebuilds Explore as a ten-view interactive atlas using NASA Eyes and official Orbital Radar embeds. The object database tab now defaults to smaller satellite groups and uses explicit tab handling so the live catalog button responds reliably. Loaded orbital rows open a detail modal.

# SpaceScope V4

V4 replaces the custom primary 3D scene with a professional multi-map hub using official embeddable NASA Eyes experiences and official Orbital Radar widgets. It also makes live catalog rows clickable and extends CelesTrak caching to two hours to follow current source limits.

# SpaceScope V3.2

V3.2 fixes browser module resolution for Three.js OrbitControls using an import map. It also adds a visible timeout error if the CDN does not load.

# SpaceScope V3.1

V3.1 fixes the black 3D viewer by switching Three.js and OrbitControls to modern ES module imports.


# SpaceScope V3

SpaceScope V3 fixes the two major architecture problems in the earlier version.

## 1. The 3D view now includes human-made technology

The app no longer relies on Solar System Scope as the main explorer.

`/explore` uses Three.js to render:

- Sun
- Mercury
- Venus
- Earth
- Moon
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Curated spacecraft markers around their destinations
- Deep-space probes
- Live Earth-orbit satellite clouds from CelesTrak

The Earth satellite cloud is generated from orbital elements supplied by CelesTrak and propagated in the browser with a lightweight Kepler approximation.

## 2. The database is no longer a tiny hand-written list

SpaceScope now separates data into two layers.

### Live orbital catalog

The backend requests CelesTrak GP JSON for groups such as:

- active satellites
- stations
- weather
- science
- Starlink
- OneWeb
- GPS
- Galileo
- BeiDou
- GLONASS
- CubeSats

This avoids manually storing thousands of changing orbital objects.

### Deep spacecraft profiles

`app/data/objects.json` stores richer profiles for major spacecraft operating around Earth and across the solar system.

Each profile includes:

- operator
- manufacturer
- mass
- power
- propulsion
- communications
- instruments
- technology
- mission timeline

## Technology taxonomy

`app/data/technology_taxonomy.json` contains a broad taxonomy covering:

- propulsion
- power
- communications
- navigation and control
- robotics
- imaging
- spectroscopy
- remote sensing
- space environment sensing
- thermal systems
- structures and materials
- human spaceflight
- science instruments
- entry/descent/landing
- computing and autonomy

## Run

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Open:

http://127.0.0.1:8000

## Important

Live CelesTrak features require an internet connection when the app is running.

The app is architected so the Earth-orbit catalog comes from a live catalog instead of being frozen inside the repository.
