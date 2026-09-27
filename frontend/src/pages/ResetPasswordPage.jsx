import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";

export function ResetPasswordPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = search.get("token") || "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!token) {
      setErr("Missing reset token");
      return;
    }
    setLoading(true);
    try {
      await api("/api/reset-password", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ token, password }),
      });
      navigate("/login", { replace: true });
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1 className="page-title">Reset password</h1>
      {!token && <div className="error-banner">Invalid reset link</div>}
      {err && <div className="error-banner">{err}</div>}
      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        <div className="form-group">
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !token}>
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
