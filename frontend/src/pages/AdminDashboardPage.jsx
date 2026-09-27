import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Spinner } from "../components/Spinner.jsx";

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "Electronics",
  image: "",
  images: "",
  lowStockThreshold: 5,
};

const emptyCoupon = {
  code: "",
  type: "percent",
  value: 10,
  active: true,
  minSubtotal: 0,
  expiresAt: "",
};

export function AdminDashboardPage() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState(null);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [couponEditId, setCouponEditId] = useState(null);

  async function loadOverview() {
    const [stats, stock] = await Promise.all([
      api("/api/admin/stats?period=week"),
      api("/api/admin/products/low-stock"),
    ]);
    setSummary(stats.summary);
    setLowStock(stock.products || []);
  }

  async function loadProducts() {
    const d = await api("/api/admin/products");
    setProducts(d.products || []);
  }

  async function loadOrders() {
    const d = await api("/api/admin/orders");
    setOrders(d.orders || []);
  }

  async function loadCoupons() {
    const d = await api("/api/admin/coupons");
    setCoupons(d.coupons || []);
  }

  useEffect(() => {
    setLoading(true);
    setError("");
    const loaders = {
      overview: loadOverview,
      products: loadProducts,
      orders: loadOrders,
      coupons: loadCoupons,
    };
    (loaders[tab] || loadOverview)()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  async function saveProduct(e) {
    e.preventDefault();
    const images = form.images
      ? form.images.split("\n").map((s) => s.trim()).filter(Boolean)
      : form.image
        ? [form.image]
        : [];
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      image: images[0] || form.image,
      images,
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    if (editId) {
      await api(`/api/admin/products/${editId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } else {
      await api("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
    }
    setForm(emptyProduct);
    setEditId(null);
    await loadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

  async function updateOrderStatus(id, status) {
    await api(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadOrders();
  }

  function couponPayload() {
    return {
      code: couponForm.code.trim(),
      type: couponForm.type,
      value: Number(couponForm.value),
      active: Boolean(couponForm.active),
      minSubtotal: Number(couponForm.minSubtotal) || 0,
      expiresAt: couponForm.expiresAt
        ? new Date(couponForm.expiresAt).toISOString()
        : null,
    };
  }

  async function saveCoupon(e) {
    e.preventDefault();
    setError("");
    try {
      const body = couponPayload();
      if (couponEditId) {
        await api(`/api/admin/coupons/${couponEditId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/coupons", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setCouponForm(emptyCoupon);
      setCouponEditId(null);
      await loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleCouponActive(coupon) {
    setError("");
    try {
      await api(`/api/admin/coupons/${coupon._id}`, {
        method: "PUT",
        body: JSON.stringify({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          active: !coupon.active,
          minSubtotal: coupon.minSubtotal ?? 0,
          expiresAt: coupon.expiresAt || null,
        }),
      });
      await loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCoupon(id) {
    if (!confirm("Delete this coupon?")) return;
    setError("");
    try {
      await api(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (couponEditId === id) {
        setCouponEditId(null);
        setCouponForm(emptyCoupon);
      }
      await loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditCoupon(c) {
    setCouponEditId(c._id);
    setCouponForm({
      code: c.code,
      type: c.type,
      value: c.value,
      active: c.active,
      minSubtotal: c.minSubtotal ?? 0,
      expiresAt: c.expiresAt
        ? new Date(c.expiresAt).toISOString().slice(0, 10)
        : "",
    });
  }

  const tabs = ["overview", "products", "orders", "coupons"];

  return (
    <div>
      <h1 className="page-title">Admin dashboard</h1>
      <div className="admin-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          {tab === "overview" && summary && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "1rem",
                  marginBottom: "2rem",
                }}
              >
                <div className="card" style={{ padding: "1rem" }}>
                  <div className="muted">Revenue (7d)</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                    ${summary.revenue.toFixed(2)}
                  </div>
                </div>
                <div className="card" style={{ padding: "1rem" }}>
                  <div className="muted">Orders (7d)</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                    {summary.orderCount}
                  </div>
                </div>
              </div>
              {summary.byDay?.length > 0 && (
                <div className="table-wrap" style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1rem" }}>Daily sales</h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byDay.map((d) => (
                        <tr key={d.date}>
                          <td>{d.date}</td>
                          <td>{d.orders}</td>
                          <td>${d.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <h2 style={{ fontSize: "1rem" }}>Low stock alerts</h2>
              {lowStock.length === 0 ? (
                <p className="muted">All products adequately stocked.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Stock</th>
                        <th>Threshold</th>
                        <th>Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((p) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.stock}</td>
                          <td>{p.lowStockThreshold}</td>
                          <td>
                            <span
                              className={
                                p.alert === "out_of_stock" ? "stock-out stock-badge" : "stock-badge stock-ok"
                              }
                            >
                              {p.alert === "out_of_stock" ? "Out of stock" : "Low stock"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "products" && (
            <div>
              <form
                onSubmit={saveProduct}
                style={{
                  marginBottom: "2rem",
                  padding: "1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <h2 style={{ fontSize: "1rem" }}>
                  {editId ? "Edit product" : "Add product"}
                </h2>
                <div className="form-group">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Stock</label>
                    <input
                      type="number"
                      className="input"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Low stock at</label>
                    <input
                      type="number"
                      className="input"
                      value={form.lowStockThreshold}
                      onChange={(e) =>
                        setForm({ ...form, lowStockThreshold: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Category</label>
                  <input
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Image URLs (one per line)</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  {editId ? "Update" : "Create"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginLeft: "0.5rem" }}
                    onClick={() => {
                      setEditId(null);
                      setForm(emptyProduct);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>${p.price.toFixed(2)}</td>
                        <td>{p.stock}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                              setEditId(p.id);
                              setForm({
                                name: p.name,
                                description: p.description,
                                price: p.price,
                                stock: p.stock,
                                category: p.category,
                                image: p.image,
                                images: (p.images || []).join("\n"),
                                lowStockThreshold: p.lowStockThreshold,
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => deleteProduct(p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>#{o.id.slice(-8)}</td>
                      <td>{o.userEmail}</td>
                      <td>${o.total.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge status-${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="input"
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                          style={{ maxWidth: 130 }}
                        >
                          <option value="pending">pending</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "coupons" && (
            <div>
              <form
                onSubmit={saveCoupon}
                style={{
                  marginBottom: "2rem",
                  padding: "1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <h2 style={{ fontSize: "1rem" }}>
                  {couponEditId ? "Edit coupon" : "Add coupon"}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="label">Code</label>
                    <input
                      className="input"
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                      }
                      placeholder="SAVE10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Type</label>
                    <select
                      className="input"
                      value={couponForm.type}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, type: e.target.value })
                      }
                    >
                      <option value="percent">Percent off</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">
                      Value {couponForm.type === "percent" ? "(%)" : "($)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={couponForm.type === "percent" ? 100 : undefined}
                      className="input"
                      value={couponForm.value}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, value: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Min subtotal ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="input"
                      value={couponForm.minSubtotal}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, minSubtotal: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Expires (optional)</label>
                    <input
                      type="date"
                      className="input"
                      value={couponForm.expiresAt}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, expiresAt: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Active</label>
                    <select
                      className="input"
                      value={couponForm.active ? "yes" : "no"}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          active: e.target.value === "yes",
                        })
                      }
                    >
                      <option value="yes">Active</option>
                      <option value="no">Inactive</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  {couponEditId ? "Update coupon" : "Create coupon"}
                </button>
                {couponEditId && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginLeft: "0.5rem" }}
                    onClick={() => {
                      setCouponEditId(null);
                      setCouponForm(emptyCoupon);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>

              {coupons.length === 0 ? (
                <p className="muted">No coupons yet. Create one above.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min</th>
                        <th>Expires</th>
                        <th>Active</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((c) => (
                        <tr key={c._id}>
                          <td>
                            <strong>{c.code}</strong>
                          </td>
                          <td>{c.type}</td>
                          <td>
                            {c.type === "percent" ? `${c.value}%` : `$${c.value}`}
                          </td>
                          <td>${Number(c.minSubtotal).toFixed(2)}</td>
                          <td className="muted">
                            {c.expiresAt
                              ? new Date(c.expiresAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(c.active)}
                                onChange={() => toggleCouponActive(c)}
                              />
                              {c.active ? "Active" : "Inactive"}
                            </label>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => startEditCoupon(c)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => deleteCoupon(c._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
