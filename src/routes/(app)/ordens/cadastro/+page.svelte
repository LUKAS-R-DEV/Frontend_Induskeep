<script>
  import '$lib/styles/ordens-cadastro.css';
  import { OrdersApi } from '$lib/api/orders';
  import { onMount } from 'svelte';
  import { MachinesApi } from '$lib/api/machines';
  import { UserApi } from '$lib/api/users';
  import { NotificationsApi } from '$lib/api/notifications';
  import { goto } from '$app/navigation';

  // Campos necessários para criar ordem conforme seu backend
  let title = '';
  let description = '';
  let machineId = '';
  let userId = '';
  let machines=[];
  let users=[];
  let status = 'PENDING';

  let loading = false;
  let error = '';

  onMount(async () => {
    const dataMachines = await MachinesApi.list();
    const dataUsers = await UserApi.list();
    machines=Array.isArray(dataMachines) ? dataMachines : [];
    users = (Array.isArray(dataUsers) ? dataUsers : []).filter(
      (u) => u.role === "TECHNICIAN"
    );
    })
  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const payload = { title, description, machineId, userId, status };
      await OrdersApi.create(payload);

      alert('✅ Ordem de Serviço criada com sucesso!');

      const notificationPayload = {
        title: 'Nova Ordem de Serviço',
        message: `Nova ordem de serviço criada: ${title}`,
        userId: userId,
      };
      await NotificationsApi.create(notificationPayload);

      goto('/ordens');
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao salvar ordem.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Nova Ordem de Serviço</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/ordens')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Dados da Ordem</h2>

  <form on:submit={handleSubmit}>
    <!-- Título -->
    <div class="form-group">
      <label for="title">Título *</label>
      <input
        id="title"
        type="text"
        bind:value={title}
        required
        placeholder="Ex: Troca de correia da esteira"
      />
    </div>

    <!-- Descrição -->
    <div class="form-group">
      <label for="description">Descrição *</label>
      <textarea
        id="description"
        bind:value={description}
        required
        placeholder="Descreva o problema identificado..."
      ></textarea>
    </div>

    <!-- Seleção de equipamento e técnico -->
    <div class="form-row">
      <div class="form-group">
        <label for="machine">Equipamento *</label>
        <select id="machine" bind:value={machineId} required>
          <option value="">Selecione um equipamento</option>
          {#each machines as m}
            <option value={m.id}>{m.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="technician">Técnico Responsável *</label>
        <select id="technician" bind:value={userId} required>
          <option value="">Selecione um técnico</option>
          {#each users as u}
            <option value={u.id}>{u.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Status (padrão PENDING) -->
    <div class="form-group">
      <label for="status">Status</label>
      <select id="status" bind:value={status}>
        <option value="PENDING">Pendente</option>
        <option value="IN_PROGRESS">Em Andamento</option>
        <option value="COMPLETED">Concluída</option>
        <option value="CANCELLED">Cancelada</option>
      </select>
    </div>

    <!-- Mensagem de erro -->
    {#if error}
      <div class="error">⚠️ {error}</div>
    {/if}

    <!-- Botões -->
    <div class="form-actions">
      <button type="button" class="btn secondary" on:click={() => goto('/ordens')}>
        Cancelar
      </button>

      <button type="submit" class="btn" disabled={loading}>
        {#if loading}
          <i class="fas fa-spinner fa-spin"></i> Salvando...
        {:else}
          <i class="fas fa-save"></i> Salvar OS
        {/if}
      </button>
    </div>
  </form>
</div>
