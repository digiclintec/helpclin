import { Edit, MonitorDot, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { createEquipment, deleteEquipment, getInventory, updateEquipment } from '../services/api.js';

function Inventory() {
  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [equipmentType, setEquipmentType] = useState('Computador');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await getInventory();
      setEquipments(data);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenForm(equipment = null) {
    if (equipment) {
      setEditingId(equipment.id);
      setName(equipment.name);
      setEquipmentType(equipment.equipment_type);
      setSerialNumber(equipment.serial_number || '');
      setLocation(equipment.location || '');
      setStatus(equipment.status);
    } else {
      setEditingId(null);
      setName('');
      setEquipmentType('Computador');
      setSerialNumber('');
      setLocation('');
      setStatus('Ativo');
    }
    setIsFormOpen(true);
    setFeedback('');
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');

    try {
      const payload = { name, equipmentType, serialNumber, location, status };
      if (editingId) {
        await updateEquipment(editingId, payload);
      } else {
        await createEquipment(payload);
      }
      await loadInventory();
      handleCloseForm();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja remover este equipamento?')) return;
    try {
      await deleteEquipment(id);
      await loadInventory();
    } catch (error) {
      setFeedback(error.message);
    }
  }

  const statusColors = {
    'Ativo': '#059669',
    'Manutenção': '#D97706',
    'Desativado': '#DC2626'
  };

  return (
    <div className="simple-page">
      <section className="simple-page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Gestão de T.I.</p>
          <h1>Inventário de Equipamentos</h1>
          <p>Cadastre e acompanhe os ativos de hardware da clínica.</p>
        </div>
        <button className="button button--primary" onClick={() => handleOpenForm()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Novo equipamento
        </button>
      </section>

      {feedback && !isFormOpen && <p className="ticket-feedback">{feedback}</p>}

      {isLoading ? (
        <div className="data-state">Carregando inventário...</div>
      ) : (
        <div style={{ marginTop: '2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {equipments.length === 0 ? (
            <div className="user-empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <MonitorDot size={28} style={{ margin: '0 auto' }} />
              <strong style={{ display: 'block', marginTop: '1rem' }}>Nenhum equipamento cadastrado</strong>
              <span>Clique em "Novo equipamento" para começar.</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '13px', color: '#6B7280', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Nome / Modelo</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>S/N</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Localização</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((eq) => (
                  <tr key={eq.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500, color: '#111827' }}>{eq.name}</td>
                    <td style={{ padding: '12px 20px', color: '#4B5563' }}>{eq.equipment_type}</td>
                    <td style={{ padding: '12px 20px', color: '#4B5563' }}>{eq.serial_number || '-'}</td>
                    <td style={{ padding: '12px 20px', color: '#4B5563' }}>{eq.location || '-'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ 
                        backgroundColor: `${statusColors[eq.status]}15`, 
                        color: statusColors[eq.status], 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '13px', 
                        fontWeight: 500 
                      }}>
                        {eq.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenForm(eq)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', marginRight: '12px' }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(eq.id)} title="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isFormOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#111827' }}>
              {editingId ? 'Editar Equipamento' : 'Novo Equipamento'}
            </h2>
            
            {feedback && <p className="ticket-feedback">{feedback}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Nome / Modelo</label>
                <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Notebook Dell Inspiron" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} required>
                    <option value="Computador">Computador / Notebook</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Impressora">Impressora</option>
                    <option value="Rede">Equipamento de Rede</option>
                    <option value="Acessório">Acessório</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)} required>
                    <option value="Ativo">Ativo</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Desativado">Desativado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Número de Série (S/N)</label>
                <input className="form-input" type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Opcional" />
              </div>

              <div>
                <label className="form-label">Localização</label>
                <input className="form-input" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Recepção, Consultório 01" />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" className="button button--quiet" onClick={handleCloseForm} disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="button button--primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
