<script>
  import { onMount } from "svelte";
  import { SettingsApi } from "$lib/api/settings";
  import '$lib/styles/configuracoes.css';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin, isSupervisorOrAdmin } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Loader2,
    Lock,
    Cog,
    Package,
    Bell,
    Wrench,
    Mail,
    AlertCircle,
    CheckCircle2,
    Save,
  } from 'lucide-svelte';

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

      // Verifica se é supervisor ou admin
      if (!isSupervisorOrAdmin(user?.role)) {
        error = 'Acesso negado. Apenas supervisores e administradores podem acessar esta página.';
        loading = false;
        return;
      }

      loading = true;
      error = "";
      const data = await SettingsApi.get();
      console.log('📥 Dados recebidos do servidor:', data);
      if (data) {
        form = {
          minStockThreshold: data.minStockThreshold ?? 5,
          autoNotifyLowStock: data.autoNotifyLowStock ?? true,
          defaultRepairDuration: data.defaultRepairDuration ?? null,
          notificationEmail: data.notificationEmail ?? "",
          maintenanceWindow: data.maintenanceWindow ?? "08:00-18:00"
        };
        console.log('📋 Form inicializado:', form);
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
      error = e?.message || "Erro ao carregar configurações.";
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
    } finally {
      loading = false;
    }
  });

  function validateForm() {
    error = "";
    
    if (form.minStockThreshold < 1) {
      error = "O estoque mínimo deve ser maior que 0.";
      return false;
    }
    
    if (form.notificationEmail && form.notificationEmail.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notificationEmail)) {
      error = "Email inválido.";
      return false;
    }

    // Valida janela de manutenção (formato: HH:MM-HH:MM)
    if (form.maintenanceWindow && form.maintenanceWindow.trim() !== "") {
      const trimmed = form.maintenanceWindow.trim();
      console.log('🔍 Validando janela de manutenção:', trimmed);
      
      // Aceita formato HH:MM-HH:MM ou H:MM-H:MM
      const pattern = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
      const match = trimmed.match(pattern);
      
      if (!match) {
        console.error('❌ Formato não corresponde ao padrão:', trimmed);
        error = "Formato de janela de manutenção inválido. Use: HH:MM-HH:MM (ex: 08:00-18:00)";
        return false;
      }
      
      // Valida horas (0-23) e minutos (0-59)
      const startHour = parseInt(match[1], 10);
      const startMin = parseInt(match[2], 10);
      const endHour = parseInt(match[3], 10);
      const endMin = parseInt(match[4], 10);
      
      console.log('📊 Horários extraídos:', { startHour, startMin, endHour, endMin });
      
      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        error = "As horas devem estar entre 00 e 23";
        return false;
      }
      
      if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
        error = "Os minutos devem estar entre 00 e 59";
        return false;
      }
      
      // Normaliza o formato para HH:MM-HH:MM (com zeros à esquerda)
      const normalized = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      console.log('✅ Janela normalizada:', normalized);
      form.maintenanceWindow = normalized;
    }

    return true;
  }

  async function saveSettings(e) {
    e.preventDefault();
    e.stopPropagation();
    saving = true;
    success = false;
    error = "";

    console.log('🔍 Validando formulário...', form);
    
    if (!validateForm()) {
      console.error('❌ Validação falhou:', error);
      saving = false;
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro de Validação',
        message: error,
      });
      return;
    }

    console.log('✅ Validação passou. Form após validação:', form);

    try {
      // Prepara payload, normalizando campos vazios para null
      const payload = {
        minStockThreshold: form.minStockThreshold,
        autoNotifyLowStock: form.autoNotifyLowStock,
        defaultRepairDuration: form.defaultRepairDuration || null,
        notificationEmail: (form.notificationEmail && form.notificationEmail.trim()) || null,
        maintenanceWindow: (form.maintenanceWindow && form.maintenanceWindow.trim()) || null
      };

      console.log('💾 Salvando configurações:', payload);
      const result = await SettingsApi.update(payload);
      console.log('✅ Resposta do servidor:', result);
      
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
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando configurações...</p>
    </div>
  {:else if error && !isSupervisorOrAdmin(user?.role)}
    <div class="error-state">
      <div class="error-icon">
        <Lock size={36} color="#ef4444" />
      </div>
      <h3>Acesso Negado</h3>
      <p>{error}</p>
    </div>
  {:else}
    <!-- Settings Form -->
    <div class="settings-card">
      <div class="card-header">
        <h2 class="card-title">
          <Cog size={20} />
          Parâmetros Gerais
        </h2>
      </div>

      <form on:submit={saveSettings} class="settings-form">
        <!-- Estoque -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <Package size={18} />
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
                <Bell size={16} />
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
              <Wrench size={18} />
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
              class="form-input"
              autocomplete="off"
            />
            <small class="form-hint">Horário permitido para manutenções (formato: HH:MM-HH:MM)</small>
          </div>
        </div>

        <!-- Notificações -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <Mail size={18} />
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
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        {/if}

        {#if success}
          <div class="form-message success">
            <CheckCircle2 size={18} />
            <span>Configurações salvas com sucesso!</span>
          </div>
        {/if}

        <!-- Actions -->
        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={saving || loading}>
            {#if saving}
              <Loader2 class="spin" size={18} />
              <span>Salvando...</span>
            {:else}
              <Save size={18} />
              <span>Salvar Configurações</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

  /* Ícones SVG refinados */
  svg {
    vertical-align: middle;
    stroke-width: 2;
    flex-shrink: 0;
  }

  /* Ajustes para section-title */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para card-title */
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para checkbox-label */
  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para form-message */
  .form-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para botões */
  .btn-primary svg {
    flex-shrink: 0;
  }
</style>
