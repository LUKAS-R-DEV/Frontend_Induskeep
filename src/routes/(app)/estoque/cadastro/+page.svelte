<script>
  import '$lib/styles/estoque-cadastro.css';

  function salvarPeca(e) {
    e.preventDefault();
    alert('Peça salva com sucesso!');
    window.location.href = '/estoque';
  }
</script>

<div class="header">
  <h1>Cadastro de Peça</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => (window.location.href = '/estoque')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Informações da Peça</h2>
  <form on:submit={salvarPeca}>
    <div class="form-row">
      <div class="form-group">
        <label for="code">Código da Peça *</label>
        <input type="text" id="code" name="code" required />
      </div>
      <div class="form-group">
        <label for="name">Nome da Peça *</label>
        <input type="text" id="name" name="name" required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="category">Categoria *</label>
        <select id="category" name="category" required>
          <option value="">Selecione uma categoria</option>
          <option value="mecanica">Mecânica</option>
          <option value="eletrica">Elétrica</option>
          <option value="hidraulica">Hidráulica</option>
          <option value="pneumatica">Pneumática</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <div class="form-group">
        <label for="manufacturer">Fabricante</label>
        <input type="text" id="manufacturer" name="manufacturer" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="quantity">Quantidade em Estoque *</label>
        <input type="number" id="quantity" name="quantity" min="0" required />
      </div>
      <div class="form-group">
        <label for="minQuantity">Quantidade Mínima *</label>
        <input type="number" id="minQuantity" name="minQuantity" min="1" required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="unitCost">Custo Unitário (R$) *</label>
        <input type="number" id="unitCost" name="unitCost" min="0" step="0.01" required />
      </div>
      <div class="form-group">
        <label for="supplier">Fornecedor</label>
        <input type="text" id="supplier" name="supplier" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="location">Localização no Estoque</label>
        <input type="text" id="location" name="location" placeholder="Ex: Prateleira A3, Caixa 12" />
      </div>
      <div class="form-group">
        <label for="status">Status *</label>
        <select id="status" name="status" required>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="description">Descrição / Especificações</label>
      <textarea id="description" name="description"></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn secondary">Cancelar</button>
      <button type="submit" class="btn">Salvar Peça</button>
    </div>
  </form>
</div>
