import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

export function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return api("/api/cart")
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => {
        setError(err.message || "Failed to load cart");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasBlockingStock = items.some((l) => l.outOfStock);

  async function placeOrder() {
    setError("");
    if (!items.length) {
      setError("Your cart is empty");
      return;
    }
    if (hasBlockingStock) {
      setError("Resolve stock issues in your cart before checkout");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/orders", { method: "POST", body: "{}" });
      navigate("/orders", { replace: true });
    } catch (err) {
      setError(err.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="page-title">Checkout</h1>
      {error && <div className="error-banner">{error}</div>}
      {!items.length ? (
        <div className="empty-state">
          <p>Your cart is empty — nothing to checkout.</p>
          <Link to="/">Browse products</Link>
        </div>
      ) : (
        <>
          <p className="muted">
            Orders use server-validated prices and stock. Your cart total is{" "}
            <strong>${total.toFixed(2)}</strong>.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0" }}>
            {items.map((line) => (
              <li
                key={line.productId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.65rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span>
                  {line.name} × {line.quantity}
                  {line.outOfStock && (
                    <span className="field-error" style={{ display: "block" }}>
                      Out of stock
                    </span>
                  )}
                </span>
                <span>${line.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || hasBlockingStock}
            onClick={placeOrder}
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
          {hasBlockingStock && (
            <p className="muted" style={{ marginTop: "1rem" }}>
              Update quantities in your <Link to="/cart">cart</Link> first.
            </p>
          )}
        </>
      )}
    </div>
  );
}
