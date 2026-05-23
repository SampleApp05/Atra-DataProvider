// MARK: - Identity Routes

import { Router } from 'express'
import type { Db } from '@atra/database'
import { NonceService } from '../services/NonceService.js'
import { SignatureService } from '../services/SignatureService.js'
import { AccountService } from '../services/AccountService.js'
import { IdentityController } from '../controllers/IdentityController.js'

// MARK: - Factory

export function createIdentityRouter(db: Db): Router {
  const router = Router()

  const nonceService = new NonceService(db)
  const signatureService = new SignatureService()
  const accountService = new AccountService(db, nonceService, signatureService)
  const controller = new IdentityController(accountService)

  router.post('/challenge', controller.challenge)
  router.post('/verify', controller.verify)

  return router
}
