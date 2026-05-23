# `market-service`

Real-time market data aggregation service for the ATRA platform.  
Aggregates Binance market data and exposes it via a REST API and a WebSocket feed.

---

## Contents

- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [REST API](#rest-api)
  - [GET /search](#get-search)
  - [GET /prices](#get-prices)
- [WebSocket API](#websocket-api)
- [Data Types](#data-types)
- [Running Tests](#running-tests)

---

## Environment Variables

| Variable              | Required | Default                             | Description                     |
|-----------------------|----------|-------------------------------------|---------------------------------|
| `BINANCE_BASE_URL`    | ✅       | `https://api.binance.com`           | Binance REST API base URL       |
| `BINANCE_WS_BASE_URL` | ✅       | `wss://stream.binance.com:9443/ws`  | Binance WebSocket stream URL    |
| `PRICE_TTL_MS`        | ❌       | `30000`                             | Price cache TTL in milliseconds |
| `PORT`                | ❌       | `3000`                              | HTTP server port                |

Copy `.env.example` to `.env` before running.

---

## Running Locally

```bash
cd apps/market-service
npm install
npm run build
npm start
```

The server starts on `PORT` (default `3000`).

---

## REST API

Base URL: `http://localhost:3000`

Error responses: `{ "error": "Human-readable message" }`

---

### GET /search

Search tradable symbols by name, base asset, or quote asset.

**Query Parameters**

| Parameter | Type   | Required | Description                         |
|-----------|--------|----------|-------------------------------------|
| `q`       | string | ✅       | Case-insensitive substring to match |

**Response `200`**
```json
[
  { "symbol": "BTCUSDT", "baseAsset": "BTC", "quoteAsset": "USDT" }
]
```

| Status | Condition                         |
|--------|-----------------------------------|
| `400`  | `q` parameter is missing or empty |

---

### GET /prices

Fetch current 24-hour ticker data for one or more symbols.

**Query Parameters**

| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| `symbols` | string | ✅       | Comma-separated list of symbols (case-insensitive) |

**Response `200`**
```json
[
  {
    "symbol": "BTCUSDT",
    "price": 43125.12,
    "changePercent24h": 2.5,
    "high24h": 43500.00,
    "low24h": 42000.00,
    "volume24h": 123456789.00,
    "ts": 1710000000
  }
]
```

| Status | Condition                               |
|--------|-----------------------------------------|
| `400`  | `symbols` parameter is missing or empty |
| `502`  | Upstream Binance request failed         |

---

## WebSocket API

Connect to `ws://localhost:3000`. All messages are JSON text frames.

### Subscribe
```json
{ "type": "subscribe", "symbols": ["BTCUSDT", "ETHUSDT"] }
```

### Unsubscribe
```json
{ "type": "unsubscribe", "symbols": ["ETHUSDT"] }
```

### Server push — `ticker`
```json
{
  "type": "ticker",
  "data": {
    "symbol": "BTCUSDT",
    "price": 43125.12,
    "changePercent24h": 2.5,
    "high24h": 43500.00,
    "low24h": 42000.00,
    "volume24h": 123456789.00,
    "ts": 1710000000
  }
}
```

---

## Data Types

```ts
type MarketTicker = {
  symbol: string
  price: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  ts: number             // Unix ms
}

type SymbolMeta = {
  symbol: string
  baseAsset: string
  quoteAsset: string
}
```

---

## Running Tests

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```
