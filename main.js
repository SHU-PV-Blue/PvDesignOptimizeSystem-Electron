'use strict'
const electron = require('electron');
const app = electron.app;
const BrowserWindow = require('browser-window');
const ipcMain = require('electron').ipcMain;
const nativeImage = require('electron').nativeImage;
const Menu = require('electron').Menu;
//var image = nativeImage.createFromPath('res/images/tray.png');

var mainWindow = null;

app.on('window-all-closed',function(){
	if(process.platform != 'darwin'){
		app.quit();
	}
});

app.on('ready',function(){
	mainWindow = new BrowserWindow({
		width : 1200,
		height : 800,
		title : 'PvDesignOptimizeSystem',
		center: true,
		webPreferences : {
		  webSecurity : false,
		  plugins : true
		},
		minWidth : 1000,
		minHeight : 700
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	mainWindow.on('closed',function(){
		mainWindow = null;
	})
});