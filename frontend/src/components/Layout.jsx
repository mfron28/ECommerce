import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            padding: "1rem 0",
          }}
        >
          <Link
            to="/"
            style={{
              fontWeight: 700,
              fontSize: "1.15rem",
              color: "var(--text)",
              textDecoration: "none",
            }}
          >
            Shop
          </Link>
          <nav style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? "var(--accent)" : "var(--muted)",
                textDecoration: "none",
                fontWeight: 500,
              })}
            >
              Products
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink
                  to="/cart"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    textDecoration: "none",
                    fontWeight: 500,
                  })}
                >
                  Cart
                </NavLink>
                <NavLink
                  to="/orders"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    textDecoration: "none",
                    fontWeight: 500,
                  })}
                >
                  Orders
                </NavLink>
              </>
            )}
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-ghost" style={{ textDecoration: "none" }}>
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Register
                </Link>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {user?.email}
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => logout()}>
                  Log out
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, padding: "2rem 0" }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "1rem",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        E-commerce demo — API-driven cart &amp; checkout
      </footer>
    </div>
  );
}
