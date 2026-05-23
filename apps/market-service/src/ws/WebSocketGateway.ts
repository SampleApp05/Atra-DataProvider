// MARK: - WebSocket Gateway
// Manages client socket connections. No business logic — only transport, parsing, forwarding.

import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import type { MarketStreamManager } from '../services/MarketStreamManager.js'
import type { MarketTicker } from '../types/index.js'

// MARK: - Client Message Types

interface SubscribeMessage {
  type: 'subscribe'
  symbols: string[]
}

interface UnsubscribeMessage {
  type: 'unsubscribe'
  symbols: string[]
}

type ClientMessage = SubscribeMessage | UnsubscribeMessage

// MARK: - Server Message Types

interface TickerMessage {
  type: 'ticker'
  data: MarketTicker
}

// MARK: - Factory Type

export type WssFactory = (server: Server) => WebSocketServer

// MARK: - Gateway

export class WebSocketGateway {
  // MARK: Private State

  private wss: WebSocketServer
  private streamManager: MarketStreamManager
  // socketId → WebSocket instance (for sending outbound messages)
  private sockets = new Map<string, WebSocket>()
  private nextSocketId = 1

  // MARK: Init

  constructor(
    server: Server,
    streamManager: MarketStreamManager,
    wssFactory: WssFactory = (s) => new WebSocketServer({ server: s })
  ) {
    this.streamManager = streamManager
    this.wss = wssFactory(server)

    // Register outbound broadcast handler with the stream manager
    this.streamManager.onBroadcast((socketId, ticker) => {
      this._sendTicker(socketId, ticker)
    })

    this._attachConnectionHandler()
  }

  // MARK: Private — Connection Handling

  private _attachConnectionHandler(): void {
    this.wss.on('connection', (socket: WebSocket) => {
      const socketId = String(this.nextSocketId++)
      this.sockets.set(socketId, socket)

      socket.on('message', (raw: Buffer) => {
        this._handleMessage(socketId, raw.toString())
      })

      socket.on('close', () => {
        this._handleDisconnect(socketId)
      })

      socket.on('error', (err: Error) => {
        console.error(`[WebSocketGateway] Socket ${socketId} error:`, err.message)
      })
    })
  }

  // MARK: Private — Inbound Message Handling

  private _handleMessage(socketId: string, raw: string): void {
    let parsed: unknown

    try {
      parsed = JSON.parse(raw)
    } catch {
      console.warn(`[WebSocketGateway] Invalid JSON from socket ${socketId}:`, raw)
      return
    }

    if (parsed === null || typeof parsed !== 'object') {
      return
    }

    const msg = parsed as Record<string, unknown>

    if (typeof msg['type'] !== 'string') {
      return
    }

    if (Array.isArray(msg['symbols']) === false) {
      return
    }

    const clientMsg = parsed as ClientMessage

    if (clientMsg.type === 'subscribe') {
      this.streamManager.subscribe(socketId, clientMsg.symbols)
      return
    }

    if (clientMsg.type === 'unsubscribe') {
      this.streamManager.unsubscribe(socketId, clientMsg.symbols)
      return
    }
  }

  // MARK: Private — Disconnect Handling

  private _handleDisconnect(socketId: string): void {
    this.streamManager.disconnect(socketId)
    this.sockets.delete(socketId)
  }

  // MARK: Private — Outbound

  private _sendTicker(socketId: string, ticker: MarketTicker): void {
    const socket = this.sockets.get(socketId)

    if (socket === undefined || socket.readyState !== WebSocket.OPEN) {
      return
    }

    const message: TickerMessage = { type: 'ticker', data: ticker }
    socket.send(JSON.stringify(message))
  }
}
