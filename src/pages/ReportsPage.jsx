import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Wrench,
  Filter,
  RefreshCw,
  Mail,
  Clock,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Star,
  Download,
  FileText,
  Table,
} from 'lucide-react'
import { ReportGenerator } from '@/lib/report-generator'
import { ExcelGenerator } from '@/lib/excel-generator'

export default function ReportsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [reportType, setReportType] = useState('Mensal')
  const [serviceType, setServiceType] = useState('Todos os serviços')
  const [startDate, setStartDate] = useState('2024-12-09')
  const [endDate, setEndDate] = useState('2025-06-09')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: <BarChart3 className='w-5 h-5' /> },
    { id: 'financial', name: 'Financeiro', icon: <DollarSign className='w-5 h-5' /> },
    { id: 'services', name: 'Serviços', icon: <Wrench className='w-5 h-5' /> },
    { id: 'clients', name: 'Clientes', icon: <Users className='w-5 h-5' /> },
    { id: 'performance', name: 'Performance', icon: <Activity className='w-5 h-5' /> },
  ]

  const reportData = [
    { period: 'dezembro de 2024', quantity: 58, total: 4354.0, clients: 45, avgTicket: 75.07 },
    { period: 'maio de 2025', quantity: 38, total: 2371.0, clients: 32, avgTicket: 62.39 },
    { period: 'abril de 2025', quantity: 1, total: 100.0, clients: 1, avgTicket: 100.0 },
    { period: 'fevereiro de 2025', quantity: 16, total: 1265.0, clients: 14, avgTicket: 79.06 },
    { period: 'janeiro de 2025', quantity: 100, total: 7475.0, clients: 78, avgTicket: 74.75 },
    { period: 'março de 2025', quantity: 5, total: 470.0, clients: 5, avgTicket: 94.0 },
  ]

  const kpiData = [
    {
      title: 'Receita Total',
      value: 'R$ 16.035,00',
      change: '+12.5%',
      trend: 'up',
      icon: <DollarSign className='w-6 h-6' />,
      color: 'green',
    },
    {
      title: 'Ordens de Serviço',
      value: '218',
      change: '+8.2%',
      trend: 'up',
      icon: <Wrench className='w-6 h-6' />,
      color: 'blue',
    },
    {
      title: 'Novos Clientes',
      value: '47',
      change: '+15.3%',
      trend: 'up',
      icon: <Users className='w-6 h-6' />,
      color: 'purple',
    },
    {
      title: 'Ticket Médio',
      value: 'R$ 73,55',
      change: '-2.1%',
      trend: 'down',
      icon: <Target className='w-6 h-6' />,
      color: 'amber',
    },
    {
      title: 'Taxa de Conversão',
      value: '68.4%',
      change: '+5.7%',
      trend: 'up',
      icon: <TrendingUp className='w-6 h-6' />,
      color: 'indigo',
    },
    {
      title: 'Tempo Médio OS',
      value: '2.3 dias',
      change: '-0.5 dias',
      trend: 'up',
      icon: <Clock className='w-6 h-6' />,
      color: 'teal',
    },
  ]

  const topServices = [
    { name: 'Regulagem Geral', quantity: 45, revenue: 2250.0, percentage: 28.5 },
    { name: 'Câmara de ar 29', quantity: 32, revenue: 1120.0, percentage: 20.3 },
    { name: 'Lavagem', quantity: 28, revenue: 840.0, percentage: 17.8 },
    { name: 'Revisão de Suspensão', quantity: 12, revenue: 1800.0, percentage: 15.2 },
    { name: 'Montagem aro 24 a 29', quantity: 8, revenue: 800.0, percentage: 10.1 },
  ]

  const clientAnalytics = [
    { segment: 'Clientes Frequentes', count: 89, revenue: 8450.0, percentage: 52.7 },
    { segment: 'Clientes Novos', count: 47, revenue: 3200.0, percentage: 20.0 },
    { segment: 'Clientes Ocasionais', count: 156, revenue: 4385.0, percentage: 27.3 },
  ]

  const createReportData = (type) => ({
    type,
    period: `${startDate} a ${endDate}`,
    startDate,
    endDate,
    data: reportData,
    summary: {
      totalRevenue: 16035.0,
      totalOrders: 218,
      totalClients: 292,
      avgTicket: 73.55,
    },
  })

  const handleExport = (format, type) => {
    setIsLoading(true)
    setTimeout(() => {
      const data = createReportData(type)
      if (format === 'pdf') {
        switch (type) {
          case 'financial':
            ReportGenerator.generateFinancialPDF(data)
            break
          case 'services':
            ReportGenerator.generateServicesPDF(data)
            break
          case 'clients':
            ReportGenerator.generateClientsPDF(data)
            break
          case 'overview':
            ReportGenerator.generateOverviewPDF(data)
            break
        }
      } else {
        const excelData = { ...data, data: reportData }
        switch (type) {
          case 'financial':
            ExcelGenerator.generateFinancialExcel(excelData)
            break
          case 'services':
            ExcelGenerator.generateServicesExcel(excelData)
            break
          case 'clients':
            ExcelGenerator.generateClientsExcel(excelData)
            break
          case 'overview':
            ExcelGenerator.generateOverviewExcel(excelData)
            break
        }
      }
      setIsLoading(false)
    }, 1500)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Dados atualizados!')
    }, 1500)
  }

  const handleScheduleReport = () => {
    alert('Configurar agendamento de relatório...')
  }

  const getKpiColor = (color) => {
    const colors = {
      green: 'from-green-400 to-green-600',
      blue: 'from-blue-400 to-blue-600',
      purple: 'from-purple-400 to-purple-600',
      amber: 'from-amber-400 to-amber-600',
      indigo: 'from-indigo-400 to-indigo-600',
      teal: 'from-teal-400 to-teal-600',
    }
    return colors[color] || 'from-gray-400 to-gray-600'
  }

  const renderOverviewTab = () => (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className={`bg-gradient-to-r ${getKpiColor(kpi.color)} p-3 rounded-xl text-white`}>{kpi.icon}</div>
              <div
                className={`flex items-center space-x-1 text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {kpi.trend === 'up' ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                <span>{kpi.change}</span>
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>{kpi.title}</p>
              <p className='text-2xl font-bold text-gray-800 dark:text-white'>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Exportar Relatórios</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {tabs.map((tab) => (
            <div key={tab.id} className='space-y-3'>
              <h4 className='font-semibold text-gray-800 dark:text-white flex items-center space-x-2'>
                {tab.icon}
                <span>{tab.name}</span>
              </h4>
              <div className='flex space-x-2'>
                <button
                  onClick={() => handleExport('pdf', tab.id)}
                  disabled={isLoading}
                  className='flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1'
                >
                  <FileText className='w-4 h-4' />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv', tab.id)}
                  disabled={isLoading}
                  className='flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1'
                >
                  <Table className='w-4 h-4' />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-bold text-gray-800 dark:text-white'>Receita por Período</h3>
            <div className='flex space-x-2'>
              <button className='p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'>
                <LineChart className='w-4 h-4' />
              </button>
              <button className='p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
                <BarChart3 className='w-4 h-4' />
              </button>
            </div>
          </div>
          <div className='h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <BarChart3 className='w-16 h-16 text-blue-400 mx-auto mb-4' />
              <p className='text-gray-600 dark:text-gray-400'>Gráfico de Receita</p>
              <p className='text-sm text-gray-500 dark:text-gray-500'>Últimos 6 meses</p>
            </div>
          </div>
        </div>

        <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-bold text-gray-800 dark:text-white'>Distribuição de Serviços</h3>
            <button className='p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors'>
              <PieChart className='w-4 h-4' />
            </button>
          </div>
          <div className='h-64 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <PieChart className='w-16 h-16 text-purple-400 mx-auto mb-4' />
              <p className='text-gray-600 dark:text-gray-400'>Gráfico de Pizza</p>
              <p className='text-sm text-gray-500 dark:text-gray-500'>Top 5 serviços</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFinancialTab = () => (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100'>Receita Bruta</p>
              <p className='text-2xl font-bold'>R$ 16.035,00</p>
            </div>
            <DollarSign className='w-8 h-8 text-green-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100'>Custos</p>
              <p className='text-2xl font-bold'>R$ 4.810,50</p>
            </div>
            <TrendingDown className='w-8 h-8 text-blue-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100'>Lucro Líquido</p>
              <p className='text-2xl font-bold'>R$ 11.224,50</p>
            </div>
            <TrendingUp className='w-8 h-8 text-purple-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-amber-100'>Margem</p>
              <p className='text-2xl font-bold'>70%</p>
            </div>
            <Target className='w-8 h-8 text-amber-200' />
          </div>
        </div>
      </div>

      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white'>Exportar Relatório Financeiro</h3>
          <div className='flex space-x-2'>
            <button
              onClick={() => handleExport('pdf', 'financial')}
              disabled={isLoading}
              className='bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>PDF Completo</span>
            </button>
            <button
              onClick={() => handleExport('csv', 'financial')}
              disabled={isLoading}
              className='bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>Planilha Excel</span>
            </button>
          </div>
        </div>
        <p className='text-gray-600 dark:text-gray-400'>
          Relatório completo com análise financeira detalhada, incluindo receitas, custos, lucros e margens por período.
        </p>
      </div>

      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Detalhamento Financeiro</h3>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200 dark:border-gray-600'>
                <th className='text-left py-3 px-4 font-semibold text-gray-800 dark:text-white'>PERÍODO</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-800 dark:text-white'>RECEITA</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-800 dark:text-white'>CUSTOS</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-800 dark:text-white'>LUCRO</th>
                <th className='text-right py-3 px-4 font-semibold text-gray-800 dark:text-white'>MARGEM</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => {
                const costs = item.total * 0.3
                const profit = item.total - costs
                const margin = (profit / item.total) * 100
                return (
                  <tr
                    key={index}
                    className='border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
                  >
                    <td className='py-3 px-4 text-gray-800 dark:text-white'>{item.period}</td>
                    <td className='py-3 px-4 text-center text-gray-800 dark:text-white'>
                      R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className='py-3 px-4 text-center text-gray-800 dark:text-white'>
                      R$ {costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className='py-3 px-4 text-center font-semibold text-green-600 dark:text-green-400'>
                      R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className='py-3 px-4 text-right font-semibold text-gray-800 dark:text-white'>
                      {margin.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderServicesTab = () => (
    <div className='space-y-8'>
      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white'>Exportar Relatório de Serviços</h3>
          <div className='flex space-x-2'>
            <button
              onClick={() => handleExport('pdf', 'services')}
              disabled={isLoading}
              className='bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>PDF Completo</span>
            </button>
            <button
              onClick={() => handleExport('csv', 'services')}
              disabled={isLoading}
              className='bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>Planilha Excel</span>
            </button>
          </div>
        </div>
        <p className='text-gray-600 dark:text-gray-400'>
          Análise completa dos serviços mais solicitados, performance por categoria e métricas de qualidade.
        </p>
      </div>

      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Serviços Mais Solicitados</h3>
        <div className='space-y-4'>
          {topServices.map((service, index) => (
            <div key={index} className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <div className='flex items-center space-x-4'>
                <div className='bg-gradient-to-r from-amber-400 to-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm'>
                  {index + 1}
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800 dark:text-white'>{service.name}</h4>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>{service.quantity} serviços realizados</p>
                </div>
              </div>
              <div className='text-right'>
                <p className='font-bold text-gray-800 dark:text-white'>
                  R$ {service.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-400'>{service.percentage}% do total</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Performance por Categoria</h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-700 dark:text-gray-300'>Manutenção</span>
              <div className='flex items-center space-x-2'>
                <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full' style={{ width: '85%' }} />
                </div>
                <span className='text-sm font-medium text-gray-800 dark:text-white'>85%</span>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-gray-700 dark:text-gray-300'>Montagem</span>
              <div className='flex items-center space-x-2'>
                <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full' style={{ width: '72%' }} />
                </div>
                <span className='text-sm font-medium text-gray-800 dark:text-white'>72%</span>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-gray-700 dark:text-gray-300'>Regulagem</span>
              <div className='flex items-center space-x-2'>
                <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full' style={{ width: '68%' }} />
                </div>
                <span className='text-sm font-medium text-gray-800 dark:text-white'>68%</span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Tempo Médio por Serviço</h3>
          <div className='space-y-4'>
            {topServices.slice(0, 3).map((service, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                <span className='text-gray-700 dark:text-gray-300'>{service.name}</span>
                <div className='flex items-center space-x-2'>
                  <Clock className='w-4 h-4 text-gray-500' />
                  <span className='font-medium text-gray-800 dark:text-white'>{Math.floor(Math.random() * 60) + 30} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderClientsTab = () => (
    <div className='space-y-8'>
      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white'>Exportar Relatório de Clientes</h3>
          <div className='flex space-x-2'>
            <button
              onClick={() => handleExport('pdf', 'clients')}
              disabled={isLoading}
              className='bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>PDF Completo</span>
            </button>
            <button
              onClick={() => handleExport('csv', 'clients')}
              disabled={isLoading}
              className='bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>Planilha Excel</span>
            </button>
          </div>
        </div>
        <p className='text-gray-600 dark:text-gray-400'>
          Análise detalhada da base de clientes, segmentação, satisfação e métricas de retenção.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {clientAnalytics.map((segment, index) => (
          <div
            key={index}
            className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'
          >
            <div className='text-center'>
              <div className='bg-gradient-to-r from-blue-400 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Users className='w-8 h-8 text-white' />
              </div>
              <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-2'>{segment.segment}</h3>
              <p className='text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1'>{segment.count}</p>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>clientes</p>
              <p className='text-lg font-semibold text-gray-800 dark:text-white'>
                R$ {segment.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-400'>{segment.percentage}% da receita</p>
            </div>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Satisfação dos Clientes</h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Star className='w-5 h-5 text-yellow-500' />
                <span className='text-gray-700 dark:text-gray-300'>5 Estrelas</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full' style={{ width: '78%' }} />
                </div>
                <span className='text-sm font-medium text-gray-800 dark:text-white'>78%</span>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Star className='w-5 h-5 text-yellow-500' />
                <span className='text-gray-700 dark:text-gray-300'>4 Estrelas</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full' style={{ width: '18%' }} />
                </div>
                <span className='text-sm font-medium text-gray-800 dark:text-white'>18%</span>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Star className='w-5 h-5 text-gray-400' />
                <span className='text-gray-700 dark:text-gray-300'>3 Estrelas</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-gray-400 to-gray-600 h-2 rounded-full' style={{ width: '4%' }} />
                </div>
                <span className='text-sm font-medium text-gray-800 dark:text-white'>4%</span>
              </div>
            </div>
          </div>
          <div className='mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='w-5 h-5 text-green-600 dark:text-green-400' />
              <span className='font-semibold text-green-800 dark:text-green-400'>Nota Média: 4.7/5</span>
            </div>
          </div>
        </div>

        <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Retenção de Clientes</h3>
          <div className='text-center mb-6'>
            <div className='relative w-32 h-32 mx-auto'>
              <div className='absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full' />
              <div className='absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-green-600 dark:text-green-400'>84%</p>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Retenção</p>
                </div>
              </div>
            </div>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-700 dark:text-gray-300'>Clientes Recorrentes</span>
              <span className='font-semibold text-gray-800 dark:text-white'>156</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-700 dark:text-gray-300'>Taxa de Retorno</span>
              <span className='font-semibold text-green-600 dark:text-green-400'>84%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-700 dark:text-gray-300'>Tempo Médio Cliente</span>
              <span className='font-semibold text-gray-800 dark:text-white'>2.3 anos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100'>Eficiência</p>
              <p className='text-2xl font-bold'>92%</p>
            </div>
            <Zap className='w-8 h-8 text-green-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100'>Qualidade</p>
              <p className='text-2xl font-bold'>4.7/5</p>
            </div>
            <Star className='w-8 h-8 text-blue-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100'>Pontualidade</p>
              <p className='text-2xl font-bold'>89%</p>
            </div>
            <Clock className='w-8 h-8 text-purple-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-amber-100'>Produtividade</p>
              <p className='text-2xl font-bold'>15.2</p>
            </div>
            <Activity className='w-8 h-8 text-amber-200' />
          </div>
        </div>
      </div>

      <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl'>
        <h3 className='text-xl font-bold text-gray-800 dark:text-white mb-6'>Alertas de Performance</h3>
        <div className='space-y-4'>
          <div className='flex items-center space-x-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
            <AlertCircle className='w-6 h-6 text-yellow-600 dark:text-yellow-400' />
            <div>
              <h4 className='font-semibold text-yellow-800 dark:text-yellow-400'>Tempo médio de OS aumentou</h4>
              <p className='text-sm text-yellow-700 dark:text-yellow-500'>O tempo médio subiu para 2.3 dias (+0.5 dias)</p>
            </div>
          </div>

          <div className='flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
            <CheckCircle className='w-6 h-6 text-green-600 dark:text-green-400' />
            <div>
              <h4 className='font-semibold text-green-800 dark:text-green-400'>Meta de satisfação atingida</h4>
              <p className='text-sm text-green-700 dark:text-green-500'>Nota média de 4.7/5 superou a meta de 4.5</p>
            </div>
          </div>

          <div className='flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <TrendingUp className='w-6 h-6 text-blue-600 dark:text-blue-400' />
            <div>
              <h4 className='font-semibold text-blue-800 dark:text-blue-400'>Produtividade em alta</h4>
              <p className='text-sm text-blue-700 dark:text-blue-500'>15.2 OS/dia, aumento de 12% no mês</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <div className='bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen'>
        <header className='bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50'>
          <div className='container mx-auto px-4 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <button
                  onClick={() => window.history.back()}
                  className='p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
                >
                  <ArrowLeft className='w-5 h-5' />
                </button>
                <div className='flex items-center space-x-3'>
                  <div className='bg-gradient-to-r from-indigo-400 to-indigo-600 p-2 rounded-full'>
                    <BarChart3 className='w-6 h-6 text-white' />
                  </div>
                  <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>Relatórios Avançados</h1>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className='p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50'
                  title='Atualizar dados'
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleScheduleReport}
                  className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all inline-flex items-center space-x-2'
                >
                  <Mail className='w-4 h-4' />
                  <span>Agendar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className='container mx-auto px-4 py-8'>
          <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8'>
            <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4'>
              <div className='flex items-center space-x-4'>
                <Filter className='w-5 h-5 text-gray-500' />
                <h2 className='text-lg font-bold text-gray-800 dark:text-white'>Filtros</h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 w-full lg:w-auto'>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className='px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                >
                  <option value='Mensal'>Mensal</option>
                  <option value='Semanal'>Semanal</option>
                  <option value='Anual'>Anual</option>
                </select>

                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className='px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                >
                  <option value='Todos os serviços'>Todos os serviços</option>
                  <option value='Manutenção'>Manutenção</option>
                  <option value='Vendas'>Vendas</option>
                  <option value='Aluguel'>Aluguel</option>
                </select>

                <input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                />

                <input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8'>
            <div className='flex flex-wrap gap-2'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'financial' && renderFinancialTab()}
            {activeTab === 'services' && renderServicesTab()}
            {activeTab === 'clients' && renderClientsTab()}
            {activeTab === 'performance' && renderPerformanceTab()}
          </div>
        </main>
      </div>
    </div>
  )
}
