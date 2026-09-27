import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "../components/Spinner.jsx";

export function VerifyEmailPage() {
  const [search] = useSearchParams();
  const { refreshUser, login } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = search.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token");
      return;
    }
    api(`/api/verify-email?token=${encodeURIComponent(token)}`, { skipAuth: true })
      .then(async (data) => {
        setStatus("ok");
        setMessage(data.message || "Email verified");
        const t = localStorage.getItem("token");
        if (t && data.user) {
          login(t, data.user);
        }
        await refreshUser();
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [search, refreshUser, login]);

  if (status === "loading") return <Spinner />;

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <h1 className="page-title">Email verification</h1>
      {status === "ok" ? (
        <p style={{ color: "var(--success)" }}>{message}</p>
      ) : (
        <div className="error-banner">{message}</div>
      )}
      <p style={{ marginTop: "1.5rem" }}>
        <Link to="/profile">Go to profile</Link>
      </p>
    </div>
  );
}
