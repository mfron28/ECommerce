import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api("/api/orders")
      .then((data) => {
        if (!cancelled) setOrders(data.orders || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Order history</h1>
      {error && <div className="error-banner">{error}</div>}
      {!error && orders.length === 0 && (
        <div className="empty-state">
          <p>You have not placed any orders yet.</p>
          <Link to="/">Start shopping</Link>
        </div>
      )}
      {!error &&
        orders.length > 0 &&
        orders.map((o) => (
          <article
            key={o.id}
            className="card"
            style={{ marginBottom: "1.25rem", padding: "1.25rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <span className="muted">Order #{o.id.slice(-8)}</span>
              <span className="muted">{formatDate(o.createdAt)}</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
              {o.items.map((it, i) => (
                <li
                  key={`${o.id}-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.35rem 0",
                    fontSize: "0.95rem",
                  }}
                >
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span>${(it.price * it.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div style={{ fontWeight: 700, color: "var(--accent)" }}>
              Total: ${o.total.toFixed(2)}
            </div>
          </article>
        ))}
    </div>
  );
}
