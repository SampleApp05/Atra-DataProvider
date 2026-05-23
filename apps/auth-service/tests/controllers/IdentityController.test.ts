// MARK: - IdentityController Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IdentityController } from '../../src/modules/identity/controllers/IdentityController.js'
import type { AccountService } from '../../src/modules/identity/services/AccountService.js'
import type { Request, Response } from 'express'

// MARK: - Helpers

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  }
  res.status.mockReturnValue(res)
  return res as unknown as Response
}

function mockReq(body: Record<string, unknown> = {}): Request {
  return { body } as Request
}

// MARK: - Tests

describe('IdentityController', () => {
  let accountService: AccountService
  let controller: IdentityController

  beforeEach(() => {
    accountService = {
      createChallenge: vi.fn(),
      verifyAndProvision: vi.fn(),
    } as unknown as AccountService

    controller = new IdentityController(accountService)
  })

  // MARK: challenge

  describe('POST /challenge', () => {
    it('returns 400 when address is missing', async () => {
      const res = mockRes()
      await controller.challenge(mockReq({ chainId: 1 }), res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'address is required' })
    })

    it('returns 400 when chainId is missing', async () => {
      const res = mockRes()
      await controller.challenge(mockReq({ address: '0xabc' }), res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'chainId is required' })
    })

    it('returns 200 with challengeId and message on success', async () => {
      ;(accountService.createChallenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        challengeId: 'cid-1',
        message: 'Sign in to Atra\n\nNonce: abc\nPurpose: LOGIN',
      })

      const res = mockRes()
      await controller.challenge(mockReq({ address: '0xabc', chainId: 1 }), res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        challengeId: 'cid-1',
        message: expect.stringContaining('Nonce:'),
      })
    })

    it('returns 500 on unexpected error', async () => {
      ;(accountService.createChallenge as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('DB_DOWN')
      )

      const res = mockRes()
      await controller.challenge(mockReq({ address: '0xabc', chainId: 1 }), res)
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  // MARK: verify

  describe('POST /verify', () => {
    const validBody = {
      address: '0xabc',
      nonce: 'deadbeef',
      signature: '0xsig',
      chainId: 1,
    }

    it('returns 400 when address is missing', async () => {
      const res = mockRes()
      const { address: _a, ...body } = validBody
      await controller.verify(mockReq(body), res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when nonce is missing', async () => {
      const res = mockRes()
      const { nonce: _n, ...body } = validBody
      await controller.verify(mockReq(body), res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when signature is missing', async () => {
      const res = mockRes()
      const { signature: _s, ...body } = validBody
      await controller.verify(mockReq(body), res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when chainId is missing', async () => {
      const res = mockRes()
      const { chainId: _c, ...body } = validBody
      await controller.verify(mockReq(body), res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 200 with walletId and accountId on success', async () => {
      ;(accountService.verifyAndProvision as ReturnType<typeof vi.fn>).mockResolvedValue({
        wallet: { id: 'w1' },
        account: { id: 'a1' },
      })

      const res = mockRes()
      await controller.verify(mockReq(validBody), res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ walletId: 'w1', accountId: 'a1' })
    })

    it('returns 404 for WALLET_NOT_FOUND', async () => {
      ;(accountService.verifyAndProvision as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('WALLET_NOT_FOUND')
      )
      const res = mockRes()
      await controller.verify(mockReq(validBody), res)
      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('returns 401 for INVALID_OR_EXPIRED_NONCE', async () => {
      ;(accountService.verifyAndProvision as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('INVALID_OR_EXPIRED_NONCE')
      )
      const res = mockRes()
      await controller.verify(mockReq(validBody), res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 401 for SIGNATURE_MISMATCH', async () => {
      ;(accountService.verifyAndProvision as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('SIGNATURE_MISMATCH')
      )
      const res = mockRes()
      await controller.verify(mockReq(validBody), res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 500 on unexpected error', async () => {
      ;(accountService.verifyAndProvision as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('DB_DOWN')
      )
      const res = mockRes()
      await controller.verify(mockReq(validBody), res)
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
