<script>
  import '$lib/styles/relatorios.css';
  import { onMount, tick } from 'svelte';
  import { AnalyticsApi } from '$lib/api/analytics';
  import { ReportApi } from '$lib/api/reports';
  import { MachinesApi } from '$lib/api/machines';
  import { StockApi } from '$lib/api/stock';
  import { ExportFactory } from '$lib/export';
  import * as echarts from 'echarts';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let loading = true;
  let error = '';
  let overview = {};
  let historico = [];
  let machines = [];
  let stockMovements = [];
  let charts = {};

  $: completionRate = overview?.totalOrders
    ? ((overview.completedOrders / overview.totalOrders) * 100).toFixed(1)
    : 0;
  $: avgPiecesPerOrder = overview?.totalOrders
    ? (overview.totalPiecesUsed / overview.totalOrders).toFixed(2)
    : 0;
  $: pendingOrders = overview?.totalOrders - overview?.completedOrders || 0;

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

  function renderCharts() {
    const palette = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

    const makeChart = (id, options) => {
      const el = document.getElementById(id);
      if (!el) return;
      const chart = echarts.init(el, null, { renderer: 'svg' });
      chart.setOption(options);
      window.addEventListener('resize', () => chart.resize());
      charts[id] = chart;
    };

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
        label: { formatter: '{b}: {d}%', fontSize: 15 },
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
        label: { formatter: '{b}: {d}%', fontSize: 15 },
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

  async function exportReport(type, data) {
    try {
      await ExportFactory[type](data, 'pdf');
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Relatório exportado com sucesso.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao exportar relatório.',
      });
    }
  }
</script>

<div class="reports-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Relatórios</h1>
        <p class="page-subtitle">Análise e insights do sistema de manutenção</p>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando relatórios...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <i class="fas fa-redo"></i>
        Tentar novamente
      </button>
    </div>
  {:else}
    <!-- KPIs -->
    <div class="kpi-section">
      <h2 class="section-title">
        <i class="fas fa-chart-line"></i>
        Indicadores de Desempenho
      </h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="fas fa-industry"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total de Máquinas</span>
            <div class="kpi-value">{overview.totalMachines || 0}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="fas fa-tasks"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total de OS</span>
            <div class="kpi-value">{overview.totalOrders || 0}</div>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Concluídas</span>
            <div class="kpi-value">{overview.completedOrders || 0}</div>
          </div>
        </div>

        <div class="kpi-card primary">
          <div class="kpi-icon">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Taxa de Conclusão</span>
            <div class="kpi-value">{completionRate}%</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Tempo Médio (MTTR)</span>
            <div class="kpi-value">{overview.avgRepairTime || 0} h</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="fas fa-history"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Intervalo entre Falhas (MTBF)</span>
            <div class="kpi-value">{overview.avgFailureInterval || 0} h</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="fas fa-box"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Peças Usadas</span>
            <div class="kpi-value">{overview.totalPiecesUsed || 0}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Média Peças/OS</span>
            <div class="kpi-value">{avgPiecesPerOrder}</div>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Ordens Pendentes</span>
            <div class="kpi-value">{pendingOrders}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Cards -->
    <div class="reports-section">
      <h2 class="section-title">
        <i class="fas fa-file-export"></i>
        Relatórios Disponíveis
      </h2>
      <div class="report-cards">
        <div class="report-card" on:click={() => exportReport('reports', historico)}>
          <div class="report-icon primary">
            <i class="fas fa-tools"></i>
          </div>
          <h3 class="report-title">Relatório de OS por Período</h3>
          <p class="report-description">Relatório detalhado de ordens de serviço, com status e técnicos.</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>

        <div class="report-card" on:click={() => exportReport('inventory', stockMovements)}>
          <div class="report-icon success">
            <i class="fas fa-box"></i>
          </div>
          <h3 class="report-title">Consumo de Peças</h3>
          <p class="report-description">Análise de consumo de peças por equipamento e tipo de manutenção.</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>

        <div class="report-card" on:click={() => exportReport('analytics', overview)}>
          <div class="report-icon danger">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3 class="report-title">Indicadores de Performance</h3>
          <p class="report-description">KPIs de manutenção: MTBF, MTTR e disponibilidade.</p>
          <div class="report-footer">
            <span class="report-badge">PDF</span>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>

        <div class="report-card" on:click={() => exportReport('machines', machines)}>
          <div class="report-icon warning">
            <i class="fas fa-cogs"></i>
          </div>
          <h3 class="report-title">Relatório de Máquinas</h3>
          <p class="report-description">Lista de máquinas com status, localização e OS associadas.</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="reports-section">
      <h2 class="section-title">
        <i class="fas fa-chart-pie"></i>
        Gráficos de Análise
      </h2>
      <div class="charts-grid">
        <div class="chart-wrapper">
          <div id="maintHistoryChart" class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <div id="topEquipChart" class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <div id="maintTypeChart" class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <div id="techPerfChart" class="chart-container"></div>
        </div>
        <div class="chart-wrapper">
          <div id="piecesChart" class="chart-container"></div>
        </div>
      </div>
    </div>
  {/if}
</div>
