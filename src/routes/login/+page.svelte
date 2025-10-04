<script>
  import '$lib/styles/login.css';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';

  async function handleLogin() {
    try {
      if(email==''&& password==''){
        alert('⚠️ Por favor, preencha todos os campos.');
      }
      // Validação dos campos
      if (!email || !password) {
        alert('⚠️ Por favor, preencha todos os campos.');
        return;
      } else if (password.length < 8) {
        alert('⚠️ A senha deve ter pelo menos 8 caracteres.');
        return;
      }

      // Credenciais de teste (substitua pela lógica real)
      if (email === 'admin@example.com' && password === '12345678') {
        alert('✅ Login bem-sucedido!');
        window.location.href = '/dashboard';
      } else {
        alert('❌ E-mail ou senha inválidos!');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("⚠️ Erro ao fazer login. Tente novamente.");
    }
  }
</script>

<div class="login-container">
  <div class="logo">INDUSKEEP</div>

  <form on:submit|preventDefault={handleLogin}>
    <input type="email" placeholder="E-mail" bind:value={email} required />
    <input type="password" placeholder="Senha" bind:value={password} required />
    <button type="submit">ACESSAR</button>
  </form>

  <a href="/recuperar-senha">Recuperar senha</a>
</div>
