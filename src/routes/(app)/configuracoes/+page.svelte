<script>
  import { onMount } from "svelte";
  import { SettingsApi } from "$lib/api/settings";
  import '$lib/styles/configuracoes.css';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin } from '$lib/utils/permissions.js';

  let loading = true;
  let saving = false;
  let error = "";
  let success = false;
  let user = null;

  let form = {
    minStockThreshold: 5,
    autoNotifyLowStock: true,
    defaultRepairDuration: null,
    notificationEmail: "",
    maintenanceWindow: "08:00-18:00"
  };

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }

      // Verifica se é admin
      if (!isAdmin(user?.role)) {
        error = 'Acesso negado. Apenas administradores podem acessar esta página.';
        loading = false;
        return;
      }

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
      const payload = {
        minStockThreshold: form.minStockThreshold,
        autoNotifyLowStock: form.autoNotifyLowStock,
        defaultRepairDuration: form.defaultRepairDuration || null,
        notificationEmail: form.notificationEmail || null,
        maintenanceWindow: form.maintenanceWindow || null
      };

      await SettingsApi.update(payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Configurações salvas com sucesso!',
      });
      
      success = true;
      setTimeout(() => {
        success = false;
      }, 3000);
    } catch (e) {
      console.error("Erro ao salvar:", e);
      error = e.message || "Falha ao salvar configurações.";
      
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
    } finally {
      saving = false;
    }
  }

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

<div class="settings-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Configurações</h1>
        <p class="page-subtitle">Gerencie as configurações gerais do sistema</p>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando configurações...</p>
    </div>
  {:else if error && !isAdmin(user?.role)}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h3>Acesso Negado</h3>
      <p>{error}</p>
    </div>
  {:else}
    <!-- Settings Form -->
    <div class="settings-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-cog"></i>
          Parâmetros Gerais
        </h2>
      </div>

      <form on:submit={saveSettings} class="settings-form">
        <!-- Estoque -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-box"></i>
              Estoque
            </h3>
          </div>
          <div class="form-group">
            <label for="minStock">
              Estoque Mínimo *
            </label>
            <input
              id="minStock"
              type="number"
              min="1"
              bind:value={form.minStockThreshold}
              required
              placeholder="Quantidade mínima em estoque"
              class="form-input"
            />
            <small class="form-hint">Quantidade mínima de peças antes de alertar estoque baixo</small>
          </div>

          <div class="form-group">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id="autoNotify"
                bind:checked={form.autoNotifyLowStock}
                class="checkbox-input"
              />
              <label for="autoNotify" class="checkbox-label">
                <i class="fas fa-bell"></i>
                Notificar automaticamente quando estoque estiver baixo
              </label>
            </div>
            <small class="form-hint">Ativa notificações automáticas quando o estoque atingir o mínimo</small>
          </div>
        </div>

        <!-- Manutenção -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-tools"></i>
              Manutenção
            </h3>
          </div>
          <div class="form-group">
            <label for="repairDuration">
              Duração Padrão de Reparo (horas)
            </label>
            <input
              id="repairDuration"
              type="number"
              min="0"
              step="0.5"
              value={getDurationInHours()}
              on:input={(e) => setDurationInHours(e.target.value)}
              placeholder="Ex: 3.5"
              class="form-input"
            />
            <small class="form-hint">Tempo padrão estimado para reparos em horas</small>
          </div>

          <div class="form-group">
            <label for="maintenanceWindow">
              Janela de Manutenção
            </label>
            <input
              id="maintenanceWindow"
              type="text"
              bind:value={form.maintenanceWindow}
              placeholder="08:00-18:00"
              pattern="^\d{2}:\d{2}-\d{2}:\d{2}$"
              class="form-input"
            />
            <small class="form-hint">Horário permitido para manutenções (formato: HH:MM-HH:MM)</small>
          </div>
        </div>

        <!-- Notificações -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-envelope"></i>
              Notificações
            </h3>
          </div>
          <div class="form-group">
            <label for="notificationEmail">
              Email de Notificação
            </label>
            <input
              id="notificationEmail"
              type="email"
              bind:value={form.notificationEmail}
              placeholder="exemplo@empresa.com"
              class="form-input"
            />
            <small class="form-hint">Email para receber notificações do sistema</small>
          </div>
        </div>

        <!-- Messages -->
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

        <!-- Actions -->
        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={saving || loading}>
            {#if saving}
              <i class="fas fa-spinner fa-spin"></i>
              <span>Salvando...</span>
            {:else}
              <i class="fas fa-save"></i>
              <span>Salvar Configurações</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
