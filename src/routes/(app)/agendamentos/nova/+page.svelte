<script>
  import "$lib/styles/agendamentos.css";
  import { onMount } from "svelte";
  import { ScheduleApi } from "$lib/api/schedule";
  import { MachinesApi } from "$lib/api/machines";
  import { UserApi } from "$lib/api/users";
  import {NotificationsApi} from "$lib/api/notifications";
  import { goto } from "$app/navigation";

  let loading = false;
  let machines = [];
  let users = [];
  let error = "";

  let form = {
    machineId: "",
    userId: "",
    date: "",
    notes: "",
  };

  onMount(async () => {
    const dataMachines = await MachinesApi.list();
    const dataUsers = await UserApi.list();

    machines = Array.isArray(dataMachines) ? dataMachines : [];
    users = (Array.isArray(dataUsers) ? dataUsers : []).filter(
      (u) => u.role === "TECHNICIAN"
    );
  });


  async function createSchedule(e) {
    e.preventDefault();
    if (!form.machineId || !form.userId || !form.date) {
      alert("⚠️ Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      loading = true;
      const isoDate = new Date(form.date).toISOString();
      await ScheduleApi.create({...form,date: isoDate,});
      const machineName = machines.find((m) => m.id === form.machineId);
      const localDate = new Date(form.date).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });




      alert("✅ Agendamento criado com sucesso!");
      const notificationsPayload = {
        title: "Novo agendamento de manutenção",
        message: `Novo agendamento de manutenção para a maquina ${machineName.name} em ${localDate}.`,
        userId: form.userId,
      }
      await NotificationsApi.create(notificationsPayload);
      goto("/agendamentos");
    } catch (err) {
      alert("❌ Erro ao criar agendamento: " + (err.message || "Erro desconhecido"));
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>🗓️ Novo Agendamento de Manutenção</h1>
</div>

<div class="form-wrapper">
  {#if error}
    <div class="error">{error}</div>
  {/if}

  <form on:submit={createSchedule} class="form-card">
    <div class="form-group">
      <label>Máquina *</label>
      <select bind:value={form.machineId} required>
        <option value="">Selecione uma máquina</option>
        {#each machines as m}
          <option value={m.id}>{m.name} — {m.location}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label>Técnico Responsável *</label>
      <select bind:value={form.userId} required>
        <option value="">Selecione um técnico</option>
        {#each users as u}
          <option value={u.id}>{u.name}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label>Data e Hora *</label>
      <input type="datetime-local" bind:value={form.date} required />
    </div>

    <div class="form-group">
      <label>Observações</label>
      <textarea
        bind:value={form.notes}
        placeholder="Descreva o motivo ou detalhes do agendamento..."
      ></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="secondary" on:click={() => goto("/schedule")}>
        Cancelar
      </button>
      <button type="submit" class="primary" disabled={loading}>
        {loading ? "Criando..." : "Criar Agendamento"}
      </button>
    </div>
  </form>
</div>
