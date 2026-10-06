# Brand and Theme Abstraction

## CURRENT IMPLEMENTED STATE

### Brand

`packages/brand` owns product identity, the shared logo and mark components, favicon/app artwork, canonical brand configuration, and the boundary for future production logo asset replacement.

`BrandLogo` and `BrandMark` callers never reconstruct the logo or depend on physical asset paths. Marketing taglines are not part of logo identity. The current `BrandLogo` text composition is a temporary fallback only; final production full-logo light and dark assets are still pending. Brand reference boards are documentation/reference material, not runtime assets.

### Theme

`packages/theme` owns brand primitives, semantic UI tokens, light and dark mappings, and visualization/status tokens. Temporary legacy compatibility tokens are isolated there as explicit debt.

### Components

Product components consume semantic tokens. They do not know raw theme colors or physical logo asset paths. A future theme update changes shared theme mappings rather than product components.

## APPROVED FUTURE STATE

- A production logo update replaces or updates `packages/brand` internals/assets; callers do not change.
- Final production full-logo light and dark assets replace the temporary text-composition fallback.

These boundaries do not authorize asset integration without a separately approved milestone.

## EXPLORATORY / DEFERRED

- Runtime white-label or multi-brand behavior is not implemented.
- School-specific theming is future only.
