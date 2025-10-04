<script>
  import '$lib/styles/estoque-movimentacao.css';

  function salvarSaida(e) {
    e.preventDefault();
    alert('Saída registrada com sucesso!');
    window.location.href = '/estoque';
  }
</script>

<div class="header">
  <h1>Saída de Estoque</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => (window.location.href = '/estoque')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Registrar Saída</h2>
  <form on:submit={salvarSaida}>
    <div class="form-row">
      <div class="form-group">
        <label for="codigo">Código da Peça *</label>
        <input type="text" id="codigo" required />
      </div>
      <div class="form-group">
        <label for="quantidade">Quantidade *</label>
        <input type="number" id="quantidade" min="1" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="responsavel">Responsável</label>
        <input type="text" id="responsavel" />
      </div>
      <div class="form-group">
        <label for="ordemServico">Ordem de Serviço</label>
        <input type="text" id="ordemServico" placeholder="#000" />
      </div>
    </div>
    <div class="form-group">
      <label for="observacoes">Observações</label>
      <textarea id="observacoes"></textarea>
    </div>
    <div class="form-actions">
      <button type="button" class="btn secondary">Cancelar</button>
      <button type="submit" class="btn danger">Confirmar Saída</button>
    </div>
  </form>
</div>
