import { Activity, CheckCircle2, Clock3, FileText, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import { getReportSummary } from '../services/api.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';

function Reports() {
  const [summary, setSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getReportSummary().then(setSummary).catch((error) => setErrorMessage(error.message));
  }, []);

  const orders = summary?.orders ?? { total: 0, open: 0, in_progress: 0, completed: 0 };
  const tickets = summary?.tickets ?? { total: 0, open: 0, in_progress: 0, resolved: 0 };
  const weekly = summary?.weekly ?? [];
  const resolutionRate = tickets.total ? Math.round((tickets.resolved / tickets.total) * 100) : 0;
  const maxWeeklyValue = Math.max(...weekly.map((item) => Math.max(item.orders, item.tickets)), 1);
  const lineStep = 180 / Math.max(weekly.length - 1, 1);
  const linePoints = weekly.map((item, index) => `${index * lineStep + 10},${110 - item.orders / maxWeeklyValue * 85}`).join(' ');

  const exportColumns = [
    { header: 'Semana / Período', accessor: 'week' },
    { header: 'Ordens Criadas', accessor: 'orders' },
    { header: 'Chamados Criados', accessor: 'tickets' }
  ];

  function handleExportXls() {
    exportToXls({
      title: 'Relatório Operacional Geral',
      filename: 'Relatorio_Operacional_HelpClin',
      columns: exportColumns,
      data: weekly
    });
  }

  function handleExportPdf() {
    exportToPdf({
      title: 'Relatório de Desempenho Operacional',
      subtitle: 'Indicadores e volume de atendimentos e ordens de serviço',
      columns: exportColumns,
      data: weekly,
      summary: [
        { label: 'Ordens Registradas', value: orders.total },
        { label: 'Chamados em Andamento', value: tickets.in_progress },
        { label: 'Taxa de Resolução', value: `${resolutionRate}%` },
        { label: 'Chamados Resolvidos', value: tickets.resolved }
      ]
    });
  }

  return (
    <div className="simple-page reports-page">
      <section className="simple-page-heading">
        <div>
          <p className="eyebrow">Visão operacional</p>
          <h1>Relatórios</h1>
          <p>Acompanhe os números reais da operação da sua clínica.</p>
        </div>
        <ExportDropdown onExportXls={handleExportXls} onExportPdf={handleExportPdf} />
      </section>
      {errorMessage && <div className="data-state data-state--error">{errorMessage}</div>}
      {!errorMessage && <>
        <section className="report-indicators"><article className="report-indicator"><div className="report-icon report-icon--coral"><FileText size={20} /></div><span>Ordens registradas</span><strong>{orders.total}</strong><small><TrendingUp size={13} /> {orders.open} em aberto</small></article><article className="report-indicator"><div className="report-icon report-icon--mint"><Clock3 size={20} /></div><span>Chamados em andamento</span><strong>{tickets.in_progress}</strong><small><Activity size={13} /> {tickets.open} aguardando atendimento</small></article><article className="report-indicator"><div className="report-icon report-icon--blue"><CheckCircle2 size={20} /></div><span>Taxa de resolução</span><strong>{resolutionRate}%</strong><small><CheckCircle2 size={13} /> {tickets.resolved} chamados resolvidos</small></article></section>
        <section className="report-chart-panel report-panel"><div className="report-panel-heading"><div><p className="eyebrow">Volume de atendimento</p><h2>Ordens e chamados por semana</h2></div><div className="chart-legend"><span><i className="legend-dot legend-dot--orange" />Ordens</span><span><i className="legend-dot legend-dot--green" />Chamados</span></div></div>{weekly.length === 0 ? <div className="data-state"><FileText size={25} /><strong>Nenhum atendimento registrado</strong><span>O gráfico será preenchido quando houver movimentação.</span></div> : <div className="bars-chart"><div className="chart-y-labels"><span>{maxWeeklyValue}</span><span>{Math.round(maxWeeklyValue * .75)}</span><span>{Math.round(maxWeeklyValue * .5)}</span><span>{Math.round(maxWeeklyValue * .25)}</span><span>0</span></div><div className="chart-columns">{weekly.map((item) => <div className="chart-column" key={item.week}><div className="bar-group"><div className="bar-track"><i className="bar-orders" style={{ height: `${item.orders / maxWeeklyValue * 100}%` }} /></div><div className="bar-track"><i className="bar-tickets" style={{ height: `${item.tickets / maxWeeklyValue * 100}%` }} /></div></div><span>{item.week}</span></div>)}</div></div>}</section>
        <section className="report-content-grid"><article className="report-panel current-status-panel"><div className="report-panel-heading"><div><p className="eyebrow">Ordens de serviço</p><h2>Status atual</h2></div></div>{weekly.length === 0 ? <div className="data-state data-state--compact"><FileText size={22} /><span>Sem histórico de ordens.</span></div> : <div className="line-chart-wrap"><svg className="line-chart" viewBox="0 0 200 125" role="img" aria-label="Evolução semanal das ordens de serviço"><line x1="10" y1="110" x2="190" y2="110" /><line x1="10" y1="25" x2="10" y2="110" /><polyline points={linePoints} /> <g>{weekly.map((item, index) => <circle key={item.week} cx={index * lineStep + 10} cy={110 - item.orders / maxWeeklyValue * 85} r="3"><title>{item.week}: {item.orders} ordens</title></circle>)}</g></svg><div className="line-chart-labels">{weekly.map((item) => <span key={item.week}>{item.week}</span>)}</div></div>}<div className="real-report-list"><span><i className="legend-dot legend-dot--green" />Concluídas <b>{orders.completed}</b></span><span><i className="legend-dot legend-dot--orange" />Em andamento <b>{orders.in_progress}</b></span><span><i className="legend-dot legend-dot--gray" />Abertas <b>{orders.open}</b></span></div></article><article className="report-panel pie-report-panel"><div className="report-panel-heading"><div><p className="eyebrow">Chamados</p><h2>Distribuição por estado</h2></div></div><div className="pie-report"><div className="pie-chart" style={{ background: `conic-gradient(#6ca88d 0 ${tickets.total ? tickets.resolved / tickets.total * 100 : 0}%, #e78368 ${tickets.total ? tickets.resolved / tickets.total * 100 : 0}% ${tickets.total ? (tickets.resolved + tickets.in_progress) / tickets.total * 100 : 0}%, #d7ded9 ${tickets.total ? (tickets.resolved + tickets.in_progress) / tickets.total * 100 : 0}% 100%)` }}><div className="pie-chart-center"><strong>{tickets.total}</strong><span>chamados</span></div></div><div className="pie-legend"><span><i className="legend-dot legend-dot--green" />Resolvidos <b>{tickets.resolved}</b></span><span><i className="legend-dot legend-dot--orange" />Em andamento <b>{tickets.in_progress}</b></span><span><i className="legend-dot legend-dot--gray" />Abertos <b>{tickets.open}</b></span></div></div></article></section>
      </>}
    </div>
  );
}

export default Reports;
