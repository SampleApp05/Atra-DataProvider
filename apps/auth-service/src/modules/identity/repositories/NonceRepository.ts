// MARK: - Nonce Repository

import type { Db, NonceChallenge } from '@atra/database'
import { nonceChallenges } from '@atra/database'
import { eq } from 'drizzle-orm'

// MARK: - Repository

export class NonceRepository {
  // MARK: Private State

  private readonly db: Db

  // MARK: Init

  constructor(db: Db) {
    this.db = db
  }

  // MARK: Public API

  async findById(id: string): Promise<NonceChallenge | null> {
    const [row] = await this.db
      .select()
      .from(nonceChallenges)
      .where(eq(nonceChallenges.id, id))
      .limit(1)

    return row ?? null
  }

  async markUsed(id: string): Promise<void> {
    await this.db
      .update(nonceChallenges)
      .set({ usedAt: new Date() })
      .where(eq(nonceChallenges.id, id))
  }
}
