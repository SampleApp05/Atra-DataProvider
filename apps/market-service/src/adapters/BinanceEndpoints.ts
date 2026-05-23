// MARK: - Binance REST Endpoints

export enum BinanceEndpoint {
  ExchangeInfo = '/api/v3/exchangeInfo',
  Ticker24hr = '/api/v3/ticker/24hr',
}

// MARK: - Binance WebSocket Stream Helpers

export function buildTickerStream(symbol: string): string {
  return `${symbol.toLowerCase()}@ticker`
}
