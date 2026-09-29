import { useState, type FormEvent } from "react";
import type { UiStrings } from "../i18n/ui";
import type { BackupInfo } from "../data/yandexSync";
import {
  checkYandexToken,
  getYandexToken,
  hasYandexToken,
  setYandexToken,
} from "../data/yandexSync";
import { changePassword, logout } from "../utils/auth";

type Props = {
  ui: UiStrings;
  onClose: () => void;
  onOpenLibrary: () => void;
  backups: BackupInfo[] | null;
  autoBackup: boolean;
  onRefreshBackups: () => Promise<void>;
  onCreateBackup: () => Promise<string>;
  onRestoreBackup: (name: string) => Promise<void>;
  onDeleteBackup: (name: string) => Promise<void>;
  onToggleAutoBackup: (on: boolean) => void;
};

/** Настройки: токен Яндекс.Диска, смена пароля, справочники, выход. */
export function SettingsDialog({
  ui,
  onClose,
  onOpenLibrary,
  backups,
  autoBackup,
  onRefreshBackups,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
  onToggleAutoBackup,
}: Props) {
  const [token, setToken] = useState(getYandexToken());
  const [tokenMessage, setTokenMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");

  function handleTokenSubmit(event: FormEvent) {
    event.preventDefault();
    setYandexToken(token);
    setTokenMessage(ui.tokenSaved);
    // Перезагрузка: хранилище заново подтянет данные уже с токеном.
    window.setTimeout(() => window.location.reload(), 600);
  }

  function handleTokenClear() {
    setYandexToken("");
    setToken("");
    setTokenMessage(ui.tokenSaved);
    window.setTimeout(() => window.location.reload(), 600);
  }

  async function handleTokenCheck() {
    setChecking(true);
    setTokenMessage("");
    const result = await checkYandexToken();
    setChecking(false);
    if (result === "ok") setTokenMessage(ui.tokenCheckOk);
    else if (result === "invalid") setTokenMessage(ui.tokenCheckInvalid);
    else if (result === "no-token") setTokenMessage(ui.tokenCheckNone);
    else setTokenMessage(ui.tokenCheckUnreachable);
  }

  async function withBackupBusy(action: () => Promise<string | void>, ok?: string) {
    setBackupBusy(true);
    setBackupMessage("");
    try {
      await action();
      if (ok) setBackupMessage(ok);
    } catch (error) {
      console.error(error);
      setBackupMessage(ui.backupError);
    } finally {
      setBackupBusy(false);
    }
  }

  function formatBackupDate(value: number | null): string {
    if (!value) return "";
    return new Date(value).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await changePassword(currentPassword, nextPassword);
    if (result === "ok") {
      setPasswordMessage(ui.passwordChanged);
      setCurrentPassword("");
      setNextPassword("");
    } else if (result === "wrong-current") {
      setPasswordMessage(ui.passwordWrong);
    } else {
      setPasswordMessage(ui.passwordWeak);
    }
  }

  function handleLogout() {
    logout();
    window.location.reload();
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-label={ui.settings}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 className="dialog-title">{ui.settings}</h2>
          <button type="button" className="btn" onClick={onClose}>
            {ui.close}
          </button>
        </div>

        <form className="dialog-section" onSubmit={handleTokenSubmit}>
          <label className="dialog-label" htmlFor="yandex-token">
            {ui.yandexTokenLabel}
          </label>
          <input
            id="yandex-token"
            type="password"
            className="dialog-input"
            placeholder={ui.tokenPlaceholder}
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="dialog-hint">{ui.yandexTokenHint}</p>
          <div className="dialog-actions">
            <a
              className="btn"
              href="https://yandex.ru/dev/disk/poligon/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {ui.tokenGet} ↗
            </a>
          </div>
          <div className="dialog-actions">
            <button type="submit" className="btn btn-primary">
              {ui.tokenSave}
            </button>
            <button
              type="button"
              className="btn"
              disabled={checking}
              onClick={handleTokenCheck}
            >
              {checking ? "…" : ui.tokenCheck}
            </button>
            {hasYandexToken() && (
              <button type="button" className="btn" onClick={handleTokenClear}>
                {ui.tokenClear}
              </button>
            )}
          </div>
          {tokenMessage && <p className="dialog-message ok">{tokenMessage}</p>}
        </form>

        <form className="dialog-section" onSubmit={handlePasswordSubmit}>
          <p className="dialog-label">{ui.changePassword}</p>
          <input
            type="password"
            className="dialog-input"
            placeholder={ui.currentPasswordLabel}
            aria-label={ui.currentPasswordLabel}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            className="dialog-input"
            placeholder={ui.newPasswordLabel}
            aria-label={ui.newPasswordLabel}
            autoComplete="new-password"
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
          />
          <div className="dialog-actions">
            <button type="submit" className="btn">
              {ui.changePasswordButton}
            </button>
          </div>
          {passwordMessage && <p className="dialog-message">{passwordMessage}</p>}
        </form>

        <div className="dialog-section">
          <p className="dialog-label">{ui.backupsTitle}</p>
          <label className="backup-auto">
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={(e) => onToggleAutoBackup(e.target.checked)}
            />
            <span>{ui.backupAuto}</span>
          </label>
          <p className="dialog-hint">{ui.backupAutoHint}</p>
          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={backupBusy || !hasYandexToken()}
              onClick={() =>
                withBackupBusy(async () => {
                  await onCreateBackup();
                }, ui.backupCreated)
              }
            >
              {ui.backupCreate}
            </button>
            <button
              type="button"
              className="btn"
              disabled={backupBusy}
              onClick={() => withBackupBusy(onRefreshBackups)}
            >
              ↻
            </button>
          </div>
          {backups === null ? null : backups.length === 0 ? (
            <p className="dialog-hint">{ui.backupNone}</p>
          ) : (
            <ul className="backup-list">
              {backups.map((backup) => (
                <li key={backup.name}>
                  <span className="backup-name" title={backup.name}>
                    {formatBackupDate(backup.modified) || backup.name}
                  </span>
                  <span className="backup-actions">
                    <button
                      type="button"
                      className="btn"
                      disabled={backupBusy}
                      title={ui.backupRestore}
                      onClick={() =>
                        withBackupBusy(
                          async () => {
                            await onRestoreBackup(backup.name);
                            onClose();
                          },
                          ui.backupRestored
                        )
                      }
                    >
                      {ui.backupRestore}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={backupBusy}
                      title={ui.backupDelete}
                      aria-label={ui.backupDelete}
                      onClick={() =>
                        withBackupBusy(() => onDeleteBackup(backup.name))
                      }
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {backupMessage && <p className="dialog-message ok">{backupMessage}</p>}
        </div>

        <div className="dialog-section">
          <button type="button" className="btn" onClick={onOpenLibrary}>
            {ui.tabLibrary} →
          </button>
        </div>

        <div className="dialog-section">
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            {ui.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
