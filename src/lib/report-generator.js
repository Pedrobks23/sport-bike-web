import jsPDF from 'jspdf'
import 'jspdf-autotable'

export class ReportGenerator {
  static addHeader(doc, title, period) {
    doc.setFillColor(245, 158, 11)
    doc.circle(20, 20, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('SB', 16, 24)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Sport & Bike', 35, 20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('25 anos de tradição no ciclismo', 35, 26)
    doc.text('Rua das Bikes, 123 - Centro, Fortaleza - CE', 35, 32)
    doc.text('(85) 3333-4444 | contato@sportbike.com.br', 35, 38)

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 20, 55)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${period}`, 20, 65)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 72)

    doc.setDrawColor(245, 158, 11)
    doc.setLineWidth(2)
    doc.line(20, 80, 190, 80)

    return 90
  }

  static addFooter(doc) {
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Sport & Bike - Relatório Confidencial', 20, pageHeight - 20)
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, 170, pageHeight - 20)
  }

  static generateFinancialPDF(reportData) {
    const doc = new jsPDF()
    let yPos = this.addHeader(doc, 'Relatório Financeiro', reportData.period)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Financeiro', 20, yPos)
    yPos += 15

    const summaryData = [
      ['Receita Bruta', 'R$ 16.035,00', '+12.5%'],
      ['Custos Operacionais', 'R$ 4.810,50', '+8.2%'],
      ['Lucro Líquido', 'R$ 11.224,50', '+15.8%'],
      ['Margem de Lucro', '70.0%', '+2.1%'],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Métrica', 'Valor', 'Variação']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    })

    yPos = doc.lastAutoTable.finalY + 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalhamento por Período', 20, yPos)
    yPos += 10

    const detailData = reportData.data.map((item) => [
      item.period,
      `R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(item.total * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(item.total * 0.7).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${(((item.total * 0.7) / item.total) * 100).toFixed(1)}%`,
    ])

    doc.autoTable({
      startY: yPos,
      head: [['Período', 'Receita', 'Custos', 'Lucro', 'Margem']],
      body: detailData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    })

    this.addFooter(doc)
    doc.save(`relatorio-financeiro-${reportData.startDate}-${reportData.endDate}.pdf`)
  }

  static generateServicesPDF(reportData) {
    const doc = new jsPDF()
    let yPos = this.addHeader(doc, 'Relatório de Serviços', reportData.period)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Serviços Mais Solicitados', 20, yPos)
    yPos += 15

    const topServices = [
      ['Regulagem Geral', '45', 'R$ 2.250,00', '28.5%'],
      ['Câmara de ar 29', '32', 'R$ 1.120,00', '20.3%'],
      ['Lavagem', '28', 'R$ 840,00', '17.8%'],
      ['Revisão de Suspensão', '12', 'R$ 1.800,00', '15.2%'],
      ['Montagem aro 24 a 29', '8', 'R$ 800,00', '10.1%'],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Serviço', 'Quantidade', 'Receita', '% do Total']],
      body: topServices,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    })

    yPos = doc.lastAutoTable.finalY + 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Métricas de Performance', 20, yPos)
    yPos += 15

    const performanceData = [
      ['Tempo Médio de Execução', '45 min', 'Meta: 60 min'],
      ['Taxa de Retrabalho', '3.2%', 'Meta: <5%'],
      ['Satisfação do Cliente', '4.7/5', 'Meta: >4.5'],
      ['Produtividade Diária', '15.2 OS/dia', 'Meta: 12 OS/dia'],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Métrica', 'Valor Atual', 'Meta']],
      body: performanceData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    })

    this.addFooter(doc)
    doc.save(`relatorio-servicos-${reportData.startDate}-${reportData.endDate}.pdf`)
  }

  static generateClientsPDF(reportData) {
    const doc = new jsPDF()
    let yPos = this.addHeader(doc, 'Relatório de Clientes', reportData.period)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Segmentação de Clientes', 20, yPos)
    yPos += 15

    const segmentData = [
      ['Clientes Frequentes', '89', 'R$ 8.450,00', '52.7%'],
      ['Clientes Novos', '47', 'R$ 3.200,00', '20.0%'],
      ['Clientes Ocasionais', '156', 'R$ 4.385,00', '27.3%'],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Segmento', 'Quantidade', 'Receita', '% Receita']],
      body: segmentData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    })

    yPos = doc.lastAutoTable.finalY + 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Satisfação e Retenção', 20, yPos)
    yPos += 15

    const satisfactionData = [
      ['Nota Média', '4.7/5', '96% dos clientes'],
      ['Taxa de Retenção', '84%', '156 clientes recorrentes'],
      ['Tempo Médio de Relacionamento', '2.3 anos', 'Crescimento de 15%'],
      ['NPS (Net Promoter Score)', '72', 'Classificação: Excelente'],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Métrica', 'Valor', 'Observação']],
      body: satisfactionData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    })

    this.addFooter(doc)
    doc.save(`relatorio-clientes-${reportData.startDate}-${reportData.endDate}.pdf`)
  }

  static generateOverviewPDF(reportData) {
    const doc = new jsPDF()
    let yPos = this.addHeader(doc, 'Relatório Executivo', reportData.period)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Executivo', 20, yPos)
    yPos += 15

    const kpiData = [
      ['Receita Total', 'R$ 16.035,00', '+12.5%', '✓'],
      ['Ordens de Serviço', '218', '+8.2%', '✓'],
      ['Novos Clientes', '47', '+15.3%', '✓'],
      ['Ticket Médio', 'R$ 73,55', '-2.1%', '⚠'],
      ['Taxa de Conversão', '68.4%', '+5.7%', '✓'],
      ['Tempo Médio OS', '2.3 dias', '-0.5 dias', '✓'],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['KPI', 'Valor', 'Variação', 'Status']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    })

    yPos = doc.lastAutoTable.finalY + 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Principais Insights', 20, yPos)
    yPos += 15

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const insights = [
      '• Crescimento de 12.5% na receita total comparado ao período anterior',
      '• Aumento significativo de 15.3% na aquisição de novos clientes',
      '• Melhoria na eficiência operacional com redução do tempo médio de OS',
      '• Taxa de satisfação mantida em 4.7/5 estrelas',
      '• Oportunidade de melhoria no ticket médio através de upselling',
    ]
    insights.forEach((insight) => {
      doc.text(insight, 20, yPos)
      yPos += 8
    })

    yPos += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recomendações', 20, yPos)
    yPos += 15

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const recommendations = [
      '• Implementar estratégias de upselling para aumentar o ticket médio',
      '• Focar na retenção dos novos clientes adquiridos',
      '• Manter o padrão de qualidade que resultou na alta satisfação',
      '• Expandir os serviços mais rentáveis (Revisão de Suspensão)',
      '• Investir em marketing digital para sustentar o crescimento',
    ]
    recommendations.forEach((rec) => {
      doc.text(rec, 20, yPos)
      yPos += 8
    })

    this.addFooter(doc)
    doc.save(`relatorio-executivo-${reportData.startDate}-${reportData.endDate}.pdf`)
  }
}
