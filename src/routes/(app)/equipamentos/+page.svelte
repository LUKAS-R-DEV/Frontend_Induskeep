<script>
  import '$lib/styles/equipamentos.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MachinesApi } from '$lib/api/machines';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin, isSupervisorOrAdmin } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Plus,
    Search,
    Filter,
    X,
    Loader2,
    AlertCircle,
    RotateCcw,
    Factory,
    Cog,
    Barcode,
    MapPin,
    Pencil,
    Trash2,
  } from 'lucide-svelte';

  let search = '';
  let statusFilter = '';
  let equipamentos = [];
  let loading = true;
  let error = '';
  let user = null;

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }
      const data = await MachinesApi.list();
      equipamentos = Array.isArray(data) ? data : [];
    } catch (err) {
      error = err.message || 'Erro ao carregar equipamentos';
    } finally {
      loading = false;
    }
  });

  function getStatusLabel(status) {
    const labels = {
      ACTIVE: 'Ativo',
      MAINTENANCE: 'Em Manutenção',
      INACTIVE: 'Inativo'
    };
    return labels[status] || status;
  }

  function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'status-active';
      case 'maintenance':
        return 'status-maintenance';
      case 'inactive':
        return 'status-inactive';
      default:
        return '';
    }
  }

  $: filteredEquipments = equipamentos.filter(e =>
    (!search || 
      (e.name?.toLowerCase().includes(search.toLowerCase()) ||
       e.serial?.toLowerCase().includes(search.toLowerCase()) ||
       e.location?.toLowerCase().includes(search.toLowerCase()))) &&
    (!statusFilter || (e.status || '').toUpperCase() === statusFilter.toUpperCase())
  );

  function editarEquipamento(eq) {
    goto(`/equipamentos/${eq.id}/editar`);
  }

  async function deletarEquipamento(eq) {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Excluir equipamento',
          message: `Deseja realmente excluir o equipamento "${eq.name}"? Esta ação não poderá ser desfeita.`,
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      await MachinesApi.remove(eq.id);
      equipamentos = equipamentos.filter(e => e.id !== eq.id);

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Equipamento excluído com sucesso.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao remover equipamento.',
      });
    }
  }
</script>

<div class="equipments-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Equipamentos</h1>
        <p class="page-subtitle">Gerencie máquinas e equipamentos industriais</p>
      </div>
      {#if isSupervisorOrAdmin(user?.role)}
        <button class="btn-primary" on:click={() => goto('/equipamentos/cadastro')}>
          <Plus size={18} />
          Novo Equipamento
        </button>
      {/if}
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <Search size={18} class="search-icon" />
      <input 
        type="text" 
        class="search-input"
        placeholder="Digite o nome do equipamento, número de série ou localização..." 
        bind:value={search} 
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="statusFilter">
          <Filter size={16} />
          Status
        </label>
        <select id="statusFilter" bind:value={statusFilter} class="filter-select">
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="MAINTENANCE">Em Manutenção</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </div>

      {#if search || statusFilter}
        <button class="btn-clear-filters" on:click={() => { search = ''; statusFilter = ''; }}>
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
      <p>Carregando equipamentos...</p>
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
  {:else if filteredEquipments.length > 0}
    <!-- Equipments List -->
    <div class="equipments-card">
      <div class="card-header">
        <h2 class="card-title">
          <Factory size={20} />
          Equipamentos ({filteredEquipments.length})
        </h2>
      </div>

      <div class="equipments-grid">
        {#each filteredEquipments as eq}
          <div class="equipment-card">
            <div class="equipment-icon">
              <Cog size={28} color="white" />
            </div>
            
            <div class="equipment-info">
              <h3 class="equipment-name">{eq.name}</h3>
              <div class="equipment-meta">
                <div class="meta-item">
                  <Barcode size={14} />
                  <span>Série: {eq.serial || 'N/A'}</span>
                </div>
                {#if eq.location}
                  <div class="meta-item">
                    <MapPin size={14} />
                    <span>{eq.location}</span>
                  </div>
                {/if}
              </div>
            </div>

            <div class="equipment-status">
              <span class="status-badge {getStatusClass(eq.status)}">
                {getStatusLabel(eq.status)}
              </span>
            </div>

            {#if isSupervisorOrAdmin(user?.role)}
              <div class="equipment-actions">
                <button
                  class="action-btn edit"
                  on:click={() => editarEquipamento(eq)}
                  title="Editar equipamento"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  class="action-btn delete"
                  on:click={() => deletarEquipamento(eq)}
                  title="Excluir equipamento"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <Cog size={32} color="#94a3b8" />
      </div>
      <h3>Nenhum equipamento encontrado</h3>
      <p>{search || statusFilter ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando um novo equipamento.'}</p>
      {#if isSupervisorOrAdmin(user?.role) && !search && !statusFilter}
        <button class="btn-primary" on:click={() => goto('/equipamentos/cadastro')}>
          <Plus size={18} />
          Cadastrar Equipamento
        </button>
      {/if}
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
  .btn-retry svg,
  .btn-clear-filters svg,
  .action-btn svg {
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
