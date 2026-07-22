# Travel information image sources

All 35 primary visuals in this directory were created specifically for this project. They contain no airline logo, brand mark, flag, readable sign, watermark, or third-party hotlink.

## Asset set

| Group | Count | Format | Source and treatment |
| --- | ---: | --- | --- |
| Overview | 1 | WebP | Generated with OpenAI's built-in image generation tool for Phase 2 |
| Category heroes | 5 | WebP | Generated with OpenAI's built-in image generation tool for Phase 2 |
| Article photography | 12 | WebP | Newly generated with OpenAI's built-in image generation tool for Phase 2.1 |
| Article illustrations | 17 | SVG | Original, route-specific vector diagrams authored for Phase 2.1 |

The 18 generated photographs use a premium natural editorial direction, controlled visual variety, soft daylight, and a deep-teal/sea-glass/warm-sand palette. The Phase 2.1 prompt template specified a unique route subject and composition, a 3:2 responsive source, and prohibited logos, brands, flags, readable text, watermarks, and crop-based variants. PNG generation outputs were converted locally to 1440 × 960 WebP at quality 76. Every optimized file is below 190 KB.

The 17 SVGs use distinct compositions suited to their route: luggage tags and restrictions, kiosk steps, priority lanes, airport directories/maps/connections, meal and child services, seating, medical clearance, fees, international departure, and journey planning. They are application-native illustrations rather than copies or renamed variants of a shared base image.

All 35 files are registered centrally in `src/features/travel-information/data/travelImageRegistry.js`. `npm run audit:travel-images` verifies file hashes, source mappings, route mappings, alt text, and missing assets.
