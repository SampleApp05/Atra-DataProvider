// MARK: - Wallet Routes

import { Router } from 'express'
import type { Db } from '@atra/database'
import { NonceService } from '../../identity/services/NonceService.js'
import { SignatureService } from '../../identity/services/SignatureService.js'
import { WalletLinkingService } from '../services/WalletLinkingService.js'
import { WalletController } from '../controllers/WalletController.js'

// MARK: - Factory

export function createWalletRouter(db: Db): Router {
  const router = Router()

  const nonceService        = new NonceService(db)
  const signatureService    = new SignatureService()
  const walletLinkingService = new WalletLinkingService(db, nonceService, signatureService)
  const controller          = new WalletController(walletLinkingService)

  router.post('/link/challenge', controller.linkChallenge)
  router.post('/link/verify',   controller.linkVerify)

  return router
}
