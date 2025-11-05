<script>
  import '$lib/styles/recuperar-senha.css';
  import { goto } from '$app/navigation';
  import {AuthApi} from '$lib/api/auth';
  import { onMount } from 'svelte';

  let email = '';
  let success = false;
  let errorMessage = '';

  function validateEmail() {
    if (email && !email.includes('@')) {
      errorMessage = 'Por favor, insira um email válido.';
      return false;
    }
    errorMessage = '';
    return true;
  }

  async function handleRecovery(e) {
    e.preventDefault();

    if (!validateEmail()) return;
    try{
      await AuthApi.recoveryPassword({email});
      success = true;
       goto('/login');
    }catch(err){
      success = true;
       goto('/login');
    }
 
  }   
    
  
</script>

<div class="recovery-container">
  <div class="logo">INDUSKEEP</div>
  
  <h2 class="recovery-title">Recuperar Senha</h2>
  <p class="recovery-text">
    Digite seu email abaixo e enviaremos instruções para redefinir sua senha.
  </p>

  {#if success}
    <div class="success-message">
      <i class="fas fa-check-circle"></i>
      Email enviado com sucesso! Verifique sua caixa de entrada.
    </div>
  {/if}

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}

  <form on:submit={handleRecovery}>
    <div class="form-group">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} placeholder="seu.email@empresa.com" required />
    </div>

    <button type="submit" class="btn btn-primary">
      <i class="fas fa-paper-plane"></i> Enviar Instruções
    </button>
  </form>

  <button type="button" class="btn btn-secondary" on:click={() => goto('/login')}>
    <i class="fas fa-arrow-left"></i> Voltar para Login
  </button>

  <a href="/login" class="back-link">
    <i class="fas fa-sign-in-alt"></i> Lembrou sua senha? Faça login
  </a>
</div>
