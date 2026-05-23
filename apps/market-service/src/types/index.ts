// MARK: - Shared Types

// MARK: Primitives

export type Symbol = string

// MARK: Market Data

export type MarketTicker = {
  symbol: Symbol
  price: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  ts: number
}

// MARK: Cache

export type CacheEntry = {
  ticker: MarketTicker
  updatedAt: number
}

// MARK: Symbol Metadata

export type SymbolMeta = {
  symbol: string
  baseAsset: string
  quoteAsset: string
}
