import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Stethoscope } from 'lucide-react';
import { useState } from 'react';

import { registerUser } from '../services/api.js';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setFeedback(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      await registerUser(form);
      setFeedback({ type: 'success', message: 'Cadastro realizado. Aguarde a aprovação de um administrador para acessar sua conta.' });
      setForm({ name: '', email: '', password: '' });
      window.setTimeout(() => { window.location.href = '/admin'; }, 1400);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-login-page register-page">
      <div className="admin-login-aside"><a className="logo logo--login" href="/"><span className="logo-mark"><Stethoscope size={20} /></span><span>help<span>clin</span>tec</span></a><div className="login-aside-copy"><p className="eyebrow eyebrow--light">Comece agora</p><h1>Uma rotina mais leve começa com <em>um bom primeiro passo.</em></h1><p>Crie seu acesso e descubra como a tecnologia pode trabalhar a favor da sua clínica.</p></div><span className="login-aside-footer">Tecnologia para cuidar melhor.</span></div>
      <div className="admin-login-content"><a className="back-link" href="/admin"><ArrowLeft size={16} /> Voltar para o login</a><section className="login-card" aria-labelledby="register-title"><div className="login-card-icon"><LockKeyhole size={20} /></div><p className="eyebrow">Novo acesso</p><h2 id="register-title">Crie sua conta</h2><p className="login-description">Preencha seus dados para acessar a área administrativa.</p><form onSubmit={handleSubmit}><label htmlFor="name">Nome completo</label><input id="name" name="name" type="text" placeholder="Dr(a). Seu nome" autoComplete="name" value={form.name} onChange={updateField} required /><label htmlFor="register-email">E-mail profissional</label><input id="register-email" name="email" type="email" placeholder="voce@suaclinica.com.br" autoComplete="email" value={form.email} onChange={updateField} required /><label htmlFor="register-password">Senha</label><div className="password-field"><input id="register-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" minLength="8" value={form.password} onChange={updateField} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><button className="login-submit" type="submit" disabled={isLoading}>{isLoading ? 'Criando conta...' : 'Criar minha conta'} {isLoading ? <LockKeyhole size={16} /> : <ArrowRight size={16} />}</button></form>{feedback && <p className={`form-feedback form-feedback--${feedback.type}`}><Check size={15} /> {feedback.message}</p>}<p className="login-help">Já tem uma conta? <a href="/admin">Entrar no painel</a></p></section><p className="login-security"><LockKeyhole size={14} /> Seus dados estão protegidos com segurança de ponta a ponta.</p></div>
    </main>
  );
}

export default Register;
