<script>
  import '$lib/styles/login.css';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';

  async function handleLogin() {
    try {
      window.location.href="/dashboard"
    } catch (error) {
      console.error('Login error:', error);
      alert("⚠️ Erro ao fazer login. Tente novamente.");
    }
  }
</script>

<div class="login-container">
  <div class="logo">INDUSKEEP</div>

  <form on:submit|preventDefault={handleLogin}>
    <input type="email" placeholder="E-mail" bind:value={email} />
    <input type="password" placeholder="Senha" bind:value={password} />
    <button type="submit">ACESSAR</button>
  </form>

  <a href="/recuperar-senha">Recuperar senha</a>
</div>
