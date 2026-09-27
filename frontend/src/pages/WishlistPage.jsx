import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";
import { StarRating } from "../components/StarRating.jsx";

export function WishlistPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/wishlist")
      .then((d) => setProducts(d.products || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function remove(productId) {
    const data = await api(`/api/wishlist/${productId}`, { method: "DELETE" });
    setProducts(data.products || []);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Wishlist</h1>
      {error && <div className="error-banner">{error}</div>}
      {products.length === 0 ? (
        <div className="empty-state">
          <p>Your wishlist is empty.</p>
          <Link to="/">Browse products</Link>
        </div>
      ) : (
        <div className="card-grid">
          {products.map((p) => (
            <article key={p.id} className="card">
              <Link to={`/products/${p.id}`}>
                <img
                  src={p.image}
                  alt=""
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
                />
              </Link>
              <div className="card-body">
                <Link to={`/products/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  <h2 className="card-title">{p.name}</h2>
                </Link>
                <p className="card-price">${p.price.toFixed(2)}</p>
                {p.ratingCount > 0 && <StarRating value={p.ratingAvg} size="0.85rem" />}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => remove(p.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
