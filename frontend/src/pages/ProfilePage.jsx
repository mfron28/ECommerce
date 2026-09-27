import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isValidEmail } from "../utils/validation.js";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function changePassword(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/profile/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMsg("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setErr(error.message);
    }
  }

  async function requestEmailChange(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!isValidEmail(newEmail)) {
      setErr("Invalid email");
      return;
    }
    try {
      await api("/api/profile/request-email-change", {
        method: "POST",
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      setMsg("Verification link sent to your new email (check server logs if email is not configured)");
      await refreshUser();
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="page-title">Profile</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Signed in as <strong>{user?.email}</strong>
        {user?.pendingEmail && (
          <> — pending change to <strong>{user.pendingEmail}</strong></>
        )}
      </p>
      {msg && <p style={{ color: "var(--success)", marginBottom: "1rem" }}>{msg}</p>}
      {err && <div className="error-banner">{err}</div>}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Change password</h2>
        <form onSubmit={changePassword}>
          <div className="form-group">
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Update password
          </button>
        </form>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Change email</h2>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          We send a verification link to the new address.
        </p>
        <form onSubmit={requestEmailChange}>
          <div className="form-group">
            <label className="label">New email</label>
            <input
              type="email"
              className="input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send verification
          </button>
        </form>
      </section>

      <p>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </div>
  );
}
