<script>
  import '$lib/styles/relatorios.css';
  import { onMount, tick } from 'svelte';
  import { AnalyticsApi } from '$lib/api/analytics';
  import { ReportApi } from '$lib/api/reports';
  import { ExportApi } from '$lib/api/export';

  let loading = true;
  let error = '';
  let overview = {};
  let historico = [];
  let Chart;
  let charts = {};

  // KPIs derivados
  $: completionRate = overview?.totalOrders
    ? ((overview.completedOrders / overview.totalOrders) * 100).toFixed(1)
    : 0;
  $: avgPiecesPerOrder = overview?.totalOrders
    ? (overview.totalPiecesUsed / overview.totalOrders).toFixed(2)
    : 0;
  $: pendingOrders = overview?.totalOrders - overview?.completedOrders || 0;

  onMount(async () => {
    try {
      const [analyticsRes, historyRes] = await Promise.allSettled([
        AnalyticsApi.get(),
        ReportApi.getHistory()
      ]);

      overview = analyticsRes.value || {};
      historico = historyRes.value || [];

      await tick();
      const mod = await import('chart.js/auto');
      Chart = mod.default || mod.Chart;
      if (Chart) renderCharts();
    } catch (e) {
      console.error(e);
      error = 'Erro ao carregar relatórios.';
    } finally {
      loading = false;
    }
  });

  // ======= Gráficos =======
  function renderCharts() {
    if (!Chart) return;

    // 1️⃣ Manutenções por mês
    charts.maintHistory = new Chart(document.getElementById('maintHistoryChart'), {
      type: 'line',
      data: {
        labels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
        datasets: [
          {
            label: 'Ordens de Serviço',
            data: [5, 7, 4, 8, 6, 9],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // 2️⃣ Top 5 Equipamentos
    charts.topEquip = new Chart(document.getElementById('topEquipChart'), {
      type: 'bar',
      data: {
        labels: ['Prensa H.', 'Compressor B', 'Misturador', 'Esteira X55', 'Máquina A'],
        datasets: [
          {
            label: 'Qtd. de OS',
            data: [12, 9, 7, 6, 5],
            backgroundColor: '#10b981'
          }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // 3️⃣ Tipos de manutenção
    charts.types = new Chart(document.getElementById('maintTypeChart'), {
      type: 'pie',
      data: {
        labels: ['Preventiva', 'Corretiva', 'Preditiva'],
        datasets: [
          {
            data: [40, 45, 15],
            backgroundColor: ['#3b82f6', '#ef4444', '#facc15']
          }
        ]
      }
    });

    // 4️⃣ Performance por técnico
    charts.techPerf = new Chart(document.getElementById('techPerfChart'), {
      type: 'bar',
      data: {
        labels: ['Carlos', 'Ana', 'João', 'Maria', 'Lucas'],
        datasets: [
          {
            label: 'Tempo médio (h)',
            data: [1.2, 1.5, 1.0, 1.8, 1.4],
            backgroundColor: '#f59e0b'
          }
        ]
      },
      options: { indexAxis: 'y', responsive: true }
    });

    // 5️⃣ Consumo de peças
    charts.pieces = new Chart(document.getElementById('piecesChart'), {
      type: 'doughnut',
      data: {
        labels: ['Filtros', 'Correias', 'Parafusos', 'Óleo', 'Outros'],
        datasets: [
          {
            data: [12, 9, 7, 5, 3],
            backgroundColor: [
              '#2563eb',
              '#16a34a',
              '#f59e0b',
              '#dc2626',
              '#6b7280'
            ]
          }
        ]
      }
    });
  }

  // ======= Exportações =======
  async function exportarPDF(modulo) {
    try {
      await ExportApi.download(modulo, 'pdf');
    } catch (e) {
      alert('⚠️ Erro ao exportar: ' + e.message);
    }
  }

  async function exportarCSV(modulo) {
    try {
      await ExportApi.download(modulo, 'csv');
    } catch (e) {
      alert('⚠️ Erro ao exportar: ' + e.message);
    }
  }
</script>

<div class="header">
  <h1>📈 Painel de Relatórios</h1>
</div>

{#if loading}
  <div class="loading">Carregando relatórios...</div>
{:else if error}
  <div class="error">⚠️ {error}</div>
{:else}
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

  <section class="relatorios-section">
    <div class="section-header">
      <h2>Exportar Relatórios</h2>
      <div class="export-buttons">
        <button class="btn" on:click={() => exportarPDF("reports")}>
          <i class="fas fa-file-pdf"></i> PDF
        </button>
        <button class="btn secondary" on:click={() => exportarCSV("reports")}>
          <i class="fas fa-file-csv"></i> CSV
        </button>
      </div>
    </div>
  </section>

  <section class="relatorios-section">
    <h2>Gráficos de Análise</h2>
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Manutenções por Mês</h3>
        <canvas id="maintHistoryChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Top 5 Equipamentos</h3>
        <canvas id="topEquipChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Tipos de Manutenção</h3>
        <canvas id="maintTypeChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Performance por Técnico</h3>
        <canvas id="techPerfChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Consumo de Peças</h3>
        <canvas id="piecesChart"></canvas>
      </div>
    </div>
  </section>
{/if}

<style>
  .header {
    background: white;
    border-bottom: 2px solid #e5e7eb;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.8rem;
    color: #111827;
    font-weight: 600;
  }

  .relatorios-section {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .loading, .error {
    text-align: center;
    margin: 2rem 0;
    color: #b91c1c;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .kpi {
    background: #f9fafb;
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
  }

  .kpi span { font-size: 0.9rem; color: #6b7280; }
  .kpi strong { display: block; font-size: 1.6rem; margin-top: .3rem; }

  .export-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn.secondary { background: #6b7280; }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .chart-card {
    background: #f9fafb;
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  canvas {
    width: 100% !important;
    height: 280px !important;
  }
</style>
