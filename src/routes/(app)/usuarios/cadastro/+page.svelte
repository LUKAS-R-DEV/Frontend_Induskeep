<script>
  import '$lib/styles/usuarios-cadastro.css';
  import { goto } from '$app/navigation';

  let name = '';
  let email = '';
  let role = '';
  let sector = '';
  let password = '';
  let confirmPassword = '';
  let phone = '';
  let status = 'active';

  let passwordStrength = { width: '0%', color: '#ccc', text: 'Força da senha' };
  let passwordMatch = '';

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

  function formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/(\d{0,2})/, '($1');
    }

    phone = value;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    alert('Usuário salvo com sucesso!');
    goto('/usuarios');
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
          <option value="admin">Administrador</option>
          <option value="supervisor">Supervisor</option>
          <option value="tecnico">Técnico</option>
        </select>
      </div>
      <div class="form-group">
        <label for="sector">Setor/Localização</label>
        <select id="sector" bind:value={sector}>
          <option value="">Selecione um setor</option>
          <option value="producao">Produção</option>
          <option value="utilidades">Utilidades</option>
          <option value="expedicao">Expedição</option>
          <option value="manutencao">Manutenção</option>
          <option value="administrativo">Administrativo</option>
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

    <div class="form-row">
      <div class="form-group">
        <label for="phone">Telefone</label>
        <input id="phone" type="tel" bind:value={phone} on:input={formatPhone} placeholder="(00) 00000-0000" />
      </div>
      <div class="form-group">
        <label for="status">Status *</label>
        <select id="status" bind:value={status} required>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn secondary" on:click={() => goto('/usuarios')}>Cancelar</button>
      <button type="submit" class="btn">Salvar Usuário</button>
    </div>
  </form>
</div>
