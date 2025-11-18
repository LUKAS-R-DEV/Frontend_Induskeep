<script>
  import '$lib/styles/historico.css';
  import { onMount } from 'svelte';
  import { HistoryApi } from '$lib/api/history';
  import { ExportFactory } from '$lib/export';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { hasPermission } from '$lib/utils/permissions.js';
  import { goto } from '$app/navigation';

  // ✅ Ícones Lucide
  import {
    FileText,
    Search,
    Factory,
    Calendar,
    X,
    Loader2,
    History,
    CheckCircle2,
    Clock,
    User,
    ExternalLink,
  } from 'lucide-svelte';

  let loading = true;
  let busca = '';
  let filtroEquipamento = '';
  let dataDe = '';
  let dataAte = '';
  let historico = [];
  let filtrado = [];
  let user = null;

  function duration(createdAt, completedAt) {
    if (!createdAt || !completedAt) return '-';
    const start = new Date(createdAt);
    const end = new Date(completedAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-';
    const diff = Math.max(0, end - start);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  onMount(async () => {
    try {
      // Carrega usuário do localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
        }
      }

      // Verifica se tem permissão para ver histórico
      if (!user || !hasPermission(user.role, 'VIEW_HISTORY')) {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Acesso negado',
          message: 'Você não tem permissão para acessar esta página.',
        });
        setTimeout(() => {
          goto('/dashboard');
        }, 2000);
        return;
      }

      const data = await HistoryApi.list();
      historico = Array.isArray(data) ? data : [];
      filtrado = [...historico];
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      if (err.status === 403) {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Acesso negado',
          message: 'Você não tem permissão para acessar esta página.',
        });
        setTimeout(() => {
          goto('/dashboard');
        }, 2000);
      }
    } finally {
      loading = false;
    }
  });

  function aplicarFiltros() {
    filtrado = historico.filter((item) => {
      const texto = busca.toLowerCase();
      const buscaMatch =
        busca === '' ||
        item.order?.machine?.name?.toLowerCase().includes(texto) ||
        item.order?.user?.name?.toLowerCase().includes(texto) ||
        item.order?.title?.toLowerCase().includes(texto) ||
        item.notes?.toLowerCase().includes(texto);

      const equipMatch = !filtroEquipamento || item.order?.machine?.name === filtroEquipamento;

      const dataItem = item.completedAt ? new Date(item.completedAt) : null;
      const dataDeMatch = !dataDe || (dataItem && dataItem >= new Date(dataDe));
      const dataAteMatch = !dataAte || (dataItem && dataItem <= new Date(dataAte));

      return buscaMatch && equipMatch && dataDeMatch && dataAteMatch;
    });
  }

  function limparFiltros() {
    busca = '';
    filtroEquipamento = '';
    dataDe = '';
    dataAte = '';
    filtrado = [...historico];
  }

  async function exportarGeral() {
    try {
      await ExportFactory.reports(historico, 'pdf');
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Relatório exportado com sucesso.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao exportar relatório.',
      });
    }
  }

  function getStatusClass(status) {
    if (!status) return '';
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-pending';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
      case 'CANCELED':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  $: aplicarFiltros();
</script>

<div class="history-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Histórico de Manutenções</h1>
        <p class="page-subtitle">
          {#if user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN'}
            Visualize suas manutenções concluídas
          {:else}
            Visualize todas as manutenções concluídas
          {/if}
        </p>
      </div>
      <button class="btn-primary" on:click={exportarGeral}>
        <FileText size={18} />
        Exportar Relatório
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <Search size={18} class="search-icon" />
      <input 
        type="text" 
        class="search-input"
        placeholder="Digite o título da manutenção, equipamento ou técnico..." 
        bind:value={busca}
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="filtroEquipamento">
          <Factory size={16} />
          Equipamento
        </label>
        <input 
          type="text" 
          id="filtroEquipamento"
          class="filter-input"
          placeholder="Filtrar por equipamento" 
          bind:value={filtroEquipamento} 
        />
      </div>

      <div class="filter-item">
        <label for="dataDe">
          <Calendar size={16} />
          De
        </label>
        <input 
          type="date" 
          id="dataDe"
          class="filter-input"
          bind:value={dataDe} 
        />
      </div>

      <div class="filter-item">
        <label for="dataAte">
          <Calendar size={16} />
          Até
        </label>
        <input 
          type="date" 
          id="dataAte"
          class="filter-input"
          bind:value={dataAte} 
        />
      </div>

      {#if busca || filtroEquipamento || dataDe || dataAte}
        <button class="btn-clear-filters" on:click={limparFiltros}>
          <X size={16} />
          Limpar Filtros
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando histórico...</p>
    </div>
  {:else if filtrado.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <History size={32} color="#94a3b8" />
      </div>
      <h3>Nenhum registro encontrado</h3>
      <p>{busca || filtroEquipamento || dataDe || dataAte ? 'Tente ajustar os filtros de busca.' : 'Ainda não há histórico de manutenções.'}</p>
    </div>
  {:else}
    <!-- History List -->
    <div class="history-card">
      <div class="card-header">
        <h2 class="card-title">
          <History size={20} />
          Histórico ({filtrado.length})
        </h2>
      </div>

      <div class="history-list">
        {#each filtrado as h}
          <div class="history-item" on:click={() => goto(`/ordens/${h.order?.id}`)} style="cursor: pointer;">
            <div class="history-icon">
              <CheckCircle2 size={24} color="#10b981" />
            </div>
            <div class="history-content">
              <div class="history-header">
                <h3 class="history-title">{h.order?.title || 'Manutenção'}</h3>
                <span class="status-badge {getStatusClass(h.order?.status)}">
                  {h.order?.status === 'COMPLETED' ? 'Concluída' : h.order?.status || '-'}
                </span>
              </div>
              <div class="history-meta">
                <div class="meta-item">
                  <Factory size={14} />
                  <span>{h.order?.machine?.name || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <User size={14} />
                  <span>{h.order?.user?.name || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <Calendar size={14} />
                  <span>{formatDate(h.completedAt)}</span>
                </div>
                <div class="meta-item">
                  <Clock size={14} />
                  <span>{duration(h.order?.createdAt, h.completedAt)}</span>
                </div>
              </div>
              {#if h.notes}
                <p class="history-notes">{h.notes}</p>
              {/if}
              <div class="history-footer">
                <span class="view-details-link">
                  <ExternalLink size={14} />
                  Clique para ver detalhes
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
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

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  /* Ajustes para ícones em labels */
  label svg {
    margin-right: 0.5rem;
  }

  /* Ajustes para ícones em botões */
  .btn-primary svg,
  .btn-clear-filters svg {
    flex-shrink: 0;
  }

  /* Ajustes para card-title */
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para meta-items */
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .meta-item svg {
    flex-shrink: 0;
  }
</style>
