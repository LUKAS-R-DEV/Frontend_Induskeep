<script>
  import "$lib/styles/agendamentos.css";
  import { onMount } from "svelte";
  import { ScheduleApi } from "$lib/api/schedule";
  import { OrdersApi } from "$lib/api/orders";
  import { goto } from "$app/navigation";
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { hasPermission } from '$lib/utils/permissions.js';
  import { getUser } from '$lib/stores/users.js';

  let currentDate = new Date();
  let currentView = "calendar";
  let schedules = [];
  let loading = true;
  let error = "";
  // Carrega usuário de forma síncrona para evitar problemas de reatividade
  // Verifica se está no browser antes de acessar localStorage
  let user = typeof window !== 'undefined' ? getUser() : null;
  let search = '';

  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  let calendarDays = [];
  let currentMonthLabel = "";

  onMount(async () => {
    try {
      // Atualiza user caso tenha mudado (mas já foi carregado síncronamente acima)
      if (!user) {
        user = getUser();
      }
      await loadSchedules();
    } catch (e) {
      console.error(e);
    }
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

  $: filteredSchedules = schedules.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.machine?.name || '').toLowerCase().includes(q) ||
      (s.user?.name || '').toLowerCase().includes(q) ||
      (s.notes || '').toLowerCase().includes(q)
    );
  });

  function generateCalendar() {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    const daysArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push({ label: "", other: true, events: [] });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const events = schedules
        .filter((s) => s.date.startsWith(dateStr))
        .map((s) => ({
          id: s.id,
          text: s.machine?.name || "Agendamento",
          color: "#3b82f6",
          notes: s.notes,
          schedule: s
        }));
      daysArray.push({ label: day, events, other: false });
    }

    calendarDays = daysArray;
    currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  function previousMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    generateCalendar();
  }
  
  function nextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    generateCalendar();
  }
  
  function goToToday() {
    currentDate = new Date();
    generateCalendar();
  }

  async function deleteSchedule(id) {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Excluir agendamento',
          message: 'Deseja realmente excluir este agendamento?',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      await ScheduleApi.delete(id);
      await loadSchedules();
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Agendamento excluído com sucesso.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao remover agendamento.',
      });
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
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de manutenção iniciada com sucesso!',
      });
      
      await ScheduleApi.delete(schedule.id);
      await loadSchedules();
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao iniciar manutenção.',
      });
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Tornar reativo para atualizar quando user mudar
  $: canCreateSchedule = (() => {
    if (!user || !user.role) {
      return false;
    }
    return hasPermission(user.role, 'CREATE_SCHEDULE');
  })();

  function canCreate() {
    return canCreateSchedule;
  }

  function canDelete() {
    return user && hasPermission(user.role, 'ALL');
  }
</script>

<div class="schedules-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Agendamentos</h1>
        <p class="page-subtitle">Gerencie agendamentos de manutenção preventiva</p>
      </div>
      {#if canCreateSchedule}
        <button 
          class="btn-primary" 
          on:click={() => goto('/agendamentos/nova')}
          title="Criar novo agendamento"
        >
          <i class="fas fa-plus"></i>
          Novo Agendamento
        </button>
      {/if}
    </div>
  </div>

  <!-- View Toggle -->
  <div class="view-toggle-card">
    <div class="view-toggle">
      <button
        class="view-option {currentView === 'calendar' ? 'active' : ''}"
        on:click={() => (currentView = 'calendar')}
      >
        <i class="fas fa-calendar"></i>
        Calendário
      </button>
      <button
        class="view-option {currentView === 'list' ? 'active' : ''}"
        on:click={() => (currentView = 'list')}
      >
        <i class="fas fa-list"></i>
        Lista
      </button>
    </div>
    {#if currentView === 'list'}
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          class="search-input"
          placeholder="Buscar agendamentos..." 
          bind:value={search} 
        />
      </div>
    {/if}
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando agendamentos...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <i class="fas fa-redo"></i>
        Tentar novamente
      </button>
    </div>
  {:else if currentView === "calendar"}
    <!-- Calendar View -->
    <div class="calendar-card">
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
        <button class="btn-secondary" on:click={goToToday}>
          <i class="fas fa-calendar-day"></i>
          Hoje
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
                <div class="day-events">
                  {#each d.events as e}
                    <div
                      class="schedule-item"
                      style="background: {e.color}"
                      on:click={() => {
                        const msg = `Agendamento: ${e.text}\nNotas: ${e.notes || "Sem observações."}`;
                        feedback.set({
                          show: true,
                          type: 'info',
                          title: 'Agendamento',
                          message: msg,
                        });
                      }}
                      title="{e.text}"
                    >
                      {e.text}
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else if filteredSchedules.length > 0}
    <!-- List View -->
    <div class="schedules-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-list"></i>
          Agendamentos ({filteredSchedules.length})
        </h2>
      </div>

      <div class="schedules-list">
        {#each filteredSchedules as s}
          <div class="schedule-item-card">
            <div class="schedule-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="schedule-content">
              <div class="schedule-header">
                <h3 class="schedule-title">{s.machine?.name || 'Agendamento'}</h3>
                <span class="schedule-date">
                  <i class="fas fa-clock"></i>
                  {formatDate(s.date)}
                </span>
              </div>
              <div class="schedule-meta">
                <div class="meta-item">
                  <i class="fas fa-user-tie"></i>
                  <span>Técnico: {s.user?.name || 'N/A'}</span>
                </div>
                {#if s.createdBy && s.createdBy.id !== s.user?.id}
                  <div class="meta-item">
                    <i class="fas fa-user-cog"></i>
                    <span>Gerador: {s.createdBy?.name || 'N/A'}</span>
                  </div>
                {/if}
                {#if s.notes}
                  <div class="meta-item">
                    <i class="fas fa-comment"></i>
                    <span>{s.notes}</span>
                  </div>
                {/if}
              </div>
            </div>
            <div class="schedule-actions">
              <button
                class="action-btn start"
                on:click={() => startMaintenance(s)}
                title="Iniciar manutenção"
              >
                <i class="fas fa-play"></i>
                Iniciar
              </button>
              {#if canDelete()}
                <button
                  class="action-btn delete"
                  on:click={() => deleteSchedule(s.id)}
                  title="Excluir"
                >
                  <i class="fas fa-trash"></i>
                  Excluir
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-calendar-times"></i>
      </div>
      <h3>Nenhum agendamento encontrado</h3>
      <p>{search ? 'Tente ajustar a busca.' : 'Comece criando um novo agendamento.'}</p>
      {#if canCreateSchedule && !search}
        <button class="btn-primary" on:click={() => goto('/agendamentos/nova')}>
          <i class="fas fa-plus"></i>
          Criar Agendamento
        </button>
      {/if}
    </div>
  {/if}
</div>
