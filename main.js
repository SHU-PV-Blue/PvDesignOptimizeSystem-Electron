'use strict'
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
const nativeImage = require('electron').nativeImage;
const Menu = require('electron').Menu;
var setMenu = require('./common/window/menu');

var mainWindow = null;

app.on('window-all-closed', function () {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

app.on('ready', function () {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		title: 'PvDesignOptimizeSystem',
		center: true,
		icon: 'res/images/logo.png',
		webPreferences: {
			webSecurity: false,
			plugins: true
		},
		minWidth: 1100,
		minHeight: 700
	});

	setMenu(Menu,mainWindow);

	mainWindow.once('ready-to-show', () => {
		win.show()
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	mainWindow.on('closed', function () {
		mainWindow = null;
	})
});