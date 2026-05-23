# `@atra/shared-types`

Shared TypeScript type definitions used across all ATRA apps and packages.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Exports

```ts
// Wallet / Account
export type { Account, Wallet, WalletRole }

// Auth
export type { JWTPayload, SessionRecord }

// Market
export type { Ticker, OHLCV, OrderBookEntry, Trade }

// Common
export type { PaginatedResponse, CursorPage, ApiError }
```

All types are pure TypeScript — no runtime code. This package compiles to `.d.ts` only.
