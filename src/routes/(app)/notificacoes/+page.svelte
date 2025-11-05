<script>
  import "$lib/styles/notificacoes.css";
  import { onMount } from "svelte";
  import { NotificationsApi } from "$lib/api/notifications";
  import { feedback } from '$lib/stores/feedback.stores.js';

  let loading = true;
  let notificacoes = [];
  let error = "";

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
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Erro ao marcar notificação como lida.',
      });
    }
  }

  async function marcarTodasLidas() {
    try {
      for (const n of notificacoes.filter((n) => !n.read)) {
        await NotificationsApi.markAsRead(n.id);
      }
      notificacoes = notificacoes.map((n) => ({ ...n, read: true }));
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Todas as notificações foram marcadas como lidas.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Erro ao marcar notificações como lidas.',
      });
    }
  }

  async function limparTodas() {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Limpar notificações',
          message: 'Tem certeza que deseja limpar todas as notificações? Esta ação não poderá ser desfeita.',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      for (const n of notificacoes) {
        await NotificationsApi.delete(n.id);
      }
      notificacoes = [];
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Todas as notificações foram removidas.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Erro ao limpar notificações.',
      });
    }
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString('pt-BR');
  }
</script>

<div class="notifications-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Notificações</h1>
        <p class="page-subtitle">Gerencie suas notificações e alertas</p>
      </div>
      <div class="header-actions">
        {#if notificacoes.filter(n => !n.read).length > 0}
          <button class="btn-secondary" on:click={marcarTodasLidas}>
            <i class="fas fa-check-double"></i>
            Marcar todas como lidas
          </button>
        {/if}
        {#if notificacoes.length > 0}
          <button class="btn-danger" on:click={limparTodas}>
            <i class="fas fa-trash"></i>
            Limpar todas
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando notificações...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <i class="fas fa-redo"></i>
        Tentar novamente
      </button>
    </div>
  {:else if notificacoes.length > 0}
    <!-- Notifications List -->
    <div class="notifications-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-bell"></i>
          Notificações ({notificacoes.length})
          {#if notificacoes.filter(n => !n.read).length > 0}
            <span class="unread-count">
              {notificacoes.filter(n => !n.read).length} não lidas
            </span>
          {/if}
        </h2>
      </div>

      <div class="notifications-list">
        {#each notificacoes as n}
          <div 
            class="notification-item {n.read ? '' : 'unread'}"
            on:click={() => !n.read && marcarComoLida(n.id)}
          >
            <div class="notification-icon {n.read ? '' : 'active'}">
              <i class="fas fa-bell"></i>
            </div>
            <div class="notification-content">
              <div class="notification-header">
                <h3 class="notification-title">
                  {n.title || "Notificação"}
                  {#if !n.read}
                    <span class="notification-badge">Nova</span>
                  {/if}
                </h3>
                <span class="notification-time">{formatDate(n.createdAt)}</span>
              </div>
              <p class="notification-message">{n.message}</p>
            </div>
            {#if !n.read}
              <button 
                class="mark-read-btn"
                on:click|stopPropagation={() => marcarComoLida(n.id)}
                title="Marcar como lida"
              >
                <i class="fas fa-check"></i>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-bell-slash"></i>
      </div>
      <h3>Nenhuma notificação</h3>
      <p>Você está em dia! Não há notificações no momento.</p>
    </div>
  {/if}
</div>
