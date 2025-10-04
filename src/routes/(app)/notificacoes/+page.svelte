<script>
  import '$lib/styles/notificacoes.css';

  let notificacoes = [
    {
      id: 1,
      titulo: "Estoque Crítico",
      tipo: "Crítico",
      icone: "fas fa-exclamation-triangle",
      classe: "critical",
      descricao: "Peça 'Rolamento AX-205' está com estoque abaixo do mínimo (5 unidades restantes)",
      tempo: "Há 2 horas",
      acoes: ["Ver estoque", "Solicitar compra"],
      unread: true
    },
    {
      id: 2,
      titulo: "Manutenção Atrasada",
      tipo: "Alerta",
      icone: "fas fa-tools",
      classe: "warning",
      descricao: "Máquina 'Misturador Industrial' está com manutenção preventiva atrasada há 3 dias",
      tempo: "Hoje às 09:15",
      acoes: ["Ver equipamento", "Criar OS"],
      unread: true
    },
    {
      id: 3,
      titulo: "Nova OS Criada",
      tipo: "Informativo",
      icone: "fas fa-info-circle",
      classe: "info",
      descricao: "Ordem de Serviço #045 foi criada para a Máquina de Moldagem A",
      tempo: "Ontem às 14:30",
      acoes: ["Ver OS"],
      unread: false
    },
    {
      id: 4,
      titulo: "OS Concluída",
      tipo: "Concluído",
      icone: "fas fa-check-circle",
      classe: "success",
      descricao: "Ordem de Serviço #043 foi concluída por João Pereira",
      tempo: "05/09/2023 às 16:45",
      acoes: ["Ver OS", "Baixar relatório"],
      unread: false
    }
  ];

  function marcarComoLida(id) {
    notificacoes = notificacoes.map(n =>
      n.id === id ? { ...n, unread: false } : n
    );
  }

  function marcarTodasLidas() {
    notificacoes = notificacoes.map(n => ({ ...n, unread: false }));
  }

  function limparTodas() {
    if (confirm("Tem certeza que deseja limpar todas as notificações?")) {
      notificacoes = [];
    }
  }
</script>

<div class="header">
  <h1>Central de Notificações</h1>
</div>

<div class="page-actions">
  <button class="btn" on:click={marcarTodasLidas}>
    <i class="fas fa-check-double"></i> Marcar todas como lidas
  </button>
  <button class="btn" on:click={limparTodas}>
    <i class="fas fa-trash"></i> Limpar todas
  </button>
</div>

<div class="filters">
  <div class="filter-group">
    <label for="typeFilter">Tipo de Notificação</label>
    <select id="typeFilter">
      <option value="all">Todas</option>
      <option value="critical">Críticas</option>
      <option value="warning">Alertas</option>
      <option value="info">Informativas</option>
      <option value="success">Concluídas</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="statusFilter">Status</label>
    <select id="statusFilter">
      <option value="all">Todas</option>
      <option value="unread">Não lidas</option>
      <option value="read">Lidas</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="dateFilter">Período</label>
    <select id="dateFilter">
      <option value="all">Todos</option>
      <option value="today">Hoje</option>
      <option value="week">Esta semana</option>
      <option value="month">Este mês</option>
    </select>
  </div>
</div>

<div class="section">
  <h2>Notificações</h2>

  {#if notificacoes.length > 0}
    {#each notificacoes as n}
      <div 
        class="notification-item {n.unread ? 'unread' : ''}" 
        on:click={() => marcarComoLida(n.id)}
      >
        <div class="notification-icon {n.classe}">
          <i class={n.icone}></i>
        </div>
        <div class="notification-content">
          <h4>
            {n.titulo}
            <span class="notification-badge badge-{n.classe}">{n.tipo}</span>
          </h4>
          <p>{n.descricao}</p>
          <div class="notification-time">{n.tempo}</div>
          {#if n.acoes && n.acoes.length > 0}
            <div class="notification-actions">
              {#each n.acoes as acao}
                <button class="action-btn">{acao}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">
      <i class="fas fa-bell-slash"></i>
      <p>Nenhuma notificação encontrada</p>
    </div>
  {/if}
</div>
