import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { isValidEmail } from "../utils/validation.js";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!isValidEmail(email)) {
      setErr("Invalid email");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/forgot-password", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email: email.trim() }),
      });
      setMsg(data.message);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1 className="page-title">Forgot password</h1>
      <p className="muted">
        Enter your email. If an account exists, you will receive a reset link (or see it in the API
        server logs when email is not configured).
      </p>
      {msg && <p style={{ color: "var(--success)", marginTop: "1rem" }}>{msg}</p>}
      {err && <div className="error-banner">{err}</div>}
      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        <div className="form-group">
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}
