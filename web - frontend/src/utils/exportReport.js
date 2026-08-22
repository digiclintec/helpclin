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
    alert('Por favor, permita popups para gerar a visualização e download em PDF.');
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório - ${title} | HelpClin</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #143b3d; background: #fff; padding: 15px; }
        
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #123b3d; padding-bottom: 12px; margin-bottom: 16px; }
        .logo-area h1 { font-size: 22px; color: #123b3d; font-weight: 800; letter-spacing: -0.5px; }
        .logo-area span { color: #e78368; }
        .logo-area p { font-size: 13px; color: #6f7f7c; margin-top: 2px; }
        .meta-area { text-align: right; font-size: 11px; color: #6f7f7c; }
        .meta-area strong { color: #123b3d; }

        .summary-boxes { display: flex; gap: 12px; margin-bottom: 18px; }
        .summary-box { flex: 1; border: 1px solid #dce7df; border-radius: 8px; padding: 10px 14px; background: #f9fbf9; }
        .summary-box span { font-size: 11px; color: #6f7f7c; display: block; }
        .summary-box strong { font-size: 18px; color: #123b3d; font-weight: 800; }

        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
        th { background: #123b3d; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #123b3d; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5ece7; vertical-align: top; color: #2d3f3c; }
        tr:nth-child(even) { background-color: #fbfdfc; }

        .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #dce7df; padding-top: 10px; font-size: 10px; color: #8e9e99; margin-top: 20px; }

        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="logo-area">
          <h1>HelpClin<span>Tec</span> · ${title}</h1>
          <p>${subtitle || 'Tecnologia inteligente para gestão e manutenção clínica.'}</p>
        </div>
        <div class="meta-area">
          <p>Data de emissão: <strong>${dateStr} às ${timeStr}</strong></p>
          <p>Total de registros: <strong>${data.length}</strong></p>
        </div>
      </div>

      ${
        summary.length > 0
          ? `
        <div class="summary-boxes">
          ${summary
            .map(
              (s) => `
            <div class="summary-box">
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

      <table>
        <thead>
          <tr>
            ${columns.map((c) => `<th>${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${
            data.length === 0
              ? `<tr><td colspan="${columns.length}" style="text-align: center; padding: 20px;">Nenhum registro encontrado.</td></tr>`
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

      <div class="footer">
        <span>HelpClin - Sistema Integrado de Gestão Hospitalar & Atendimento</span>
        <span>Página 1 de 1</span>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}
