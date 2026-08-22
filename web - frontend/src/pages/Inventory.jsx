import { Edit, Laptop, MonitorDot, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import { createEquipment, deleteEquipment, getInventory, updateEquipment } from '../services/api.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';

function Inventory() {
  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');

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
    setFeedback('');
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

  const filteredEquipments = equipments.filter((eq) =>
    `${eq.name} ${eq.equipment_type} ${eq.serial_number || ''} ${eq.location || ''} ${eq.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const statusStyles = {
    'Ativo': { color: '#059669', bg: '#e8f5e9' },
    'Manutenção': { color: '#d97706', bg: '#fef3c7' },
    'Desativado': { color: '#dc2626', bg: '#fee2e2' }
  };

  const exportColumns = [
    { header: 'Nome / Modelo', accessor: 'name' },
    { header: 'Tipo', accessor: 'equipment_type' },
    { header: 'Número de Série (S/N)', accessor: (e) => e.serial_number || '—' },
    { header: 'Localização', accessor: (e) => e.location || '—' },
    { header: 'Status', accessor: 'status' }
  ];

  function handleExportXls() {
    exportToXls({
      title: 'Inventário de Equipamentos',
      filename: 'Inventario_Equipamentos_HelpClin',
      columns: exportColumns,
      data: filteredEquipments
    });
  }

  function handleExportPdf() {
    exportToPdf({
      title: 'Inventário de Ativos de Hardware',
      subtitle: `Listagem de ${filteredEquipments.length} equipamentos cadastrados`,
      columns: exportColumns,
      data: filteredEquipments,
      summary: [
        { label: 'Total de Ativos', value: filteredEquipments.length },
        { label: 'Ativos', value: filteredEquipments.filter((e) => e.status === 'Ativo').length },
        { label: 'Em Manutenção', value: filteredEquipments.filter((e) => e.status === 'Manutenção').length },
        { label: 'Desativados', value: filteredEquipments.filter((e) => e.status === 'Desativado').length }
      ]
    });
  }

  return (
    <div className="simple-page">
      <section className="simple-page-heading">
        <div>
          <p className="eyebrow">Gestão de T.I.</p>
          <h1>Inventário de Equipamentos</h1>
          <p>Cadastre e acompanhe os ativos de hardware da clínica.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ExportDropdown onExportXls={handleExportXls} onExportPdf={handleExportPdf} />
          <button
            className="primary-button"
            onClick={() => handleOpenForm()}
            type="button"
          >
            <Plus size={16} /> Novo equipamento
          </button>
        </div>
      </section>

      {feedback && !isFormOpen && <p className="ticket-feedback">{feedback}</p>}

      <section className="ticket-list-card">
        <div className="list-toolbar">
          <div>
            <p className="eyebrow">Ativos Cadastrados</p>
            <h2>
              Equipamentos <span>{equipments.length}</span>
            </h2>
          </div>
          <div className="search-control">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar equipamento..."
              aria-label="Buscar equipamento"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="data-state">Carregando inventário...</div>
        ) : filteredEquipments.length === 0 ? (
          <div className="user-empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <MonitorDot size={32} style={{ margin: '0 auto', color: '#67a486' }} />
            <strong style={{ display: 'block', marginTop: '1rem' }}>
              {search ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
            </strong>
            <span>{search ? 'Tente pesquisar com outro termo.' : 'Clique em "Novo equipamento" para registrar o primeiro.'}</span>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th>Nome / Modelo</th>
                  <th>Tipo</th>
                  <th>Nº de Série</th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map((eq) => {
                  const style = statusStyles[eq.status] || { color: '#4B5563', bg: '#F3F4F6' };
                  return (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 600, color: 'var(--teal)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#e2eff1', color: '#4d8796' }}>
                            <Laptop size={16} />
                          </div>
                          <span>{eq.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{eq.equipment_type}</td>
                      <td style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>
                        {eq.serial_number || '—'}
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        {eq.location || '—'}
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-block'
                          }}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="inventory-action-btn"
                            onClick={() => handleOpenForm(eq)}
                            title="Editar equipamento"
                            aria-label="Editar equipamento"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="inventory-action-btn inventory-action-btn--delete"
                            onClick={() => handleDelete(eq.id)}
                            title="Remover equipamento"
                            aria-label="Remover equipamento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="inventory-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleCloseForm(); }}>
          <div className="inventory-modal">
            <div className="inventory-modal-header">
              <div>
                <p className="eyebrow">Gestão de Ativos</p>
                <h2>{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              </div>
              <button
                type="button"
                className="inventory-modal-close"
                onClick={handleCloseForm}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {feedback && <p className="ticket-feedback" style={{ marginBottom: '16px' }}>{feedback}</p>}

            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="inventory-field">
                <label>
                  Nome / Modelo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Notebook Dell Inspiron 15"
                  autoFocus
                />
              </div>

              <div className="inventory-grid-2">
                <div className="inventory-field">
                  <label>
                    Tipo <span className="required">*</span>
                  </label>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                    required
                  >
                    <option value="Computador">Computador / Notebook</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Impressora">Impressora</option>
                    <option value="Rede">Equipamento de Rede</option>
                    <option value="Acessório">Acessório</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="inventory-field">
                  <label>
                    Status <span className="required">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Desativado">Desativado</option>
                  </select>
                </div>
              </div>

              <div className="inventory-grid-2">
                <div className="inventory-field">
                  <label>Número de Série (S/N)</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Ex: SN-94820194"
                  />
                </div>
                <div className="inventory-field">
                  <label>Localização</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Consultório 02, Recepção"
                  />
                </div>
              </div>

              <div className="inventory-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
