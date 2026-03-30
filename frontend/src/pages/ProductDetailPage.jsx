import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "../components/Spinner.jsx";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState("");
  const [cartMsg, setCartMsg] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api(`/api/products/${id}`, { skipAuth: true })
      .then((data) => {
        if (!cancelled) setProduct(data.product);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const maxQty = product?.stock ?? 0;
  const outOfStock = maxQty < 1;

  async function addToCart() {
    setCartMsg("");
    setQtyError("");
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) {
      setQtyError("Quantity must be a whole number of at least 1");
      return;
    }
    if (n > maxQty) {
      setQtyError(`Only ${maxQty} available in stock`);
      return;
    }
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    setAdding(true);
    try {
      await api("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: id, quantity: n }),
      });
      setCartMsg("Added to cart");
    } catch (err) {
      setCartMsg(err.message || "Could not add to cart");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <Spinner />;
  if (error || !product) {
    return (
      <div>
        <div className="error-banner">{error || "Product not found"}</div>
        <Link to="/">← Back to products</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "2rem",
        alignItems: "start",
      }}
      className="product-detail-grid"
    >
      <style>{`
        @media (max-width: 720px) {
          .product-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div>
        <img
          src={product.image}
          alt=""
          style={{
            width: "100%",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        />
      </div>
      <div>
        <p className="muted" style={{ margin: "0 0 0.5rem" }}>
          <Link to="/">Products</Link> / {product.category}
        </p>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          {product.name}
        </h1>
        <p className="card-price" style={{ fontSize: "1.5rem", margin: "0 0 1rem" }}>
          ${product.price.toFixed(2)}
        </p>
        <span
          className={`stock-badge ${outOfStock ? "stock-out" : "stock-ok"}`}
          style={{ marginBottom: "1rem" }}
        >
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </span>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{product.description}</p>

        <div style={{ marginTop: "1.5rem" }}>
          <label className="label" htmlFor="detail-qty">
            Quantity
          </label>
          <input
            id="detail-qty"
            className="input"
            type="number"
            min={1}
            max={Math.max(1, maxQty)}
            disabled={outOfStock}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={{ maxWidth: 120, marginBottom: "0.5rem" }}
          />
          {qtyError && <div className="field-error">{qtyError}</div>}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={outOfStock || adding}
            onClick={addToCart}
          >
            {adding ? "Adding…" : "Add to cart"}
          </button>
          <Link to="/cart" className="btn" style={{ textDecoration: "none" }}>
            View cart
          </Link>
        </div>
        {cartMsg && (
          <p
            style={{
              marginTop: "1rem",
              color: cartMsg.includes("Added") ? "var(--success)" : "var(--danger)",
            }}
          >
            {cartMsg}
          </p>
        )}
      </div>
    </div>
  );
}
