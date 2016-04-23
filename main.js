'use strict'
const electron = require('electron');
const app = electron.app;
const BrowserWindow = require('browser-window');
const ipcMain = require('electron').ipcMain;

var mainWindow = null;

app.on('window-all-closed',function(){
	if(process.platform != 'darwin'){
		app.quit();
	}
});

app.on('ready',function(){
	mainWindow = new BrowserWindow({
		width : 1200,
		height : 800
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	mainWindow.on('closed',function(){
		mainWindow = null;
	})
})