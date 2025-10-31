<script>
  import '$lib/styles/ordens-cadastro.css';
  import { OrdersApi } from '$lib/api/orders';
  import { goto } from '$app/navigation';

  // Campos necessários para criar ordem conforme seu backend
  let title = '';
  let description = '';
  let machineId = '';
  let userId = '';
  let status = 'PENDING';

  let loading = false;
  let error = '';

  // ⚙️ Exemplo de dados estáticos (substitua por fetch futuro)
  const machines = [
    { id: '11902ccc-e1cf-4c47-9fea-6316ae0a3e67', name: 'Compressor A12' },
    { id: '2bd83846-2c34-4073-a39f-348bf86ef2f4', name: 'Esteira X55' },
    { id: '9cb2e6a0-023d-42d5-8ca7-7d7bf8ced1a0', name: 'Máquina de Moldagem' }
  ];

  const users = [
    { id: 'a5718035-b24f-49f9-b8d7-de7c9e5a4726', name: 'Lucas Técnico' },
    { id: '411ecedc-a4b6-452c-8fd9-f1887259d041', name: 'Carlos Silva' }
  ];

  // Função de envio
  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const payload = { title, description, machineId, userId, status };
      await OrdersApi.create(payload);

      alert('✅ Ordem de Serviço criada com sucesso!');
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
