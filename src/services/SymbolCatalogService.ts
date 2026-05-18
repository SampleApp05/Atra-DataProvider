// MARK: - Symbol Catalog Service

import type { SymbolMeta } from '../types/index.js'
import type { BinanceRestAdapter } from '../adapters/BinanceRestAdapter.js'

// MARK: - Service

export class SymbolCatalogService {
  // MARK: Private State

  private symbols: SymbolMeta[] = []
  private restAdapter: BinanceRestAdapter

  // MARK: Init

  constructor(restAdapter: BinanceRestAdapter) {
    this.restAdapter = restAdapter
  }

  // MARK: Public API

  /**
   * Must be called once on application startup.
   * Fetches all TRADING symbols from Binance and stores them in memory.
   */
  async initialize(): Promise<void> {
    this.symbols = await this.restAdapter.fetchExchangeInfo()
    console.log(`[SymbolCatalogService] Loaded ${this.symbols.length} symbols.`)
  }

  /**
   * Case-insensitive substring search across symbol, baseAsset, and quoteAsset.
   */
  search(query: string): SymbolMeta[] {
    const q = query.toUpperCase()
    return this.symbols.filter(
      (s) =>
        s.symbol.includes(q) ||
        s.baseAsset.toUpperCase().includes(q) ||
        s.quoteAsset.toUpperCase().includes(q)
    )
  }

  /**
   * Returns all loaded symbols.
   */
  getAll(): SymbolMeta[] {
    return this.symbols
  }
}
