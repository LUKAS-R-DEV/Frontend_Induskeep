<script>
  import '$lib/styles/ordens-cadastro.css';
  import { onMount } from 'svelte';
  import { ScheduleApi } from '$lib/api/schedule';
  import { MachinesApi } from '$lib/api/machines';
  import { UserApi } from '$lib/api/users';
  import { NotificationsApi } from '$lib/api/notifications';
  import { goto } from '$app/navigation';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let loading = false;
  let loadingData = true;
  let machines = [];
  let users = [];
  let error = '';

  let form = {
    machineId: '',
    userId: '',
    date: '',
    notes: '',
  };

  onMount(async () => {
    try {
      const [dataMachines, dataUsers] = await Promise.all([
        MachinesApi.list(),
        // Usa listTechnicians() que permite supervisor e admin verem técnicos
        UserApi.listTechnicians()
      ]);

      machines = Array.isArray(dataMachines) ? dataMachines : [];
      // listTechnicians() já retorna apenas técnicos, não precisa filtrar
      users = Array.isArray(dataUsers) ? dataUsers : [];
    } catch (err) {
      error = 'Erro ao carregar dados. Tente novamente.';
      console.error(err);
    } finally {
      loadingData = false;
    }
  });

  async function createSchedule(e) {
    e.preventDefault();
    loading = true;
    error = '';

    // Validação de campos obrigatórios (com trim para remover espaços)
    if (!form.machineId || !form.userId || !form.date || !form.notes || !form.notes.trim()) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios (Máquina, Técnico, Data/Hora e Observações).',
      });
      loading = false;
      return;
    }

    // Valida se a data não é do passado
    const selectedDate = new Date(form.date);
    const now = new Date();
    if (selectedDate < now) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Data inválida',
        message: 'Não é possível agendar para uma data/hora no passado.',
      });
      loading = false;
      return;
    }

    try {
      const isoDate = new Date(form.date).toISOString();
      await ScheduleApi.create({...form, date: isoDate});
      
      const machine = machines.find((m) => m.id === form.machineId);
      const localDate = new Date(form.date).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const notificationsPayload = {
        title: 'Novo agendamento de manutenção',
        message: `Novo agendamento de manutenção para a máquina ${machine?.name || 'N/A'} em ${localDate}.`,
        userId: form.userId,
      };
      await NotificationsApi.create(notificationsPayload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Agendamento criado com sucesso!',
      });

      setTimeout(() => {
        goto('/agendamentos');
      }, 1000);
    } catch (err) {
      error = err.message || 'Erro ao criar agendamento.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
      loading = false;
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  $: selectedMachine = machines.find(m => m.id === form.machineId);
  $: selectedUser = users.find(u => u.id === form.userId);

  // Calcula a data mínima (agora) no formato datetime-local (YYYY-MM-DDTHH:mm)
  function getMinDateTime() {
    const now = new Date();
    // Ajusta para o fuso horário local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  $: minDateTime = getMinDateTime();
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Novo Agendamento</h1>
        <p class="page-subtitle">Agende uma manutenção preventiva</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/agendamentos')}>
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
  {:else if error && (!machines.length || !users.length)}
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
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-calendar-plus"></i>
          Informações do Agendamento
        </h2>
      </div>

      <form on:submit={createSchedule} class="form-content">
        <!-- Row: Máquina e Técnico -->
        <div class="form-row">
          <div class="form-group">
            <label for="machineId">
              <i class="fas fa-industry"></i>
              Máquina *
            </label>
            <select 
              bind:value={form.machineId} 
              required
              class="form-select"
              disabled={loading}
            >
              <option value="">Selecione uma máquina</option>
              {#each machines as m}
                <option value={m.id}>{m.name} — {m.location || 'Sem localização'}</option>
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
              bind:value={form.userId} 
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
                Selecione o técnico responsável
              {/if}
            </small>
          </div>
        </div>

        <!-- Data e Hora -->
        <div class="form-group">
          <label for="date">
            <i class="fas fa-calendar-alt"></i>
            Data e Hora *
          </label>
          <input
            id="date"
            type="datetime-local"
            bind:value={form.date}
            min={minDateTime}
            required
            class="form-input"
            disabled={loading}
          />
          <small class="form-hint">
            {#if form.date}
              Agendado para: <strong>{formatDate(form.date)}</strong>
            {:else}
              Selecione a data e hora do agendamento (apenas datas futuras são permitidas)
            {/if}
          </small>
        </div>

        <!-- Observações -->
        <div class="form-group">
          <label for="notes">
            <i class="fas fa-comment"></i>
            Observações *
          </label>
          <textarea
            id="notes"
            bind:value={form.notes}
            required
            placeholder="Descreva o tipo de manutenção, peças necessárias, observações importantes..."
            class="form-textarea"
            rows="4"
            disabled={loading}
          ></textarea>
          <small class="form-hint">Informações adicionais sobre o agendamento (obrigatório)</small>
        </div>

        <!-- Preview -->
        {#if form.machineId && form.userId && form.date}
          <div class="schedule-preview">
            <div class="preview-card">
              <h4 class="preview-title">
                <i class="fas fa-eye"></i>
                Pré-visualização
              </h4>
              <div class="preview-content">
                <div class="preview-item">
                  <i class="fas fa-industry"></i>
                  <span><strong>Equipamento:</strong> {selectedMachine?.name || 'N/A'}</span>
                </div>
                <div class="preview-item">
                  <i class="fas fa-user"></i>
                  <span><strong>Técnico:</strong> {selectedUser?.name || 'N/A'}</span>
                </div>
                <div class="preview-item">
                  <i class="fas fa-calendar"></i>
                  <span><strong>Data/Hora:</strong> {formatDate(form.date)}</span>
                </div>
              </div>
            </div>
          </div>
        {/if}

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
            on:click={() => goto('/agendamentos')}
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
              <span>Criar Agendamento</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .schedule-preview {
    margin: 1rem 0;
  }

  .preview-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .preview-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .preview-title i {
    color: #3b82f6;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .preview-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: #475569;
  }

  .preview-item i {
    color: #94a3b8;
    width: 20px;
    text-align: center;
  }

  .preview-item strong {
    color: #1e293b;
    font-weight: 600;
  }
</style>
