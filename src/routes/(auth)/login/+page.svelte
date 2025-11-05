<script>
import {UserApi} from '$lib/api/users'
  import '$lib/styles/login.css';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error='';

  async function handleLogin() {
    try {
      const data=await UserApi.login({email,password});
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      await window.location.replace('/dashboard');
    } catch (e) {
    error=e.message;
    
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
