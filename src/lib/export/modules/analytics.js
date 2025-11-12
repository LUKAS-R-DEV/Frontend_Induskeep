import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";

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
  const summary = [
    "RESUMO DE ANÁLISE DE DESEMPENHO",
    `Total de Ordens de Serviço: ${val(data.totalOrders)}`,
    `Concluídas: ${val(data.completedOrders)}`,
    `Taxa de Conclusão: ${safeRate(data.completedOrders, data.totalOrders)}`,
    `MTTR (Tempo Médio de Reparo): ${val(data.avgRepairTime, "h")}`,
    `MTBF (Intervalo entre Falhas): ${val(data.avgFailureInterval, "h")}`,
    `Total de Máquinas: ${val(data.totalMachines)}`,
    `Peças Usadas: ${val(data.totalPiecesUsed)}`,
    "",
  ];

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

  const csv = [
    ...summary,
    headers.join(";"),
    ...rows.map(r => r.map(v => `"${v ?? ""}"`).join(";"))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `analise_desempenho_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAnalyticsPDF(overview, charts) {
  const doc = createBasePDF("Análise de Desempenho");
  
  // Cores profissionais
  const primaryColor = [37, 99, 235];
  const successColor = [16, 185, 129];
  const infoColor = [59, 130, 246];
  const warningColor = [245, 158, 11];

  let startY = 120;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("Indicadores de Desempenho (KPIs)", 40, startY);

  startY += 30;

  // Criar tabela de KPIs com estilo profissional
  const kpiRows = [
    ["Total de Ordens de Serviço", val(overview.totalOrders)],
    ["Ordens Concluídas", val(overview.completedOrders)],
    ["Taxa de Conclusão", safeRate(overview.completedOrders, overview.totalOrders)],
    ["MTTR (Tempo Médio de Reparo)", val(overview.avgRepairTime, " horas")],
    ["MTBF (Intervalo entre Falhas)", val(overview.avgFailureInterval, " horas")],
    ["Total de Máquinas", val(overview.totalMachines)],
    ["Peças Utilizadas", val(overview.totalPiecesUsed)],
  ];

  autoTable(doc, {
    startY: startY,
    head: [["Indicador", "Valor"]],
    body: kpiRows,
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 8,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      halign: "left",
      fontStyle: "bold",
      fontSize: 11,
    },
    columnStyles: {
      0: { cellWidth: 200, fontStyle: "bold" },
      1: { cellWidth: 150, halign: "right" },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  // Calcular próxima posição Y após a tabela
  const finalY = doc.lastAutoTable.finalY || startY + 200;
  let y = finalY + 30;

  // Seção de Gráficos (se disponíveis)
  const chartIds = ["maintHistoryChart", "topEquipChart", "maintTypeChart"];
  let chartAdded = false;

  for (const id of chartIds) {
    const chart = charts && charts[id];
    if (!chart || typeof chart.getDataURL !== "function") continue;
    
    if (!chartAdded) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text("Análises Gráficas", 40, y);
      y += 25;
      chartAdded = true;
    }

    try {
      const img = chart.getDataURL({ 
        pixelRatio: 2, 
        backgroundColor: "#ffffff", 
        type: "png" 
      });
      if (img) {
        // Verificar se há espaço na página
        if (y + 250 > 750) {
          doc.addPage();
          y = 40;
        }
        doc.addImage(img, "PNG", 40, y, 500, 200);
        y += 220;
      }
    } catch (e) {
      console.error(`Erro ao exportar gráfico ${id}:`, e);
    }
  }

  addFooter(doc);
  
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`analise_desempenho_${dateStr}.pdf`);
}
