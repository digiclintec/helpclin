import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function ExportDropdown({ onExportXls, onExportPdf, label = 'Exportar Relatório' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute best positioning when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      // If there's less than 240px to the right of the button, align right, otherwise align left
      const spaceOnRight = screenWidth - rect.left;
      if (spaceOnRight < 240 && rect.right > 240) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [isOpen]);

  return (
    <div className="export-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="export-dropdown-trigger secondary-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <Download size={16} className="export-dropdown-icon" />
        <span>{label}</span>
        <ChevronDown size={14} className={`export-dropdown-chevron ${isOpen ? 'export-dropdown-chevron--open' : ''}`} />
      </button>

      {isOpen && (
        <div className={`export-dropdown-panel ${alignRight ? 'export-dropdown-panel--right' : 'export-dropdown-panel--left'}`}>
          <button
            type="button"
            className="export-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onExportXls();
            }}
          >
            <div className="export-dropdown-item-icon export-dropdown-item-icon--excel">
              <FileSpreadsheet size={16} />
            </div>
            <div className="export-dropdown-item-content">
              <strong>Planilha Excel</strong>
              <small>Formato .XLS compatível</small>
            </div>
          </button>

          <button
            type="button"
            className="export-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onExportPdf();
            }}
          >
            <div className="export-dropdown-item-icon export-dropdown-item-icon--pdf">
              <FileText size={16} />
            </div>
            <div className="export-dropdown-item-content">
              <strong>Documento PDF</strong>
              <small>Visualizar / Imprimir PDF</small>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportDropdown;

