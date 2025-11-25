<script>
  import '$lib/styles/ordens-cadastro.css';
  import { OrdersApi } from '$lib/api/orders';
  import { onMount } from 'svelte';
  import { MachinesApi } from '$lib/api/machines';
  import { UserApi } from '$lib/api/users';
  import { goto } from '$app/navigation';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin } from '$lib/utils/permissions.js';

  let title = '';
  let description = '';
  let machineId = '';
  let userId = '';
  let machines = [];
  let users = [];
  let loading = false;
  let error = '';
  let loadingData = true;
  let user = null;

  onMount(async () => {
    try {
      // Carrega usuário do localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
        }
      }

      const [dataMachines, dataUsers] = await Promise.all([
        MachinesApi.list(),
        // Se for admin, busca todos os usuários; senão, busca apenas técnicos
        isAdmin(user?.role) ? UserApi.list() : UserApi.listTechnicians()
      ]);
      machines = Array.isArray(dataMachines) ? dataMachines : [];
      // Se usou list(), filtra técnicos; se usou listTechnicians(), já vem filtrado
      users = isAdmin(user?.role) 
        ? (Array.isArray(dataUsers) ? dataUsers : []).filter((u) => u.role === "TECHNICIAN")
        : (Array.isArray(dataUsers) ? dataUsers : []);
    } catch (err) {
      error = 'Erro ao carregar dados. Tente novamente.';
      console.error(err);
    } finally {
      loadingData = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    // Validação de campos obrigatórios (com trim para remover espaços)
    if (!title || !title.trim() || !description || !description.trim() || !machineId || !userId) {
      error = 'Por favor, preencha todos os campos obrigatórios (Título, Descrição, Equipamento e Técnico).';
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
      // Sempre cria como PENDING - faz mais sentido uma ordem recém-criada estar pendente
      const payload = { title, description, machineId, userId, status: 'PENDING' };
      await OrdersApi.create(payload);
      
      // Notificação é criada automaticamente pelo backend quando um técnico é atribuído

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de Serviço criada com sucesso!',
      });

      setTimeout(() => {
        goto('/ordens');
      }, 1000);
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao salvar ordem.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
      loading = false;
    }
  }
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Nova Ordem de Serviço</h1>
        <p class="page-subtitle">Crie uma nova ordem de manutenção</p>
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
      <p>Carregando dados...</p>
    </div>
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-clipboard-list"></i>
          Dados da Ordem
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
            <label for="machine">
              <i class="fas fa-industry"></i>
              Equipamento *
            </label>
            <select 
              id="machine" 
              bind:value={machineId} 
              required
              class="form-select"
              disabled={loading}
            >
              <option value="">Selecione um equipamento</option>
              {#each machines.filter(m => m.status === 'ACTIVE' || m.status === 'MAINTENANCE') as m}
                <option value={m.id}>
                  {m.name} - {m.location || 'Sem localização'}
                  {#if m.status === 'MAINTENANCE'}
                    (Em Manutenção)
                  {/if}
                </option>
              {/each}
            </select>
            <small class="form-hint">
              Apenas equipamentos ativos ou em manutenção podem ser selecionados.
              {#if machines.filter(m => m.status === 'INACTIVE').length > 0}
                <br>
                <span style="color: #f59e0b;">
                  <i class="fas fa-info-circle"></i>
                  {machines.filter(m => m.status === 'INACTIVE').length} equipamento(s) inativo(s) não estão disponíveis para seleção.
                </span>
              {/if}
            </small>
          </div>

          <div class="form-group">
            <label for="technician">
              <i class="fas fa-user-tie"></i>
              Técnico Responsável *
            </label>
            <select 
              id="technician" 
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
              <span>Salvar Ordem</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
