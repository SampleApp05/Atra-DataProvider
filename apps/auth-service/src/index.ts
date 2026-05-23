// MARK: - Auth Service Entry Point

import 'dotenv/config'
import express from 'express'
import { db } from './db/index.js'
import { createIdentityRouter } from './modules/identity/routes/identityRoutes.js'
import { createAuthRouter } from './modules/auth/routes/authRoutes.js'
import { createWalletRouter } from './modules/wallets/routes/walletRoutes.js'

const app = express()
app.use(express.json())

// MARK: - Routes

app.use('/identity', createIdentityRouter(db))
app.use('/auth',     createAuthRouter(db))
app.use('/wallets',  createWalletRouter(db))

// MARK: - Health

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// MARK: - Start

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`[auth-service] Listening on port ${PORT}`)
})
