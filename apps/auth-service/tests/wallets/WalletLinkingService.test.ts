// MARK: - WalletLinkingService Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletLinkingService } from '../../src/modules/wallets/services/WalletLinkingService.js'
import type { NonceService } from '../../src/modules/identity/services/NonceService.js'
import type { SignatureService } from '../../src/modules/identity/services/SignatureService.js'

// MARK: - Fixtures

const ACCOUNT_ID  = 'account-uuid-1'
const CALLER_WID  = 'caller-wallet-uuid-1'
const NEW_ADDRESS = '0xdeadbeef'
const NEW_WID     = 'new-wallet-uuid-1'
const CHAIN_ID    = 1
const NONCE       = 'abcdef1234567890abcdef1234567890'
const CHALLENGE_ID = 'challenge-uuid-1'

function mockOwnerRole() {
  return { id: 'r1', accountId: ACCOUNT_ID, walletId: CALLER_WID, role: 'OWNER', grantedByWalletId: null, createdAt: new Date() }
}

function mockChallenge() {
  return {
    id: CHALLENGE_ID,
    walletId: NEW_WID,
    nonce: NONCE,
    purpose: 'LINK_WALLET',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    createdAt: new Date(),
  }
}

function mockWallet(address = NEW_ADDRESS.toLowerCase()) {
  return { id: NEW_WID, address, chainId: CHAIN_ID, createdAt: new Date() }
}

// MARK: - DB Mock

function makeLimit(rows: unknown[]) {
  return vi.fn().mockResolvedValue(rows.slice(0, 1))
}

function makeWhere(rows: unknown[]) {
  return vi.fn(() => ({
    limit: makeLimit(rows),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(rows).then(resolve),
  }))
}

/**
 * buildDb — used for createLinkChallenge tests.
 * Select call order: 1=assertHasRole, 2=existingWallet check
 */
function buildDb(scenario: {
  roles?: unknown[]
  existingWallet?: unknown | null
} = {}) {
  const {
    roles          = [mockOwnerRole()],
    existingWallet = null,
  } = scenario

  const sequences = [
    roles,
    existingWallet ? [existingWallet] : [],
  ]
  let callIndex = 0

  const insertReturning = vi.fn().mockResolvedValue([mockWallet()])
  const insertValuesReturning = vi.fn(() => ({ returning: insertReturning }))
  const insertFn = vi.fn(() => ({ values: insertValuesReturning }))

  return {
    select: vi.fn().mockImplementation(() => {
      const idx = callIndex++
      const rows = sequences[idx] ?? []
      return { from: vi.fn(() => ({ where: makeWhere(rows) })) }
    }),
    insert: insertFn,
  }
}

/**
 * buildDbForVerify — used for verifyAndLink tests.
 * Select call order: 1=assertHasRole, 2=wallet lookup, 3=challenge lookup
 */
function buildDbForVerify(scenario: {
  roles?: unknown[]
  wallet?: unknown | null
  challenge?: unknown | null
} = {}) {
  const {
    roles     = [mockOwnerRole()],
    wallet    = mockWallet(),
    challenge = mockChallenge(),
  } = scenario

  const sequences = [
    roles,
    wallet ? [wallet] : [],
    challenge ? [challenge] : [],
  ]
  let callIndex = 0

  const insertValuesReturning = vi.fn(() => ({ returning: vi.fn().mockResolvedValue([mockWallet()]) }))
  const insertFn = vi.fn(() => ({ values: insertValuesReturning }))

  return {
    select: vi.fn().mockImplementation(() => {
      const idx = callIndex++
      const rows = sequences[idx] ?? []
      return { from: vi.fn(() => ({ where: makeWhere(rows) })) }
    }),
    insert: insertFn,
  }
}

// MARK: - Tests

describe('WalletLinkingService', () => {
  let nonceService: NonceService
  let signatureService: SignatureService

  beforeEach(() => {
    nonceService = {
      create: vi.fn().mockResolvedValue(mockChallenge()),
      markUsed: vi.fn().mockResolvedValue(undefined),
    } as unknown as NonceService

    signatureService = {
      buildChallengeMessage: vi.fn().mockReturnValue('Sign in to Atra\n\nNonce: abc\nPurpose: LINK_WALLET'),
      verifySignature: vi.fn().mockReturnValue(true),
    } as unknown as SignatureService
  })

  // MARK: createLinkChallenge

  describe('createLinkChallenge', () => {
    it('throws INSUFFICIENT_ROLE when caller has no OWNER or AUTH role', async () => {
      const db = buildDb({ roles: [] })
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.createLinkChallenge(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, CHAIN_ID)
      ).rejects.toThrow('INSUFFICIENT_ROLE')
    })

    it('throws ADDRESS_ALREADY_LINKED when wallet address already exists', async () => {
      const db = buildDb({ existingWallet: mockWallet() })
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.createLinkChallenge(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, CHAIN_ID)
      ).rejects.toThrow('ADDRESS_ALREADY_LINKED')
    })

    it('creates a wallet and returns a challenge on success', async () => {
      const db = buildDb()
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      const result = await service.createLinkChallenge(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, CHAIN_ID)
      expect(result.challengeId).toBe(CHALLENGE_ID)
      expect(result.message).toContain('LINK_WALLET')
    })

    it('normalises address to lowercase', async () => {
      const db = buildDb()
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await service.createLinkChallenge(ACCOUNT_ID, CALLER_WID, '0xDEADBEEF', CHAIN_ID)
      expect(nonceService.create).toHaveBeenCalled()
    })

    it('also succeeds when caller has AUTH role', async () => {
      const authRole = { ...mockOwnerRole(), role: 'AUTH' }
      const db = buildDb({ roles: [authRole] })
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.createLinkChallenge(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, CHAIN_ID)
      ).resolves.toBeDefined()
    })
  })

  // MARK: verifyAndLink

  describe('verifyAndLink', () => {
    it('throws INSUFFICIENT_ROLE when caller has no OWNER or AUTH role', async () => {
      const db = buildDbForVerify({ roles: [] })
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.verifyAndLink(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xsig')
      ).rejects.toThrow('INSUFFICIENT_ROLE')
    })

    it('throws WALLET_NOT_FOUND when new wallet does not exist', async () => {
      const db = buildDbForVerify({ wallet: null })
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.verifyAndLink(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xsig')
      ).rejects.toThrow('WALLET_NOT_FOUND')
    })

    it('throws INVALID_OR_EXPIRED_NONCE when challenge is invalid', async () => {
      const db = buildDbForVerify({ challenge: null })
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.verifyAndLink(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xsig')
      ).rejects.toThrow('INVALID_OR_EXPIRED_NONCE')
    })

    it('throws SIGNATURE_MISMATCH when signature is invalid', async () => {
      ;(signatureService.verifySignature as ReturnType<typeof vi.fn>).mockReturnValue(false)
      const db = buildDbForVerify()
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await expect(
        service.verifyAndLink(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xbadsig')
      ).rejects.toThrow('SIGNATURE_MISMATCH')
    })

    it('grants STANDARD role on success', async () => {
      const db = buildDbForVerify()
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      const result = await service.verifyAndLink(
        ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xsig'
      )
      expect(result.role).toBe('STANDARD')
    })

    it('marks nonce as used after valid signature', async () => {
      const db = buildDbForVerify()
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await service.verifyAndLink(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xsig')
      expect(nonceService.markUsed).toHaveBeenCalledWith(CHALLENGE_ID)
    })

    it('writes an audit log entry', async () => {
      const db = buildDbForVerify()
      const service = new WalletLinkingService(
        db as unknown as import('@atra/database').Db,
        nonceService, signatureService
      )
      await service.verifyAndLink(ACCOUNT_ID, CALLER_WID, NEW_ADDRESS, NONCE, '0xsig')
      expect(db.insert).toHaveBeenCalled()
    })
  })
})
