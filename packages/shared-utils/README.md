# `@atra/shared-utils`

General-purpose utility functions shared across all ATRA services.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Exports

```ts
// Pagination
export { buildCursor, parseCursor } from '@atra/shared-utils/pagination'

// Crypto / Address
export { normalizeAddress, isValidEthAddress } from '@atra/shared-utils/address'

// Time
export { msFromDuration } from '@atra/shared-utils/time'

// Response helpers
export { ok, fail } from '@atra/shared-utils/response'
```

No external runtime dependencies — pure utility code only.
