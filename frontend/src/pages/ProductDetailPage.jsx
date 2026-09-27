import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { StarRating } from "../components/StarRating.jsx";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState("");
  const [cartMsg, setCartMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  function loadProduct() {
    return api(`/api/products/${id}`, { skipAuth: !isAuthenticated }).then(
      (data) => {
        setProduct(data.product);
        setActiveImage(0);
      }
    );
  }

  function loadReviews() {
    return api(`/api/products/${id}/reviews`, { skipAuth: true }).then((data) =>
      setReviews(data.reviews || [])
    );
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([loadProduct(), loadReviews()])
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  const images =
    product?.images?.length > 0
      ? product.images
      : product?.image
        ? [product.image]
        : [];
  const maxQty = product?.stock ?? 0;
  const outOfStock = maxQty < 1;

  async function addToCart() {
    setCartMsg("");
    setQtyError("");
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) {
      setQtyError("Quantity must be at least 1");
      return;
    }
    if (n > maxQty) {
      setQtyError(`Only ${maxQty} available`);
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

  async function toggleWishlist() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setWishlistBusy(true);
    try {
      if (product.inWishlist) {
        await api(`/api/wishlist/${id}`, { method: "DELETE" });
        setProduct((p) => ({ ...p, inWishlist: false }));
      } else {
        await api(`/api/wishlist/${id}`, { method: "POST" });
        setProduct((p) => ({ ...p, inWishlist: true }));
      }
    } catch (err) {
      setCartMsg(err.message);
    } finally {
      setWishlistBusy(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setReviewMsg("");
    try {
      await api(`/api/products/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      setReviewComment("");
      await Promise.all([loadProduct(), loadReviews()]);
      setReviewMsg("Review submitted");
    } catch (err) {
      setReviewMsg(err.message);
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
    <div>
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
            className="gallery-main"
            src={images[activeImage] || product.image}
            alt=""
          />
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`gallery-thumb ${i === activeImage ? "active" : ""}`}
                  onClick={() => setActiveImage(i)}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 0.5rem" }}>
            <Link to="/">Products</Link> / {product.category}
          </p>
          <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
            {product.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <StarRating value={product.ratingAvg} />
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              {product.ratingCount > 0
                ? `${product.ratingAvg} (${product.ratingCount} reviews)`
                : "No reviews yet"}
            </span>
          </div>
          <p className="card-price" style={{ fontSize: "1.5rem", margin: "0 0 1rem" }}>
            ${product.price.toFixed(2)}
          </p>
          <span
            className={`stock-badge ${outOfStock ? "stock-out" : "stock-ok"}`}
          >
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </span>
          <p style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: "1rem" }}>
            {product.description}
          </p>

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
              style={{ maxWidth: 120 }}
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
            <button
              type="button"
              className="btn"
              disabled={wishlistBusy}
              onClick={toggleWishlist}
            >
              {product.inWishlist ? "♥ In wishlist" : "♡ Add to wishlist"}
            </button>
            <Link to="/cart" className="btn btn-ghost" style={{ textDecoration: "none" }}>
              View cart
            </Link>
          </div>
          {cartMsg && (
            <p
              style={{
                marginTop: "1rem",
                color: cartMsg.includes("Added") || cartMsg.includes("wishlist")
                  ? "var(--success)"
                  : "var(--danger)",
              }}
            >
              {cartMsg}
            </p>
          )}
        </div>
      </div>

      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Reviews</h2>
        {isAuthenticated && (
          <form
            onSubmit={submitReview}
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <div className="form-group">
              <label className="label">Rating</label>
              <select
                className="input"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                style={{ maxWidth: 120 }}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Comment</label>
              <textarea
                className="input"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                minLength={3}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Submit review
            </button>
            {reviewMsg && (
              <p style={{ marginTop: "0.75rem", color: "var(--muted)" }}>{reviewMsg}</p>
            )}
          </form>
        )}
        {reviews.length === 0 ? (
          <p className="muted">No reviews yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {reviews.map((r) => (
              <li
                key={r.id}
                style={{
                  padding: "1rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <StarRating value={r.rating} size="0.9rem" />
                <p style={{ margin: "0.5rem 0" }}>{r.comment}</p>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {r.userEmail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
