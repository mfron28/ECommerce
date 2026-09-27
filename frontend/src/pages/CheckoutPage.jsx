import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

const emptyAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [regions, setRegions] = useState({});
  const [shippingRegion, setShippingRegion] = useState("US");
  const [shippingCost, setShippingCost] = useState(9.99);
  const [address, setAddress] = useState(emptyAddress);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return api("/api/cart")
      .then((data) => {
        setItems(data.items || []);
        setSubtotal(data.subtotal ?? data.total ?? 0);
        if (data.stockHoldExpiresAt) {
          setHoldExpiresAt(new Date(data.stockHoldExpiresAt));
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load cart");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    api("/api/checkout/shipping-regions")
      .then((d) => setRegions(d.regions || {}))
      .catch(() => {});
  }, [refresh]);

  useEffect(() => {
    const row = regions[shippingRegion];
    if (row) setShippingCost(row.cost);
  }, [shippingRegion, regions]);

  useEffect(() => {
    if (!items.length) return;
    api("/api/checkout/reserve", { method: "POST" })
      .then((d) => setHoldExpiresAt(new Date(d.expiresAt)))
      .catch((err) => setError(err.message));
  }, [items.length]);

  const total = Math.max(0, subtotal - discount + shippingCost);
  const hasBlockingStock = items.some((l) => l.outOfStock);

  async function applyCoupon() {
    setCouponMsg("");
    try {
      const data = await api("/api/checkout/validate-coupon", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      setDiscount(data.coupon.discountAmount);
      setCouponMsg(`Applied: −$${data.coupon.discountAmount.toFixed(2)}`);
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err.message);
    }
  }

  async function placeOrder() {
    setError("");
    if (!items.length) {
      setError("Your cart is empty");
      return;
    }
    if (hasBlockingStock) {
      setError("Resolve stock issues in your cart first");
      return;
    }
    if (!holdExpiresAt || holdExpiresAt < new Date()) {
      setError("Stock reservation expired — refresh this page");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: address,
          shippingRegion,
          couponCode: couponCode.trim() || undefined,
        }),
      });
      navigate(`/orders/${data.order.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="page-title">Checkout</h1>
      {error && <div className="error-banner">{error}</div>}
      {holdExpiresAt && (
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Stock reserved until {holdExpiresAt.toLocaleTimeString()}
        </p>
      )}
      {!items.length ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/">Browse products</Link>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Shipping address</h2>
          <div className="form-group">
            <label className="label">Full name</label>
            <input
              className="input"
              value={address.fullName}
              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Address line 1</label>
            <input
              className="input"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Address line 2</label>
            <input
              className="input"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group">
              <label className="label">City</label>
              <input
                className="input"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">State / region</label>
              <input
                className="input"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group">
              <label className="label">Postal code</label>
              <input
                className="input"
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Country</label>
              <input
                className="input"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Shipping zone</label>
            <select
              className="input"
              value={shippingRegion}
              onChange={(e) => setShippingRegion(e.target.value)}
            >
              {Object.entries(regions).map(([code, r]) => (
                <option key={code} value={code}>
                  {r.label} — ${r.cost.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: "1.5rem" }}>
            <label className="label">Coupon code</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="input"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="SAVE10, FLAT5…"
              />
              <button type="button" className="btn" onClick={applyCoupon}>
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className="muted" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
                {couponMsg}
              </p>
            )}
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0" }}>
            {items.map((line) => (
              <li
                key={line.productId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>${line.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div style={{ fontSize: "0.95rem", lineHeight: 1.8 }}>
            <div>Subtotal: ${subtotal.toFixed(2)}</div>
            {discount > 0 && <div>Discount: −${discount.toFixed(2)}</div>}
            <div>Shipping: ${shippingCost.toFixed(2)}</div>
            <div style={{ fontWeight: 700, fontSize: "1.15rem", marginTop: "0.5rem" }}>
              Total: ${total.toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: "1.25rem" }}
            disabled={submitting || hasBlockingStock}
            onClick={placeOrder}
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </>
      )}
    </div>
  );
}
