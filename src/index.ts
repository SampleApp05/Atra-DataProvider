// MARK: - Application Entry Point

import { BinanceRestAdapter } from './adapters/index.js'
import { InMemoryPriceCache } from './cache/index.js'
import { PriceService, SymbolCatalogService } from './services/index.js'

// MARK: - Bootstrap

async function bootstrap() {
  const restAdapter = new BinanceRestAdapter()
  const priceCache = new InMemoryPriceCache()

  const priceService = new PriceService(priceCache, restAdapter)
  const symbolCatalogService = new SymbolCatalogService(restAdapter)

  // Load symbol catalog on startup
  await symbolCatalogService.initialize()

  // Expose for use by REST/WS layers (Steps 6+)
  return { priceService, symbolCatalogService }
}

bootstrap().catch(console.error)
