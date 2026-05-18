// MARK: - WebSocketGateway Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import { WebSocketGateway } from '../../src/ws/WebSocketGateway.js'
import type { WssFactory } from '../../src/ws/WebSocketGateway.js'
import type { MarketStreamManager } from '../../src/services/MarketStreamManager.js'
import type { MarketTicker } from '../../src/types/index.js'

// MARK: - Mock WebSocket Server

class MockClientSocket extends EventEmitter {
  static OPEN = 1
  readyState = 1
  send = vi.fn()
}

class MockWebSocketServer extends EventEmitter {
  simulateConnection(socket: MockClientSocket) {
    this.emit('connection', socket)
  }
}

// MARK: - Helpers

function makeStreamManager(): MarketStreamManager {
  return {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    disconnect: vi.fn(),
    onBroadcast: vi.fn(),
  } as unknown as MarketStreamManager
}

function makeTicker(symbol: string): MarketTicker {
  return {
    symbol,
    price: 100,
    changePercent24h: 1.0,
    high24h: 110,
    low24h: 90,
    volume24h: 5000,
    ts: Date.now(),
  }
}

function makeGateway() {
  const mockWss = new MockWebSocketServer()
  const wssFactory: WssFactory = () => mockWss as any
  const streamManager = makeStreamManager()
  const httpServer = new EventEmitter() as any
  const gateway = new WebSocketGateway(httpServer, streamManager, wssFactory)
  return { gateway, streamManager, mockWss }
}

// MARK: - Tests

describe('WebSocketGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // MARK: subscribe message

  describe('subscribe message', () => {
    it('forwards subscribe to the stream manager', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      socket.emit('message', Buffer.from(JSON.stringify({
        type: 'subscribe',
        symbols: ['BTCUSDT', 'ETHUSDT'],
      })))

      expect(streamManager.subscribe).toHaveBeenCalledWith(
        expect.any(String),
        ['BTCUSDT', 'ETHUSDT']
      )
    })
  })

  // MARK: unsubscribe message

  describe('unsubscribe message', () => {
    it('forwards unsubscribe to the stream manager', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      socket.emit('message', Buffer.from(JSON.stringify({
        type: 'unsubscribe',
        symbols: ['BTCUSDT'],
      })))

      expect(streamManager.unsubscribe).toHaveBeenCalledWith(
        expect.any(String),
        ['BTCUSDT']
      )
    })
  })

  // MARK: invalid messages

  describe('invalid messages', () => {
    it('does not throw on malformed JSON', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      expect(() => socket.emit('message', Buffer.from('not json'))).not.toThrow()
      expect(streamManager.subscribe).not.toHaveBeenCalled()
    })

    it('ignores messages with an unknown type', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      socket.emit('message', Buffer.from(JSON.stringify({
        type: 'ping',
        symbols: [],
      })))

      expect(streamManager.subscribe).not.toHaveBeenCalled()
      expect(streamManager.unsubscribe).not.toHaveBeenCalled()
    })

    it('ignores messages missing a symbols array', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      socket.emit('message', Buffer.from(JSON.stringify({ type: 'subscribe' })))

      expect(streamManager.subscribe).not.toHaveBeenCalled()
    })
  })

  // MARK: disconnect

  describe('disconnect', () => {
    it('calls disconnect on the stream manager when the socket closes', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      socket.emit('close')

      expect(streamManager.disconnect).toHaveBeenCalledWith(expect.any(String))
    })
  })

  // MARK: outbound broadcast

  describe('outbound broadcast', () => {
    it('sends a ticker message to the correct socket', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      // Capture the broadcast callback registered with the stream manager
      const onBroadcast = vi.mocked(streamManager.onBroadcast).mock.calls[0]?.[0]!

      // Get the socketId that was assigned to this socket
      const subscribeCall = vi.mocked(streamManager.subscribe)
      socket.emit('message', Buffer.from(JSON.stringify({
        type: 'subscribe',
        symbols: ['BTCUSDT'],
      })))
      const socketId = subscribeCall.mock.calls[0]?.[0] as string

      const ticker = makeTicker('BTCUSDT')
      onBroadcast(socketId, ticker)

      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ticker', data: ticker })
      )
    })

    it('does not send to a socket that has disconnected', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket = new MockClientSocket()
      mockWss.simulateConnection(socket)

      const onBroadcast = vi.mocked(streamManager.onBroadcast).mock.calls[0]?.[0]!
      socket.emit('message', Buffer.from(JSON.stringify({
        type: 'subscribe',
        symbols: ['BTCUSDT'],
      })))
      const socketId = vi.mocked(streamManager.subscribe).mock.calls[0]?.[0] as string

      // Disconnect the socket
      socket.emit('close')

      onBroadcast(socketId, makeTicker('BTCUSDT'))
      expect(socket.send).not.toHaveBeenCalled()
    })
  })

  // MARK: multiple clients

  describe('multiple clients', () => {
    it('assigns unique socket IDs to each connection', () => {
      const { streamManager, mockWss } = makeGateway()
      const socket1 = new MockClientSocket()
      const socket2 = new MockClientSocket()

      mockWss.simulateConnection(socket1)
      socket1.emit('message', Buffer.from(JSON.stringify({ type: 'subscribe', symbols: ['BTCUSDT'] })))

      mockWss.simulateConnection(socket2)
      socket2.emit('message', Buffer.from(JSON.stringify({ type: 'subscribe', symbols: ['ETHUSDT'] })))

      const calls = vi.mocked(streamManager.subscribe).mock.calls
      const id1 = calls[0]?.[0]
      const id2 = calls[1]?.[0]

      expect(id1).not.toBe(id2)
    })
  })
})
