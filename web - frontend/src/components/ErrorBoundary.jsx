import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HelpClin Application Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleEnterDemo() {
    const demoUser = {
      id: 1,
      name: 'Administrador Demo',
      email: 'admin@helpclin.com.br',
      role: 'admin'
    };
    localStorage.setItem('helpclin_user', JSON.stringify(demoUser));
    window.location.href = '/dashboard';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f8f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #dce7df',
            boxShadow: '0 10px 30px rgba(18, 59, 61, 0.08)',
            padding: '36px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fdeee9',
              color: '#e78368',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              ⚠️
            </div>

            <h2 style={{ color: '#123b3d', margin: '0 0 10px', fontSize: '22px', fontWeight: 800 }}>
              Ops! Ocorreu um imprevisto na interface
            </h2>

            <p style={{ color: '#5e726e', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
              Detectamos uma inconsistência temporária de carregamento. Você pode recarregar a página ou entrar diretamente no modo demonstração para acessar o sistema.
            </p>

            {this.state.error && (
              <pre style={{
                background: '#f1f8f5',
                color: '#123b3d',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                border: '1px solid #dce7df'
              }}>
                {String(this.state.error.message || this.state.error)}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 22px',
                  borderRadius: '10px',
                  border: '1px solid #dce7df',
                  background: '#ffffff',
                  color: '#123b3d',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Recarregar Página
              </button>

              <button
                type="button"
                onClick={this.handleEnterDemo}
                style={{
                  padding: '12px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#e78368',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Acessar Painel / Modo Demo
              </button>

              <a
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '12px 22px',
                  borderRadius: '10px',
                  border: '1px solid #194e50',
                  background: '#f1f8f5',
                  color: '#123b3d',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Ir para o Site Principal
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
