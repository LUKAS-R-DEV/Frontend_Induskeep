export const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
};

export const formatStatus = (status) => {
  switch (status) {
    case "COMPLETED": return "✅ Concluído";
    case "PENDING": return "🕓 Pendente";
    case "IN_PROGRESS": return "⚙️ Em Andamento";
    case "CANCELLED": return "❌ Cancelado";
    default: return status;
  }
};
