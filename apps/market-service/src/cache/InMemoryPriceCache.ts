// MARK: - InMemory Price Cache

import type { CacheEntry } from '../types/index.js'
import type { PriceCache } from './PriceCache.js'

// MARK: Implementation

export class InMemoryPriceCache implements PriceCache {
  // MARK: Private State

  private store = new Map<string, CacheEntry>()

  // MARK: PriceCache

  get(symbol: string): CacheEntry | null {
    return this.store.get(symbol) ?? null
  }

  set(symbol: string, value: CacheEntry): void {
    this.store.set(symbol, value)
  }

  delete(symbol: string): void {
    this.store.delete(symbol)
  }

  has(symbol: string): boolean {
    return this.store.has(symbol)
  }
}
