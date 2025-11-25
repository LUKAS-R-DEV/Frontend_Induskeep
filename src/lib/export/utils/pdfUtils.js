import { jsPDF } from "jspdf";
const LOGO = null;

// Função auxiliar para desenhar retângulo arredondado (usando rect simples como fallback)
export function drawRoundedRect(doc, x, y, width, height, radius, fill = false) {
  // Usar rect simples pois roundedRect não está disponível no jsPDF padrão
  if (fill) {
    doc.rect(x, y, width, height, "F");
  } else {
    doc.rect(x, y, width, height);
  }
}

export function createBasePDF(title) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  // Cabeçalho com logo e título
  if (LOGO) {
    doc.addImage(LOGO, "PNG", 40, 30, 90, 35);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, LOGO ? 150 : 40, 55);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 40, 90);
  doc.line(40, 100, 550, 100);

  return doc;
}

export function addFooter(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`IndusKeep — Página ${i} de ${totalPages}`, 40, 820);
  }
}
