<script>
  import '$lib/styles/estoque-cadastro.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { SettingsApi } from '$lib/api/settings';

  let name = '';
  let code = '';
  let quantity = 0;
  let minStock = '';
  let unitPrice = '';
  let settingsMinStock = 5;
  let loading = false;

  // 🔹 Carrega o valor mínimo padrão do Settings
  onMount(async () => {
    try {
      const settings = await SettingsApi.get();
      settingsMinStock = settings?.minStockThreshold ?? 5;
    } catch (err) {
      console.warn('⚠️ Falha ao buscar configurações globais:', err);
    }
  });

  // 🔹 Envia o formulário para a API
  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        quantity: Number(quantity),
        minStock: minStock ? Number(minStock) : settingsMinStock,
        unitPrice: unitPrice ? Number(unitPrice) : null,
      };

      await PieceApi.create(payload);
      alert(`✅ Peça "${payload.name}" cadastrada com sucesso!`);
      goto('/estoque');
    } catch (err) {
      console.error(err);
      alert(`❌ Erro ao cadastrar peça: ${err.message || 'Tente novamente.'}`);
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Cadastro de Peça</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/estoque')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Informações da Peça</h2>

  <form on:submit={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="code">Código da Peça *</label>
        <input id="code" bind:value={code} required />
      </div>
      <div class="form-group">
        <label for="name">Nome da Peça *</label>
        <input id="name" bind:value={name} required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="quantity">Quantidade Inicial *</label>
        <input id="quantity" type="number" min="0" bind:value={quantity} required />
      </div>
      <div class="form-group">
        <label for="minStock">Qtd. Mínima (opcional)</label>
        <input
          id="minStock"
          type="number"
          min="0"
          bind:value={minStock}
          placeholder={`Padrão: ${settingsMinStock}`}
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="unitPrice">Custo Unitário (R$)</label>
        <input id="unitPrice" type="number" min="0" step="0.01" bind:value={unitPrice} />
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn secondary" on:click={() => goto('/estoque')}>Cancelar</button>
      <button type="submit" class="btn" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Peça'}
      </button>
    </div>
  </form>
</div>

<style>
  .btn[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
