import { Building2, Edit3, Filter, Laptop, MonitorDot, Plus, Search, ShieldCheck, Stethoscope, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import { createEquipment, deleteEquipment, getInventory, getStoredUser, updateEquipment } from '../services/api.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';
import { normalizeText } from '../utils/searchUtils.js';
import {
  VERTICALS,
  canUserAccessVertical,
  formatUserVerticalsSummary,
  getAssetVertical,
  getUserAllowedVerticals
} from '../utils/verticalUtils.js';

function Inventory() {
  const user = getStoredUser();
  const allowedVerticals = useMemo(() => getUserAllowedVerticals(user), [user]);

  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // If user only has 1 vertical contracted, default directly to that vertical
  const [verticalFilter, setVerticalFilter] = useState(() => {
    return allowedVerticals.length === 1 ? allowedVerticals[0] : 'all';
  });

  const [name, setName] = useState('');
  const [selectedVertical, setSelectedVertical] = useState(() => allowedVerticals[0] || 'clinical');
  const [equipmentType, setEquipmentType] = useState('Computador / Notebook');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  // Sync URL query params (?vertical=clinical | ti | predial)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vertParam = urlParams.get('vertical');
    if (vertParam && ['clinical', 'ti', 'predial'].includes(vertParam)) {
      if (allowedVerticals.includes(vertParam)) {
        setVerticalFilter(vertParam);
      } else if (allowedVerticals.length > 0) {
        setVerticalFilter(allowedVerticals[0]);
      }
    } else if (allowedVerticals.length === 1) {
      setVerticalFilter(allowedVerticals[0]);
    }
  }, [allowedVerticals]);

  // Escuta alteração de vertentes contratuais em tempo real
  useEffect(() => {
    function handleVerticalsUpdate() {
      loadInventory();
    }
    window.addEventListener('helpclin_verticals_changed', handleVerticalsUpdate);
    window.addEventListener('helpclin_settings_changed', handleVerticalsUpdate);
    return () => {
      window.removeEventListener('helpclin_verticals_changed', handleVerticalsUpdate);
      window.removeEventListener('helpclin_settings_changed', handleVerticalsUpdate);
    };
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
      const detected = getAssetVertical(equipment.equipment_type, equipment.vertical);
      setSelectedVertical(detected.code);
      setEquipmentType(equipment.equipment_type);
      setSerialNumber(equipment.serial_number || '');
      setLocation(equipment.location || '');
      setStatus(equipment.status);
    } else {
      setEditingId(null);
      setName('');
      const defaultVert = allowedVerticals[0] || 'clinical';
      setSelectedVertical(defaultVert);
      setEquipmentType(
        defaultVert === 'clinical'
          ? 'Monitor Multiparâmetro'
          : defaultVert === 'predial'
          ? 'Grupo Gerador'
          : 'Computador / Notebook'
      );
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
      const payload = {
        name,
        equipmentType,
        serialNumber,
        location,
        status,
        vertical: selectedVertical
      };
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

  // REQUISITO CRÍTICO: Cada cliente só pode visualizar o que está setado nas suas vertentes contratadas
  const accessibleEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      const vert = getAssetVertical(eq.equipment_type, eq.vertical);
      return canUserAccessVertical(user, vert.code);
    });
  }, [equipments, user]);

  const filteredEquipments = useMemo(() => {
    return accessibleEquipments.filter((eq) => {
      if (verticalFilter !== 'all') {
        const vert = getAssetVertical(eq.equipment_type, eq.vertical);
        if (vert.code !== verticalFilter) return false;
      }
      if (!search.trim()) return true;
      const str = normalizeText(
        `${eq.name} ${eq.equipment_type} ${eq.serial_number || ''} ${eq.location || ''} ${eq.status}`
      );
      const normSearch = normalizeText(search);
      const tokens = normSearch.split(/\s+/).filter(Boolean);
      return tokens.every((token) => str.includes(token));
    });
  }, [accessibleEquipments, verticalFilter, search]);

  const statusStyles = {
    Ativo: { color: '#059669', bg: '#e8f5e9' },
    Manutenção: { color: '#d97706', bg: '#fef3c7' },
    Desativado: { color: '#dc2626', bg: '#fee2e2' }
  };

  const exportColumns = [
    { header: 'Nome / Modelo', accessor: 'name' },
    { header: 'Vertente', accessor: (e) => getAssetVertical(e.equipment_type, e.vertical).name },
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
      title: 'Inventário de Ativos HelpClin',
      subtitle: `Listagem de ${filteredEquipments.length} equipamentos da vertente ${verticalFilter === 'all' ? 'geral contratada' : VERTICALS[verticalFilter]?.name || ''}`,
      columns: exportColumns,
      data: filteredEquipments,
      summary: [
        { label: 'Total de Ativos Visíveis', value: filteredEquipments.length },
        { label: 'Ativos', value: filteredEquipments.filter((e) => e.status === 'Ativo').length },
        { label: 'Em Manutenção', value: filteredEquipments.filter((e) => e.status === 'Manutenção').length },
        { label: 'Desativados', value: filteredEquipments.filter((e) => e.status === 'Desativado').length }
      ]
    });
  }

  const isClientRole = user?.role !== 'admin' && user?.role !== 'technician';
  const contractSummary = formatUserVerticalsSummary(user);

  return (
    <div className="simple-page">
      <section className="simple-page-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <p className="eyebrow" style={{ margin: 0 }}>Gestão de Ativos</p>
            {isClientRole && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#e3f2e8',
                  color: '#286756',
                  border: '1px solid #bce1ce'
                }}
              >
                <ShieldCheck size={12} />
                Seu Contrato: {contractSummary}
              </span>
            )}
          </div>
          <h1>Inventário de Equipamentos</h1>
          <p>
            {isClientRole
              ? `Acompanhe os equipamentos vinculados às vertentes contratadas (${contractSummary}).`
              : 'Cadastre e acompanhe os ativos de Engenharia Clínica, T.I. e Predial da clínica.'}
          </p>
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
              Equipamentos <span>{accessibleEquipments.length}</span>
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

        {/* Separador de Vertentes: Cada cliente só vê o que contratou (1, 2 ou todas) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            margin: '14px 0 18px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--line)'
          }}
        >
          {/* Aba "Todos os Ativos" só é exibida se o cliente tem mais de 1 vertente */}
          {allowedVerticals.length > 1 && (
            <button
              type="button"
              onClick={() => setVerticalFilter('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: verticalFilter === 'all' ? 700 : 500,
                border: verticalFilter === 'all' ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                background: verticalFilter === 'all' ? 'var(--teal)' : '#fff',
                color: verticalFilter === 'all' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Todos os Ativos Contratados</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: verticalFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#f0f3f1',
                  color: verticalFilter === 'all' ? '#fff' : 'var(--teal)',
                  fontWeight: 700
                }}
              >
                {accessibleEquipments.length}
              </span>
            </button>
          )}

          {/* Abas filtradas pelas vertentes contratadas do cliente */}
          {allowedVerticals.map((vertId) => {
            const v = VERTICALS[vertId];
            if (!v) return null;
            const Icon = v.icon;
            const isActive = verticalFilter === vertId;
            const count = accessibleEquipments.filter(
              (e) => getAssetVertical(e.equipment_type, e.vertical).code === vertId
            ).length;

            return (
              <button
                key={vertId}
                type="button"
                onClick={() => setVerticalFilter(vertId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  border: isActive ? `1.5px solid ${v.color}` : '1px solid var(--line)',
                  background: isActive ? v.color : '#fff',
                  color: isActive ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {Icon && <Icon size={13} />}
                <span>{v.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : v.bg,
                    color: isActive ? '#fff' : v.color,
                    fontWeight: 700
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="data-state">Carregando inventário...</div>
        ) : filteredEquipments.length === 0 ? (
          <div className="user-empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <MonitorDot size={32} style={{ margin: '0 auto', color: '#67a486' }} />
            <strong style={{ display: 'block', marginTop: '1rem' }}>
              {search || verticalFilter !== 'all' ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
            </strong>
            <span>{search || verticalFilter !== 'all' ? 'Tente ajustar os filtros ou pesquisar com outro termo.' : 'Clique em "Novo equipamento" para registrar o primeiro.'}</span>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th>Nome / Modelo</th>
                  <th>Vertente</th>
                  <th>Tipo Específico</th>
                  <th>Nº de Série</th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map((eq) => {
                  const style = statusStyles[eq.status] || { color: '#4B5563', bg: '#F3F4F6' };
                  const vert = getAssetVertical(eq.equipment_type);
                  const VertIcon = vert.icon;
                  return (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 600, color: 'var(--teal)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '8px', background: vert.bg, color: vert.color }}>
                            <VertIcon size={16} />
                          </div>
                          <span>{eq.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: vert.bg,
                          color: vert.color
                        }}>
                          <VertIcon size={12} />
                          {vert.name}
                        </span>
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
                            <Edit3 size={14} />
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
                    Vertente do Ativo <span className="required">*</span>
                  </label>
                  <select
                    value={selectedVertical}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedVertical(v);
                      if (v === 'clinical') setEquipmentType('Monitor Multiparâmetro');
                      else if (v === 'predial') setEquipmentType('Grupo Gerador');
                      else setEquipmentType('Computador / Notebook');
                    }}
                    required
                  >
                    {allowedVerticals.includes('clinical') && (
                      <option value="clinical">🩺 Engenharia Clínica</option>
                    )}
                    {allowedVerticals.includes('ti') && (
                      <option value="ti">💻 T.I. em Saúde</option>
                    )}
                    {allowedVerticals.includes('predial') && (
                      <option value="predial">🏢 Engenharia Predial</option>
                    )}
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

              <div className="inventory-field">
                <label>
                  Tipo Específico <span className="required">*</span>
                </label>
                <select
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  required
                >
                  {selectedVertical === 'ti' && (
                    <optgroup label="Tecnologia da Informação (T.I.)">
                      <option value="Computador / Notebook">Computador / Notebook</option>
                      <option value="Monitor de Vídeo">Monitor de Vídeo</option>
                      <option value="Impressora">Impressora (Térmica / Convencional)</option>
                      <option value="Equipamento de Rede">Equipamento de Rede (Switch / AP / Roteador)</option>
                      <option value="Servidor / Storage">Servidor / Storage</option>
                      <option value="Acessório de T.I.">Acessório de T.I.</option>
                    </optgroup>
                  )}
                  {selectedVertical === 'clinical' && (
                    <optgroup label="Engenharia Clínica (Equipamentos Médicos)">
                      <option value="Monitor Multiparâmetro">Monitor Multiparâmetro / Sinais Vitais</option>
                      <option value="Ventilador Pulmonar">Ventilador Pulmonar / Respirador</option>
                      <option value="Desfibrilador / Cardioversor">Desfibrilador / Cardioversor</option>
                      <option value="Bomba de Infusão">Bomba de Infusão / Seringa</option>
                      <option value="Eletrocardiógrafo">Eletrocardiógrafo (ECG)</option>
                      <option value="Autoclave / Esterilização">Autoclave / Esterilização</option>
                      <option value="Bisturi Elétrico">Bisturi Elétrico / Eletrocirúrgico</option>
                      <option value="Equipamento de Diagnóstico">Equipamento de Diagnóstico / Imagem</option>
                    </optgroup>
                  )}
                  {selectedVertical === 'predial' && (
                    <optgroup label="Engenharia Predial & Facilities Hospitalar">
                      <option value="Grupo Gerador">Grupo Gerador de Emergência</option>
                      <option value="No-Break Industrial / UPS">No-Break Industrial / UPS</option>
                      <option value="Central de Gases Medicinais">Central de Gases Medicinais (O2, Ar, Vácuo)</option>
                      <option value="Sistema de Climatização / PMOC">Sistema de Climatização / Chiller (PMOC)</option>
                      <option value="Subestação / Elétrica">Subestação / Quadro de Distribuição</option>
                      <option value="Bomba Hidráulica">Bomba Hidráulica / Pressurização</option>
                      <option value="Sistema de Incêndio / AVCB">Sistema de Incêndio / AVCB</option>
                      <option value="Elevador Hospitalar">Elevador Hospitalar / Monta-cargas</option>
                    </optgroup>
                  )}
                  <option value="Outro">Outro Ativo</option>
                </select>
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
