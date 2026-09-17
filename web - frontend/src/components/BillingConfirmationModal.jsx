import { AlertCircle, CheckCircle2, DollarSign, X } from 'lucide-react';
import React from 'react';
import { getDaysSinceCompletion } from '../utils/billingUtils.js';

export default function BillingConfirmationModal({
  isOpen,
  order,
  onConfirm,
  onClose,
  isSubmitting = false
}) {
  if (!isOpen || !order) return null;

  const orderNumber = String(order.order_number || order.service_order_number || order.ticket_number || '').padStart(5, '0');
  const clientName = order.patient_name || order.requester || 'Cliente / Clínica';
  const serviceDetail = order.service_type || order.company_sector || order.related_problem || 'Atendimento Técnico';
  const daysSince = getDaysSinceCompletion(order);

  return (
    <div className="dash-modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="dash-modal"
        style={{ width: 'min(100%, 480px)', padding: '24px 26px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-modal-header" style={{ borderBottom: '1px solid #eef2f0', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <DollarSign size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', color: 'var(--teal)', margin: 0, fontWeight: 700 }}>
                Confirmar Faturamento
              </h2>
              <span style={{ fontSize: '12px', color: '#667873' }}>
                Ordem de Serviço #{orderNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="dash-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#3d4f4a', lineHeight: 1.5, margin: '0 0 16px' }}>
          Você tem certeza de que deseja informar esta ordem de serviço como <strong>faturada / paga</strong>?
        </p>

        {/* Info card */}
        <div
          style={{
            backgroundColor: '#f8faf9',
            border: '1px solid #e2e8e5',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'grid',
            gap: '8px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#687b76' }}>Identificação:</span>
            <strong style={{ color: 'var(--teal)' }}>OS-{orderNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#687b76' }}>Cliente / Solicitante:</span>
            <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{clientName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#687b76' }}>Serviço / Setor:</span>
            <span style={{ color: '#2d3b38' }}>{serviceDetail}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#687b76' }}>Tempo de conclusão:</span>
            <span style={{ color: '#b45309', fontWeight: 600 }}>
              {daysSince > 0 ? `Concluída há ${daysSince} dia${daysSince > 1 ? 's' : ''}` : 'Concluída recentemente'}
            </span>
          </div>
        </div>

        {/* Explanatory banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '9px',
            padding: '10px 12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            color: '#92400e',
            fontSize: '11px',
            lineHeight: 1.45,
            marginBottom: '20px'
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Ao confirmar, o status será atualizado para <strong>Faturada</strong>, registrando a quitação do serviço e liberando o acesso técnico à ordem.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="dash-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{
              backgroundColor: '#059669',
              borderColor: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? 'Confirmando...' : 'Sim, Confirmar como Faturada'}
          </button>
        </div>
      </div>
    </div>
  );
}
