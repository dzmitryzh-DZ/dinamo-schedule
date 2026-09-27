import { useState, type FormEvent } from "react";
import { getUi } from "../i18n/ui";
import { readLang } from "../hooks/useScheduleStore";
import { checkPassword, markAuthenticated } from "../utils/auth";
import zubrLogoUrl from "../assets/zubr-logo.png";

type Props = {
  onSuccess: () => void;
};

/** Полноэкранный вход по паролю. */
export function LoginGate({ onSuccess }: Props) {
  const ui = getUi(readLang());
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await checkPassword(password);
    setBusy(false);
    if (!ok) {
      setError(true);
      setPassword("");
      return;
    }
    markAuthenticated();
    onSuccess();
  }

  return (
    <div className="login-screen">
      <form className={`login-card${error ? " has-error" : ""}`} onSubmit={handleSubmit}>
        <img
          className="login-logo"
          src={zubrLogoUrl}
          alt="HC Dinamo-Minsk"
        />
        <h1 className="login-title">{ui.loginTitle}</h1>
        <p className="login-subtitle">{ui.loginSubtitle}</p>
        <input
          type="password"
          className="login-input"
          placeholder={ui.passwordLabel}
          aria-label={ui.passwordLabel}
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
        />
        {error && <p className="login-error">{ui.loginError}</p>}
        <button type="submit" className="btn btn-primary login-button" disabled={busy}>
          {ui.loginButton}
        </button>
      </form>
    </div>
  );
}
