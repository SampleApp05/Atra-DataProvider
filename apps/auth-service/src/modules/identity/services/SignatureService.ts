// MARK: - Signature Service
// Builds EIP-191 personal_sign challenge messages and verifies signatures.

import { ethers } from 'ethers'
import type { NoncePurpose } from '@atra/database'

// MARK: - Service

export class SignatureService {
  // MARK: Public API

  /**
   * Builds the human-readable message that the wallet must sign.
   * This is the canonical challenge message format for ATRA.
   */
  buildChallengeMessage(nonce: string, purpose: NoncePurpose): string {
    return `Sign in to Atra\n\nNonce: ${nonce}\nPurpose: ${purpose}`
  }

  /**
   * Recovers the signer address from an EIP-191 personal_sign signature.
   * Returns the recovered address in checksummed form.
   * Throws if the signature is malformed.
   */
  recoverAddress(message: string, signature: string): string {
    return ethers.verifyMessage(message, signature)
  }

  /**
   * Verifies that the given signature was produced by the claimed wallet address.
   * Comparison is case-insensitive.
   */
  verifySignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): boolean {
    const recovered = this.recoverAddress(message, signature)
    return recovered.toLowerCase() === expectedAddress.toLowerCase()
  }
}
