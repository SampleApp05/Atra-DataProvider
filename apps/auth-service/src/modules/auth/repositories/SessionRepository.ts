// MARK: - Session Repository

import type { Db, NewSession, Session } from '@atra/database'
import { sessions } from '@atra/database'
import { eq, and, isNull } from 'drizzle-orm'

// MARK: - Repository

export class SessionRepository {
  // MARK: Private State

  private readonly db: Db

  // MARK: Init

  constructor(db: Db) {
    this.db = db
  }

  // MARK: Public API

  async create(values: NewSession): Promise<Session> {
    const [row] = await this.db
      .insert(sessions)
      .values(values)
      .returning()
    return row
  }

  /**
   * Finds an active (not revoked, not expired) session by its refresh token hash.
   */
  async findActiveByRefreshHash(
    refreshTokenHash: string
  ): Promise<Session | null> {
    const now = new Date()

    const [row] = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, refreshTokenHash),
          isNull(sessions.revokedAt),
        )
      )
      .limit(1)

    if (!row) return null
    if (row.expiresAt < now) return null

    return row
  }

  async findById(id: string): Promise<Session | null> {
    const [row] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
    return row ?? null
  }

  /**
   * Soft-deletes a session by setting revokedAt.
   */
  async revoke(id: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id))
  }

  /**
   * Revokes every active session for the given account.
   */
  async revokeAllForAccount(accountId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.accountId, accountId),
          isNull(sessions.revokedAt),
        )
      )
  }
}
