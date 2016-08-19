/*
 * 定义菜单
*/
module.exports = function (Menu,mainWindow) {
    const template = [
        {
            label: '视图',
            submenu: [
                {
                    label: '开发人员工具',
                    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.webContents.toggleDevTools();
                    }
                },
            ]
        },
        {
            label : '项目',
            click : function () {
                mainWindow.loadURL('file://' + __dirname + '/../../index.html');
            }
        },
        {
            label : '自定义设备',
            click : function () {
                mainWindow.loadURL('file://' + __dirname + '/../../customer.html');
            }
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}