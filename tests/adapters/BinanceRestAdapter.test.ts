// MARK: - BinanceRestAdapter Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { BinanceRestAdapter } from '../../src/adapters/BinanceRestAdapter.js'

// MARK: - Mocks

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// MARK: - Fixtures

const rawExchangeInfo = {
  data: {
    symbols: [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING' },
      { symbol: 'XYZUSDT', baseAsset: 'XYZ', quoteAsset: 'USDT', status: 'BREAK' },
    ],
  },
}

const rawTicker = {
  data: {
    symbol: 'BTCUSDT',
    lastPrice: '43125.12',
    priceChangePercent: '2.5',
    highPrice: '43500',
    lowPrice: '42000',
    quoteVolume: '123456789',
    closeTime: 1710000000,
  },
}

// MARK: - Tests

describe('BinanceRestAdapter', () => {
  let adapter: BinanceRestAdapter

  beforeEach(() => {
    adapter = new BinanceRestAdapter()
    vi.clearAllMocks()
  })

  // MARK: fetchExchangeInfo

  describe('fetchExchangeInfo', () => {
    it('returns only TRADING symbols normalized to SymbolMeta', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(rawExchangeInfo)

      const result = await adapter.fetchExchangeInfo()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' })
      expect(result[1]).toEqual({ symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' })
    })

    it('filters out non-TRADING symbols', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(rawExchangeInfo)

      const result = await adapter.fetchExchangeInfo()

      const symbols = result.map((s) => s.symbol)
      expect(symbols).not.toContain('XYZUSDT')
    })

    it('returns an empty array when all symbols are non-TRADING', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: {
          symbols: [
            { symbol: 'AAUSDT', baseAsset: 'AA', quoteAsset: 'USDT', status: 'BREAK' },
          ],
        },
      })

      const result = await adapter.fetchExchangeInfo()
      expect(result).toHaveLength(0)
    })
  })

  // MARK: fetchTicker

  describe('fetchTicker', () => {
    it('returns a normalized MarketTicker', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(rawTicker)

      const result = await adapter.fetchTicker('BTCUSDT')

      expect(result).toEqual({
        symbol: 'BTCUSDT',
        price: 43125.12,
        changePercent24h: 2.5,
        high24h: 43500,
        low24h: 42000,
        volume24h: 123456789,
        ts: 1710000000,
      })
    })

    it('uppercases the symbol before sending the request', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(rawTicker)

      await adapter.fetchTicker('btcusdt')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params: { symbol: 'BTCUSDT' } })
      )
    })

    it('parses all numeric fields from strings to numbers', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(rawTicker)

      const result = await adapter.fetchTicker('BTCUSDT')

      expect(typeof result.price).toBe('number')
      expect(typeof result.changePercent24h).toBe('number')
      expect(typeof result.high24h).toBe('number')
      expect(typeof result.low24h).toBe('number')
      expect(typeof result.volume24h).toBe('number')
    })
  })
})
