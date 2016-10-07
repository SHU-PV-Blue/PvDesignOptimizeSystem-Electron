'use strict'
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
const nativeImage = require('electron').nativeImage;
const Menu = require('electron').Menu;
var fs = require('fs');

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

    mainWindow.setMenu(null);

	mainWindow.once('ready-to-show', () => {
		win.show()
	});

    fs.stat(process.env.TEMP + "/pvsystem.json",function(err,stat){
        if(err){
            return mainWindow.loadURL('file://' + __dirname + '/user.html');
        }
        mainWindow.loadURL('file://' + __dirname + '/index.html');
    });

	mainWindow.on('closed', function () {
		mainWindow = null;
	});
    // mainWindow.webContents.toggleDevTools();
});