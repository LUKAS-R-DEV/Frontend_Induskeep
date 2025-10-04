<script>
  import '$lib/styles/ordens-detalhe.css';
  import { page } from '$app/stores';

  // Exemplo mockado – depois você pode buscar da API
  let ordem = {
    id: '#045',
    equipamento: 'Máquina de Moldagem A',
    tipo: 'Preventiva',
    tecnico: 'Carlos Silva',
    abertura: '05/09/2023',
    previsao: '10/09/2023',
    conclusao: '-',
    descricao: 'Manutenção preventiva programada para verificação de componentes de desgaste, lubrificação e ajustes necessários.',
    status: 'aberta',
    prioridade: 'alta',
    pecas: [
      { nome: 'Rolamento AX-205', qtd: 2, valor: 85 },
      { nome: 'Lubrificante Industrial', qtd: 1, valor: 45 },
      { nome: 'Jogo de Parafusos', qtd: 1, valor: 22.5 }
    ],
    historico: [
      { data: '05/09/2023 09:15', texto: 'OS aberta por João Silva' },
      { data: '05/09/2023 10:30', texto: 'OS atribuída ao técnico Carlos Silva' },
      { data: '06/09/2023 14:20', texto: 'Técnico iniciou os trabalhos' }
    ]
  };

  function iniciarOS() {
    alert(`OS ${ordem.id} iniciada!`);
  }

  function concluirOS() {
    alert(`OS ${ordem.id} concluída!`);
  }

  function cancelarOS() {
    alert(`OS ${ordem.id} cancelada!`);
  }
</script>

<div class="header">
  <h1>Detalhes da Ordem de Serviço</h1>

</div>

<div class="page-actions">
  <a href="/ordens" class="btn secondary">
    <i class="fas fa-arrow-left"></i> Voltar
  </a>
</div>

<div class="os-header">
  <div class="os-title">
    <span class="os-number">{ordem.id}</span>
    <span class={"status " + ordem.status}>{ordem.status}</span>
    <span class={"priority " + ordem.prioridade}>{ordem.prioridade} Prioridade</span>
  </div>
  <div class="os-actions">
    <button class="btn warning"><i class="fas fa-edit"></i> Editar</button>
  </div>
</div>

<div class="section">
  <h2>Informações da OS</h2>
  <div class="info-grid">
    <div class="info-item"><label>Equipamento</label><p>{ordem.equipamento}</p></div>
    <div class="info-item"><label>Tipo de Manutenção</label><p>{ordem.tipo}</p></div>
    <div class="info-item"><label>Técnico Responsável</label><p>{ordem.tecnico}</p></div>
    <div class="info-item"><label>Data de Abertura</label><p>{ordem.abertura}</p></div>
    <div class="info-item"><label>Previsão de Conclusão</label><p>{ordem.previsao}</p></div>
    <div class="info-item"><label>Data de Conclusão</label><p>{ordem.conclusao}</p></div>
  </div>
</div>

<div class="section">
  <h2>Descrição do Problema</h2>
  <p>{ordem.descricao}</p>
</div>

<div class="section">
  <h2>Peças Utilizadas</h2>
  <table>
    <thead>
      <tr><th>Peça</th><th>Quantidade</th><th>Valor Unitário</th><th>Total</th></tr>
    </thead>
    <tbody>
      {#each ordem.pecas as p}
        <tr>
          <td>{p.nome}</td>
          <td>{p.qtd}</td>
          <td>R$ {p.valor.toFixed(2)}</td>
          <td>R$ {(p.qtd * p.valor).toFixed(2)}</td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align:right;font-weight:bold;">Total:</td>
        <td style="font-weight:bold;">R$ {ordem.pecas.reduce((t,p)=>t+p.qtd*p.valor,0).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="section">
  <h2>Histórico de Atualizações</h2>
  <div class="timeline">
    {#each ordem.historico as h}
      <div class="timeline-item">
        <div class="timeline-date">{h.data}</div>
        <div class="timeline-content">{h.texto}</div>
      </div>
    {/each}
  </div>
</div>

<div class="section">
  <h2>Atualizar Status</h2>
  <div class="action-buttons">
    <button class="btn" on:click={iniciarOS}><i class="fas fa-play"></i> Iniciar OS</button>
    <button class="btn success" on:click={concluirOS}><i class="fas fa-check"></i> Concluir OS</button>
    <button class="btn danger" on:click={cancelarOS}><i class="fas fa-times"></i> Cancelar OS</button>
  </div>
</div>
