// MARK: - SymbolCatalogService Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SymbolCatalogService } from '../../src/services/SymbolCatalogService.js'
import type { BinanceRestAdapter } from '../../src/adapters/BinanceRestAdapter.js'
import type { SymbolMeta } from '../../src/types/index.js'

// MARK: - Fixtures

const symbols: SymbolMeta[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'ADABTC',  baseAsset: 'ADA', quoteAsset: 'BTC'  },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
]

function makeAdapter(): BinanceRestAdapter {
  return {
    fetchExchangeInfo: vi.fn().mockResolvedValue(symbols),
    fetchTicker: vi.fn(),
  } as unknown as BinanceRestAdapter
}

// MARK: - Tests

describe('SymbolCatalogService', () => {
  let adapter: BinanceRestAdapter
  let service: SymbolCatalogService

  beforeEach(async () => {
    adapter = makeAdapter()
    service = new SymbolCatalogService(adapter)
    await service.initialize()
  })

  // MARK: initialize

  describe('initialize', () => {
    it('calls fetchExchangeInfo on startup', () => {
      expect(adapter.fetchExchangeInfo).toHaveBeenCalledOnce()
    })

    it('loads all symbols returned by the adapter', () => {
      expect(service.getAll()).toHaveLength(symbols.length)
    })
  })

  // MARK: search

  describe('search', () => {
    it('returns symbols whose symbol field contains the query (case-insensitive)', () => {
      const results = service.search('btc')
      const found = results.map((s) => s.symbol)
      // BTCUSDT and ADABTC both contain "BTC"
      expect(found).toContain('BTCUSDT')
      expect(found).toContain('ADABTC')
    })

    it('matches against baseAsset', () => {
      const results = service.search('eth')
      expect(results.map((s) => s.symbol)).toContain('ETHUSDT')
    })

    it('matches against quoteAsset', () => {
      // All four symbols have USDT or BTC as quote — query "BTC" as quote should hit ADABTC
      const results = service.search('BTC')
      expect(results.map((s) => s.symbol)).toContain('ADABTC')
    })

    it('is case-insensitive', () => {
      const lower = service.search('sol')
      const upper = service.search('SOL')
      expect(lower).toEqual(upper)
    })

    it('returns an empty array when there are no matches', () => {
      const results = service.search('ZZZNOMATCH')
      expect(results).toHaveLength(0)
    })

    it('returns all symbols when query matches all of them (e.g. USDT)', () => {
      // BTCUSDT, ETHUSDT, SOLUSDT have USDT; ADABTC does not
      const results = service.search('USDT')
      expect(results).toHaveLength(3)
    })
  })

  // MARK: getAll

  describe('getAll', () => {
    it('returns the full list of loaded symbols', () => {
      expect(service.getAll()).toEqual(symbols)
    })
  })
})
