<script>
  import '$lib/styles/equipamentos.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MachinesApi } from '$lib/api/machines';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin } from '$lib/utils/permissions.js';

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
      {#if isAdmin(user?.role)}
        <button class="btn-primary" on:click={() => goto('/equipamentos/cadastro')}>
          <i class="fas fa-plus"></i>
          Novo Equipamento
        </button>
      {/if}
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <i class="fas fa-search search-icon"></i>
      <input 
        type="text" 
        class="search-input"
        placeholder="Buscar por nome, série ou localização..." 
        bind:value={search} 
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="statusFilter">
          <i class="fas fa-filter"></i>
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
          <i class="fas fa-times"></i>
          Limpar Filtros
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando equipamentos...</p>
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
  {:else if filteredEquipments.length > 0}
    <!-- Equipments List -->
    <div class="equipments-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-industry"></i>
          Equipamentos ({filteredEquipments.length})
        </h2>
      </div>

      <div class="equipments-grid">
        {#each filteredEquipments as eq}
          <div class="equipment-card">
            <div class="equipment-icon">
              <i class="fas fa-cogs"></i>
            </div>
            
            <div class="equipment-info">
              <h3 class="equipment-name">{eq.name}</h3>
              <div class="equipment-meta">
                <div class="meta-item">
                  <i class="fas fa-barcode"></i>
                  <span>Série: {eq.serial || 'N/A'}</span>
                </div>
                {#if eq.location}
                  <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
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

            {#if isAdmin(user?.role)}
              <div class="equipment-actions">
                <button
                  class="action-btn edit"
                  on:click={() => editarEquipamento(eq)}
                  title="Editar equipamento"
                >
                  <i class="fas fa-edit"></i>
                  Editar
                </button>
                <button
                  class="action-btn delete"
                  on:click={() => deletarEquipamento(eq)}
                  title="Excluir equipamento"
                >
                  <i class="fas fa-trash"></i>
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
        <i class="fas fa-cogs"></i>
      </div>
      <h3>Nenhum equipamento encontrado</h3>
      <p>{search || statusFilter ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando um novo equipamento.'}</p>
      {#if isAdmin(user?.role) && !search && !statusFilter}
        <button class="btn-primary" on:click={() => goto('/equipamentos/cadastro')}>
          <i class="fas fa-plus"></i>
          Cadastrar Equipamento
        </button>
      {/if}
    </div>
  {/if}
</div>
