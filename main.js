'use strict'
const electron = require('electron');
const app = electron.app;
const BrowserWindow = require('browser-window');
const ipcMain = require('electron').ipcMain;
const nativeImage = require('electron').nativeImage;
const Menu = require('electron').Menu;
var image = nativeImage.createFromPath('res/images/tray.png');

var mainWindow = null;

var template = [
  {
  	label: '文件',
  	submenu: [
  		{
  			label : '创建新项目',
  			accelerator : 'Ctrl+N'
  		},
  		{
  			label : '打开项目',
  			accelerator : 'Ctrl+O'
  		},
  		{
  			type: 'separator'
  		},
  		{
  			label : '退出',
  			accelerator : 'Ctrl+E'
  		}
  	]
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: '重做',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: '剪切',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: '复制',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      }
    ]
  },
  {
    label: '视图',
    submenu: [
      {
        label: '重新加载',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: '切换全屏',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        label: '开发者工具',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.toggleDevTools();
        }
      },
    ]
  },
  {
    label: '窗口',
    role: 'window',
    submenu: [
      {
        label: '最小化',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: '关闭',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      }
    ]
  }
];

var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

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
		icon : image,
    webPreferences : {
      webSecurity : false,
      plugins : true
    },
    minWidth : 1200,
    minHeight : 600
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	mainWindow.on('closed',function(){
		mainWindow = null;
	})
})