import { createBasePDF, addFooter, drawRoundedRect } from "../utils/pdfUtils.js";
import { formatDate } from "../utils/formatters.js";
import autoTable from "jspdf-autotable";

export async function exportHistory(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportHistoryCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportHistoryPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  // Garantir que estamos trabalhando com array de History
  const histories = Array.isArray(list) ? list : [];
  
  const rows = histories.map((history) => {
    // History tem: completedAt, notes, order (com machine, user, title, createdAt, etc)
    const order = history?.order || {};
    
    const machineName = order?.machine?.name || "-";
    const userName = order?.user?.name || "-";
    const title = order?.title || "-";
    const description = order?.description || "";
    const createdAt = order?.createdAt || null;
    const completedAt = history?.completedAt || null;
    const notes = history?.notes || description || "-";
    
    // Calcular duração (tempo entre criação e conclusão) em minutos para estatísticas
    let duracao = "-";
    let duracaoMinutos = null;
    if (createdAt && completedAt) {
      const start = new Date(createdAt);
      const end = new Date(completedAt);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diff = Math.max(0, end - start);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        duracaoMinutos = hours * 60 + minutes;
        if (hours > 0) {
          duracao = `${hours}h ${minutes}m`;
        } else {
          duracao = `${minutes}m`;
        }
      }
    }
    
    return {
      dataConclusao: formatDate(completedAt),
      dataCriacao: formatDate(createdAt),
      maquina: machineName,
      tecnico: userName,
      titulo: title,
      duracao: duracao,
      duracaoMinutos: duracaoMinutos, // Para cálculo de média
      notas: notes || "-",
      completedAt: completedAt, // Para ordenação
    };
  });

  // Ordenar por data de conclusão (mais recente primeiro)
  rows.sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Calcular estatísticas
  const stats = {
    total: rows.length,
    maquinasUnicas: new Set(rows.map(r => r.maquina).filter(m => m !== "-")).size,
    tecnicosUnicos: new Set(rows.map(r => r.tecnico).filter(t => t !== "-")).size,
    // Calcular tempo médio de conclusão
    tempoMedio: calcularTempoMedio(rows),
  };

  return { rows, stats };
}

function calcularTempoMedio(rows) {
  // Calcular diretamente dos minutos já calculados
  const duracoes = rows
    .map(r => r.duracaoMinutos)
    .filter(d => d !== null && d > 0);

  if (duracoes.length === 0) return "-";
  
  const media = duracoes.reduce((a, b) => a + b, 0) / duracoes.length;
  const horas = Math.floor(media / 60);
  const minutos = Math.round(media % 60);
  
  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  }
  return `${minutos}m`;
}

function exportHistoryCSV(rows, stats) {
  const headers = ["Data de Conclusão", "Data de Criação", "Máquina", "Técnico", "Título", "Duração", "Observações"];
  const csvRows = rows.map(r => [
    r.dataConclusao,
    r.dataCriacao,
    r.maquina,
    r.tecnico,
    r.titulo,
    r.duracao,
    r.notas,
  ]);
  
  // Adicionar resumo no início do CSV
  const summary = [
    "RELATÓRIO DE HISTÓRICO DE MANUTENÇÕES",
    "",
    "RESUMO",
    `Total de Manutenções Concluídas: ${stats.total}`,
    `Máquinas Envolvidas: ${stats.maquinasUnicas}`,
    `Técnicos Envolvidos: ${stats.tecnicosUnicos}`,
    `Tempo Médio de Conclusão: ${stats.tempoMedio}`,
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
  a.download = `relatorio_historico_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportHistoryPDF(rows, stats) {
  const doc = createBasePDF("Relatório de Histórico de Manutenções");
  
  // Cores profissionais
  const primaryColor = [37, 99, 235]; // Azul
  const successColor = [16, 185, 129]; // Verde
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
  doc.text("Manutenções", boxX + 10, boxY + 40);
  doc.text("Concluídas", boxX + 10, boxY + 50);
  
  // Box 2: Máquinas
  doc.setFillColor(236, 253, 245);
  drawRoundedRect(doc, boxX + boxWidth + boxSpacing, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.maquinasUnicas.toString(), boxX + boxWidth + boxSpacing + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Máquinas", boxX + boxWidth + boxSpacing + 10, boxY + 40);
  doc.text("Envolvidas", boxX + boxWidth + boxSpacing + 10, boxY + 50);
  
  // Box 3: Técnicos
  doc.setFillColor(239, 246, 255);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 2, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...infoColor);
  doc.text(stats.tecnicosUnicos.toString(), boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Técnicos", boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 40);
  doc.text("Envolvidos", boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 50);
  
  // Box 4: Tempo Médio
  doc.setFillColor(255, 251, 235);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 3, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(245, 158, 11);
  const tempoMedioY = boxY + 25;
  doc.text(stats.tempoMedio, boxX + (boxWidth + boxSpacing) * 3 + 10, tempoMedioY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Tempo Médio", boxX + (boxWidth + boxSpacing) * 3 + 10, boxY + 40);
  doc.text("de Conclusão", boxX + (boxWidth + boxSpacing) * 3 + 10, boxY + 50);
  
  // Informações adicionais
  startY += boxHeight + 25;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Este relatório contém apenas manutenções concluídas e finalizadas.", 40, startY);
  
  // Linha separadora
  startY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(40, startY, 550, startY);
  
  // Tabela principal
  startY += 20;
  
  const tableRows = rows.map(r => {
    // Limitar tamanho das observações
    const notas = r.notas && r.notas.length > 50 
      ? r.notas.substring(0, 47) + "..." 
      : (r.notas || "-");
    
    return [
      r.dataConclusao,
      r.dataCriacao,
      r.maquina,
      r.tecnico,
      r.titulo,
      r.duracao,
      notas,
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [["Data Conclusão", "Data Criação", "Máquina", "Técnico", "Título", "Duração", "Observações"]],
    body: tableRows,
    theme: "striped",
    styles: { 
      fontSize: 7.5, 
      cellPadding: 3,
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: { 
      fillColor: primaryColor, 
      textColor: 255, 
      halign: "center",
      fontStyle: "bold",
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 70, halign: "center" }, // Data Conclusão
      1: { cellWidth: 70, halign: "center" }, // Data Criação
      2: { cellWidth: 90 }, // Máquina
      3: { cellWidth: 80 }, // Técnico
      4: { cellWidth: 100 }, // Título
      5: { cellWidth: 60, halign: "center" }, // Duração
      6: { cellWidth: 80 }, // Observações
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  // Adicionar rodapé
  addFooter(doc);
  
  // Salvar arquivo
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_historico_${dateStr}.pdf`);
}

