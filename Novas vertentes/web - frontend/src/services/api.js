const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api';

export async function getHealth() {
  const response = await fetch(`${apiUrl}/health`);
  if (!response.ok) throw new Error('Não foi possível conectar à API');
  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível criar a conta');
  return data.user;
}

export async function loginUser(credentials) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível realizar o login');
  return data.user;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('helpclin_user'));
  } catch {
    return null;
  }
}

export async function createServiceOrder(orderData) {
  const response = await fetch(`${apiUrl}/service-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível criar a ordem');
  return data.order;
}

export async function getServiceOrders() {
  const response = await fetch(`${apiUrl}/service-orders`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível carregar as ordens');
  return data.orders;
}

export async function updateServiceOrder(orderId, orderData) {
  const response = await fetch(`${apiUrl}/service-orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível editar a ordem');
  return data.order;
}

export async function informServiceOrderPayment(orderId, paymentDate) {
  const response = await fetch(`${apiUrl}/service-orders/${orderId}/inform-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentDate })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível informar o pagamento');
  return data.order;
}

export async function confirmPaymentReceipt(orderId, technicianId) {
  const response = await fetch(`${apiUrl}/service-orders/${orderId}/confirm-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ technicianId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível confirmar o recebimento');
  return data.order;
}

export async function rejectPaymentReceipt(orderId, technicianId, reason) {
  const response = await fetch(`${apiUrl}/service-orders/${orderId}/reject-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ technicianId, reason })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível recusar o recebimento');
  return data.order;
}

export async function deleteServiceOrder(orderId, deleteTicket = false) {
  const query = deleteTicket ? '?deleteTicket=true' : '';
  const response = await fetch(`${apiUrl}/service-orders/${orderId}${query}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível excluir a ordem');
  return data;
}

export async function createSupportTicket(ticketData) {
  const response = await fetch(`${apiUrl}/support-tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível abrir o chamado');
  return data.ticket;
}

export async function getSupportTickets() {
  const response = await fetch(`${apiUrl}/support-tickets`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível carregar os chamados');
  return data.tickets;
}

export async function assignSupportTicket(ticketId, userId) {
  const response = await fetch(`${apiUrl}/support-tickets/${ticketId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível assumir o chamado');
  return data.ticket;
}

export async function rejectSupportTicket(ticketId, reason) {
  const response = await fetch(`${apiUrl}/support-tickets/${ticketId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível recusar o chamado');
  return data;
}

export async function deleteSupportTicket(ticketId) {
  const response = await fetch(`${apiUrl}/support-tickets/${ticketId}`, {
    method: 'DELETE'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível excluir o chamado');
  return data;
}

export async function getReportSummary() {
  const response = await fetch(`${apiUrl}/reports/summary`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível carregar os relatórios');
  return data;
}

export async function getAllUsers(adminId) {
  const response = await fetch(`${apiUrl}/admin/users?adminId=${encodeURIComponent(adminId)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível carregar os usuários');
  return data.users;
}

export async function getPendingUsers(adminId) {
  const response = await fetch(`${apiUrl}/admin/users/pending?adminId=${encodeURIComponent(adminId)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível carregar os usuários');
  return data.users;
}

export async function approveUser(userId, adminId) {
  const response = await fetch(`${apiUrl}/admin/users/${userId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível aprovar o usuário');
  return data.user;
}

export async function updateUser(userId, userData) {
  const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível atualizar o usuário');
  return data.user;
}

export async function deleteUser(userId, adminId) {
  const response = await fetch(`${apiUrl}/admin/users/${userId}?adminId=${encodeURIComponent(adminId)}`, {
    method: 'DELETE'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível remover o usuário');
  return data;
}

export async function getInventory() {
  const response = await fetch(`${apiUrl}/inventory`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível carregar os equipamentos');
  return data.equipments;
}

export async function createEquipment(equipmentData) {
  const response = await fetch(`${apiUrl}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipmentData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível cadastrar o equipamento');
  return data.equipment;
}

export async function updateEquipment(id, equipmentData) {
  const response = await fetch(`${apiUrl}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipmentData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Não foi possível editar o equipamento');
  return data.equipment;
}

export async function deleteEquipment(id) {
  const response = await fetch(`${apiUrl}/inventory/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message ?? 'Não foi possível remover o equipamento');
  }
}
