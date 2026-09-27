import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

export function CartPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lineBusy, setLineBusy] = useState({});

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

  function setBusy(pid, v) {
    setLineBusy((b) => ({ ...b, [pid]: v }));
  }

  async function updateQty(productId, quantity) {
    const n = Number(quantity);
    if (!Number.isInteger(n) || n < 1) {
      setError("Quantity must be a whole number of at least 1");
      return;
    }
    setBusy(productId, true);
    setError("");
    try {
      const data = await api(`/api/cart/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: n }),
      });
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(productId, false);
    }
  }

  async function removeLine(productId) {
    setBusy(productId, true);
    setError("");
    try {
      const data = await api(`/api/cart/${productId}`, { method: "DELETE" });
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message || "Remove failed");
    } finally {
      setBusy(productId, false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Cart</h1>
      {error && <div className="error-banner">{error}</div>}
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/">Browse products</Link>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem" }}>
            {items.map((line) => (
              <li
                key={line.productId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr auto auto",
                  gap: "1rem",
                  alignItems: "center",
                  padding: "1rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
                className="cart-row"
              >
                <style>{`
                  @media (max-width: 640px) {
                    .cart-row {
                      grid-template-columns: 64px 1fr !important;
                    }
                    .cart-row .cart-actions { grid-column: 1 / -1; }
                  }
                `}</style>
                <img
                  src={line.image}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
                <div>
                  <strong>{line.name}</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    ${line.price.toFixed(2)} each
                  </div>
                  {line.outOfStock && (
                    <div className="field-error" style={{ marginTop: "0.35rem" }}>
                      Not enough stock — reduce quantity or remove
                    </div>
                  )}
                </div>
                <div className="cart-actions" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={line.stock}
                    style={{ width: 72 }}
                    defaultValue={line.quantity}
                    key={`${line.productId}-${line.quantity}`}
                    disabled={lineBusy[line.productId]}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (Number(v) !== line.quantity) {
                        updateQty(line.productId, v);
                      }
                    }}
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>${line.lineTotal.toFixed(2)}</div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}
                    disabled={lineBusy[line.productId]}
                    onClick={() => removeLine(line.productId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <p style={{ fontSize: "1.25rem", margin: 0 }}>
              Subtotal: <strong>${total.toFixed(2)}</strong>
              <span className="muted" style={{ fontSize: "0.9rem", marginLeft: "0.5rem" }}>
                (calculated on server)
              </span>
            </p>
            <Link to="/checkout" className="btn btn-primary" style={{ textDecoration: "none" }}>
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
