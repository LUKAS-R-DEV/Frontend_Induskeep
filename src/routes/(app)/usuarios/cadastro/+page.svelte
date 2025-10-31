<script>
  import '$lib/styles/usuarios-cadastro.css';
  import { goto } from '$app/navigation';
  import { UserApi } from '$lib/api/users';

  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let role = '';

  let passwordStrength = { width: '0%', color: '#ccc', text: 'Força da senha' };
  let passwordMatch = '';
  let loading = false;

  function checkPasswordStrength() {
    let strength = 0;
    let color = '#ff3333';
    let text = 'Fraca';

    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;

    if (strength === 2) { color = '#ff9900'; text = 'Média'; }
    else if (strength === 3) { color = '#00cc99'; text = 'Forte'; }
    else if (strength === 4) { color = '#0066cc'; text = 'Muito Forte'; }

    passwordStrength = { width: strength * 25 + '%', color, text };
  }

  function checkPasswordMatch() {
    if (!confirmPassword) {
      passwordMatch = '';
    } else if (password === confirmPassword) {
      passwordMatch = 'Senhas coincidem';
      passwordStrength.color = '#00cc99';
    } else {
      passwordMatch = 'Senhas não coincidem';
      passwordStrength.color = '#ff3333';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (!name || !email || !role || !password) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      name,
      email,
      password,
      role: role.toUpperCase(), // backend usa letras maiúsculas
    };

    try {
      loading = true;
      await UserApi.register(payload);
      alert('Usuário cadastrado com sucesso!');
      goto('/usuarios');
    } catch (err) {
      alert(err.message || 'Erro ao cadastrar usuário');
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Cadastro de Usuário</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/usuarios')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Dados do Usuário</h2>
  <form on:submit={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="name">Nome Completo *</label>
        <input id="name" type="text" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="email">E-mail *</label>
        <input id="email" type="email" bind:value={email} required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="role">Perfil de Acesso *</label>
        <select id="role" bind:value={role} required>
          <option value="">Selecione um perfil</option>
          <option value="ADMIN">Administrador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="TECHNICIAN">Técnico</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="password">Senha *</label>
        <input id="password" type="password" bind:value={password} required on:input={checkPasswordStrength} />
        <div class="password-strength">
          <div class="password-strength-bar" style="width: {passwordStrength.width}; background: {passwordStrength.color};"></div>
        </div>
        <small style="color: {passwordStrength.color}; font-size: 0.8rem;">{passwordStrength.text}</small>
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirmar Senha *</label>
        <input id="confirmPassword" type="password" bind:value={confirmPassword} required on:input={checkPasswordMatch} />
        <small style="color: {passwordStrength.color}; font-size: 0.8rem;">{passwordMatch}</small>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn secondary" on:click={() => goto('/usuarios')}>Cancelar</button>
      <button type="submit" class="btn" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Usuário'}
      </button>
    </div>
  </form>
</div>

<style>
  .password-strength {
    height: 6px;
    width: 100%;
    background: #eee;
    border-radius: 4px;
    margin-top: 4px;
  }

  .password-strength-bar {
    height: 6px;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  small {
    display: block;
    margin-top: 4px;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
