<script>
  import '$lib/styles/estoque-cadastro.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { StockApi } from '$lib/api/stock';
  import { getUser } from '$lib/stores/users';


  let pecas = [];
  let pieceId = '';
  let quantity = '';
  let type = 'ENTRY';
  let notes = '';
  let loading = false;
  let error = '';

  // 🔹 Carrega peças disponíveis
  onMount(async () => {
    try {
      pecas = await PieceApi.list();
    } catch (e) {
      console.error(e);
      error = 'Erro ao carregar peças. Verifique a conexão.';
    }
  });

  // 🔹 Salvar movimentação
  async function salvarMovimentacao(e) {
    e.preventDefault();
    if (!pieceId || !quantity || !type) {
      alert('⚠️ Preencha todos os campos obrigatórios.');
      return;
    }

    loading = true;
    try {
      const payload = {
        pieceId,
        quantity: Number(quantity),
        type,
        notes: notes || null,
        userId: getUser()?.id || null
      };

      await StockApi.create(payload);
      alert('✅ Movimentação registrada com sucesso!');
      goto('/estoque/movimentacoes');
    } catch (err) {
      console.error(err);
      alert(`❌ Erro ao salvar movimentação: ${err.message || 'Tente novamente.'}`);
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Nova Movimentação</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/estoque/movimentacoes')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

{#if error}
  <div class="error">{error}</div>
{:else}
  <div class="section">
    <h2>Informações da Movimentação</h2>

    <form on:submit={salvarMovimentacao}>
      <div class="form-row">
        <div class="form-group">
          <label for="pieceId">Peça *</label>
          <select id="pieceId" bind:value={pieceId} required>
            <option value="">Selecione a peça</option>
            {#each pecas as p}
              <option value={p.id}>{p.name} ({p.code})</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="quantity">Quantidade *</label>
          <input
            id="quantity"
            type="number"
            min="1"
            bind:value={quantity}
            placeholder="Ex: 5"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="type">Tipo de Movimentação *</label>
          <select id="type" bind:value={type} required>
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Saída</option>
          </select>
        </div>

        <div class="form-group">
          <label for="notes">Observação</label>
          <input
            id="notes"
            type="text"
            bind:value={notes}
            placeholder="Ex: Reposição semanal, uso em manutenção..."
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn secondary" on:click={() => goto('/estoque/movimentacoes')}>
          Cancelar
        </button>
        <button type="submit" class="btn" disabled={loading}>
          {loading ? 'Salvando...' : 'Registrar Movimentação'}
        </button>
      </div>
    </form>
  </div>
{/if}

<style>
  .error {
    background: #fee2e2;
    color: #b91c1c;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
  }

  .btn[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  select, input {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }

  form {
    margin-top: 1rem;
  }
</style>
