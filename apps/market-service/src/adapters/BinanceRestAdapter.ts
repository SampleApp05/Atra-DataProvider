// MARK: - Binance REST Adapter

import axios from 'axios'
import { Config } from '../config/index.js'
import { BinanceEndpoint } from './BinanceEndpoints.js'
import type { MarketTicker, SymbolMeta } from '../types/index.js'

// MARK: - Raw Binance Response Types

interface BinanceSymbolInfo {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}

interface BinanceExchangeInfoResponse {
  symbols: BinanceSymbolInfo[]
}

interface BinanceTicker24hr {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  quoteVolume: string
  closeTime: number
}

// MARK: - Normalization

function normalizeTicker(raw: BinanceTicker24hr): MarketTicker {
  return {
    symbol: raw.symbol,
    price: parseFloat(raw.lastPrice),
    changePercent24h: parseFloat(raw.priceChangePercent),
    high24h: parseFloat(raw.highPrice),
    low24h: parseFloat(raw.lowPrice),
    volume24h: parseFloat(raw.quoteVolume),
    ts: raw.closeTime,
  }
}

// MARK: - Adapter

export class BinanceRestAdapter {
  private readonly baseUrl = Config.binance.baseUrl

  // MARK: Exchange Info

  /**
   * Fetches all trading symbols from Binance exchangeInfo.
   * Only returns symbols with status TRADING.
   */
  async fetchExchangeInfo(): Promise<SymbolMeta[]> {
    const response = await axios.get<BinanceExchangeInfoResponse>(
      `${this.baseUrl}${BinanceEndpoint.ExchangeInfo}`
    )

    return response.data.symbols
      .filter((s) => s.status === 'TRADING')
      .map((s) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }))
  }

  // MARK: Ticker

  /**
   * Fetches the 24hr ticker for a single symbol.
   */
  async fetchTicker(symbol: string): Promise<MarketTicker> {
    const response = await axios.get<BinanceTicker24hr>(
      `${this.baseUrl}${BinanceEndpoint.Ticker24hr}`,
      { params: { symbol: symbol.toUpperCase() } }
    )

    return normalizeTicker(response.data)
  }
}
