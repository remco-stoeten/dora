use crate::credential_storage::{
    CredentialStorageStatus, KeyringInstallPlan, KeyringInstallResult,
};

#[tauri::command]
#[specta::specta]
pub fn get_credential_storage_status() -> CredentialStorageStatus {
    crate::credential_storage::status()
}

#[tauri::command]
#[specta::specta]
pub fn get_keyring_install_plan() -> Option<KeyringInstallPlan> {
    crate::credential_storage::install_plan()
}

#[tauri::command]
#[specta::specta]
pub async fn install_credential_keyring() -> KeyringInstallResult {
    tauri::async_runtime::spawn_blocking(crate::credential_storage::install)
        .await
        .unwrap_or_else(|error| KeyringInstallResult {
            ok: false,
            message: format!("Install task failed: {error}"),
        })
}
