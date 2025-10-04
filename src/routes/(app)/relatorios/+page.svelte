<script>
  import '$lib/styles/relatorios.css';

  let filtros = {
    dataInicial: '',
    dataFinal: '',
    tipo: '',
    equipamento: '',
    tecnico: '',
    status: ''
  };

  function gerarRelatorio() {
    alert("Gerando relatório com filtros selecionados...");
  }

  function limparFiltros() {
    filtros = { dataInicial: '', dataFinal: '', tipo: '', equipamento: '', tecnico: '', status: '' };
  }
</script>

<div class="header">
  <h1>Relatórios e Análises</h1>
</div>

<div class="cards">
  <div class="card">
    <div class="card-header">
      <div class="card-icon primary"><i class="fas fa-tools"></i></div>
      <div class="card-title">Relatório de OS por Período</div>
    </div>
    <div class="card-description">
      Relatório detalhado de ordens de serviço por período, com filtros por tipo, status e técnico.
    </div>
    <div class="card-footer">
      <span class="card-badge primary">PDF, Excel</span>
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon accent"><i class="fas fa-box"></i></div>
      <div class="card-title">Consumo de Peças</div>
    </div>
    <div class="card-description">
      Análise de consumo de peças por equipamento, período e tipo de manutenção.
    </div>
    <div class="card-footer">
      <span class="card-badge primary">PDF, Excel</span>
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="card-title">Estoque Crítico</div>
    </div>
    <div class="card-description">
      Relatório de peças com estoque abaixo do mínimo estabelecido.
    </div>
    <div class="card-footer">
      <span class="card-badge primary">PDF</span>
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon danger"><i class="fas fa-chart-line"></i></div>
      <div class="card-title">Indicadores de Performance</div>
    </div>
    <div class="card-description">
      KPIs de manutenção: MTBF, MTTR, disponibilidade de equipamentos.
    </div>
    <div class="card-footer">
      <span class="card-badge primary">PDF, Excel</span>
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>
</div>

<div class="filters">
  <h2>Relatório de Ordens de Serviço</h2>
  <div class="filter-row">
    <div class="filter-group">
      <label for="startDate">Data Inicial</label>
      <input type="date" id="startDate" bind:value={filtros.dataInicial} />
    </div>
    <div class="filter-group">
      <label for="endDate">Data Final</label>
      <input type="date" id="endDate" bind:value={filtros.dataFinal} />
    </div>
    <div class="filter-group">
      <label for="reportType">Tipo de Manutenção</label>
      <select id="reportType" bind:value={filtros.tipo}>
        <option value="">Todos</option>
        <option value="Preventiva">Preventiva</option>
        <option value="Corretiva">Corretiva</option>
        <option value="Preditiva">Preditiva</option>
      </select>
    </div>
  </div>

  <div class="filter-row">
    <div class="filter-group">
      <label for="equipmentReport">Equipamento</label>
      <select id="equipmentReport" bind:value={filtros.equipamento}>
        <option value="">Todos</option>
        <option value="Máquina de Moldagem A">Máquina de Moldagem A</option>
        <option value="Compressor B">Compressor B</option>
        <option value="Prensa Hidráulica">Prensa Hidráulica</option>
        <option value="Misturador Industrial">Misturador Industrial</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="technicianReport">Técnico</label>
      <select id="technicianReport" bind:value={filtros.tecnico}>
        <option value="">Todos</option>
        <option value="Carlos Silva">Carlos Silva</option>
        <option value="Ana Santos">Ana Santos</option>
        <option value="João Pereira">João Pereira</option>
        <option value="Maria Oliveira">Maria Oliveira</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="statusReport">Status</label>
      <select id="statusReport" bind:value={filtros.status}>
        <option value="">Todos</option>
        <option value="Concluída">Concluída</option>
        <option value="Cancelada">Cancelada</option>
      </select>
    </div>
  </div>

  <div class="filter-actions">
    <button class="btn secondary" on:click={limparFiltros}>Limpar</button>
    <button class="btn" on:click={gerarRelatorio}><i class="fas fa-download"></i> Gerar Relatório</button>
  </div>
</div>

<div class="chart-container">
  <h2>Estatísticas de Manutenção (Últimos 6 Meses)</h2>
  <div class="chart-placeholder">[ Gráfico de estatísticas de manutenção ]</div>
</div>

<div class="chart-container">
  <h2>Top 5 Equipamentos com Mais Manutenções</h2>
  <div class="chart-placeholder">[ Gráfico de equipamentos com mais manutenções ]</div>
</div>
