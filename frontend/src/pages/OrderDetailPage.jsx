import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>{status}</span>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error || !order) {
    return (
      <div>
        <div className="error-banner">{error || "Order not found"}</div>
        <Link to="/orders">← Orders</Link>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div style={{ maxWidth: 640 }}>
      <p className="muted">
        <Link to="/orders">← Order history</Link>
      </p>
      <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        Order #{order.id.slice(-8)}
        <StatusBadge status={order.status} />
      </h1>
      <p className="muted">
        Placed {new Date(order.createdAt).toLocaleString()}
      </p>

      {addr && (
        <section
          style={{
            margin: "1.5rem 0",
            padding: "1rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
          <h2 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>Shipping address</h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {addr.fullName}
            <br />
            {addr.line1}
            {addr.line2 && (
              <>
                <br />
                {addr.line2}
              </>
            )}
            <br />
            {addr.city}
            {addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
            <br />
            {addr.country}
          </p>
          {order.shippingRegion && (
            <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              Zone: {order.shippingRegion}
            </p>
          )}
        </section>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {order.items.map((it, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {it.image && (
              <img
                src={it.image}
                alt=""
                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <strong>{it.name}</strong>
              <div className="muted">
                {it.quantity} × ${it.price.toFixed(2)}
              </div>
            </div>
            <div>${(it.price * it.quantity).toFixed(2)}</div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "1rem", lineHeight: 1.8 }}>
        <div>Subtotal: ${order.subtotal?.toFixed(2)}</div>
        {order.discountAmount > 0 && (
          <div>Discount{order.couponCode ? ` (${order.couponCode})` : ""}: −$
            {order.discountAmount.toFixed(2)}
          </div>
        )}
        <div>Shipping: ${order.shippingCost?.toFixed(2)}</div>
        <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
          Total: ${order.total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
