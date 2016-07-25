/*
 * 定义菜单
*/
module.exports = function (Menu,mainWindow) {
    const template = [
        {
            label: '编辑',
            submenu: [
                {
                    label: '撤销',
                    role: 'undo'
                },
                {
                    label: '重做',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: '剪切',
                    role: 'cut'
                },
                {
                    label: '复制',
                    role: 'copy'
                },
                {
                    label: '粘贴',
                    role: 'paste'
                }
            ]
        },
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
            label : '自定义组件',
            click : function () {
                mainWindow.loadURL('file://' + __dirname + '/../../customer.html');
            }
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}