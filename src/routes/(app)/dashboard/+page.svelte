<script>
  import '$lib/styles/dashboard.css';
</script>

<div class="dashboard">
  <div class="header">
    <h1>Dashboard - Área principal</h1>
  </div>

  <!-- Cards -->
  <div class="cards">
    <div class="card">
      <h3>Total de equipamentos</h3>
      <div class="number">5</div>
    </div>
    <div class="card pending">
      <h3>Manutenção Pendentes</h3>
      <div class="number">1</div>
    </div>
    <div class="card completed">
      <h3>Manutenção Concluída</h3>
      <div class="number">2</div>
    </div>
    <div class="card critical">
      <h3>Estoque Crítico</h3>
      <div class="number">3</div>
    </div>
  </div>

  <!-- Próximas Manutenções -->
  <div class="section">
    <h2>Próximas manutenções</h2>
    <div class="maintenance-item">
      <div class="machine-info">
        <h4>Máquina: A</h4>
        <p>Responsável: Jose • Data: 10/09</p>
      </div>
      <div class="status pending">Pendente</div>
    </div>
    <div class="maintenance-item">
      <div class="machine-info">
        <h4>Máquina: B</h4>
        <p>Responsável: Antonio • Data: 11/09</p>
      </div>
      <div class="status completed">Concluída</div>
    </div>
    <div class="maintenance-item">
      <div class="machine-info">
        <h4>Máquina: C</h4>
        <p>Responsável: Maria • Data: 12/09</p>
      </div>
      <div class="status critical">Atrasada</div>
    </div>
  </div>

  <!-- Notificações -->
  <div class="section">
    <h2>Notificações</h2>
    <div class="notification-item">
      <div class="notification-icon warning">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="notification-content">
        <h4>Manutenção Preventiva Atrasada</h4>
        <p>Máquina C está com manutenção atrasada há 3 dias</p>
        <div class="notification-time">Há 2 horas</div>
      </div>
    </div>
    <div class="notification-item">
      <div class="notification-icon danger">
        <i class="fas fa-box"></i>
      </div>
      <div class="notification-content">
        <h4>Estoque Crítico</h4>
        <p>Peça "Rolamento AX-205" está com estoque abaixo do mínimo</p>
        <div class="notification-time">Há 5 horas</div>
      </div>
    </div>
    <div class="notification-item">
      <div class="notification-icon info">
        <i class="fas fa-info-circle"></i>
      </div>
      <div class="notification-content">
        <h4>Nova OS Criada</h4>
        <p>Ordem de Serviço #045 foi criada para a Máquina B</p>
        <div class="notification-time">Hoje às 09:30</div>
      </div>
    </div>
  </div>
</div>
