module.exports = function (Menu) {
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
                },
                {
                    label: '删除',
                    role: 'delete'
                },
                {
                    label: '全选',
                    role: 'selectall'
                },
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '重新加载',
                    accelerator: 'CmdOrCtrl+R',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.reload();
                    }
                },
                {
                    label: '全屏',
                    role : 'togglefullscreen'
                },
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
            label: '窗口',
            role: 'window',
            submenu: [
                {
                    label: '最小化',
                    role: 'minimize'
                },
                {
                    label: '关闭',
                    role: 'close'
                },
            ]
        },
        {
            label : '自定义组件',
            click : function () {
                
            }
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}