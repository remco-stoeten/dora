import { assertTauriRuntime } from "@studio/core/platform/runtime";
import { commands, type NeonAccount, type NeonDatabase } from "@studio/lib/bindings";

export type { NeonAccount, NeonDatabase };

export async function isNeonConnected(): Promise<boolean> {
  assertTauriRuntime();
  return commands.neonIsConnected();
}

// Validates a Neon API key (by listing projects), then stores it encrypted
// on-device. Neon's API is token-based (Bearer), so there's no OAuth flow.
export async function saveNeonToken(token: string): Promise<void> {
  assertTauriRuntime();
  const result = await commands.neonSaveToken(token);
  if (result.status === "error") {
    throw result.error;
  }
}

export async function listNeonDatabases(): Promise<NeonDatabase[]> {
  assertTauriRuntime();
  const result = await commands.neonListDatabases();
  if (result.status === "error") {
    throw result.error;
  }
  return result.data;
}

// Mints a pooled connection URI (password embedded) for a database. This is the
// credential stored on the connection — the user never copies a secret.
export async function createNeonConnectionUri(database: NeonDatabase): Promise<string> {
  assertTauriRuntime();
  const result = await commands.neonCreateConnectionUri(
    database.projectId,
    database.branchId,
    database.databaseName,
    database.roleName,
  );
  if (result.status === "error") {
    throw result.error;
  }
  return result.data;
}

export async function disconnectNeon(): Promise<void> {
  assertTauriRuntime();
  const result = await commands.neonDisconnect();
  if (result.status === "error") {
    throw result.error;
  }
}

// The Neon account the stored key belongs to — used to show which account the
// connection is authenticated as.
export async function getNeonAccount(): Promise<NeonAccount> {
  assertTauriRuntime();
  const result = await commands.neonAccount();
  if (result.status === "error") {
    throw result.error;
  }
  return result.data;
}
