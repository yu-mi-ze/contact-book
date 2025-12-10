// 联系人数据模型
class Contact {
    constructor(id, name, contactMethods = [], notes = '', isFavorite = false) {
        // 确保id始终是字符串类型
        this.id = String(id);
        this.name = name;
        this.contactMethods = contactMethods;
        this.notes = notes;
        this.isFavorite = isFavorite;
    }
}

// 联系方式类型
const methodTypes = [
    { value: 'phone', label: '电话' },
    { value: 'email', label: '邮箱' },
    { value: 'wechat', label: '微信' },
    { value: 'address', label: '地址' }
];

// 联系人存储管理
class ContactStorage {
    constructor() {
        this.contacts = this.loadContacts();
    }

    loadContacts() {
        const stored = localStorage.getItem('contacts');
        if (stored) {
            return JSON.parse(stored).map(contact => new Contact(
                // 确保ID是字符串类型
                String(contact.id),
                contact.name,
                contact.contactMethods,
                contact.notes,
                contact.isFavorite
            ));
        }
        return [];
    }

    saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(this.contacts));
    }

    addContact(contact) {
        this.contacts.push(contact);
        this.saveContacts();
    }

    updateContact(updatedContact) {
        const stringId = String(updatedContact.id);
        const index = this.contacts.findIndex(contact => contact.id === stringId);
        if (index !== -1) {
            this.contacts[index] = updatedContact;
            this.saveContacts();
        }
    }

    deleteContact(id) {
        const stringId = String(id);
        this.contacts = this.contacts.filter(contact => contact.id !== stringId);
        this.saveContacts();
    }

    getContactById(id) {
        // 确保ID比较时类型一致
        const stringId = String(id);
        return this.contacts.find(contact => contact.id === stringId);
    }

    toggleFavorite(id) {
        const contact = this.getContactById(id);
        if (contact) {
            contact.isFavorite = !contact.isFavorite;
            this.saveContacts();
        }
    }
}

// 应用控制器
class ContactApp {
    constructor() {
        this.storage = new ContactStorage();
        this.editingId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderContacts();
    }

    bindEvents() {
        // 添加联系人按钮
        document.getElementById('addContactBtn').addEventListener('click', () => {
            this.openModal();
        });

        // 导入导出按钮
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importContacts();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportContacts();
        });

        // 模态框事件
        const modal = document.getElementById('contactModal');
        const closeBtn = document.querySelector('.close');
        const form = document.getElementById('contactForm');

        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContact();
        });

        // 添加联系方式按钮
        document.getElementById('addMethodBtn').addEventListener('click', () => {
            this.addContactMethod();
        });
    }

    openModal(contact = null) {
        const modal = document.getElementById('contactModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('contactForm');
        const contactMethodsContainer = document.getElementById('contactMethods');

        this.editingId = contact ? contact.id : null;
        title.textContent = contact ? '编辑联系人' : '添加联系人';

        // 清空表单
        form.reset();
        contactMethodsContainer.innerHTML = '';

        if (contact) {
            // 填充现有联系人数据
            document.getElementById('name').value = contact.name;
            document.getElementById('notes').value = contact.notes;
            document.getElementById('favorite').checked = contact.isFavorite;

            // 添加现有联系方式
            contact.contactMethods.forEach(method => {
                this.addContactMethod(method.type, method.value);
            });
        } else {
            // 添加一个默认联系方式
            this.addContactMethod('phone', '');
        }

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('contactModal');
        modal.style.display = 'none';
        this.editingId = null;
    }

    addContactMethod(type = 'phone', value = '') {
        const container = document.getElementById('contactMethods');
        const methodItem = document.createElement('div');
        methodItem.className = 'contact-method-item';

        let typeOptions = '';
        methodTypes.forEach(methodType => {
            const selected = methodType.value === type ? 'selected' : '';
            typeOptions += `<option value="${methodType.value}" ${selected}>${methodType.label}</option>`;
        });

        methodItem.innerHTML = `
            <select class="method-type">
                ${typeOptions}
            </select>
            <input type="text" class="method-value" value="${value}" placeholder="请输入联系方式">
            <button type="button" class="remove-method">删除</button>
        `;

        // 绑定删除按钮事件
        methodItem.querySelector('.remove-method').addEventListener('click', () => {
            methodItem.remove();
        });

        container.appendChild(methodItem);
    }

    saveContact() {
        const name = document.getElementById('name').value.trim();
        const notes = document.getElementById('notes').value.trim();
        const isFavorite = document.getElementById('favorite').checked;

        // 获取所有联系方式
        const methodItems = document.querySelectorAll('.contact-method-item');
        const contactMethods = [];

        methodItems.forEach(item => {
            const type = item.querySelector('.method-type').value;
            const value = item.querySelector('.method-value').value.trim();
            if (value) {
                contactMethods.push({ type, value });
            }
        });

        // 验证表单
        if (!name) {
            alert('请输入联系人姓名');
            return;
        }

        if (contactMethods.length === 0) {
            alert('请至少添加一种联系方式');
            return;
        }

        if (this.editingId) {
            // 更新现有联系人
            const contact = this.storage.getContactById(this.editingId);
            if (contact) {
                // 创建新的联系人对象，而不是直接修改现有对象
                const updatedContact = new Contact(
                    contact.id,
                    name,
                    contactMethods,
                    notes,
                    isFavorite
                );
                this.storage.updateContact(updatedContact);
            }
        } else {
            // 创建新联系人
            const newContact = new Contact(
                Date.now().toString(),
                name,
                contactMethods,
                notes,
                isFavorite
            );
            this.storage.addContact(newContact);
        }

        this.closeModal();
        this.renderContacts();
    }

    renderContacts() {
        const container = document.getElementById('contactsList');
        const contacts = this.storage.contacts;

        if (contacts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i>📇</i><p>暂无联系人</p><p>点击"添加联系人"开始使用</p></div>';
            return;
        }

        // 按收藏状态和姓名排序
        const sortedContacts = [...contacts].sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) {
                return b.isFavorite ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        container.innerHTML = sortedContacts.map(contact => this.renderContactItem(contact)).join('');

        // 绑定联系人操作事件
        this.bindContactEvents();
    }

    renderContactItem(contact) {
        const favoriteStar = contact.isFavorite ? '<span class="favorite-star">★</span>' : '';
        const contactMethodsHtml = contact.contactMethods.map(method => {
            const methodType = methodTypes.find(type => type.value === method.type);
            return `<div class="contact-method">${methodType.label}: ${method.value}</div>`;
        }).join('');

        return `
            <div class="contact-item" data-id="${contact.id}">
                <div class="contact-info">
                    <div class="contact-name">${contact.name} ${favoriteStar}</div>
                    <div class="contact-methods">${contactMethodsHtml}</div>
                    ${contact.notes ? `<div class="contact-notes">备注: ${contact.notes}</div>` : ''}
                </div>
                <div class="contact-actions">
                    <button class="action-btn edit-btn" data-id="${contact.id}">编辑</button>
                    <button class="action-btn delete-btn" data-id="${contact.id}">删除</button>
                    <button class="action-btn favorite-btn" data-id="${contact.id}">${contact.isFavorite ? '取消收藏' : '收藏'}</button>
                </div>
            </div>
        `;
    }

    bindContactEvents() {
        // 编辑按钮
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const contact = this.storage.getContactById(id);
                if (contact) {
                    this.openModal(contact);
                }
            });
        });

        // 删除按钮
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('确定要删除这个联系人吗？')) {
                    this.storage.deleteContact(id);
                    this.renderContacts();
                }
            });
        });

        // 收藏按钮
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.storage.toggleFavorite(id);
                this.renderContacts();
            });
        });
    }

    importContacts() {
        // 创建文件输入元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // 解析导入的数据
                    jsonData.forEach(row => {
                        const name = row['姓名'] || row['Name'] || '';
                        if (!name) return;

                        const contactMethods = [];
                        
                        // 检查各种联系方式
                        if (row['电话'] || row['Phone']) {
                            contactMethods.push({ type: 'phone', value: row['电话'] || row['Phone'] });
                        }
                        if (row['邮箱'] || row['Email']) {
                            contactMethods.push({ type: 'email', value: row['邮箱'] || row['Email'] });
                        }
                        if (row['微信'] || row['WeChat']) {
                            contactMethods.push({ type: 'wechat', value: row['微信'] || row['WeChat'] });
                        }
                        if (row['地址'] || row['Address']) {
                            contactMethods.push({ type: 'address', value: row['地址'] || row['Address'] });
                        }

                        if (contactMethods.length === 0) return;

                        const notes = row['备注'] || row['Notes'] || '';
                        const isFavorite = !!row['收藏'] || !!row['Favorite'];

                        const newContact = new Contact(
                            Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            name,
                            contactMethods,
                            notes,
                            isFavorite
                        );

                        this.storage.addContact(newContact);
                    });

                    this.renderContacts();
                    alert(`成功导入 ${jsonData.length} 个联系人`);
                } catch (error) {
                    console.error('导入失败:', error);
                    alert('导入失败，请确保文件格式正确');
                }
            };

            reader.readAsArrayBuffer(file);
        });

        input.click();
    }

    exportContacts() {
        const contacts = this.storage.contacts;
        if (contacts.length === 0) {
            alert('暂无联系人可导出');
            return;
        }

        // 准备导出数据
        const exportData = contacts.map(contact => {
            const row = {
                '姓名': contact.name,
                '备注': contact.notes,
                '收藏': contact.isFavorite ? '是' : '否'
            };

            // 提取各种联系方式
            contact.contactMethods.forEach(method => {
                const methodType = methodTypes.find(type => type.value === method.type);
                row[methodType.label] = method.value;
            });

            return row;
        });

        // 创建工作簿和工作表
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // 调整列宽
        const columnWidths = [
            { wch: 20 },  // 姓名
            { wch: 15 },  // 电话
            { wch: 25 },  // 邮箱
            { wch: 20 },  // 微信
            { wch: 30 },  // 地址
            { wch: 50 },  // 备注
            { wch: 10 }   // 收藏
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, '联系人列表');

        // 导出文件
        const fileName = `通讯录_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        alert('导出成功！');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ContactApp();
});