<script>
  import "$lib/styles/resetSenha.css";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { AuthApi } from "$lib/api/auth";

  let token = "";
  let newPassword = "";
  let confirmPassword = "";
  let loading = false;
  let error = "";
  let success = "";

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    token = params.get("token") || "";
    if (!token) {
      error = "Link inválido ou ausente.";
    }
  });

  function validate() {
    if (!token) { error = "Token inválido."; return false; }
    if (!newPassword || !confirmPassword) { error = "Preencha todos os campos."; return false; }
    if (newPassword !== confirmPassword) { error = "As senhas não coincidem."; return false; }
    if (newPassword.length < 8) { error = "A nova senha deve ter pelo menos 8 caracteres."; return false; }
    error = "";
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    try {
      loading = true;
      const res = await AuthApi.resetPassword({ token, newPassword });
      success = res?.message || "Senha redefinida com sucesso.";
      setTimeout(() => goto("/login"), 1200);
    } catch (err) {
      error = err?.message || "Erro ao redefinir a senha.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="reset-container">
  <div class="logo">INDUSKEEP</div>
  <h2 class="title">Redefinir Senha</h2>
  <p class="subtitle">Crie sua nova senha abaixo.</p>

  {#if error}<div class="alert error"><i class="fas fa-times-circle"></i>{error}</div>{/if}
  {#if success}<div class="alert success"><i class="fas fa-check-circle"></i>{success}</div>{/if}

  <form on:submit={handleSubmit} class="card">
    <div class="form-group">
      <label>Nova Senha</label>
      <input type="password" bind:value={newPassword} placeholder="Mínimo 8 caracteres" minlength="8" required />
    </div>

    <div class="form-group">
      <label>Confirmar Nova Senha</label>
      <input type="password" bind:value={confirmPassword} minlength="8" required />
    </div>

    <button type="submit" class="btn btn-primary" disabled={loading || !token}>
      {loading ? "Enviando..." : "Redefinir Senha"}
    </button>

    <a href="/login" class="back-link">
      <i class="fas fa-arrow-left"></i> Voltar para o login
    </a>
  </form>
</div>
