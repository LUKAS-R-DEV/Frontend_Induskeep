import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
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

function formatTime(hours) {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "-";
  if (hours === 0) return "0 h";
  
  // Se for menor que 1 hora, mostrar em minutos
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return minutes > 0 ? `${minutes} min` : "0 min";
  }
  
  // Se for >= 24 horas, mostrar em dias
  if (hours >= 24) {
    const days = (hours / 24).toFixed(1);
    return `${days} dias`;
  }
  
  // Caso contrário, mostrar em horas com 1 casa decimal
  return `${hours.toFixed(1)} h`;
}

function exportAnalyticsCSV(data) {
  const summary = [
    "RELATÓRIO DE INDICADORES DE DESEMPENHO (KPIs)",
    "",
    "RESUMO EXECUTIVO",
    `Total de Ordens de Serviço: ${val(data.totalOrders)}`,
    `Concluídas: ${val(data.completedOrders)}`,
    `Pendentes: ${val(data.pendingOrders)}`,
    `Em Andamento: ${val(data.inProgressOrders)}`,
    `Taxa de Conclusão: ${safeRate(data.completedOrders, data.totalOrders)}`,
    "",
    "MÉTRICAS DE TEMPO",
    `MTTR (Tempo Médio de Reparo): ${formatTime(data.avgRepairTime)}`,
    `MTBF (Intervalo Médio entre Falhas): ${formatTime(data.avgFailureInterval)}`,
    "",
    "RECURSOS",
    `Total de Máquinas: ${val(data.totalMachines)}`,
    `Total de Técnicos: ${val(data.totalTechnicians)}`,
    `Agendamentos Atrasados: ${val(data.overdueSchedules)}`,
    "",
    "DETALHES",
    "",
  ];

  const headers = ["Indicador", "Valor"];
  const rows = [
    ["Total de OS", val(data.totalOrders)],
    ["Concluídas", val(data.completedOrders)],
    ["Pendentes", val(data.pendingOrders)],
    ["Em Andamento", val(data.inProgressOrders)],
    ["Taxa de Conclusão", safeRate(data.completedOrders, data.totalOrders)],
    ["MTTR (Tempo Médio de Reparo)", formatTime(data.avgRepairTime)],
    ["MTBF (Intervalo entre Falhas)", formatTime(data.avgFailureInterval)],
    ["Total de Máquinas", val(data.totalMachines)],
    ["Total de Técnicos", val(data.totalTechnicians)],
    ["Agendamentos Atrasados", val(data.overdueSchedules)],
  ];

  const csv = [
    ...summary,
    headers.join(";"),
    ...rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `relatorio_kpis_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAnalyticsPDF(overview, charts) {
  const doc = createBasePDF("Relatório de Indicadores de Desempenho (KPIs)");
  
  // Cores profissionais
  const primaryColor = [37, 99, 235];
  const successColor = [16, 185, 129];
  const infoColor = [59, 130, 246];
  const warningColor = [245, 158, 11];
  const dangerColor = [239, 68, 68];

  let startY = 120;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("Indicadores de Desempenho (KPIs)", 40, startY);

  startY += 30;

  // Seção: Ordens de Serviço
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text("Ordens de Serviço", 40, startY);
  startY += 20;

  const orderRows = [
    ["Total de Ordens de Serviço", val(overview.totalOrders)],
    ["Ordens Concluídas", val(overview.completedOrders)],
    ["Ordens Pendentes", val(overview.pendingOrders)],
    ["Ordens em Andamento", val(overview.inProgressOrders)],
    ["Taxa de Conclusão", safeRate(overview.completedOrders, overview.totalOrders)],
  ];

  autoTable(doc, {
    startY: startY,
    head: [["Indicador", "Valor"]],
    body: orderRows,
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 7,
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

  // Seção: Métricas de Tempo
  const finalY = doc.lastAutoTable.finalY || startY + 100;
  startY = finalY + 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text("Métricas de Tempo", 40, startY);
  startY += 20;

  const timeRows = [
    ["MTTR (Tempo Médio de Reparo)", formatTime(overview.avgRepairTime)],
    ["MTBF (Intervalo Médio entre Falhas)", formatTime(overview.avgFailureInterval)],
  ];

  autoTable(doc, {
    startY: startY,
    head: [["Indicador", "Valor"]],
    body: timeRows,
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 7,
    },
    headStyles: {
      fillColor: infoColor,
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

  // Seção: Recursos
  const finalY2 = doc.lastAutoTable.finalY || startY + 100;
  startY = finalY2 + 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text("Recursos", 40, startY);
  startY += 20;

  const resourceRows = [
    ["Total de Máquinas", val(overview.totalMachines)],
    ["Total de Técnicos", val(overview.totalTechnicians)],
    ["Agendamentos Atrasados", val(overview.overdueSchedules)],
  ];

  autoTable(doc, {
    startY: startY,
    head: [["Indicador", "Valor"]],
    body: resourceRows,
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 7,
    },
    headStyles: {
      fillColor: successColor,
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

  addFooter(doc);
  
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_kpis_${dateStr}.pdf`);
}
