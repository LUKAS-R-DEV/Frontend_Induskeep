<script>
  import '$lib/styles/ordens-cadastro.css';
  import { OrdersApi } from '$lib/api/orders';
  import { MachinesApi } from '$lib/api/machines';
  import { UserApi } from '$lib/api/users';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin } from '$lib/utils/permissions.js';

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
  let originalStatus = 'PENDING'; // Status original da ordem
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

      id = $page.params.id;
      
      // Carrega dados em paralelo
      // Se for admin, busca todos os usuários; senão, busca apenas técnicos
      const [os, dataMachines, dataUsers] = await Promise.all([
        OrdersApi.get(id),
        MachinesApi.list(),
        isAdmin(user?.role) ? UserApi.list() : UserApi.listTechnicians()
      ]);

      // Validação: se for técnico, verifica se a ordem pertence a ele
      const userRole = user ? String(user.role || '').toUpperCase().trim() : '';
      if (userRole === 'TECHNICIAN' && os.userId !== user.id) {
        error = 'Você não tem permissão para editar esta ordem de serviço.';
        feedback.set({
          show: true,
          type: 'error',
          title: 'Acesso negado',
          message: error,
        });
        setTimeout(() => {
          goto('/ordens');
        }, 2000);
        return;
      }

      // Preenche formulário
      title = os.title || '';
      description = os.description || '';
      machineId = os.machineId || os.machine?.id || '';
      userId = os.userId || os.user?.id || '';
      originalStatus = os.status || 'PENDING'; // Guarda o status original para referência
      
      // Inicializa o status baseado no papel do usuário
      const isSupervisorOrAdmin = userRole === 'SUPERVISOR' || userRole === 'ADMIN';
      if (isSupervisorOrAdmin) {
        // Supervisores e admins só podem cancelar, então mantém o status atual ou define como CANCELLED
        status = os.status === 'CANCELLED' ? 'CANCELLED' : 'CANCELLED';
      } else if (userRole === 'TECHNICIAN') {
        // Técnicos: se estiver concluída, permite reabrir mudando para outro status
        status = os.status === 'COMPLETED' ? 'IN_PROGRESS' : (os.status || 'PENDING');
      } else {
        // Outros usuários: mantém o status atual
        status = os.status === 'COMPLETED' ? 'IN_PROGRESS' : (os.status || 'PENDING');
      }

      // Preenche listas
      machines = Array.isArray(dataMachines) ? dataMachines : [];
      // Se usou list(), filtra técnicos; se usou listTechnicians(), já vem filtrado
      users = isAdmin(user?.role)
        ? (Array.isArray(dataUsers) ? dataUsers : []).filter((u) => u.role === "TECHNICIAN")
        : (Array.isArray(dataUsers) ? dataUsers : []);
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
      // Validação: apenas técnicos podem mudar status para IN_PROGRESS ou COMPLETED
      const userRole = user ? String(user.role || '').toUpperCase().trim() : '';
      const isSupervisorOrAdmin = userRole === 'SUPERVISOR' || userRole === 'ADMIN';
      
      // Supervisores e admins só podem cancelar ordens
      if (isSupervisorOrAdmin && status !== 'CANCELLED') {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Acesso negado',
          message: 'Supervisores e administradores só podem cancelar ordens de serviço. Apenas técnicos podem alterar o status da ordem.',
        });
        loading = false;
        return;
      }
      
      if ((status === 'IN_PROGRESS' || status === 'COMPLETED') && userRole !== 'TECHNICIAN') {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Acesso negado',
          message: 'Apenas o técnico responsável pode iniciar ou concluir uma ordem de serviço.',
        });
        loading = false;
        return;
      }
      
      // Se técnico tentar mudar para IN_PROGRESS, verifica se a ordem é dele
      if (status === 'IN_PROGRESS' && userRole === 'TECHNICIAN') {
        const os = await OrdersApi.get(id);
        if (os.userId !== user.id) {
          feedback.set({
            show: true,
            type: 'error',
            title: 'Acesso negado',
            message: 'Você não tem permissão para iniciar esta ordem de serviço.',
          });
          loading = false;
          return;
        }
      }

      // Não permite salvar como COMPLETED diretamente na edição
      // A conclusão deve ser feita pelo botão específico que cria o histórico
      const finalStatus = status === 'COMPLETED' ? 'IN_PROGRESS' : status;
      const payload = { title, description, machineId, userId, status: finalStatus };
      
      // Se estava tentando salvar como COMPLETED, avisa o usuário
      if (status === 'COMPLETED') {
        feedback.set({
          show: true,
          type: 'warning',
          title: 'Atenção',
          message: 'Para concluir a ordem, use o botão "Concluir" na lista ou na página de detalhes. O status foi alterado para "Em Andamento".',
        });
      }
      
      // Se estava concluída e mudou para outro status, informa que foi reaberta
      if (originalStatus === 'COMPLETED' && finalStatus !== 'COMPLETED') {
        feedback.set({
          show: true,
          type: 'info',
          title: 'Ordem reaberta',
          message: `A ordem foi reaberta e o status foi alterado para "${getStatusLabel(finalStatus)}". Para concluí-la novamente, use o botão "Concluir".`,
        });
      }
      
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
              {#each machines.filter(m => m.status === 'ACTIVE' || m.status === 'MAINTENANCE' || m.id === machineId) as m}
                <option value={m.id}>
                  {m.name} — {m.location || 'Sem localização'}
                  {#if m.status === 'MAINTENANCE'}
                    (Em Manutenção)
                  {:else if m.status === 'INACTIVE'}
                    (Inativo)
                  {/if}
                </option>
              {/each}
            </select>
            <small class="form-hint">
              {#if selectedMachine}
                Equipamento selecionado: <strong>{selectedMachine.name}</strong>
                {#if selectedMachine.status === 'INACTIVE'}
                  <br>
                  <span style="color: #f59e0b;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Este equipamento está inativo. Apenas equipamentos ativos ou em manutenção podem ser selecionados para novas ordens.
                  </span>
                {/if}
              {:else}
                Selecione o equipamento a ser mantido. Apenas equipamentos ativos ou em manutenção podem ser selecionados.
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
            {#if user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN'}
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Andamento</option>
            {:else if user && (String(user.role || '').toUpperCase().trim() === 'SUPERVISOR' || String(user.role || '').toUpperCase().trim() === 'ADMIN')}
              <option value="CANCELLED">Cancelada</option>
            {:else}
              <option value="PENDING">Pendente</option>
              <option value="CANCELLED">Cancelada</option>
            {/if}
          </select>
          <small class="form-hint">
            Status atual: <strong>{getStatusLabel(originalStatus)}</strong>
            {#if originalStatus === 'COMPLETED'}
              <br>
              <span style="color: #059669; font-weight: 600;">
                <i class="fas fa-info-circle"></i>
                Esta ordem está concluída. Para reabrir, altere o status acima. Para concluir novamente, use o botão "Concluir" na lista ou na página de detalhes.
              </span>
            {:else}
              <br>
              <span style="color: #64748b;">
                <i class="fas fa-info-circle"></i>
                Para concluir a ordem, use o botão "Concluir" na lista ou na página de detalhes.
              </span>
            {/if}
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
