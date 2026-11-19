const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`API ${res.status}: ${msg}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("/health"),
  list: () => request("/todos"),
  create: (text) => request("/todos", { method: "POST", body: JSON.stringify({ text }) }),
  update: (id, data) => request(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id) => request(`/todos/${id}`, { method: "DELETE" }),
};