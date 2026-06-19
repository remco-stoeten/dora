use tauri::State;
use tauri_plugin_opener::OpenerExt;

use crate::{
    integrations::cloudflare::{self, CloudflareAccount, CloudflareD1Database},
    integrations::neon::{self, NeonAccount, NeonDatabase},
    integrations::supabase::{self, SupabaseOrganization, SupabaseProject},
    integrations::turso::{self, TursoDatabase, TursoOrganization},
    AppState, Error,
};

#[tauri::command]
#[specta::specta]
pub async fn supabase_save_token(
    token: String,
    state: State<'_, AppState>,
) -> Result<(), Error> {
    supabase::save_token(&state.storage, token).await
}

/// One-click OAuth: opens the consent page in the browser and waits for the
/// hosted proxy to redirect tokens back to a local loopback listener.
#[tauri::command]
#[specta::specta]
pub async fn supabase_oauth_connect(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), Error> {
    supabase::oauth_connect(&state.storage, move |url| {
        app.opener()
            .open_url(url, None::<&str>)
            .map_err(|error| Error::Any(anyhow::anyhow!("Failed to open browser: {error}")))
    })
    .await
}

#[tauri::command]
#[specta::specta]
pub async fn supabase_list_projects(
    state: State<'_, AppState>,
) -> Result<Vec<SupabaseProject>, Error> {
    supabase::list_projects(&state.storage).await
}

/// The Supabase organizations the stored token can access, so the UI can show
/// which account is currently connected.
#[tauri::command]
#[specta::specta]
pub async fn supabase_account(
    state: State<'_, AppState>,
) -> Result<Vec<SupabaseOrganization>, Error> {
    supabase::current_account(&state.storage).await
}

/// Resolves the real Supavisor pooler host for a project (the cluster index
/// can't be guessed from the region), used to build pooler connection strings.
#[tauri::command]
#[specta::specta]
pub async fn supabase_pooler_host(
    project_ref: String,
    state: State<'_, AppState>,
) -> Result<String, Error> {
    supabase::pooler_host(&state.storage, &project_ref).await
}

#[tauri::command]
#[specta::specta]
pub async fn supabase_disconnect(state: State<'_, AppState>) -> Result<(), Error> {
    supabase::disconnect(&state.storage)
}

#[tauri::command]
#[specta::specta]
pub fn supabase_is_connected(state: State<'_, AppState>) -> bool {
    supabase::is_connected(&state.storage)
}

/// Remembers a project's database password (encrypted on-device) so it can be
/// prefilled on the next connect. The Management API never returns it, so this
/// is the only way to avoid re-typing it every time.
#[tauri::command]
#[specta::specta]
pub fn supabase_save_project_password(
    project_ref: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<(), Error> {
    supabase::save_project_password(&state.storage, &project_ref, &password)
}

#[tauri::command]
#[specta::specta]
pub fn supabase_get_project_password(
    project_ref: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, Error> {
    supabase::load_project_password(&state.storage, &project_ref)
}

// ---------------------------------------------------------------------------
// Turso
// ---------------------------------------------------------------------------

/// Validates and stores a Turso Platform API token (encrypted on-device).
#[tauri::command]
#[specta::specta]
pub async fn turso_save_token(token: String, state: State<'_, AppState>) -> Result<(), Error> {
    turso::save_token(&state.storage, token).await
}

#[tauri::command]
#[specta::specta]
pub async fn turso_list_databases(
    state: State<'_, AppState>,
) -> Result<Vec<TursoDatabase>, Error> {
    turso::list_databases(&state.storage).await
}

/// Mints a database auth token (JWT) for a Turso database so the connection
/// needs no hand-copied secret.
#[tauri::command]
#[specta::specta]
pub async fn turso_create_token(
    organization_slug: String,
    database_name: String,
    state: State<'_, AppState>,
) -> Result<String, Error> {
    turso::create_token(&state.storage, &organization_slug, &database_name).await
}

#[tauri::command]
#[specta::specta]
pub fn turso_disconnect(state: State<'_, AppState>) -> Result<(), Error> {
    turso::disconnect(&state.storage)
}

#[tauri::command]
#[specta::specta]
pub fn turso_is_connected(state: State<'_, AppState>) -> bool {
    turso::is_connected(&state.storage)
}

/// Whether the Turso CLI is installed locally, so the frontend can offer
/// one-click minting instead of a manual token paste.
#[tauri::command]
#[specta::specta]
pub fn turso_cli_available() -> bool {
    turso::cli_available()
}

/// Mints a Turso Platform API token via the local CLI (running `turso auth
/// login` first if the user isn't signed in), then validates and stores it.
#[tauri::command]
#[specta::specta]
pub async fn turso_mint_token(state: State<'_, AppState>) -> Result<(), Error> {
    turso::mint_token_via_cli(&state.storage).await
}

/// Installs the Turso CLI via the official install script. macOS/Linux only —
/// returns an error on Windows with Scoop instructions.
#[tauri::command]
#[specta::specta]
pub async fn turso_install_cli() -> Result<(), Error> {
    turso::install_cli().await
}

/// Whether the user is signed in to the local Turso CLI, so the frontend can
/// prompt for sign-in before offering one-click minting.
#[tauri::command]
#[specta::specta]
pub async fn turso_cli_logged_in() -> bool {
    turso::cli_logged_in().await
}

/// Runs `turso auth login` (opens a browser) so the user can authenticate the
/// Turso CLI without leaving Dora.
#[tauri::command]
#[specta::specta]
pub async fn turso_cli_login() -> Result<(), Error> {
    turso::cli_login().await
}

/// The Turso organizations the stored token can access, so the UI can show
/// which account is currently connected.
#[tauri::command]
#[specta::specta]
pub async fn turso_account(state: State<'_, AppState>) -> Result<Vec<TursoOrganization>, Error> {
    turso::current_account(&state.storage).await
}

// ---------------------------------------------------------------------------
// Neon
// ---------------------------------------------------------------------------

/// Validates and stores a Neon API key (encrypted on-device).
#[tauri::command]
#[specta::specta]
pub async fn neon_save_token(token: String, state: State<'_, AppState>) -> Result<(), Error> {
    neon::save_token(&state.storage, token).await
}

#[tauri::command]
#[specta::specta]
pub async fn neon_list_databases(
    state: State<'_, AppState>,
) -> Result<Vec<NeonDatabase>, Error> {
    neon::list_databases(&state.storage).await
}

/// The Neon account the stored key belongs to, so the UI can show which account
/// is currently connected.
#[tauri::command]
#[specta::specta]
pub async fn neon_account(state: State<'_, AppState>) -> Result<NeonAccount, Error> {
    neon::current_account(&state.storage).await
}

/// Mints a pooled connection URI for a Neon database so the connection needs no
/// hand-copied password.
#[tauri::command]
#[specta::specta]
pub async fn neon_create_connection_uri(
    project_id: String,
    branch_id: String,
    database_name: String,
    role_name: String,
    state: State<'_, AppState>,
) -> Result<String, Error> {
    neon::create_connection_uri(
        &state.storage,
        &project_id,
        &branch_id,
        &database_name,
        &role_name,
    )
    .await
}

#[tauri::command]
#[specta::specta]
pub fn neon_disconnect(state: State<'_, AppState>) -> Result<(), Error> {
    neon::disconnect(&state.storage)
}

#[tauri::command]
#[specta::specta]
pub fn neon_is_connected(state: State<'_, AppState>) -> bool {
    neon::is_connected(&state.storage)
}

// ---------------------------------------------------------------------------
// Cloudflare D1
// ---------------------------------------------------------------------------

/// Validates and stores a Cloudflare API token (encrypted on-device).
#[tauri::command]
#[specta::specta]
pub async fn cloudflare_save_token(
    token: String,
    state: State<'_, AppState>,
) -> Result<(), Error> {
    cloudflare::save_token(&state.storage, token).await
}

/// The Cloudflare accounts the stored token can see — the first pick step (D1 is
/// account-scoped) and the source of the "Connected as …" label.
#[tauri::command]
#[specta::specta]
pub async fn cloudflare_list_accounts(
    state: State<'_, AppState>,
) -> Result<Vec<CloudflareAccount>, Error> {
    cloudflare::list_accounts(&state.storage).await
}

/// The D1 databases in one Cloudflare account.
#[tauri::command]
#[specta::specta]
pub async fn cloudflare_list_databases(
    account_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<CloudflareD1Database>, Error> {
    cloudflare::list_databases(&state.storage, &account_id).await
}

#[tauri::command]
#[specta::specta]
pub async fn cloudflare_account(
    state: State<'_, AppState>,
) -> Result<Vec<CloudflareAccount>, Error> {
    cloudflare::current_account(&state.storage).await
}

#[tauri::command]
#[specta::specta]
pub fn cloudflare_disconnect(state: State<'_, AppState>) -> Result<(), Error> {
    cloudflare::disconnect(&state.storage)
}

#[tauri::command]
#[specta::specta]
pub fn cloudflare_is_connected(state: State<'_, AppState>) -> bool {
    cloudflare::is_connected(&state.storage)
}
