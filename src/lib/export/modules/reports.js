import { createBasePDF, addFooter, drawRoundedRect } from "../utils/pdfUtils.js";
import { formatDate, formatStatus } from "../utils/formatters.js";
import autoTable from "jspdf-autotable";

export async function exportReports(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportReportsCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportReportsPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  // Garantir que estamos trabalhando com array de ordens
  const orders = Array.isArray(list) ? list : [];
  
  const rows = orders.map((order) => {
    // Extrair informações da ordem
    const machineName = order?.machine?.name || "-";
    const userName = order?.user?.name || "-";
    const title = order?.title || "-";
    const status = order?.status || "PENDING";
    const description = order?.description || "";
    
    // Para ordens concluídas, usar completedAt do history, senão usar createdAt
    const completedAt = order?.history?.completedAt || null;
    const createdAt = order?.createdAt || null;
    
    // Observações: priorizar notes do history, senão description
    const notes = order?.history?.notes || description || "-";
    
    // Data a ser exibida: se concluída, mostrar completedAt, senão createdAt
    const displayDate = completedAt || createdAt;
    
    return {
      data: formatDate(displayDate),
      dataCriacao: formatDate(createdAt),
      dataConclusao: completedAt ? formatDate(completedAt) : "-",
      maquina: machineName,
      tecnico: userName,
      titulo: title,
      status: status,
      statusFormatado: formatStatus(status),
      notas: notes || "-",
      rawStatus: status,
      createdAt: createdAt, // Para ordenação
    };
  });

  // Ordenar por data de criação (mais recente primeiro)
  rows.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Calcular estatísticas
  const stats = {
    total: rows.length,
    concluidas: rows.filter(r => r.rawStatus === "COMPLETED").length,
    pendentes: rows.filter(r => r.rawStatus === "PENDING").length,
    emAndamento: rows.filter(r => r.rawStatus === "IN_PROGRESS").length,
    canceladas: rows.filter(r => r.rawStatus === "CANCELLED" || r.rawStatus === "CANCELED").length,
    maquinasUnicas: new Set(rows.map(r => r.maquina).filter(m => m !== "-")).size,
    tecnicosUnicos: new Set(rows.map(r => r.tecnico).filter(t => t !== "-")).size,
  };

  return { rows, stats };
}

function exportReportsCSV(rows, stats) {
  const headers = ["Data", "Máquina", "Técnico", "Título", "Status", "Observações"];
  const csvRows = rows.map(r => [
    r.data,
    r.maquina,
    r.tecnico,
    r.titulo,
    r.statusFormatado.replace(/✅|🕓|⚙️|❌/g, "").trim(),
    r.notas,
  ]);
  
  // Adicionar resumo no início do CSV
  const summary = [
    "RELATÓRIO DE ORDENS DE SERVIÇO POR PERÍODO",
    "",
    "RESUMO",
    `Total de Ordens de Serviço: ${stats.total}`,
    `Concluídas: ${stats.concluidas}`,
    `Pendentes: ${stats.pendentes}`,
    `Em Andamento: ${stats.emAndamento}`,
    `Canceladas: ${stats.canceladas}`,
    `Máquinas Envolvidas: ${stats.maquinasUnicas}`,
    `Técnicos Envolvidos: ${stats.tecnicosUnicos}`,
    "",
    "DETALHES",
    "",
    headers.join(";"),
    ...csvRows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
  ];

  const csv = summary.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `relatorio_os_periodo_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportReportsPDF(rows, stats) {
  const doc = createBasePDF("Relatório de Ordens de Serviço por Período");
  
  // Cores profissionais
  const primaryColor = [37, 99, 235]; // Azul
  const successColor = [16, 185, 129]; // Verde
  const warningColor = [245, 158, 11]; // Amarelo
  const dangerColor = [239, 68, 68]; // Vermelho
  const infoColor = [59, 130, 246]; // Azul claro

  // Seção de Resumo Executivo
  let startY = 120;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo Executivo", 40, startY);
  
  startY += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Box de estatísticas - 4 boxes em linha
  const boxWidth = 120;
  const boxHeight = 75;
  const boxX = 40;
  const boxY = startY;
  const boxSpacing = 10;
  
  // Box 1: Total
  doc.setFillColor(245, 247, 250);
  drawRoundedRect(doc, boxX, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(stats.total.toString(), boxX + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Total de OS", boxX + 10, boxY + 40);
  
  // Box 2: Concluídas
  doc.setFillColor(236, 253, 245);
  drawRoundedRect(doc, boxX + boxWidth + boxSpacing, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.concluidas.toString(), boxX + boxWidth + boxSpacing + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Concluídas", boxX + boxWidth + boxSpacing + 10, boxY + 40);
  
  // Box 3: Pendentes
  doc.setFillColor(255, 251, 235);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 2, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...warningColor);
  doc.text(stats.pendentes.toString(), boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Pendentes", boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 40);
  
  // Box 4: Em Andamento
  doc.setFillColor(239, 246, 255);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 3, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...infoColor);
  doc.text(stats.emAndamento.toString(), boxX + (boxWidth + boxSpacing) * 3 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Em Andamento", boxX + (boxWidth + boxSpacing) * 3 + 10, boxY + 40);
  
  // Informações adicionais
  startY += boxHeight + 25;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  
  const infoParts = [
    `Máquinas: ${stats.maquinasUnicas}`,
    `Técnicos: ${stats.tecnicosUnicos}`
  ];
  if (stats.canceladas > 0) {
    infoParts.push(`Canceladas: ${stats.canceladas}`);
  }
  
  doc.text(infoParts.join(" | "), 40, startY);
  
  // Linha separadora
  startY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(40, startY, 550, startY);
  
  // Tabela principal
  startY += 20;
  
  const tableRows = rows.map(r => {
    // Remover emojis do status para o PDF
    const statusClean = r.statusFormatado
      .replace(/✅/g, "")
      .replace(/🕓/g, "")
      .replace(/⚙️/g, "")
      .replace(/❌/g, "")
      .trim();
    
    // Limitar tamanho das observações
    const notas = r.notas && r.notas.length > 60 
      ? r.notas.substring(0, 57) + "..." 
      : (r.notas || "-");
    
    return [
      r.data,
      r.maquina,
      r.tecnico,
      r.titulo,
      statusClean,
      notas,
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [["Data", "Máquina", "Técnico", "Título", "Status", "Observações"]],
    body: tableRows,
    theme: "striped",
    styles: { 
      fontSize: 8, 
      cellPadding: 4,
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: { 
      fillColor: primaryColor, 
      textColor: 255, 
      halign: "center",
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 75, halign: "center" }, // Data
      1: { cellWidth: 100 }, // Máquina
      2: { cellWidth: 90 }, // Técnico
      3: { cellWidth: 120 }, // Título
      4: { cellWidth: 65, halign: "center" }, // Status
      5: { cellWidth: 100 }, // Observações
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  // Adicionar rodapé
  addFooter(doc);
  
  // Salvar arquivo
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_os_periodo_${dateStr}.pdf`);
}
