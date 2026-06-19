use anyhow::Context;

use super::Storage;
use crate::Result;

impl Storage {
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self
            .conn
            .lock()
            .map_err(|_| crate::Error::Internal("lock poisoned".into()))?;
        let mut stmt = conn
            .prepare("SELECT value FROM app_settings WHERE key = ?1")
            .context("Failed to prepare settings statement")?;
        let mut rows = stmt
            .query_map([key], |row| row.get::<_, String>(0))
            .context("Failed to query settings")?;

        if let Some(row) = rows.next() {
            Ok(Some(row.context("Failed to get setting value")?))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        let conn = self
            .conn
            .lock()
            .map_err(|_| crate::Error::Internal("lock poisoned".into()))?;
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            (key, value, now),
        )
        .context("Failed to set setting")?;
        Ok(())
    }

    pub fn delete_setting(&self, key: &str) -> Result<()> {
        let conn = self
            .conn
            .lock()
            .map_err(|_| crate::Error::Internal("lock poisoned".into()))?;
        conn.execute("DELETE FROM app_settings WHERE key = ?1", [key])
            .context("Failed to delete setting")?;
        Ok(())
    }

    /// Deletes every setting whose key begins with `prefix`. Used to clear a
    /// family of related keys at once (e.g. all per-project integration
    /// passwords) without tracking each key individually.
    pub fn delete_settings_with_prefix(&self, prefix: &str) -> Result<()> {
        let conn = self
            .conn
            .lock()
            .map_err(|_| crate::Error::Internal("lock poisoned".into()))?;
        // Escape LIKE wildcards in the prefix so a key fragment containing `%`
        // or `_` can't widen the match, then match `prefix%` literally.
        let escaped = prefix
            .replace('\\', "\\\\")
            .replace('%', "\\%")
            .replace('_', "\\_");
        conn.execute(
            "DELETE FROM app_settings WHERE key LIKE ?1 ESCAPE '\\'",
            [format!("{escaped}%")],
        )
        .context("Failed to delete settings by prefix")?;
        Ok(())
    }
}
