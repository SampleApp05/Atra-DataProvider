// MARK: - Account Repository

import type { Db, NewAccount, Account } from '@atra/database'
import { accounts } from '@atra/database'
import { eq } from 'drizzle-orm'

// MARK: - Repository

export class AccountRepository {
  // MARK: Private State

  private readonly db: Db

  // MARK: Init

  constructor(db: Db) {
    this.db = db
  }

  // MARK: Public API

  async findById(id: string): Promise<Account | null> {
    const [row] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1)

    return row ?? null
  }

  async create(ownerWalletId: string): Promise<Account> {
    const values: NewAccount = {
      ownerWalletId,
    }

    const [row] = await this.db
      .insert(accounts)
      .values(values)
      .returning()

    return row
  }
}
