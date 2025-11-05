import { feedback } from "$lib/stores/feedback.stores.js";

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

  // 💠 Início do loading global (exceto se `silent: true` ou `skipFeedback: true`)
  if (!options.silent && !options.skipFeedback) {
    feedback.set({
      show: true,
      type: "loading",
      message: "Processando solicitação...",
    });
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

      // ⏹️ Finaliza o loading primeiro (apenas se foi mostrado)
      if (!options.silent && !options.skipFeedback) {
        setTimeout(() => feedback.set({ show: false }), 100);
      }

      // 🔴 Mostra modal de erro global apenas se não for silencioso
      // Para erros de autenticação (401), não mostra modal global - deixa a página tratar
      if (!options.silent && !options.skipFeedback) {
        // Aguarda um pouco para o loading fechar antes de mostrar o erro
        setTimeout(() => {
          feedback.set({
            show: true,
            type: "error",
            title: res.status === 401 ? "Credenciais inválidas" : "Erro",
            message,
          });
        }, 200);
      }

      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Se já é um erro HTTP que foi tratado acima, apenas re-lança
    if (err.status) {
      throw err;
    }

    console.error("🚨 [API Fetch Falhou]", err.message || err);

    // ⏹️ Finaliza o loading primeiro (apenas se foi mostrado)
    if (!options.silent && !options.skipFeedback) {
      setTimeout(() => feedback.set({ show: false }), 100);
    }

    // 🔴 Mostra modal de falha de conexão apenas se não for silencioso
    // E apenas se for realmente um erro de rede (não HTTP)
    if (!options.silent && !options.skipFeedback) {
      setTimeout(() => {
        feedback.set({
          show: true,
          type: "error",
          title: "Falha de conexão",
          message: "Não foi possível comunicar-se com o servidor. Verifique sua conexão e tente novamente.",
        });
      }, 200);
    }

    throw err;
  } finally {
    // ⏹️ Finaliza o loading apenas se a requisição foi bem-sucedida
    // (os erros já fecharam o loading antes)
    if (!options.silent && !options.hideLoading) {
      // Se chegou aqui, a requisição foi bem-sucedida
      setTimeout(() => feedback.set({ show: false }), 300);
    }
  }
}
