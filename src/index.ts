// MARK: - Application Entry Point

import { BinanceRestAdapter, BinanceWsAdapter } from './adapters/index.js'
import { InMemoryPriceCache } from './cache/index.js'
import { PriceService, SymbolCatalogService, MarketStreamManager } from './services/index.js'
import { createServer } from './rest/index.js'
import { WebSocketGateway } from './ws/index.js'

// MARK: - Bootstrap

async function bootstrap() {
  // Adapters
  const restAdapter = new BinanceRestAdapter()
  const wsAdapter = new BinanceWsAdapter()

  // Cache
  const priceCache = new InMemoryPriceCache()

  // Services
  const priceService = new PriceService(priceCache, restAdapter)
  const symbolCatalogService = new SymbolCatalogService(restAdapter)
  const streamManager = new MarketStreamManager(priceCache, wsAdapter)

  // Load symbol catalog on startup
  await symbolCatalogService.initialize()

  // Connect Binance WebSocket
  wsAdapter.connect()

  // HTTP server (REST API)
  const httpServer = createServer(symbolCatalogService, priceService)

  // WebSocket Gateway — attaches to the same HTTP server
  new WebSocketGateway(httpServer, streamManager)
}

bootstrap().catch(console.error)
