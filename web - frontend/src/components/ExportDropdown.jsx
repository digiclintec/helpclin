import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function ExportDropdown({ onExportXls, onExportPdf, label = 'Exportar Relatório' }) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        type="button"
        className="secondary-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '44px',
          padding: '0 16px',
          background: '#ffffff',
          borderColor: 'var(--line)',
          color: 'var(--teal)',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '10px'
        }}
      >
        <Download size={16} color="var(--coral)" />
        <span>{label}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 150,
            width: '230px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            boxShadow: '0 14px 30px rgba(18, 59, 61, 0.15)',
            padding: '6px',
            animation: 'modalFadeIn 0.15s ease'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportXls();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              border: 0,
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--teal)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8f5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#e8f5e9',
                color: '#2e7d32'
              }}
            >
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '13px' }}>Planilha Excel</strong>
              <small style={{ color: '#6f7f7c', fontSize: '11px' }}>Formato .XLS compatível</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportPdf();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              border: 0,
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--teal)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              marginTop: '4px',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbe4dd')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#fbe4dd',
                color: 'var(--coral)'
              }}
            >
              <FileText size={16} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '13px' }}>Documento PDF</strong>
              <small style={{ color: '#6f7f7c', fontSize: '11px' }}>Impressão / Salvar em PDF</small>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportDropdown;
