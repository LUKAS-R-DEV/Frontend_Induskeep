// src/lib/api/export.js

// Base da API com fallback seguro (alinhado com base.js)
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");

export const ExportApi = {
  async download(module, format = "pdf") {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_URL}/export/${module}?format=${format}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Falha ao exportar relatório.");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
