const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog } = require('electron');
const path = require('path');

// URL padrão da plataforma HelpClin
const APP_URL = process.env.HELPCLIN_URL || 'https://helpclintec.com.br';
const OFFLINE_FILE = path.join(__dirname, 'offline.html');
const ICON_PATH = path.join(__dirname, 'assets', 'icon.ico');
const ICON_PNG = path.join(__dirname, 'assets', 'icon.png');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Garante apenas uma instância do aplicativo em execução
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createMainWindow);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'HelpClin - Gestão Clínica e Atendimento',
    icon: ICON_PATH,
    backgroundColor: '#f7f9f8',
    show: false, // Exibe após carregar para transição suave
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true
    }
  });

  // Carrega a URL da plataforma
  carregarPlataforma();

  // Exibe a janela assim que estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Tratamento de falha de conexão (offline)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Código -3 é abortado propositalmente (ex: redirecionamento rápido)
    if (errorCode !== -3) {
      console.warn(`[HelpClin] Falha ao carregar: ${errorCode} - ${errorDescription}`);
      mainWindow.loadFile(OFFLINE_FILE);
    }
  });

  // Interceptar links externos (WhatsApp, e-mails, links fora do domínio) para abrir no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://api.whatsapp.com') ||
        url.startsWith('https://wa.me') ||
        url.startsWith('mailto:') ||
        !url.includes('helpclintec.com.br')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('https://api.whatsapp.com') ||
        url.startsWith('https://wa.me') ||
        url.startsWith('mailto:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Configura Menu Nativo do Windows
  configurarMenu();

  // Configura Bandeja do Sistema (Systray)
  configurarTray();

  // Fechar ou minimizar para bandeja
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      // Deixar fechar normalmente quando o usuário clica no 'X'
      // Se desejar minimizar para o tray, pode descomentar a linha abaixo:
      // event.preventDefault(); mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function carregarPlataforma() {
  if (!mainWindow) return;
  mainWindow.loadURL(APP_URL).catch((err) => {
    console.error('[HelpClin] Erro ao carregar URL principal:', err);
    mainWindow.loadFile(OFFLINE_FILE);
  });
}

function configurarMenu() {
  const template = [
    {
      label: 'HelpClin',
      submenu: [
        {
          label: 'Acessar Portal / Início',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow && mainWindow.loadURL(APP_URL)
        },
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        {
          label: 'Forçar Recarregamento',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow && mainWindow.webContents.reloadIgnoringCache()
        },
        { type: 'separator' },
        {
          label: 'Sobre o HelpClin',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o HelpClin',
              message: 'HelpClin - Versão Desktop Windows 1.0.0',
              detail: 'Sistema Completo de Gestão Clínica, Ordens de Serviço & Suporte.\nDesenvolvido por Daniel Knaip e Rodrigo Santos.\nBlessed Soluções Tec.',
              icon: ICON_PNG,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'resetZoom', label: 'Tamanho Padrão (100%)' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia (F11)' }
      ]
    },
    {
      label: 'Suporte',
      submenu: [
        {
          label: 'Falar com Suporte Técnico (WhatsApp)',
          click: () => {
            shell.openExternal('https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20aplicativo%20desktop%20HelpClin.');
          }
        },
        {
          label: 'Abrir Site Oficial',
          click: () => {
            shell.openExternal('https://helpclintec.com.br');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function configurarTray() {
  try {
    tray = new Tray(ICON_PATH);
    const trayMenu = Menu.buildFromTemplate([
      {
        label: 'Abrir HelpClin',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Recarregar',
        click: () => {
          if (mainWindow) mainWindow.reload();
        }
      },
      { type: 'separator' },
      {
        label: 'Encerrar HelpClin',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('HelpClin - Gestão Clínica');
    tray.setContextMenu(trayMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('[HelpClin] Não foi possível carregar o ícone da bandeja:', err.message);
  }
}

// IPC Handlers
ipcMain.on('app:reconectar', () => {
  carregarPlataforma();
});

ipcMain.on('app:recarregar', () => {
  if (mainWindow) mainWindow.reload();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
