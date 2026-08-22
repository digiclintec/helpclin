/**
 * HelpClin Export Utilities for Excel (.xls / .csv) and PDF
 */

export function exportToXls({ title, columns, data, filename = 'relatorio' }) {
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const timeStr = new Date().toLocaleTimeString('pt-BR');

  // Build HTML table format for native Excel compatibility (.xls)
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${title}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
        th { background-color: #123B3D; color: #ffffff; font-weight: bold; border: 1px solid #dce7df; padding: 10px; }
        td { border: 1px solid #dce7df; padding: 8px 10px; color: #143b3d; }
        .header-title { font-size: 18px; font-weight: bold; color: #123B3D; padding: 10px 0; }
        .header-info { font-size: 11px; color: #6f7f7c; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${columns.length}" class="header-title">HelpClin - ${title}</td>
        </tr>
        <tr>
          <td colspan="${columns.length}" class="header-info">Gerado em: ${dateStr} às ${timeStr} | Total de registros: ${data.length}</td>
        </tr>
        <tr></tr>
        <thead>
          <tr>
            ${columns.map((c) => `<th>${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${columns
                .map((c) => {
                  const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor] ?? '—';
                  return `<td>${val}</td>`;
                })
                .join('')}
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPdf({ title, subtitle = '', columns, data, summary = [] }) {
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const timeStr = new Date().toLocaleTimeString('pt-BR');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita popups para visualizar e baixar o relatório em PDF.');
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório - ${title} | HelpClinTec</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');

        @page {
          size: A4 portrait;
          margin: 12mm 10mm;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #143b3d;
          background: #f4f7f5;
          padding: 24px 16px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .action-bar {
          max-width: 900px;
          margin: 0 auto 16px auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: #ffffff;
          border: 1px solid #dce7df;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(18, 59, 61, 0.06);
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-bar-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #59716e;
          font-weight: 500;
        }

        .action-bar-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          background: #e3f2e8;
          color: #2e7d5a;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        .btn-print {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 20px;
          border: 0;
          border-radius: 8px;
          background: #123b3d;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(18, 59, 61, 0.2);
        }

        .btn-print:hover {
          background: #1a4f52;
          transform: translateY(-1px);
        }

        .btn-close {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 14px;
          border: 1px solid #dce7df;
          border-radius: 8px;
          background: #ffffff;
          color: #59716e;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }

        .btn-close:hover {
          background: #f8faf9;
          color: #143b3d;
        }

        /* Document Container */
        .document-wrapper {
          max-width: 900px;
          margin: 0 auto;
          background: #ffffff;
          padding: 36px 40px;
          border: 1px solid #dce7df;
          border-radius: 12px;
          box-shadow: 0 6px 28px rgba(18, 59, 61, 0.06);
        }

        /* Header */
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #123b3d;
          padding-bottom: 20px;
          margin-bottom: 24px;
          gap: 16px;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          background: #e78368;
          color: #ffffff;
          border-radius: 10px;
          font-weight: 800;
          font-size: 20px;
          flex-shrink: 0;
        }

        .logo-text h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #123b3d;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .logo-text h2 span {
          color: #e78368;
        }

        .logo-text p {
          font-size: 11px;
          color: #6f7f7c;
          margin-top: 2px;
          font-weight: 500;
        }

        .meta-card {
          text-align: right;
          background: #f7faf8;
          border: 1px solid #e0ece4;
          padding: 10px 14px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .meta-card p {
          font-size: 11px;
          color: #6f7f7c;
          line-height: 1.5;
        }

        .meta-card strong {
          color: #123b3d;
          font-weight: 700;
        }

        /* Title Area */
        .title-banner {
          text-align: center;
          margin: 0 auto 24px auto;
          max-width: 650px;
          padding: 14px 20px;
          background: linear-gradient(180deg, #f7faf8 0%, #ffffff 100%);
          border: 1px solid #e2eee7;
          border-radius: 10px;
        }

        .title-banner h1 {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #123b3d;
          letter-spacing: -0.4px;
          margin-bottom: 4px;
        }

        .title-banner p {
          font-size: 12px;
          color: #59716e;
          line-height: 1.4;
        }

        /* Summary Boxes */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: #ffffff;
          border: 1px solid #dce7df;
          border-top: 3px solid #123b3d;
          border-radius: 8px;
          padding: 12px 14px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(18, 59, 61, 0.02);
        }

        .summary-card:nth-child(2) {
          border-top-color: #e78368;
        }

        .summary-card:nth-child(3) {
          border-top-color: #38a169;
        }

        .summary-card:nth-child(4) {
          border-top-color: #3182ce;
        }

        .summary-card span {
          display: block;
          font-size: 11px;
          color: #6f7f7c;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .summary-card strong {
          display: block;
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #123b3d;
        }

        /* Table */
        .table-container {
          width: 100%;
          overflow: hidden;
          border: 1px solid #dce7df;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          text-align: left;
        }

        thead tr {
          background: #123b3d;
          color: #ffffff;
        }

        th {
          padding: 10px 12px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 2px solid #0d2a2b;
        }

        td {
          padding: 9px 12px;
          border-bottom: 1px solid #e5ede8;
          color: #263835;
          vertical-align: middle;
        }

        tbody tr:last-child td {
          border-bottom: 0;
        }

        tbody tr:nth-child(even) {
          background-color: #fbfdfc;
        }

        tbody tr:hover {
          background-color: #f4f9f6;
        }

        .empty-row {
          text-align: center;
          padding: 30px 15px !important;
          color: #8faea1;
          font-size: 12px;
        }

        /* Footer */
        .report-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #dce7df;
          padding-top: 14px;
          margin-top: 20px;
          font-size: 10px;
          color: #8faea1;
        }

        .report-footer strong {
          color: #123b3d;
        }

        @media (max-width: 650px) {
          body {
            padding: 12px 8px;
          }
          .action-bar {
            padding: 10px 12px;
          }
          .action-bar-info span:not(.action-bar-badge) {
            display: none;
          }
          .document-wrapper {
            padding: 20px 16px;
          }
          .report-header {
            flex-direction: column;
          }
          .meta-card {
            text-align: left;
            width: 100%;
          }
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .summary-card {
            padding: 8px 10px;
          }
          .summary-card strong {
            font-size: 18px;
          }
        }

        /* Print Media Styles */
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }

          .action-bar {
            display: none !important;
          }

          .document-wrapper {
            max-width: 100% !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .summary-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }

          .table-container {
            border: 1px solid #b8ccc1;
          }

          th {
            background: #123b3d !important;
            color: #ffffff !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="action-bar no-print">
        <div class="action-bar-info">
          <span class="action-bar-badge">Visualização de Impressão</span>
          <span>Pronto para salvar ou imprimir em PDF</span>
        </div>
        <div class="action-buttons">
          <button class="btn-close" onclick="window.close()">Fechar</button>
          <button class="btn-print" onclick="window.print()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir
          </button>
        </div>
      </div>

      <div class="document-wrapper">
        <header class="report-header">
          <div class="logo-area">
            <div class="logo-mark">H</div>
            <div class="logo-text">
              <h2>help<span>clin</span>tec</h2>
              <p>Tecnologia Inteligente para Gestão e Manutenção Clínica</p>
            </div>
          </div>
          <div class="meta-card">
            <p>Emissão: <strong>${dateStr} às ${timeStr}</strong></p>
            <p>Registros: <strong>${data.length} item(ns)</strong></p>
            <p>Status: <strong>Documento Autenticado</strong></p>
          </div>
        </header>

        <section class="title-banner">
          <h1>${title}</h1>
          <p>${subtitle || 'Relatório analítico de acompanhamento e controle operacional.'}</p>
        </section>

        ${
          summary.length > 0
            ? `
          <div class="summary-grid">
            ${summary
              .map(
                (s) => `
              <div class="summary-card">
                <span>${s.label}</span>
                <strong>${s.value}</strong>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="table-container">
          <table>
            <thead>
              <tr>
                ${columns.map((c) => `<th>${c.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${
                data.length === 0
                  ? `<tr><td colspan="${columns.length}" class="empty-row">Nenhum registro encontrado para exibição.</td></tr>`
                  : data
                      .map(
                        (row) => `
                    <tr>
                      ${columns
                        .map((c) => {
                          const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor] ?? '—';
                          return `<td>${val}</td>`;
                        })
                        .join('')}
                    </tr>
                  `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <footer class="report-footer">
          <span><strong>HelpClinTec</strong> · Sistema Integrado de Gestão Clínica</span>
          <span>Documento Oficial Confidencial · Página 1 de 1</span>
        </footer>
      </div>

      <script>
        // Automatic focus for print-ready dialog
        window.onload = function() {
          window.focus();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}

