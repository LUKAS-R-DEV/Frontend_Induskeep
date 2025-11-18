<script>
  import "$lib/styles/notificacoes.css";
  import { onMount } from "svelte";
  import { NotificationsApi } from "$lib/api/notifications";
  import { feedback } from '$lib/stores/feedback.stores.js';

  // ✅ Ícones Lucide
  import {
    CheckCheck,
    Trash2,
    Loader2,
    AlertCircle,
    RotateCcw,
    Bell,
    BellOff,
    Check,
  } from 'lucide-svelte';

  let loading = true;
  let notificacoes = [];
  let error = "";

  onMount(async () => {
    try {
      notificacoes = await NotificationsApi.list();
      
      // Disparar evento para atualizar contador na navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
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
      
      // Disparar evento para atualizar contador na navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
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
      
      // Disparar evento para atualizar contador na navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
      
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
      
      // Disparar evento para atualizar contador na navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
      
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
            <CheckCheck size={18} />
            Marcar todas como lidas
          </button>
        {/if}
        {#if notificacoes.length > 0}
          <button class="btn-danger" on:click={limparTodas}>
            <Trash2 size={18} />
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
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando notificações...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <AlertCircle size={36} color="#ef4444" />
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <RotateCcw size={18} />
        Tentar novamente
      </button>
    </div>
  {:else if notificacoes.length > 0}
    <!-- Notifications List -->
    <div class="notifications-card">
      <div class="card-header">
        <h2 class="card-title">
          <Bell size={20} />
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
              <Bell size={24} color={n.read ? "#94a3b8" : "#3b82f6"} />
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
                <Check size={16} />
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <BellOff size={32} color="#94a3b8" />
      </div>
      <h3>Nenhuma notificação</h3>
      <p>Você está em dia! Não há notificações no momento.</p>
    </div>
  {/if}
</div>

<style>
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

  /* Ícones SVG refinados */
  svg {
    vertical-align: middle;
    stroke-width: 2;
    flex-shrink: 0;
  }

  /* Ajustes para ícones em botões */
  .btn-secondary svg,
  .btn-danger svg,
  .btn-retry svg,
  .mark-read-btn svg {
    flex-shrink: 0;
  }

  /* Ajustes para card-title */
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
