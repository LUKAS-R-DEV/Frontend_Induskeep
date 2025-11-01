import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";

export async function exportAnalytics(overview, charts, format = "pdf") {
  const o = overview || {};
  const c = charts || {};
  if (format === "csv") return exportAnalyticsCSV(o);
  if (format === "pdf") return exportAnalyticsPDF(o, c);
}

function safeRate(completed, total) {
  const c = Number(completed || 0);
  const t = Number(total || 0);
  if (!t || t <= 0) return "0.0%";
  return `${((c / t) * 100).toFixed(1)}%`;
}

function val(v, suffix = "") {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return suffix ? `${v}${suffix}` : v;
}

function exportAnalyticsCSV(data) {
  const headers = ["Indicador", "Valor"];
  const rows = [
    ["Total de OS", val(data.totalOrders)],
    ["Concluídas", val(data.completedOrders)],
    ["Taxa de Conclusão", safeRate(data.completedOrders, data.totalOrders)],
    ["MTTR (Tempo Médio de Reparo)", val(data.avgRepairTime, "h")],
    ["MTBF (Intervalo entre Falhas)", val(data.avgFailureInterval, "h")],
    ["Total de Máquinas", val(data.totalMachines)],
    ["Peças Usadas", val(data.totalPiecesUsed)],
  ];
  toCSV(headers, rows);
}

function exportAnalyticsPDF(overview, charts) {
  const doc = createBasePDF("Análise de Desempenho — IndusKeep");

  // KPIs principais
  doc.setFontSize(12);
  doc.text("Indicadores Gerais", 40, 130);
  const yBase = 150;
  const rows = [
    ["Total de OS", val(overview.totalOrders)],
    ["Concluídas", val(overview.completedOrders)],
    ["Taxa de Conclusão", safeRate(overview.completedOrders, overview.totalOrders)],
    ["MTTR", val(overview.avgRepairTime, "h")],
    ["MTBF", val(overview.avgFailureInterval, "h")],
    ["Máquinas", val(overview.totalMachines)],
    ["Peças Usadas", val(overview.totalPiecesUsed)],
  ];

  rows.forEach(([label, value], i) => {
    doc.text(`${label}:`, 60, yBase + i * 20);
    doc.text(String(value ?? "-"), 220, yBase + i * 20);
  });

  // Gráficos (caso existam no ECharts)
  const chartIds = ["maintHistoryChart", "topEquipChart", "maintTypeChart"];
  let y = 320;

  for (const id of chartIds) {
    const chart = charts && charts[id];
    if (!chart || typeof chart.getDataURL !== "function") continue;
    try {
      const img = chart.getDataURL({ pixelRatio: 2, backgroundColor: "#ffffff", type: "png" });
      if (img) {
        doc.addImage(img, "PNG", 40, y, 500, 250);
        y += 270;
      }
    } catch (e) {
      console.error(e);
     
    }
  }

  addFooter(doc);
  doc.save(`analise_desempenho_${Date.now()}.pdf`);
}
