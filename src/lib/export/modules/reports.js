import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import { formatDate, formatStatus } from "../utils/formatters.js";
import autoTable from "jspdf-autotable";

export async function exportReports(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportReportsCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportReportsPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  const rows = (list || []).map((r) => {
    // history shape: { completedAt, notes, order:{ title,status, user:{name}, machine:{name} } }
    // order shape: { title,status, createdAt, history:{ completedAt, notes }, user:{name}, machine:{name} }
    const order = r.order || r;
    const machineName = order?.machine?.name || "-";
    const userName = order?.user?.name || "-";
    const title = order?.title || "-";
    const status = order?.status || "-";
    const notes = r?.notes || order?.history?.notes || order?.description || "-";
    const completedAt = r?.completedAt || order?.history?.completedAt || null;
    const createdAt = order?.createdAt || null;
    
    return {
      data: formatDate(completedAt || createdAt),
      maquina: machineName,
      tecnico: userName,
      titulo: title,
      status: status,
      statusFormatado: formatStatus(status),
      notas: notes || "-",
      rawStatus: status,
    };
  });

  // Calcular estatísticas
  const stats = {
    total: rows.length,
    concluidas: rows.filter(r => r.rawStatus === "COMPLETED").length,
    pendentes: rows.filter(r => r.rawStatus === "PENDING" || r.rawStatus === "IN_PROGRESS").length,
    canceladas: rows.filter(r => r.rawStatus === "CANCELLED" || r.rawStatus === "CANCELED").length,
    maquinasUnicas: new Set(rows.map(r => r.maquina).filter(m => m !== "-")).size,
    tecnicosUnicos: new Set(rows.map(r => r.tecnico).filter(t => t !== "-")).size,
  };

  return { rows, stats };
}

function exportReportsCSV(rows, stats) {
  const headers = ["Data", "Máquina", "Técnico", "Título", "Status", "Notas"];
  const csvRows = rows.map(r => [
    r.data,
    r.maquina,
    r.tecnico,
    r.titulo,
    r.statusFormatado,
    r.notas,
  ]);
  
  // Adicionar resumo no início do CSV
  const summary = [
    "RESUMO DO RELATÓRIO",
    `Total de Manutenções: ${stats.total}`,
    `Concluídas: ${stats.concluidas}`,
    `Pendentes: ${stats.pendentes}`,
    `Canceladas: ${stats.canceladas}`,
    `Máquinas: ${stats.maquinasUnicas}`,
    `Técnicos: ${stats.tecnicosUnicos}`,
    "",
    ...headers.join(";"),
    ...csvRows.map(r => r.map(v => `"${v ?? ""}"`).join(";"))
  ];

  const csv = summary.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `relatorio_manutencoes_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportReportsPDF(rows, stats) {
  const doc = createBasePDF("Relatório de Manutenções");
  
  // Cores profissionais
  const primaryColor = [37, 99, 235]; // Azul
  const successColor = [16, 185, 129]; // Verde
  const warningColor = [245, 158, 11]; // Amarelo
  const dangerColor = [239, 68, 68]; // Vermelho
  const grayColor = [107, 114, 128]; // Cinza

  // Seção de Resumo Executivo
  let startY = 120;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo Executivo", 40, startY);
  
  startY += 25;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Box de estatísticas
  const boxWidth = 160;
  const boxHeight = 80;
  const boxX = 40;
  const boxY = startY;
  
  // Box 1: Total
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text(stats.total.toString(), boxX + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Total de Manutenções", boxX + 10, boxY + 35);
  
  // Box 2: Concluídas
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(boxX + boxWidth + 10, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...successColor);
  doc.text(stats.concluidas.toString(), boxX + boxWidth + 20, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Concluídas", boxX + boxWidth + 20, boxY + 35);
  
  // Box 3: Pendentes
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(boxX + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...warningColor);
  doc.text(stats.pendentes.toString(), boxX + (boxWidth + 10) * 2 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Pendentes", boxX + (boxWidth + 10) * 2 + 10, boxY + 35);
  
  // Informações adicionais
  startY += boxHeight + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Máquinas envolvidas: ${stats.maquinasUnicas} | Técnicos: ${stats.tecnicosUnicos}`, 40, startY);
  
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
      .replace(/❌/g, "")
      .trim();
    
    return [
      r.data,
      r.maquina,
      r.tecnico,
      r.titulo,
      statusClean,
      r.notas.length > 50 ? r.notas.substring(0, 47) + "..." : r.notas,
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [["Data", "Máquina", "Técnico", "Título", "Status", "Observações"]],
    body: tableRows,
    theme: "striped",
    styles: { 
      fontSize: 8, 
      cellPadding: 5,
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
      0: { cellWidth: 80, halign: "center" }, // Data
      1: { cellWidth: 100 }, // Máquina
      2: { cellWidth: 90 }, // Técnico
      3: { cellWidth: 120 }, // Título
      4: { cellWidth: 70, halign: "center" }, // Status
      5: { cellWidth: 90 }, // Observações
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  // Adicionar rodapé
  addFooter(doc);
  
  // Salvar arquivo
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_manutencoes_${dateStr}.pdf`);
}
