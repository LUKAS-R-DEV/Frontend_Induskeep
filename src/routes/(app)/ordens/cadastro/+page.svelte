<script>
  import '$lib/styles/ordens-cadastro.css';
  import { goto } from '$app/navigation';

  let equipment = '';
  let type = '';
  let technician = '';
  let priority = '';
  let openingDate = '';
  let deadline = '';
  let description = '';

  let parts = [];

  function addPart() {
    parts = [
      ...parts,
      {
        id: Date.now(),
        name: '',
        quantity: 1,
        price: 0
      }
    ];
  }

  function removePart(id) {
    parts = parts.filter(p => p.id !== id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert('Ordem de Serviço salva com sucesso!');
    goto('/ordens');
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
  <h2>Dados da Ordem de Serviço</h2>
  <form on:submit={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="equipment">Equipamento *</label>
        <select id="equipment" bind:value={equipment} required>
          <option value="">Selecione um equipamento</option>
          <option>Máquina de Moldagem A</option>
          <option>Compressor B</option>
          <option>Prensa Hidráulica</option>
          <option>Misturador Industrial</option>
        </select>
      </div>
      <div class="form-group">
        <label for="type">Tipo de Manutenção *</label>
        <select id="type" bind:value={type} required>
          <option value="">Selecione o tipo</option>
          <option value="preventiva">Preventiva</option>
          <option value="corretiva">Corretiva</option>
          <option value="preditiva">Preditiva</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="technician">Técnico Responsável *</label>
        <select id="technician" bind:value={technician} required>
          <option value="">Selecione um técnico</option>
          <option>Carlos Silva</option>
          <option>Ana Santos</option>
          <option>João Pereira</option>
          <option>Maria Oliveira</option>
        </select>
      </div>
      <div class="form-group">
        <label for="priority">Prioridade *</label>
        <select id="priority" bind:value={priority} required>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="openingDate">Data de Abertura *</label>
        <input type="date" id="openingDate" bind:value={openingDate} required />
      </div>
      <div class="form-group">
        <label for="deadline">Previsão de Conclusão *</label>
        <input type="date" id="deadline" bind:value={deadline} required />
      </div>
    </div>

    <div class="form-group">
      <label for="description">Descrição do Problema *</label>
      <textarea id="description" bind:value={description} required></textarea>
    </div>

    <!-- Peças -->
    <div class="parts-list">
      <div class="parts-header">
        <h3>Peças Utilizadas</h3>
        <button type="button" class="btn secondary" on:click={addPart}>
          <i class="fas fa-plus"></i> Adicionar Peça
        </button>
      </div>
      <table class="parts-table">
        <thead>
          <tr>
            <th>Peça</th>
            <th>Quantidade</th>
            <th>Valor Unit.</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {#each parts as part}
            <tr>
              <td>
                <select bind:value={part.name}>
                  <option value="">Selecione uma peça</option>
                  <option>Rolamento AX-205</option>
                  <option>Correia Dentada 5M</option>
                  <option>Sensor de Temperatura</option>
                </select>
              </td>
              <td><input type="number" min="1" bind:value={part.quantity} /></td>
              <td>R$ {part.price.toFixed(2)}</td>
              <td>
                <span class="remove-part" on:click={() => removePart(part.id)}>
                  <i class="fas fa-times"></i>
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="form-actions">
      <button type="button" class="btn secondary" on:click={() => goto('/ordens')}>Cancelar</button>
      <button type="submit" class="btn">Salvar OS</button>
    </div>
  </form>
</div>
