export interface Migration {
  id: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export interface MigrationState {
  id: string;
  appliedAt: Date;
}

export interface MigrationRunner {
  getAppliedMigrations(): Promise<MigrationState[]>;
  markMigrationApplied(id: string): Promise<void>;
  markMigrationRolledBack(id: string): Promise<void>;
  getPendingMigrations(): Promise<Migration[]>;
  runMigration(migration: Migration): Promise<void>;
  rollbackMigration(migration: Migration): Promise<void>;
}
