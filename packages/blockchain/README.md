# `@atra/blockchain`

EVM blockchain utilities — balance queries, transaction helpers, and chain configuration.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned API

```ts
import { getBalance, getSupportedChains } from '@atra/blockchain'

const balance = await getBalance({ address: '0x...', chainId: 1, token: 'ETH' })
```

---

## Dependencies

| Package    | Role                              |
|------------|-----------------------------------|
| `ethers`   | EVM provider + contract interface |
| `viem`     | Lightweight alternative (TBD)     |
