<script>
  import "$lib/styles/agendamentos.css";
  import { onMount } from "svelte";
  import { ScheduleApi } from "$lib/api/schedule";
  import { OrdersApi } from "$lib/api/orders";
  import { goto } from "$app/navigation";

  let currentDate = new Date();
  let currentView = "calendar";
  let schedules = [];
  let loading = true;
  let error = "";

  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  let calendarDays = [];
  let currentMonthLabel = "";

  onMount(async () => {
    await loadSchedules();
  });

  async function loadSchedules() {
    try {
      loading = true;
      error = "";
      const data = await ScheduleApi.list();
      schedules = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("❌ Erro ao carregar agendamentos:", e);
      error = "Erro ao carregar agendamentos.";
    } finally {
      loading = false;
    }
  }

  $: if (!loading && schedules.length >= 0) generateCalendar();

  function generateCalendar() {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    const daysArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) daysArray.push({ label: "", other: true, events: [] });

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const events = schedules
        .filter((s) => s.date.startsWith(dateStr))
        .map((s) => ({
          id: s.id,
          text: s.machine?.name || "Agendamento",
          color: "var(--primary)",
          notes: s.notes
        }));
      daysArray.push({ label: day, events, other: false });
    }

    calendarDays = daysArray;
    currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
  }
  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
  }
  function goToToday() {
    currentDate = new Date();
    generateCalendar();
  }

  async function deleteSchedule(id) {
    if (!confirm("Deseja realmente excluir este agendamento?")) return;
    try {
      await ScheduleApi.delete(id);
      await loadSchedules();
    } catch (err) {
      alert("❌ Erro ao remover: " + err.message);
    }
  }

  async function startMaintenance(schedule) {
    try {
      await OrdersApi.create({
        title: `Execução de manutenção agendada (${schedule.machine?.name ?? "Máquina"})`,
        description: schedule.notes || "Manutenção iniciada a partir de agendamento.",
        machineId: schedule.machineId,
        userId: schedule.userId,
        scheduleId: schedule.id
      });
      alert("🚀 Ordem de manutenção iniciada!");
      await ScheduleApi.delete(schedule.id);
      await loadSchedules();
    } catch (err) {
      alert("❌ Erro ao iniciar manutenção: " + err.message);
    }
  }
</script>

<div class="page-header">
  <h1>📅 Agendamentos</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar agendamentos..." />
  </div>
  <button class="btn-primary" on:click={() => goto('/agendamentos/nova')}>
    <i class="fas fa-plus"></i> Novo Agendamento
  </button>
</div>

<div class="view-toggle">
  <div
    class="view-option {currentView === 'calendar' ? 'active' : ''}"
    on:click={() => (currentView = 'calendar')}
  >
    <i class="fas fa-calendar"></i> Calendário
  </div>
  <div
    class="view-option {currentView === 'list' ? 'active' : ''}"
    on:click={() => (currentView = 'list')}
  >
    <i class="fas fa-list"></i> Lista
  </div>
</div>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando agendamentos...</p>
  </div>
{:else if error}
  <div class="error-state">
    <i class="fas fa-exclamation-circle"></i>
    <p>{error}</p>
  </div>
{:else if currentView === "calendar"}
  <div class="page-section calendar-view">
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="calendar-nav-btn" on:click={previousMonth} title="Mês anterior">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="current-month">{currentMonthLabel}</div>
        <button class="calendar-nav-btn" on:click={nextMonth} title="Próximo mês">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <button class="btn-primary" on:click={goToToday}>
        <i class="fas fa-calendar-day"></i> Hoje
      </button>
    </div>

    <div class="calendar-grid">
      {#each days as day}
        <div class="calendar-day-header">{day}</div>
      {/each}

      {#each calendarDays as d}
        <div class="calendar-day {d.other ? 'other-month' : ''}">
          {#if d.label}
            <div class="day-number">{d.label}</div>
            {#if d.events.length > 0}
              {#each d.events as e}
                <div
                  class="schedule-item"
                  style="background: {e.color}"
                  on:click={() =>
                    alert(`Agendamento: ${e.text}\nNotas: ${e.notes || "Sem observações."}`)
                  }
                  title="{e.text}"
                >
                  {e.text}
                </div>
              {/each}
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="page-section">
    <h2>Lista de Agendamentos</h2>
    {#if schedules.length === 0}
      <div class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <p>Nenhum agendamento encontrado.</p>
      </div>
    {:else}
      <div class="table-wrapper">
        <table class="standard-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Máquina</th>
              <th>Usuário</th>
              <th>Observações</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {#each schedules as s}
              <tr>
                <td>{new Date(s.date).toLocaleString('pt-BR')}</td>
                <td>{s.machine?.name || "—"}</td>
                <td>{s.user?.name || "—"}</td>
                <td>{s.notes || "—"}</td>
                <td><span class="status-scheduled">Agendado</span></td>
                <td class="actions">
                  <button class="action-btn start" on:click={() => startMaintenance(s)} title="Iniciar manutenção">
                    <i class="fas fa-play"></i>
                  </button>
                  <button class="action-btn delete" on:click={() => deleteSchedule(s.id)} title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
{/if}

<style>
  .calendar-view {
    width: 100%;
  }

  /* View Toggle padronizado */
  .view-toggle {
    display: flex;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 1.5rem;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    width: fit-content;
  }

  .view-option {
    padding: 0.8rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #6b7280;
  }

  .view-option.active {
    background: #0066cc;
    color: white;
    font-weight: 600;
  }

  .view-option:hover:not(.active) {
    background: #f3f4f6;
  }

  /* Navegação do calendário */
  .calendar-nav-btn {
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #374151;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calendar-nav-btn:hover {
    background: #e5e7eb;
    transform: scale(1.05);
  }

  .current-month {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    min-width: 200px;
    text-align: center;
  }

  /* Status badge */
  .status-scheduled {
    background: #e6f0ff;
    color: #1d4ed8;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
  }
</style>
