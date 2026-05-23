// MARK: - Auth Service Entry Point

import 'dotenv/config'
import express from 'express'
import { db } from './db/index.js'
import { createIdentityRouter } from './modules/identity/routes/identityRoutes.js'

const app = express()
app.use(express.json())

// MARK: - Routes

app.use('/identity', createIdentityRouter(db))

// MARK: - Health

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// MARK: - Start

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`[auth-service] Listening on port ${PORT}`)
})
