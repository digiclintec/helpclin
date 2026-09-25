import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { loginUser } from '../services/api.js';

function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setFeedback(null);
  }

  function handleDemoLogin() {
    const demoUser = {
      id: 1,
      name: 'Administrador Demo',
      email: 'admin@helpclintec.com.br',
      role: 'admin'
    };
    localStorage.setItem('helpclin_user', JSON.stringify(demoUser));
    window.location.href = '/dashboard';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const user = await loginUser(form);
      localStorage.setItem('helpclin_user', JSON.stringify(user));
      window.location.href = '/dashboard';
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-aside">
        <a className="logo logo--login" href="/"><span className="logo-mark"><Stethoscope size={20} /></span><span>help<span>clin</span>tec</span></a>
        <div className="login-aside-copy"><p className="eyebrow eyebrow--light">Área administrativa</p><h1>Gestão inteligente para quem <em>cuida de verdade.</em></h1><p>Tenha sua clínica inteira sob controle, com segurança e simplicidade.</p></div>
        <span className="login-aside-footer">Tecnologia para cuidar melhor.</span>
      </div>
      <div className="admin-login-content">
        <a className="back-link" href="/"><ArrowLeft size={16} /> Voltar para o site</a>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-icon"><LockKeyhole size={20} /></div>
          <p className="eyebrow">Acesso seguro</p>
          <h2 id="login-title">Bem-vindo de volta</h2>
          <p className="login-description">Entre na sua conta para acessar o painel de Chamados.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail profissional</label>
            <input id="email" name="email" type="email" placeholder="voce@suaclinica.com.br" autoComplete="email" value={form.email} onChange={updateField} required />
            <div className="password-label"><label htmlFor="password">Senha</label><a href="mailto:suporte@helpclintec.com.br?subject=Recuperação de senha">Esqueci minha senha</a></div>
            <div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Digite sua senha" autoComplete="current-password" value={form.password} onChange={updateField} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <button className="login-submit" type="submit" disabled={isLoading}>{isLoading ? 'Entrando...' : 'Entrar no painel'} {isLoading ? <LockKeyhole size={16} /> : <ArrowRight size={16} />}</button>
          </form>

          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px dashed #dce7df', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#5e726e' }}>
              Testando localmente ou banco de dados offline?
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid #194e50',
                background: '#f1f8f5',
                color: '#123b3d',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={16} color="#e78368" />
              <span>Entrar no Modo Demonstração (Sem Banco)</span>
            </button>
          </div>

          {feedback && (
            <div style={{ marginTop: '16px' }}>
              <p className="form-feedback form-feedback--error"><LockKeyhole size={15} /> {feedback}</p>
              <p style={{ fontSize: '11px', color: '#6f7f7c', marginTop: '6px', textAlign: 'center' }}>
                Dica: O banco PostgreSQL local pode estar desligado. Use o botão de <strong>Modo Demonstração</strong> acima para testar todos os recursos!
              </p>
            </div>
          )}
          <p className="login-help">Ainda não tem uma conta? <a href="/registro">Crie seu acesso</a></p>
        </section>
        <p className="login-security"><LockKeyhole size={14} /> Seus dados estão protegidos com segurança de ponta a ponta.</p>
      </div>
    </main>
  );
}

export default AdminLogin;
