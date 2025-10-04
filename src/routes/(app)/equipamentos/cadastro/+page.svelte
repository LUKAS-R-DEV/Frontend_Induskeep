<script>
  import '$lib/styles/equipamentos-cadastro.css';
  import { goto } from '$app/navigation';

  let name = '';
  let serial = '';
  let sector = '';
  let model = '';
  let manufacturer = '';
  let purchaseDate = '';
  let maintenanceInterval = 90;
  let status = 'active';
  let description = '';

  function handleSubmit(e) {
    e.preventDefault();

    // Aqui você pode chamar sua API futuramente
    alert(`Equipamento "${name}" salvo com sucesso!`);
    goto('/equipamentos');
  }
</script>

<div class="header">
  <h1>Cadastro de Equipamento</h1>
  </div>
<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/equipamentos')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Informações do Equipamento</h2>
  <form on:submit={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="name">Nome do Equipamento *</label>
        <input id="name" type="text" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="serial">Número de Série *</label>
        <input id="serial" type="text" bind:value={serial} required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="sector">Setor *</label>
        <select id="sector" bind:value={sector} required>
          <option value="">Selecione um setor</option>
          <option value="producao">Produção</option>
          <option value="utilidades">Utilidades</option>
          <option value="expedicao">Expedição</option>
          <option value="preparacao">Preparação</option>
        </select>
      </div>
      <div class="form-group">
        <label for="model">Modelo</label>
        <input id="model" type="text" bind:value={model} />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="manufacturer">Fabricante</label>
        <input id="manufacturer" type="text" bind:value={manufacturer} />
      </div>
      <div class="form-group">
        <label for="purchaseDate">Data de Aquisição</label>
        <input id="purchaseDate" type="date" bind:value={purchaseDate} />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="maintenanceInterval">Intervalo de Manutenção (dias)</label>
        <input id="maintenanceInterval" type="number" min="1" bind:value={maintenanceInterval} />
      </div>
      <div class="form-group">
        <label for="status">Status *</label>
        <select id="status" bind:value={status} required>
          <option value="active">Ativo</option>
          <option value="maintenance">Em Manutenção</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="description">Descrição / Observações</label>
      <textarea id="description" bind:value={description}></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn secondary" on:click={() => goto('/equipamentos')}>Cancelar</button>
      <button type="submit" class="btn">Salvar Equipamento</button>
    </div>
  </form>
</div>
