// MARK: - InMemoryPriceCache Tests

import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryPriceCache } from '../../src/cache/InMemoryPriceCache.js'
import type { CacheEntry } from '../../src/types/index.js'

// MARK: - Helpers

function makeCacheEntry(symbol: string, updatedAt = Date.now()): CacheEntry {
  return {
    ticker: {
      symbol,
      price: 100,
      changePercent24h: 1.5,
      high24h: 110,
      low24h: 90,
      volume24h: 999,
      ts: updatedAt,
    },
    updatedAt,
  }
}

// MARK: - Tests

describe('InMemoryPriceCache', () => {
  let cache: InMemoryPriceCache

  beforeEach(() => {
    cache = new InMemoryPriceCache()
  })

  // MARK: get

  describe('get', () => {
    it('returns null for a symbol that has not been set', () => {
      const result = cache.get('BTCUSDT')
      expect(result).toBeNull()
    })

    it('returns the entry after it has been set', () => {
      const entry = makeCacheEntry('BTCUSDT')
      cache.set('BTCUSDT', entry)
      expect(cache.get('BTCUSDT')).toEqual(entry)
    })
  })

  // MARK: set

  describe('set', () => {
    it('overwrites an existing entry with a new one', () => {
      const first = makeCacheEntry('BTCUSDT', 1000)
      const second = makeCacheEntry('BTCUSDT', 2000)
      cache.set('BTCUSDT', first)
      cache.set('BTCUSDT', second)
      expect(cache.get('BTCUSDT')).toEqual(second)
    })

    it('stores multiple symbols independently', () => {
      const btc = makeCacheEntry('BTCUSDT')
      const eth = makeCacheEntry('ETHUSDT')
      cache.set('BTCUSDT', btc)
      cache.set('ETHUSDT', eth)
      expect(cache.get('BTCUSDT')).toEqual(btc)
      expect(cache.get('ETHUSDT')).toEqual(eth)
    })
  })

  // MARK: has

  describe('has', () => {
    it('returns false when the symbol is not in the cache', () => {
      expect(cache.has('BTCUSDT')).toBe(false)
    })

    it('returns true after a symbol has been set', () => {
      cache.set('BTCUSDT', makeCacheEntry('BTCUSDT'))
      expect(cache.has('BTCUSDT')).toBe(true)
    })
  })

  // MARK: delete

  describe('delete', () => {
    it('removes an existing entry', () => {
      cache.set('BTCUSDT', makeCacheEntry('BTCUSDT'))
      cache.delete('BTCUSDT')
      expect(cache.get('BTCUSDT')).toBeNull()
      expect(cache.has('BTCUSDT')).toBe(false)
    })

    it('does not throw when deleting a symbol that does not exist', () => {
      expect(() => cache.delete('NONEXISTENT')).not.toThrow()
    })
  })
})
