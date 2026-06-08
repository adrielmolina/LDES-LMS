const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let flaskProcess = null;
let mainWindow = null;
const FLASK_PORT = 5000;

function startFlask() {
    const flaskPath = path.join(process.resourcesPath, 'flask', 'flask_server.exe');
    const dbPath = path.join(app.getPath('userData'), 'LDES-LMS.db');

    flaskProcess = spawn(flaskPath, [], {
        env: {
            ...process.env,
            FLASK_ENV: 'development',
            DB_PATH: dbPath
        },
        windowsHide: true  // hide the console window
    });

    flaskProcess.stdout.on('data', data => console.log(`Flask: ${data}`));
    flaskProcess.stderr.on('data', data => console.error(`Flask ERR: ${data}`));
}

function waitForFlask(callback, retries = 20) {
    http.get(`http://127.0.0.1:${FLASK_PORT}/`, res => {
        callback();
    }).on('error', () => {
        if (retries === 0) {
            console.error('Flask failed to start');
            return;
        }
        setTimeout(() => waitForFlask(callback, retries - 1), 500);
    });
}
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(app.getAppPath(), 'static', 'assets', 'favicon.png'),
        title: 'LDES-LMS'
    });

    mainWindow.loadURL(`http://127.0.0.1:${FLASK_PORT}/`);
    mainWindow.setMenuBarVisibility(false); // hide default menu bar
    mainWindow.maximize();

    // open target="_blank" links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' }; // prevent Electron from opening it
    });
}

app.whenReady().then(() => {
    //startFlask();
    waitForFlask(() => createWindow());
});

app.on('window-all-closed', () => {
    if (flaskProcess) flaskProcess.kill();
    app.quit();
});