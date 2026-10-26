// Gerenciador de Licenças e Sistemas de Revenda por Usuário / Cliente
const STORAGE_KEY = 'helpclin_reseller_licenses_v1';

export function getAllLicenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Falha ao ler licenças:', err);
    return {};
  }
}

export function getUserLicenses(userId) {
  const all = getAllLicenses();
  // Por padrão, se não configurado explicitamente, clientes têm HelpClin e Helpchat ativos
  return all[userId] || {
    helpchat: true,
    helpclin: true,
    company: '',
    phone: '',
    plan: 'Combo Pro',
    expiresAt: ''
  };
}

export function saveUserLicenses(userId, licenseData) {
  const all = getAllLicenses();
  all[userId] = {
    ...getUserLicenses(userId),
    ...licenseData,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[userId];
}

export function formatWhatsAppCredentials({ name, email, phone, password, licenses }) {
  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal` : 'https://helpclintec.com.br/portal';
  
  const systemsList = [];
  if (licenses?.helpchat !== false) {
    systemsList.push('✅ *Helpchat (Central WhatsApp):* http://chat.helpclintec.com.br/');
  }
  if (licenses?.helpclin !== false) {
    systemsList.push('✅ *HelpClin OS (Ordens de Serviço & Laudos):* ' + portalUrl);
  }

  const message = `*Olá, ${name || 'Cliente'}! Seja bem-vindo à nossa plataforma.* 🚀

Seguem os seus dados de acesso ao seu *Portal de Sistemas*:

🔗 *Link do Portal:* ${portalUrl}
👤 *Login:* ${email}
${password ? `🔑 *Senha provisória:* ${password}\n` : ''}
*Sistemas Liberados para sua conta:*
${systemsList.join('\n')}

💡 _Dica: Você pode acessar diretamente pelo celular ou computador._
Qualquer dúvida, nossa equipe de suporte está à disposição!`;

  return message;
}
