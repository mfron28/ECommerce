import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/orders")
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
                marginBottom: "0.75rem",
              }}
            >
              <Link to={`/orders/${o.id}`} style={{ fontWeight: 600 }}>
                Order #{o.id.slice(-8)}
              </Link>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <StatusBadge status={o.status} />
                <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <p className="muted" style={{ margin: "0 0 0.5rem" }}>
              {o.items.length} item(s)
            </p>
            <div style={{ fontWeight: 700, color: "var(--accent)" }}>
              Total: ${o.total.toFixed(2)}
            </div>
            <Link
              to={`/orders/${o.id}`}
              style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.9rem" }}
            >
              View details →
            </Link>
          </article>
        ))}
    </div>
  );
}
