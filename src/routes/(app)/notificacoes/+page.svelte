<script>
  import "$lib/styles/notificacoes.css";
  import { onMount } from "svelte";
  import { NotificationsApi } from "$lib/api/notifications";

  let loading = true;
  let notificacoes = [];
  let error = "";

  let filtros = {
    tipo: "all",
    status: "all",
    periodo: "all"
  };

  onMount(async () => {
    try {
      notificacoes = await NotificationsApi.list();
    } catch (err) {
      error = "Erro ao carregar notificações.";
      console.error(err);
    } finally {
      loading = false;
    }
  });

  async function marcarComoLida(id) {
    try {
      await NotificationsApi.markAsRead(id);
      notificacoes = notificacoes.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
    } catch (err) {
      alert("Erro ao marcar como lida.");
    }
  }

  async function marcarTodasLidas() {
    for (const n of notificacoes.filter((n) => !n.read)) {
      await NotificationsApi.markAsRead(n.id);
    }
    notificacoes = notificacoes.map((n) => ({ ...n, read: true }));
  }

  async function limparTodas() {
    if (!confirm("Tem certeza que deseja limpar todas as notificações?")) return;
    try {
      for (const n of notificacoes) {
        await NotificationsApi.delete(n.id);
      }
      notificacoes = [];
    } catch (err) {
      alert("Erro ao limpar notificações.");
    }
  }
</script>

<div class="page-header">
  <h1>🔔 Notificações</h1>
</div>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando notificações...</p>
  </div>
{:else if error}
  <div class="error-state">
    <i class="fas fa-exclamation-circle"></i>
    <p>{error}</p>
  </div>
{:else}
  <div class="page-actions">
    <button class="btn-primary" on:click={marcarTodasLidas}>
      <i class="fas fa-check-double"></i> Marcar todas como lidas
    </button>
    <button class="btn-primary" on:click={limparTodas}>
      <i class="fas fa-trash"></i> Limpar todas
    </button>
  </div>

  <div class="page-section">
    <h2>Notificações Recentes</h2>

    {#if notificacoes.length > 0}
      {#each notificacoes as n}
        <div
          class="notification-item {n.read ? '' : 'unread'}"
          on:click={() => marcarComoLida(n.id)}
        >
          <div class="notification-icon {n.read ? '' : 'active'}">
            <i class="fas fa-bell"></i>
          </div>
          <div class="notification-content">
            <h4>
              {n.title || "Notificação"}
              {#if !n.read}
                <span class="notification-badge">Nova</span>
              {/if}
            </h4>
            <p>{n.message}</p>
            {#if n.createdAt}
              <div class="notification-time">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    {:else}
      <div class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>Nenhuma notificação encontrada</p>
      </div>
    {/if}
  </div>
{/if}
