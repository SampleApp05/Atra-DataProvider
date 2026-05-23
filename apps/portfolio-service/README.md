# `portfolio-service`

Tracks wallet holdings, calculates P&L, and aggregates portfolio value across chains.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Responsibilities

- Fetch and cache on-chain balances for linked wallets
- Aggregate portfolio value using prices from `market-service`
- Historical P&L snapshots
- Multi-chain support (EVM chains via `@atra/blockchain`)

---

## Dependencies

| Package            | Role                             |
|--------------------|----------------------------------|
| `@atra/database`   | Shared schema + DB client        |
| `@atra/blockchain` | On-chain balance queries         |
| `@atra/logger`     | Structured logging               |
