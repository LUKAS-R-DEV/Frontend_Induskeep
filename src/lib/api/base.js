// src/lib/api/base.js

// Define a URL base da API com fallback seguro
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");

export async function apiFetch(path, options = {}) {
  // Garante que o caminho comece com "/"
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;

  const token = localStorage.getItem("token");

  // Merge de headers
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    credentials: "include", // mantém compatibilidade com cookies/sessões
    ...options,
  };

  if (import.meta.env.DEV) {
    console.log(`📡 [API] ${fetchOptions.method} ${url}`, options.body || "");
  }

  try {
    const res = await fetch(url, fetchOptions);

    // Tenta interpretar a resposta como JSON, texto ou vazia
    const contentType = res.headers.get("content-type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else if (contentType.includes("text/")) {
      data = await res.text().catch(() => "");
    }

    // Lida com erros HTTP
    if (!res.ok) {
      const message =
        (data && (data.error || data.message)) ||
        `Erro ${res.status}: ${res.statusText || "Erro desconhecido"}`;

      if (import.meta.env.DEV) {
        console.error("❌ [API Error]", message, { url, status: res.status, data });
      }

      throw new Error(message);
    }

    return data;
  } catch (err) {
    console.error("🚨 [API Fetch Falhou]", err.message || err);
    throw new Error("Falha na comunicação com o servidor. Tente novamente.");
  }
}
