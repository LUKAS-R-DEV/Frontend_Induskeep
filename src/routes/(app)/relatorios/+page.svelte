<script>
  import '$lib/styles/relatorios.css';
  import { onMount, tick } from 'svelte';
  import { AnalyticsApi } from '$lib/api/analytics';
  import { ReportApi } from '$lib/api/reports';
  import { MachinesApi } from '$lib/api/machines';
  import { StockApi } from '$lib/api/stock';
  import { ExportFactory } from '$lib/export'; // usa módulos de exportação
  import * as echarts from 'echarts';

  let loading = true;
  let error = '';
  let overview = {};
  let historico = [];
  let machines = [];
  let stockMovements = [];
  let charts = {};

  // KPIs derivados
  $: completionRate = overview?.totalOrders
    ? ((overview.completedOrders / overview.totalOrders) * 100).toFixed(1)
    : 0;
  $: avgPiecesPerOrder = overview?.totalOrders
    ? (overview.totalPiecesUsed / overview.totalOrders).toFixed(2)
    : 0;
  $: pendingOrders = overview?.totalOrders - overview?.completedOrders || 0;

  // ======= Carregamento inicial =======
  onMount(async () => {
    try {
      const [analyticsRes, historyRes, machinesRes, stockRes] = await Promise.allSettled([
        AnalyticsApi.get(),
        ReportApi.getHistory(),
        MachinesApi.list(),
        StockApi.listMovements()
      ]);
      overview = analyticsRes.value || {};
      historico = historyRes.value || [];
      machines = machinesRes.value || [];
      stockMovements = stockRes.value || [];

      loading = false;
      await tick();
      renderCharts();
    } catch (e) {
      console.error(e);
      error = 'Erro ao carregar relatórios.';
      loading = false;
    }
  });

  // ======= Renderização dos gráficos (ECharts) =======
  function renderCharts() {
    const palette = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
    const baseFont = 14;

    const makeChart = (id, options) => {
      const el = document.getElementById(id);
      if (!el) return;
      const chart = echarts.init(el, null, { renderer: 'svg' });
      chart.setOption(options);
      window.addEventListener('resize', () => chart.resize());
      charts[id] = chart;
    };

    // Gráficos
    makeChart('maintHistoryChart', {
      title: { text: 'Manutenções por Mês', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 60, bottom: 45 },
      xAxis: { type: 'category', data: ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', smooth: true, data: [5, 7, 4, 8, 6, 9], areaStyle: { color: 'rgba(37,99,235,0.15)' } }]
    });

    makeChart('topEquipChart', {
      title: { text: 'Top 5 Equipamentos', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 60, bottom: 60 },
      xAxis: { type: 'category', data: ['Prensa H.', 'Compressor B', 'Misturador', 'Esteira X55', 'Máquina A'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [12, 9, 7, 6, 5], itemStyle: { color: palette[1], borderRadius: [6, 6, 0, 0] } }]
    });

    makeChart('maintTypeChart', {
      title: { text: 'Tipos de Manutenção', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'item' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: ['45%', '75%'],
        label: { formatter: '{b}: {d}%', fontSize: baseFont + 1 },
        data: [
          { value: 40, name: 'Preventiva' },
          { value: 45, name: 'Corretiva' },
          { value: 15, name: 'Preditiva' }
        ],
        color: [palette[0], palette[3], palette[2]]
      }]
    });

    makeChart('techPerfChart', {
      title: { text: 'Performance por Técnico', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 120, right: 40, top: 60, bottom: 40 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ['Carlos', 'Ana', 'João', 'Maria', 'Lucas'] },
      series: [{ type: 'bar', data: [1.2, 1.5, 1.0, 1.8, 1.4], itemStyle: { color: palette[2], borderRadius: 8 } }]
    });

    makeChart('piecesChart', {
      title: { text: 'Consumo de Peças', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'item' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: ['50%', '78%'],
        label: { formatter: '{b}: {d}%', fontSize: baseFont + 1 },
        data: [
          { value: 12, name: 'Filtros' },
          { value: 9, name: 'Correias' },
          { value: 7, name: 'Parafusos' },
          { value: 5, name: 'Óleo' },
          { value: 3, name: 'Outros' }
        ],
        color: palette
      }]
    });
  }
</script>

<!-- HEADER -->
<div class="header">
  <h1>📊 Painel de Relatórios</h1>
</div>

<!-- ESTADOS -->
{#if loading}
  <div class="loading">Carregando relatórios...</div>
{:else if error}
  <div class="error">⚠️ {error}</div>
{:else}

  <!-- KPI PRINCIPAIS -->
  <section class="relatorios-section">
    <h2>Indicadores de Desempenho</h2>
    <div class="kpi-grid">
      <div class="kpi"><span>Total de Máquinas</span><strong>{overview.totalMachines}</strong></div>
      <div class="kpi"><span>Total de OS</span><strong>{overview.totalOrders}</strong></div>
      <div class="kpi"><span>Concluídas</span><strong>{overview.completedOrders}</strong></div>
      <div class="kpi"><span>Taxa de Conclusão</span><strong>{completionRate}%</strong></div>
      <div class="kpi"><span>Tempo Médio (MTTR)</span><strong>{overview.avgRepairTime} h</strong></div>
      <div class="kpi"><span>Intervalo entre Falhas (MTBF)</span><strong>{overview.avgFailureInterval} h</strong></div>
      <div class="kpi"><span>Peças Usadas</span><strong>{overview.totalPiecesUsed}</strong></div>
      <div class="kpi"><span>Média Peças/OS</span><strong>{avgPiecesPerOrder}</strong></div>
      <div class="kpi"><span>Ordens Pendentes</span><strong>{pendingOrders}</strong></div>
    </div>
  </section>

  <!-- CARDS DE EXPORTAÇÃO -->
  <section class="relatorios-section">
    <h2>Relatórios Disponíveis</h2>
    <div class="cards">
      <div class="card" on:click={() => ExportFactory.reports(historico, 'pdf')}>
        <div class="card-header">
          <div class="card-icon primary"><i class="fas fa-tools"></i></div>
          <div class="card-title">Relatório de OS por Período</div>
        </div>
        <div class="card-description">
          Relatório detalhado de ordens de serviço, com status e técnicos.
        </div>
        <div class="card-footer">
          <span class="card-badge primary">PDF, CSV</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <div class="card" on:click={() => ExportFactory.inventory(stockMovements, 'pdf')}>
        <div class="card-header">
          <div class="card-icon accent"><i class="fas fa-box"></i></div>
          <div class="card-title">Consumo de Peças</div>
        </div>
        <div class="card-description">
          Análise de consumo de peças por equipamento e tipo de manutenção.
        </div>
        <div class="card-footer">
          <span class="card-badge primary">PDF, CSV</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <div class="card" on:click={() => ExportFactory.analytics(overview, charts, 'pdf')}>
        <div class="card-header">
          <div class="card-icon danger"><i class="fas fa-chart-line"></i></div>
          <div class="card-title">Indicadores de Performance</div>
        </div>
        <div class="card-description">
          KPIs de manutenção: MTBF, MTTR e disponibilidade.
        </div>
        <div class="card-footer">
          <span class="card-badge primary">PDF</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <div class="card" on:click={() => ExportFactory.machines(machines, 'pdf')}>
        <div class="card-header">
          <div class="card-icon warning"><i class="fas fa-cogs"></i></div>
          <div class="card-title">Relatório de Máquinas</div>
        </div>
        <div class="card-description">
          Lista de máquinas com status, localização e OS associadas.
        </div>
        <div class="card-footer">
          <span class="card-badge primary">PDF,CSV</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
  </section>

  <!-- GRÁFICOS -->
  <section class="relatorios-section">
    <h2>Gráficos de Análise</h2>
    <div class="charts-grid">
      <div id="maintHistoryChart" class="chart-card"></div>
      <div id="topEquipChart" class="chart-card"></div>
      <div id="maintTypeChart" class="chart-card"></div>
      <div id="techPerfChart" class="chart-card"></div>
      <div id="piecesChart" class="chart-card"></div>
    </div>
  </section>
{/if}

<style>
  .header {
    background: white;
    border-bottom: 2px solid #e5e7eb;
    padding: 1rem 1.5rem;
  }

  .relatorios-section {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  /* KPI GRID */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
  }

  .kpi {
    background: #f9fafb;
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
  }

  .kpi span { font-size: 0.95rem; color: #6b7280; }
  .kpi strong { display: block; font-size: 1.6rem; margin-top: .3rem; color: #111827; }

  /* CARDS */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .card {
    background: #fff;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
  }

  .card-icon.primary { background: #2563eb; }
  .card-icon.accent { background: #10b981; }
  .card-icon.warning { background: #f59e0b; }
  .card-icon.danger { background: #ef4444; }

  .card-title { font-weight: 600; font-size: 1rem; color: #111827; }
  .card-description { font-size: 0.9rem; color: #4b5563; margin-bottom: 0.75rem; }
  .card-footer { display: flex; align-items: center; justify-content: space-between; color: #2563eb; font-weight: 500; }

  .card-badge {
    background: #2563eb;
    color: #fff;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
  }

  /* CHARTS */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .chart-card {
    background: #f9fafb;
    border-radius: 12px;
    padding: 0.75rem;
    height: 460px;
  }

  @media (max-width: 768px) {
    .charts-grid { grid-template-columns: 1fr; }
    .chart-card { height: 360px; }
  }

  .loading, .error {
    text-align: center;
    margin: 2rem 0;
    color: #b91c1c;
  }
</style>
