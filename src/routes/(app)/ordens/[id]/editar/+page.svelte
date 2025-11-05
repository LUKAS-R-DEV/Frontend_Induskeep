<script>
  import '$lib/styles/ordens-cadastro.css';
  import { OrdersApi } from '$lib/api/orders';
  import { MachinesApi } from '$lib/api/machines';
  import { UserApi } from '$lib/api/users';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let id = '';

  // Campos do formulário
  let title = '';
  let description = '';
  let machineId = '';
  let userId = '';
  let status = 'PENDING';

  let loading = false;
  let loadingData = true;
  let error = '';
  let machines = [];
  let users = [];

  onMount(async () => {
    try {
      id = $page.params.id;
      
      // Carrega dados em paralelo
      const [os, dataMachines, dataUsers] = await Promise.all([
        OrdersApi.get(id),
        MachinesApi.list(),
        UserApi.list()
      ]);

      // Preenche formulário
      title = os.title || '';
      description = os.description || '';
      machineId = os.machineId || os.machine?.id || '';
      userId = os.userId || os.user?.id || '';
      status = os.status || 'PENDING';

      // Preenche listas
      machines = Array.isArray(dataMachines) ? dataMachines : [];
      users = (Array.isArray(dataUsers) ? dataUsers : []).filter(
        (u) => u.role === "TECHNICIAN"
      );
    } catch (e) {
      error = e?.message || 'Falha ao carregar a ordem de serviço.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
    } finally {
      loadingData = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    if (!title || !description || !machineId || !userId) {
      error = 'Por favor, preencha todos os campos obrigatórios.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: error,
      });
      loading = false;
      return;
    }

    try {
      const payload = { title, description, machineId, userId, status };
      await OrdersApi.update(id, payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de Serviço atualizada com sucesso!',
      });

      setTimeout(() => {
        goto('/ordens');
      }, 1000);
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao atualizar a ordem de serviço.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
      loading = false;
    }
  }

  function getStatusLabel(status) {
    const labels = {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada'
    };
    return labels[status] || status;
  }

  $: selectedMachine = machines.find(m => m.id === machineId);
  $: selectedUser = users.find(u => u.id === userId);
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Editar Ordem de Serviço</h1>
        <p class="page-subtitle">Atualize as informações da ordem de manutenção</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/ordens')}>
        <i class="fas fa-arrow-left"></i>
        Voltar
      </button>
    </div>
  </div>

  {#if loadingData}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados da ordem...</p>
    </div>
  {:else if error && !title}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar ordem</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => goto('/ordens')}>
        <i class="fas fa-arrow-left"></i>
        Voltar para lista
      </button>
    </div>
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-edit"></i>
          Dados da Ordem de Serviço
        </h2>
      </div>

      <form on:submit={handleSubmit} class="form-content">
        <!-- Título -->
        <div class="form-group">
          <label for="title">
            <i class="fas fa-heading"></i>
            Título *
          </label>
          <input
            id="title"
            type="text"
            bind:value={title}
            required
            placeholder="Ex: Troca de correia da esteira"
            class="form-input"
            disabled={loading}
          />
          <small class="form-hint">Informe um título descritivo para a ordem</small>
        </div>

        <!-- Descrição -->
        <div class="form-group">
          <label for="description">
            <i class="fas fa-align-left"></i>
            Descrição *
          </label>
          <textarea
            id="description"
            bind:value={description}
            required
            placeholder="Descreva o problema identificado, ações necessárias e observações..."
            class="form-textarea"
            rows="5"
            disabled={loading}
          ></textarea>
          <small class="form-hint">Descreva detalhadamente o problema ou necessidade de manutenção</small>
        </div>

        <!-- Row: Equipamento e Técnico -->
        <div class="form-row">
          <div class="form-group">
            <label for="machineId">
              <i class="fas fa-industry"></i>
              Equipamento *
            </label>
            <select 
              id="machineId" 
              bind:value={machineId} 
              required
              class="form-select"
              disabled={loading}
            >
              <option value="">Selecione um equipamento</option>
              {#each machines as m}
                <option value={m.id}>
                  {m.name} — {m.location || 'Sem localização'}
                </option>
              {/each}
            </select>
            <small class="form-hint">
              {#if selectedMachine}
                Equipamento selecionado: <strong>{selectedMachine.name}</strong>
              {:else}
                Selecione o equipamento a ser mantido
              {/if}
            </small>
          </div>

          <div class="form-group">
            <label for="userId">
              <i class="fas fa-user-tie"></i>
              Técnico Responsável *
            </label>
            <select 
              id="userId" 
              bind:value={userId} 
              required
              class="form-select"
              disabled={loading}
            >
              <option value="">Selecione um técnico</option>
              {#each users as u}
                <option value={u.id}>{u.name}</option>
              {/each}
            </select>
            <small class="form-hint">
              {#if selectedUser}
                Técnico: <strong>{selectedUser.name}</strong>
              {:else}
                Selecione o técnico responsável pela ordem
              {/if}
            </small>
          </div>
        </div>

        <!-- Status -->
        <div class="form-group">
          <label for="status">
            <i class="fas fa-flag"></i>
            Status da Ordem
          </label>
          <select 
            id="status" 
            bind:value={status}
            class="form-select"
            disabled={loading}
          >
            <option value="PENDING">Pendente</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
          <small class="form-hint">
            Status atual: <strong>{getStatusLabel(status)}</strong>
          </small>
        </div>

        <!-- Status Preview -->
        <div class="status-preview">
          <div class="preview-badge status-{status.toLowerCase().replace('_', '-')}">
            <i class="fas fa-{status === 'PENDING' ? 'clock' : status === 'IN_PROGRESS' ? 'spinner' : status === 'COMPLETED' ? 'check-circle' : 'times-circle'}"></i>
            <span>Status: {getStatusLabel(status)}</span>
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="form-message error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        {/if}

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn-cancel" 
            on:click={() => goto('/ordens')}
            disabled={loading}
          >
            <i class="fas fa-times"></i>
            Cancelar
          </button>

          <button 
            type="submit" 
            class="btn-submit" 
            disabled={loading}
          >
            {#if loading}
              <i class="fas fa-spinner fa-spin"></i>
              <span>Salvando...</span>
            {:else}
              <i class="fas fa-save"></i>
              <span>Salvar Alterações</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .status-preview {
    margin: 1rem 0;
  }

  .preview-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .preview-badge.status-pending {
    background: #fef3c7;
    color: #d97706;
  }

  .preview-badge.status-in-progress {
    background: #dbeafe;
    color: #2563eb;
  }

  .preview-badge.status-completed {
    background: #d1fae5;
    color: #059669;
  }

  .preview-badge.status-cancelled {
    background: #fee2e2;
    color: #dc2626;
  }

  .preview-badge i {
    font-size: 1.1rem;
  }
</style>
