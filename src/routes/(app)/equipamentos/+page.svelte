<script>
  import '$lib/styles/equipamentos.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MachinesApi } from '$lib/api/machines';

  let search = '';
  let equipamentos = [];
  let loading = true;
  let error = '';

  // Busca da API
  onMount(async () => {
    try {
      const data = await MachinesApi.list();
      equipamentos = Array.isArray(data) ? data : [];
    } catch (err) {
      error = err.message || 'Erro ao carregar equipamentos';
    } finally {
      loading = false;
    }
  });

  function editarEquipamento(eq) {
    goto(`/equipamentos/${eq.id}/editar`);
  }

  async function deletarEquipamento(eq) {
    const ok = confirm(`Deseja realmente excluir ${eq.name}?`);
    if (!ok) return;

    try {
      await MachinesApi.remove(eq.id);
      equipamentos = equipamentos.filter(e => e.id !== eq.id);
      alert('Equipamento removido com sucesso.');
    } catch (err) {
      alert(err.message || 'Erro ao remover equipamento.');
    }
  }
</script>

<div class="header">
  <h1>Gestão de Equipamentos</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input
      type="text"
      placeholder="Buscar equipamento..."
      bind:value={search}
    />
  </div>
  <button class="btn" on:click={() => goto('/equipamentos/cadastro')}>
    <i class="fas fa-plus"></i> Novo Equipamento
  </button>
</div>

{#if loading}
  <div class="loading">Carregando equipamentos...</div>
{:else if error}
  <div class="error">⚠️ {error}</div>
{:else}
  <div class="section">
    <h2>Lista de Equipamentos</h2>

    {#if equipamentos.length > 0}
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Nº Série</th>
            <th>Localização</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each equipamentos.filter(e =>
            (e.name?.toLowerCase().includes(search.toLowerCase()) ||
             e.serial?.toLowerCase().includes(search.toLowerCase()))
          ) as eq}
            <tr>
              <td>{eq.name}</td>
              <td>{eq.serial}</td>
              <td>{eq.location || '-'}</td>
              <td>
                <span class={"status " + eq.status.toLowerCase()}>
                  {eq.status === 'ACTIVE'
                    ? 'Ativo'
                    : eq.status === 'MAINTENANCE'
                    ? 'Em Manutenção'
                    : 'Inativo'}
                </span>
              </td>
              <td class="actions">
                <button
                  class="action-btn edit"
                  title="Editar equipamento"
                  on:click={() => editarEquipamento(eq)}
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="action-btn delete"
                  title="Excluir equipamento"
                  on:click={() => deletarEquipamento(eq)}
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>Nenhum equipamento encontrado.</p>
    {/if}
  </div>
{/if}

<style>
  .status.active {
    background: #e6f9ef;
    color: #008a4e;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .status.inactive {
    background: #fde8e8;
    color: #b91c1c;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .status.maintenance {
    background: #fff4cc;
    color: #b36b00;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .loading,
  .error {
    margin-top: 2rem;
    font-size: 1.2rem;
  }

  .error {
    color: #b91c1c;
  }
</style>
