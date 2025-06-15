export class ExcelGenerator {
  static generateFinancialExcel(reportData) {
    const summaryData = [
      ["Sport & Bike - Relatório Financeiro"],
      [`Período: ${reportData.period}`],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
      [""],
      ["RESUMO FINANCEIRO"],
      ["Métrica", "Valor", "Variação"],
      ["Receita Bruta", "R$ 16.035,00", "+12.5%"],
      ["Custos Operacionais", "R$ 4.810,50", "+8.2%"],
      ["Lucro Líquido", "R$ 11.224,50", "+15.8%"],
      ["Margem de Lucro", "70.0%", "+2.1%"],
      [""],
      ["DETALHAMENTO POR PERÍODO"],
      ["Período", "Receita", "Custos", "Lucro", "Margem", "Quantidade OS"],
      ...reportData.data.map((item) => [
        item.period,
        item.total,
        item.total * 0.3,
        item.total * 0.7,
        "70.0%",
        item.quantity,
      ]),
    ];

    this.downloadCSV(
      summaryData,
      `relatorio-financeiro-${reportData.startDate}-${reportData.endDate}`,
    );
  }

  static generateServicesExcel(reportData) {
    const servicesData = [
      ["Sport & Bike - Relatório de Serviços"],
      [`Período: ${reportData.period}`],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
      [""],
      ["SERVIÇOS MAIS SOLICITADOS"],
      ["Ranking", "Serviço", "Quantidade", "Receita", "% do Total"],
      ["1", "Regulagem Geral", "45", "R$ 2.250,00", "28.5%"],
      ["2", "Câmara de ar 29", "32", "R$ 1.120,00", "20.3%"],
      ["3", "Lavagem", "28", "R$ 840,00", "17.8%"],
      ["4", "Revisão de Suspensão", "12", "R$ 1.800,00", "15.2%"],
      ["5", "Montagem aro 24 a 29", "8", "R$ 800,00", "10.1%"],
      [""],
      ["MÉTRICAS DE PERFORMANCE"],
      ["Métrica", "Valor Atual", "Meta", "Status"],
      ["Tempo Médio de Execução", "45 min", "60 min", "Atingida"],
      ["Taxa de Retrabalho", "3.2%", "<5%", "Atingida"],
      ["Satisfação do Cliente", "4.7/5", ">4.5", "Superada"],
      ["Produtividade Diária", "15.2 OS/dia", "12 OS/dia", "Superada"],
    ];

    this.downloadCSV(
      servicesData,
      `relatorio-servicos-${reportData.startDate}-${reportData.endDate}`,
    );
  }

  static generateClientsExcel(reportData) {
    const clientsData = [
      ["Sport & Bike - Relatório de Clientes"],
      [`Período: ${reportData.period}`],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
      [""],
      ["SEGMENTAÇÃO DE CLIENTES"],
      ["Segmento", "Quantidade", "Receita", "% Receita", "Ticket Médio"],
      ["Clientes Frequentes", "89", "R$ 8.450,00", "52.7%", "R$ 94,94"],
      ["Clientes Novos", "47", "R$ 3.200,00", "20.0%", "R$ 68,09"],
      ["Clientes Ocasionais", "156", "R$ 4.385,00", "27.3%", "R$ 28,11"],
      [""],
      ["SATISFAÇÃO E RETENÇÃO"],
      ["Métrica", "Valor", "Observação"],
      ["Nota Média", "4.7/5", "96% dos clientes"],
      ["Taxa de Retenção", "84%", "156 clientes recorrentes"],
      ["Tempo Médio de Relacionamento", "2.3 anos", "Crescimento de 15%"],
      ["NPS (Net Promoter Score)", "72", "Classificação: Excelente"],
      [""],
      ["DISTRIBUIÇÃO DE AVALIAÇÕES"],
      ["Estrelas", "Quantidade", "Percentual"],
      ["5 Estrelas", "156", "78%"],
      ["4 Estrelas", "36", "18%"],
      ["3 Estrelas", "8", "4%"],
      ["2 Estrelas", "0", "0%"],
      ["1 Estrela", "0", "0%"],
    ];

    this.downloadCSV(
      clientsData,
      `relatorio-clientes-${reportData.startDate}-${reportData.endDate}`,
    );
  }

  static generateOverviewExcel(reportData) {
    const overviewData = [
      ["Sport & Bike - Relatório Executivo"],
      [`Período: ${reportData.period}`],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
      [""],
      ["RESUMO EXECUTIVO - KPIs"],
      ["KPI", "Valor", "Variação", "Status", "Meta"],
      ["Receita Total", "R$ 16.035,00", "+12.5%", "Atingida", "R$ 15.000,00"],
      ["Ordens de Serviço", "218", "+8.2%", "Atingida", "200"],
      ["Novos Clientes", "47", "+15.3%", "Superada", "40"],
      ["Ticket Médio", "R$ 73,55", "-2.1%", "Atenção", "R$ 75,00"],
      ["Taxa de Conversão", "68.4%", "+5.7%", "Atingida", "65%"],
      ["Tempo Médio OS", "2.3 dias", "-0.5 dias", "Melhorada", "3 dias"],
      [""],
      ["PRINCIPAIS INSIGHTS"],
      ["Insight"],
      ["Crescimento de 12.5% na receita total comparado ao período anterior"],
      ["Aumento significativo de 15.3% na aquisição de novos clientes"],
      ["Melhoria na eficiência operacional com redução do tempo médio de OS"],
      ["Taxa de satisfação mantida em 4.7/5 estrelas"],
      ["Oportunidade de melhoria no ticket médio através de upselling"],
      [""],
      ["RECOMENDAÇÕES"],
      ["Recomendação", "Prioridade", "Prazo"],
      ["Implementar estratégias de upselling", "Alta", "30 dias"],
      ["Focar na retenção dos novos clientes", "Alta", "60 dias"],
      ["Manter padrão de qualidade", "Média", "Contínuo"],
      ["Expandir serviços mais rentáveis", "Média", "90 dias"],
      ["Investir em marketing digital", "Baixa", "120 dias"],
    ];

    this.downloadCSV(
      overviewData,
      `relatorio-executivo-${reportData.startDate}-${reportData.endDate}`,
    );
  }

  static createWorkbook() {
    return {};
  }

  static downloadCSV(data, filename) {
    const csvContent = data
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell,
          )
          .join(','),
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
