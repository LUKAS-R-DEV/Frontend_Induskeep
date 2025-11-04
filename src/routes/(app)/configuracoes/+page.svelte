<script>
  import { onMount } from "svelte";
  import { SettingsApi } from "$lib/api/settings";
  import '$lib/styles/ordens-cadastro.css';

  let loading = true;
  let saving = false;
  let error = "";
  let success = false;

  let form = {
    minStockThreshold: 5,
    autoNotifyLowStock: true,
    defaultRepairDuration: null, // em minutos conforme backend
    notificationEmail: "",
    maintenanceWindow: "08:00-18:00"
  };

  onMount(async () => {
    try {
      loading = true;
      error = "";
      const data = await SettingsApi.get();
      if (data) {
        form = {
          minStockThreshold: data.minStockThreshold ?? 5,
          autoNotifyLowStock: data.autoNotifyLowStock ?? true,
          defaultRepairDuration: data.defaultRepairDuration ?? null,
          notificationEmail: data.notificationEmail ?? "",
          maintenanceWindow: data.maintenanceWindow ?? "08:00-18:00"
        };
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
      error = "Erro ao carregar configurações.";
    } finally {
      loading = false;
    }
  });

  function validateForm() {
    if (form.minStockThreshold < 1) {
      error = "O estoque mínimo deve ser maior que 0.";
      return false;
    }
    
    if (form.notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notificationEmail)) {
      error = "Email inválido.";
      return false;
    }

    if (form.maintenanceWindow && !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(form.maintenanceWindow)) {
      error = "Formato de janela de manutenção inválido. Use: HH:MM-HH:MM";
      return false;
    }

    return true;
  }

  async function saveSettings(e) {
    e.preventDefault();
    saving = true;
    success = false;
    error = "";

    if (!validateForm()) {
      saving = false;
      return;
    }

    try {
      // Preparar payload - converter valores vazios para null
      const payload = {
        minStockThreshold: form.minStockThreshold,
        autoNotifyLowStock: form.autoNotifyLowStock,
        defaultRepairDuration: form.defaultRepairDuration || null,
        notificationEmail: form.notificationEmail || null,
        maintenanceWindow: form.maintenanceWindow || null
      };

      await SettingsApi.update(payload);
      success = true;
      setTimeout(() => {
        success = false;
      }, 3000);
    } catch (e) {
      console.error("Erro ao salvar:", e);
      error = e.message || "Falha ao salvar configurações.";
    } finally {
      saving = false;
    }
  }

  // Converter minutos para horas para exibição
  function getDurationInHours() {
    if (!form.defaultRepairDuration || form.defaultRepairDuration === 0) return "";
    const hours = form.defaultRepairDuration / 60;
    return hours % 1 === 0 ? hours : hours.toFixed(1);
  }

  function setDurationInHours(hours) {
    if (!hours || hours === "") {
      form.defaultRepairDuration = null;
    } else {
      const hoursNum = parseFloat(hours);
      form.defaultRepairDuration = Math.round(hoursNum * 60);
    }
  }
</script>

<div class="page-header">
  <h1>⚙️ Configurações do Sistema</h1>
</div>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando configurações...</p>
  </div>
{:else}
  <div class="page-section">
    <h2>Parâmetros Gerais</h2>

    <form on:submit={saveSettings}>
      <!-- Estoque -->
      <div class="form-group">
        <label for="minStock">
          <i class="fas fa-box"></i> Estoque Mínimo *
        </label>
        <input
          id="minStock"
          type="number"
          min="1"
          bind:value={form.minStockThreshold}
          required
          placeholder="Quantidade mínima em estoque"
        />
        <small class="form-hint">Quantidade mínima de peças antes de alertar estoque baixo</small>
      </div>

      <!-- Notificação automática -->
      <div class="form-group">
        <div class="checkbox-group">
          <input
            type="checkbox"
            id="autoNotify"
            bind:checked={form.autoNotifyLowStock}
          />
          <label for="autoNotify">
            <i class="fas fa-bell"></i> Notificar automaticamente quando estoque estiver baixo
          </label>
        </div>
        <small class="form-hint">Ativa notificações automáticas quando o estoque atingir o mínimo</small>
      </div>

      <!-- Duração padrão de reparo -->
      <div class="form-group">
        <label for="repairDuration">
          <i class="fas fa-clock"></i> Duração Padrão de Reparo (horas)
        </label>
        <input
          id="repairDuration"
          type="number"
          min="0"
          step="0.5"
          value={getDurationInHours()}
          on:input={(e) => setDurationInHours(e.target.value)}
          placeholder="Ex: 3.5"
        />
        <small class="form-hint">Tempo padrão estimado para reparos em horas (será convertido para minutos no backend)</small>
      </div>

      <!-- Email de notificação -->
      <div class="form-group">
        <label for="notificationEmail">
          <i class="fas fa-envelope"></i> Email de Notificação
        </label>
        <input
          id="notificationEmail"
          type="email"
          bind:value={form.notificationEmail}
          placeholder="exemplo@empresa.com"
        />
        <small class="form-hint">Email para receber notificações do sistema</small>
      </div>

      <!-- Janela de manutenção -->
      <div class="form-group">
        <label for="maintenanceWindow">
          <i class="fas fa-calendar-alt"></i> Janela de Manutenção
        </label>
        <input
          id="maintenanceWindow"
          type="text"
          bind:value={form.maintenanceWindow}
          placeholder="08:00-18:00"
          pattern="^\d{2}:\d{2}-\d{2}:\d{2}$"
        />
        <small class="form-hint">Horário permitido para manutenções (formato: HH:MM-HH:MM)</small>
      </div>

      <!-- Mensagens de feedback -->
      {#if error}
        <div class="form-message error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      {/if}

      {#if success}
        <div class="form-message success">
          <i class="fas fa-check-circle"></i>
          <span>Configurações salvas com sucesso!</span>
        </div>
      {/if}

      <!-- Botões -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" disabled={saving || loading}>
          {#if saving}
            <i class="fas fa-spinner fa-spin"></i> Salvando...
          {:else}
            <i class="fas fa-save"></i> Salvar Configurações
          {/if}
        </button>
      </div>
    </form>
  </div>
{/if}

<style>
  .form-hint {
    display: block;
    margin-top: 0.375rem;
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }

  .checkbox-group label {
    margin: 0;
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group > label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group > label i,
  .checkbox-group label i {
    color: #0066cc;
    font-size: 0.95rem;
  }

  .form-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-size: 0.95rem;
  }

  .form-message.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .form-message.success {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }

  .form-message i {
    font-size: 1.1rem;
  }
</style>
