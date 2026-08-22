import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Headset,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getPendingUsers,
  getServiceOrders,
  getStoredUser,
  getSupportTickets
} from '../services/api.js';

function timeAgo(dateString) {
  if (!dateString) return 'recentemente';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Há ${diffInDays}d`;
}

function NotificationCenter() {
  const user = getStoredUser();
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('helpclin_read_notifs') || '[]');
    } catch {
      return [];
    }
  });
  const containerRef = useRef(null);

  useEffect(() => {
    loadNotificationsData();
    const interval = setInterval(loadNotificationsData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function loadNotificationsData() {
    try {
      const [ticketsRes, ordersRes] = await Promise.allSettled([
        getSupportTickets(),
        getServiceOrders()
      ]);

      if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value || []);

      if (user?.role === 'admin' && user?.id) {
        try {
          const pUsers = await getPendingUsers(user.id);
          setPendingUsers(pUsers || []);
        } catch {
          // ignore if non-admin or failed
        }
      }
    } catch (err) {
      console.error('Falha ao carregar notificações:', err);
    }
  }

  // Build notifications list
  const notifications = useMemo(() => {
    const list = [];

    // 1. Pending user registrations (Admin only)
    if (user?.role === 'admin') {
      pendingUsers.forEach((pu) => {
        list.push({
          id: `user-pending-${pu.id}`,
          type: 'user',
          title: 'Novo usuário aguardando aprovação',
          desc: `${pu.name} (${pu.email})`,
          time: pu.created_at,
          link: '/usuarios',
          icon: UserCheck,
          color: '#3b82f6',
          isUrgent: true
        });
      });
    }

    // 2. Urgent / High priority Tickets
    tickets.forEach((t) => {
      const p = (t.priority || '').toLowerCase();
      const isUrgent = p === 'urgent' || p === 'urgente' || p === 'high' || p === 'alta';
      const isOpen = t.status === 'open' && !t.assigned_to_name;

      if (t.status !== 'resolved' && (isUrgent || isOpen)) {
        list.push({
          id: `ticket-notif-${t.id}`,
          type: 'ticket',
          title: isUrgent ? `Chamado Prioritário #${t.id}` : `Chamado aguardando atendimento #${t.id}`,
          desc: `${t.related_problem || t.title || 'Solicitação'} • ${t.company_sector || 'Clínica'}`,
          time: t.created_at,
          link: '/chamados',
          icon: Headset,
          color: isUrgent ? '#ef4444' : '#e78368',
          isUrgent
        });
      }
    });

    // 3. Urgent / Open Service Orders
    orders.forEach((o) => {
      const p = (o.priority || '').toLowerCase();
      const isUrgent = p === 'urgent' || p === 'urgente' || p === 'high' || p === 'alta';

      if (o.status === 'open' || (o.status === 'in_progress' && isUrgent)) {
        list.push({
          id: `order-notif-${o.id}`,
          type: 'order',
          title: `OS-${String(o.order_number || o.id).padStart(5, '0')} ${isUrgent ? 'Urgente' : 'Aberta'}`,
          desc: `${o.patient_name || 'Setor'} • ${o.service_type || 'Manutenção'}`,
          time: o.created_at,
          link: '/ordens',
          icon: FileText,
          color: isUrgent ? '#ef4444' : '#316c79',
          isUrgent
        });
      }
    });

    return list.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  }, [tickets, orders, pendingUsers, user]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  function markAllAsRead() {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('helpclin_read_notifs', JSON.stringify(allIds));
    } catch {
      // ignore
    }
  }

  function handleNotificationClick(notif) {
    if (!readIds.includes(notif.id)) {
      const nextRead = [...readIds, notif.id];
      setReadIds(nextRead);
      try {
        localStorage.setItem('helpclin_read_notifs', JSON.stringify(nextRead));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
    if (notif.link) {
      window.location.href = notif.link;
    }
  }

  return (
    <div className="notification-container" ref={containerRef}>
      <button
        type="button"
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir notificações"
        title="Notificações do sistema"
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>
              <Bell size={16} /> Notificações
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>
                  ({unreadCount} nova{unreadCount > 1 ? 's' : ''})
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-clear-btn"
                onClick={markAllAsRead}
              >
                Marcar como lidas
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <CheckCircle2 size={28} style={{ color: '#67a486' }} />
                <strong>Tudo em dia!</strong>
                <span>Nenhuma notificação ou pendência no momento.</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const IconComponent = notif.icon;
                const isUnread = !readIds.includes(notif.id);

                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${isUnread ? 'notification-item--unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="notification-icon-wrap"
                      style={{
                        backgroundColor: `${notif.color}15`,
                        color: notif.color
                      }}
                    >
                      <IconComponent size={16} />
                    </div>

                    <div className="notification-content">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <strong className="notification-title">{notif.title}</strong>
                        {isUnread && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--coral)', flexShrink: 0 }} />
                        )}
                      </div>
                      <p className="notification-desc">{notif.desc}</p>
                      <time className="notification-time">{timeAgo(notif.time)}</time>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="notification-footer">
            <a href="/dashboard" onClick={() => setIsOpen(false)}>
              Ir para o Painel Geral <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
