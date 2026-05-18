// MARK: - Price Cache Interface

import type { CacheEntry } from '../types/index.js'

// MARK: Interface

export interface PriceCache {
  get(symbol: string): CacheEntry | null
  set(symbol: string, value: CacheEntry): void
  delete(symbol: string): void
  has(symbol: string): boolean
}
