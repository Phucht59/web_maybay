# Travel image audit before Phase 2.1

Audit date: 2026-07-19

The implementation has 35 route-level primary usages but only 6 unique files. All six files have distinct SHA-256 values; duplication is caused by route mapping, not copied filenames. `travelInformationData.js` replaces every article image with its category image, so every article hero and every related card in the same category repeats the same source.

| Route | Image key before | File path | Usage type | Duplicate count |
| --- | --- | --- | --- | ---: |
| `/travel-information` | `travel-overview` | `travel-overview.webp` | overview hero | 1 |
| `/travel-information/baggage` | `baggage` | `baggage.webp` | category hero | 8 |
| `/travel-information/baggage/baggage-information` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/baggage/carry-on-baggage` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/baggage/checked-baggage` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/baggage/extra-baggage` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/baggage/special-baggage` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/baggage/restricted-baggage` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/baggage/baggage-issues` | `baggage` | `baggage.webp` | article hero/card | 8 |
| `/travel-information/check-in` | `check-in` | `check-in.webp` | category hero | 4 |
| `/travel-information/check-in/online-check-in` | `check-in` | `check-in.webp` | article hero/card | 4 |
| `/travel-information/check-in/kiosk-check-in` | `check-in` | `check-in.webp` | article hero/card | 4 |
| `/travel-information/check-in/airport-check-in` | `check-in` | `check-in.webp` | article hero/card | 4 |
| `/travel-information/airports` | `airports` | `airports.webp` | category hero | 6 |
| `/travel-information/airports/business-lounges` | `airports` | `airports.webp` | article hero/card | 6 |
| `/travel-information/airports/airport-priority-services` | `airports` | `airports.webp` | article hero/card | 6 |
| `/travel-information/airports/airport-information` | `airports` | `airports.webp` | article hero/card | 6 |
| `/travel-information/airports/connecting-services` | `airports` | `airports.webp` | article hero/card | 6 |
| `/travel-information/airports/airport-maps` | `airports` | `airports.webp` | article hero/card | 6 |
| `/travel-information/special-services` | `special-services` | `special-services.webp` | category hero | 11 |
| `/travel-information/special-services/pet-transport` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/special-meals` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/services-for-children` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/unaccompanied-minors` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/infant-separate-seat` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/reduced-mobility` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/pregnant-passengers` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/extra-seat` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/medical-clearance` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/special-services/special-service-fees` | `special-services` | `special-services.webp` | article hero/card | 11 |
| `/travel-information/travel-advice` | `travel-advice` | `travel-advice.webp` | category hero | 5 |
| `/travel-information/travel-advice/vietnam-domestic-flights` | `travel-advice` | `travel-advice.webp` | article hero/card | 5 |
| `/travel-information/travel-advice/flights-to-vietnam` | `travel-advice` | `travel-advice.webp` | article hero/card | 5 |
| `/travel-information/travel-advice/international-flights-from-vietnam` | `travel-advice` | `travel-advice.webp` | article hero/card | 5 |
| `/travel-information/travel-advice/smooth-journey-guide` | `travel-advice` | `travel-advice.webp` | article hero/card | 5 |

## Baseline summary

- Total route-level primary mappings: 35
- Total image keys effectively used: 6
- Unique files: 6
- Duplicate primary mappings: 29 excess mappings
- Duplicate SHA-256 groups: 0
- Category/article shared sources: 5 groups
- Articles using a shared category fallback: 29
- Article pages where hero can repeat in related cards: 29
