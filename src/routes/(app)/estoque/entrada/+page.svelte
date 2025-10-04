<script>
  import '$lib/styles/estoque-movimentacao.css';

  function salvarEntrada(e) {
    e.preventDefault();
    alert('Entrada registrada com sucesso!');
    window.location.href = '/estoque';
  }
</script>

<div class="header">
  <h1>Entrada de Estoque</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => (window.location.href = '/estoque')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Registrar Entrada</h2>
  <form on:submit={salvarEntrada}>
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
        <label for="fornecedor">Fornecedor</label>
        <input type="text" id="fornecedor" />
      </div>
      <div class="form-group">
        <label for="notaFiscal">Nota Fiscal</label>
        <input type="text" id="notaFiscal" />
      </div>
    </div>
    <div class="form-group">
      <label for="observacoes">Observações</label>
      <textarea id="observacoes"></textarea>
    </div>
    <div class="form-actions">
      <button type="button" class="btn secondary">Cancelar</button>
      <button type="submit" class="btn success">Confirmar Entrada</button>
    </div>
  </form>
</div>
