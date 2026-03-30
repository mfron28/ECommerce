import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

export function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    api("/api/products", { skipAuth: true })
      .then((data) => {
        const set = new Set((data.products || []).map((p) => p.category));
        setAllCategories([...set].sort());
      })
      .catch(() => {
        /* catalog fetch for categories is best-effort */
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (minPrice !== "") params.set("minPrice", minPrice);
    if (maxPrice !== "") params.set("maxPrice", maxPrice);
    const qs = params.toString();
    const path = qs ? `/api/products?${qs}` : "/api/products";

    let cancelled = false;
    setLoading(true);
    setError("");
    api(path, { skipAuth: true })
      .then((data) => {
        if (!cancelled) setProducts(data.products || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, category, minPrice, maxPrice]);

  return (
    <div>
      <h1 className="page-title">Products</h1>
      <div className="filters">
        <div className="form-group" style={{ flex: "1 1 200px" }}>
          <label className="label" htmlFor="search-q">
            Search
          </label>
          <input
            id="search-q"
            className="input"
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="filter-cat">
            Category
          </label>
          <select
            id="filter-cat"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label" htmlFor="min-p">
            Min price
          </label>
          <input
            id="min-p"
            className="input"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="max-p">
            Max price
          </label>
          <input
            id="max-p"
            className="input"
            type="number"
            min={0}
            step="0.01"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {loading && <Spinner />}
      {error && !loading && <div className="error-banner">{error}</div>}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>No products match your filters.</p>
          <p className="muted">Try clearing search or price range.</p>
        </div>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="card-grid">
          {products.map((p) => (
            <article key={p.id} className="card">
              <Link to={`/products/${p.id}`} style={{ display: "block" }}>
                <img
                  src={p.image}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    objectFit: "cover",
                    background: "var(--bg)",
                  }}
                />
              </Link>
              <div className="card-body">
                <Link
                  to={`/products/${p.id}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <h2 className="card-title">{p.name}</h2>
                </Link>
                <p className="card-price">${p.price.toFixed(2)}</p>
                <span
                  className={`stock-badge ${p.stock > 0 ? "stock-ok" : "stock-out"}`}
                >
                  {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
