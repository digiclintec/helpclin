import { AlertCircle, AlertTriangle, Calendar, CheckCircle2, Clock, DollarSign, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BILLING_MAX_DAYS, getDaysSinceCompletion, isBillingOverdue } from '../utils/billingUtils.js';

export default function BillingConfirmationModal({
  isOpen,
  order,
  onConfirm,
  onClose,
  isSubmitting = false
}) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen) {
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const orderNumber = String(order.order_number || order.service_order_number || order.ticket_number || '').padStart(5, '0');
  const clientName = order.patient_name || order.requester || 'Cliente / Clínica';
  const serviceDetail = order.service_type || order.company_sector || order.related_problem || 'Atendimento Técnico';
  const daysSince = getDaysSinceCompletion(order);
  const isOverdue = isBillingOverdue(order);

  function handleConfirmSubmit(e) {
    if (e) e.preventDefault();
    if (!paymentDate) return;
    onConfirm(paymentDate);
  }

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
                Informar Pagamento
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
          Confirme a <strong>data em que o pagamento foi realizado</strong> para esta ordem de serviço:
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
            <span style={{ color: isOverdue ? '#dc2626' : '#c2410c', fontWeight: 600 }}>
              {daysSince > 0
                ? isOverdue
                  ? `Concluída há ${daysSince} dias (⚠️ Ultrapassou o prazo de 30 dias!)`
                  : `Concluída há ${daysSince} dia${daysSince > 1 ? 's' : ''} (prazo de 30 dias)`
                : 'Concluída recentemente'}
            </span>
          </div>
        </div>

        {/* Payment Date Input Field */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="billing-payment-date"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--teal)',
              marginBottom: '6px'
            }}
          >
            <Calendar size={14} style={{ color: '#059669' }} />
            Data do Pagamento Realizado <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="billing-payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            disabled={isSubmitting}
            required
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: 'var(--ink)',
              backgroundColor: '#ffffff',
              outline: 'none',
              fontWeight: 600,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
            Esta data será registrada e enviada para o técnico confirmar o recebimento do valor.
          </small>
        </div>

        {/* Explanatory banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '9px',
            padding: '10px 12px',
            backgroundColor: isOverdue ? '#fef2f2' : '#fff7ed',
            border: `1px solid ${isOverdue ? '#fecaca' : '#fed7aa'}`,
            borderRadius: '8px',
            color: isOverdue ? '#991b1b' : '#c2410c',
            fontSize: '11px',
            lineHeight: 1.45,
            marginBottom: '20px'
          }}
        >
          {isOverdue ? (
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
          ) : (
            <Clock size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ea580c' }} />
          )}
          <span>
            Ao informar o pagamento, a ordem passará para <strong>Aguardando Confirmação do Técnico</strong>. O técnico conferirá o recebimento para finalizar o faturamento definitivo.
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
            onClick={handleConfirmSubmit}
            disabled={isSubmitting || !paymentDate}
            style={{
              backgroundColor: '#059669',
              borderColor: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? 'Registrando...' : 'Sim, Informar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
