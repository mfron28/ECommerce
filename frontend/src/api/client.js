const base =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

function getToken() {
  return localStorage.getItem("token");
}

export async function api(path, options = {}) {
  const { token, skipAuth, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const authToken = token ?? getToken();
  if (!skipAuth && authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let res;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error("Network error — is the API running?");
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { status: "error", message: text || "Invalid response" };
  }
  if (!res.ok) {
    const msg =
      data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
