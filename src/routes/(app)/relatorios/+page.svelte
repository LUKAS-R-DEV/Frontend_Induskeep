<script>
  import '$lib/styles/relatorios.css';
  import { onMount, tick } from 'svelte';
  import { AnalyticsApi } from '$lib/api/analytics';
  import { ReportApi } from '$lib/api/reports';
  import { MachinesApi } from '$lib/api/machines';
  import { StockApi } from '$lib/api/stock';
  import { OrdersApi } from '$lib/api/orders';
  import { ExportFactory } from '$lib/export';
  import * as echarts from 'echarts';
  import { feedback } from '$lib/stores/feedback.stores.js';

  // ✅ Ícones Lucide
  import {
    Loader2,
    AlertCircle,
    RotateCcw,
    TrendingUp,
    Factory,
    CheckCircle2,
    Percent,
    Clock,
    History,
    Package,
    TriangleAlert,
    FileDown,
    Wrench,
    Box,
    LineChart,
    Cog,
    ChevronRight,
    PieChart,
    CalendarX,
    PlayCircle,
    Users,
  } from 'lucide-svelte';

  let loading = true;
  let error = '';
  let overview = {};
  let historico = [];
  let machines = [];
  let stockMovements = [];
  let allOrders = [];
  let charts = {};

  $: completionRate = overview?.totalOrders
    ? ((overview.completedOrders / overview.totalOrders) * 100).toFixed(1)
    : 0;
  
  // Formata tempo: mostra em dias se >= 24h, senão em horas, senão em minutos
  function formatTime(hours) {
    if (hours === null || hours === undefined || Number.isNaN(hours)) return '-';
    if (hours === 0) return '0 h';
    
    // Se for menor que 1 hora, mostrar em minutos
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return minutes > 0 ? `${minutes} min` : '0 min';
    }
    
    // Se for >= 24 horas, mostrar em dias
    if (hours >= 24) {
      const days = (hours / 24).toFixed(1);
      return `${days} dias`;
    }
    
    // Caso contrário, mostrar em horas com 1 casa decimal
    return `${hours.toFixed(1)} h`;
  }
  
  $: formattedMTTR = formatTime(overview?.avgRepairTime);
  $: formattedMTBF = formatTime(overview?.avgFailureInterval);

  onMount(async () => {
    try {
      const [analyticsRes, historyRes, machinesRes, stockRes, ordersRes] = await Promise.allSettled([
        AnalyticsApi.get(),
        ReportApi.getHistory(),
        MachinesApi.list(),
        StockApi.listMovements(),
        OrdersApi.list()
      ]);
      overview = analyticsRes.value || {};
      historico = historyRes.value || [];
      machines = machinesRes.value || [];
      stockMovements = stockRes.value || [];
      allOrders = ordersRes.value || [];

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

    // Gráfico 1: Manutenções por Mês (últimos 6 meses)
    const last6Months = [];
    const maintByMonth = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[date.getMonth()];
      last6Months.push(monthLabel);
      maintByMonth[monthKey] = 0;
    }

    historico.forEach(h => {
      if (h.completedAt) {
        const date = new Date(h.completedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (maintByMonth.hasOwnProperty(monthKey)) {
          maintByMonth[monthKey]++;
        }
      }
    });

    const maintData = Object.values(maintByMonth);

    makeChart('maintHistoryChart', {
      title: { text: 'Manutenções por Mês', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 60, bottom: 45 },
      xAxis: { type: 'category', data: last6Months },
      yAxis: { type: 'value', name: 'Quantidade' },
      series: [{ 
        type: 'line', 
        smooth: true, 
        data: maintData, 
        areaStyle: { color: 'rgba(37,99,235,0.15)' },
        itemStyle: { color: palette[0] }
      }]
    });

    // Gráfico 2: Top 5 Equipamentos (por quantidade de manutenções concluídas)
    const machineCounts = {};
    historico.forEach(h => {
      const machineName = h.order?.machine?.name || 'Não identificado';
      machineCounts[machineName] = (machineCounts[machineName] || 0) + 1;
    });

    const topMachines = Object.entries(machineCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const machineNames = topMachines.map(m => m[0].length > 15 ? m[0].substring(0, 15) + '...' : m[0]);
    const machineCountsData = topMachines.map(m => m[1]);

    makeChart('topEquipChart', {
      title: { text: 'Top 5 Equipamentos', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 60, bottom: 60 },
      xAxis: { type: 'category', data: machineNames.length > 0 ? machineNames : ['Sem dados'] },
      yAxis: { type: 'value', name: 'Manutenções' },
      series: [{ 
        type: 'bar', 
        data: machineCountsData.length > 0 ? machineCountsData : [0], 
        itemStyle: { color: palette[1], borderRadius: [6, 6, 0, 0] } 
      }]
    });

    // Gráfico 3: Status das Ordens (usa TODAS as ordens, não apenas histórico)
    const statusCounts = {};
    allOrders.forEach(order => {
      const status = order?.status || 'PENDING';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusLabels = {
      'COMPLETED': 'Concluídas',
      'PENDING': 'Pendentes',
      'IN_PROGRESS': 'Em Andamento',
      'CANCELLED': 'Canceladas',
      'CANCELED': 'Canceladas'
    };

    const statusData = Object.entries(statusCounts)
      .map(([status, count]) => ({
        value: count,
        name: statusLabels[status] || status
      }))
      .filter(item => item.value > 0); // Remove status com 0

    // Mapear cores por status na ordem dos dados
    const statusColorMap = {
      'Concluídas': palette[1], // Verde
      'Pendentes': palette[2], // Amarelo/Laranja
      'Em Andamento': palette[0], // Azul
      'Canceladas': palette[3] // Vermelho
    };

    // Criar array de cores na mesma ordem dos dados
    const statusColors = statusData.map(item => statusColorMap[item.name] || palette[4]);

    makeChart('maintTypeChart', {
      title: { text: 'Status das Manutenções', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: ['45%', '75%'],
        label: { formatter: '{b}: {d}%', fontSize: 15 },
        data: statusData.length > 0 ? statusData : [{ value: 0, name: 'Sem dados' }],
        color: statusData.length > 0 ? statusColors : [palette[4]]
      }]
    });

    // Gráfico 4: Performance por Técnico (ordens concluídas)
    const techCounts = {};
    historico.forEach(h => {
      const techName = h.order?.user?.name || 'Não identificado';
      techCounts[techName] = (techCounts[techName] || 0) + 1;
    });

    const topTechs = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const techNames = topTechs.map(t => t[0]);
    const techCountsData = topTechs.map(t => t[1]);

    makeChart('techPerfChart', {
      title: { text: 'Ordens Concluídas por Técnico', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'axis', formatter: '{b}: {c} ordens' },
      grid: { left: 120, right: 40, top: 60, bottom: 40 },
      xAxis: { type: 'value', name: 'Ordens' },
      yAxis: { type: 'category', data: techNames.length > 0 ? techNames : ['Sem dados'] },
      series: [{ 
        type: 'bar', 
        data: techCountsData.length > 0 ? techCountsData : [0], 
        itemStyle: { color: palette[2], borderRadius: 8 } 
      }]
    });

    // Gráfico 5: Movimentações de Estoque (entradas vs saídas)
    const movementCounts = { ENTRY: 0, EXIT: 0, ADJUSTMENT: 0 };
    stockMovements.forEach(m => {
      if (m.type && movementCounts.hasOwnProperty(m.type)) {
        movementCounts[m.type]++;
      }
    });

    const movementData = [
      { value: movementCounts.ENTRY, name: 'Entradas' },
      { value: movementCounts.EXIT, name: 'Saídas' },
      { value: movementCounts.ADJUSTMENT, name: 'Ajustes' }
    ].filter(m => m.value > 0);

    makeChart('piecesChart', {
      title: { text: 'Movimentações de Estoque', left: 'center', textStyle: { fontSize: 18 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: ['50%', '78%'],
        label: { formatter: '{b}: {d}%', fontSize: 15 },
        data: movementData.length > 0 ? movementData : [{ value: 0, name: 'Sem dados' }],
        color: palette
      }]
    });
  }

  async function exportReport(type, data) {
    try {
      if (type === 'analytics') {
        // Para analytics, passar overview e charts
        await ExportFactory[type](data, charts, 'pdf');
      } else {
        await ExportFactory[type](data, 'pdf');
      }
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
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando relatórios...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <AlertCircle size={36} color="#ef4444" />
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <RotateCcw size={18} />
        Tentar novamente
      </button>
    </div>
  {:else}
    <!-- KPIs -->
    <div class="kpi-section">
      <h2 class="section-title">
        <TrendingUp size={20} />
        Indicadores de Desempenho
      </h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">
            <Factory size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total de Máquinas</span>
            <div class="kpi-value">{overview.totalMachines || 0}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <Users size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total de Técnicos</span>
            <div class="kpi-value">{overview.totalTechnicians || 0}</div>
          </div>
        </div>

        <div class="kpi-card primary">
          <div class="kpi-icon">
            <Percent size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Taxa de Conclusão</span>
            <div class="kpi-value">{completionRate}%</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <Clock size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Tempo Médio (MTTR)</span>
            <div class="kpi-value">{formattedMTTR}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <History size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Intervalo entre Falhas (MTBF)</span>
            <div class="kpi-value">{formattedMTBF}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <Package size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Peças Usadas (30 dias)</span>
            <div class="kpi-value">{overview.piecesUsedLastMonth || 0}</div>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-icon">
            <TriangleAlert size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Ordens Pendentes</span>
            <div class="kpi-value">{overview.pendingOrders || 0}</div>
          </div>
        </div>

        <div class="kpi-card primary">
          <div class="kpi-icon">
            <PlayCircle size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Ordens em Andamento</span>
            <div class="kpi-value">{overview.inProgressOrders || 0}</div>
          </div>
        </div>

        <div class="kpi-card danger">
          <div class="kpi-icon">
            <CalendarX size={28} color="white" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Agendamentos Atrasados</span>
            <div class="kpi-value">{overview.overdueSchedules || 0}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Cards -->
    <div class="reports-section">
      <h2 class="section-title">
        <FileDown size={20} />
        Relatórios Disponíveis
      </h2>
      <div class="report-cards">
        <div class="report-card" on:click={() => exportReport('reports', allOrders)}>
          <div class="report-icon primary">
            <Wrench size={28} color="white" />
          </div>
          <h3 class="report-title">Relatório de OS por Período</h3>
          <p class="report-description">Relatório detalhado de todas as ordens de serviço (pendentes, em andamento, concluídas e canceladas).</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <ChevronRight size={18} />
          </div>
        </div>

        <div class="report-card" on:click={() => exportReport('inventory', stockMovements)}>
          <div class="report-icon success">
            <Box size={28} color="white" />
          </div>
          <h3 class="report-title">Consumo de Peças</h3>
          <p class="report-description">Análise de movimentações de estoque: entradas, saídas e ajustes.</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <ChevronRight size={18} />
          </div>
        </div>

        <div class="report-card" on:click={() => exportReport('analytics', overview)}>
          <div class="report-icon danger">
            <LineChart size={28} color="white" />
          </div>
          <h3 class="report-title">Indicadores de Performance</h3>
          <p class="report-description">KPIs de manutenção: MTBF, MTTR e disponibilidade.</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <ChevronRight size={18} />
          </div>
        </div>

        <div class="report-card" on:click={() => exportReport('machines', machines)}>
          <div class="report-icon warning">
            <Cog size={28} color="white" />
          </div>
          <h3 class="report-title">Relatório de Máquinas</h3>
          <p class="report-description">Lista de máquinas com status, localização e OS associadas.</p>
          <div class="report-footer">
            <span class="report-badge">PDF, CSV</span>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="reports-section">
      <h2 class="section-title">
        <PieChart size={20} />
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

<style>
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

  /* Ícones SVG refinados */
  svg {
    vertical-align: middle;
    stroke-width: 2;
    flex-shrink: 0;
  }

  /* Ajustes para ícones em botões */
  .btn-retry svg {
    flex-shrink: 0;
  }

  /* Ajustes para section-title */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para report-footer */
  .report-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
