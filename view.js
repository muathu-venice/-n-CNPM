// view.js - BOUNDARY / VIEW LAYER - V10

class MainView {
    constructor(controller) {
        this.controller = controller;
        this.chartInstance = null;

        window.app = {
            nav: (id) => this.controller.chuyenTab(id),
            processImport: () => this.onBtnNhapKhoClick(),
            addToExportList: () => this.onBtnThemVaoGioClick(),
            confirmExport: () => this.onBtnXuatKhoClick(),
            addProduct: () => this.onBtnThemSP(),
            delProd: (id) => this.controller.xoaSP(id),
            addStaff: () => this.onBtnThemNV(),
            delStaff: (id) => this.controller.xoaNV(id),
            addSupplier: () => this.onBtnThemNCC(),
            delSup: (id) => this.controller.xoaNCC(id),
            filterReport: () => this.onBtnLocBaoCao(),
            resetSample: () => this.controller.xuLyNapMau(),
            clearAll: () => this.controller.xuLyXoaTrang(),
            login: () => this.controller.handleLogin(),
            logout: () => this.controller.handleLogout(),
            
            // --- HÀM KIỂM KÊ MỚI ---
            // Được gọi mỗi khi nhập số vào ô "Thực tế" để tính chênh lệch ngay lập tức
            calcDiff: (input, sysQty, idDiff) => {
                const actual = parseInt(input.value) || 0;
                const diff = actual - sysQty;
                const el = document.getElementById(idDiff);
                if(diff > 0) { el.innerText = `+${diff}`; el.className = "text-center font-bold text-green-600"; }
                else if(diff < 0) { el.innerText = `${diff}`; el.className = "text-center font-bold text-red-600"; }
                else { el.innerText = "0"; el.className = "text-center font-bold text-gray-400"; }
            },
            saveCheck: () => this.onBtnLuuKiemKe()
        };
        this.exportCart = [];
    }

    toggleLogin(show) { const loginScreen = document.getElementById('login-screen'); const mainLayout = document.getElementById('main-layout'); if (show) { loginScreen.classList.remove('hidden'); mainLayout.classList.add('hidden'); } else { loginScreen.classList.add('hidden'); mainLayout.classList.remove('hidden'); mainLayout.classList.add('flex'); } }
    switchTab(tabId) { document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active')); document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active')); const target = document.getElementById(tabId); if (target) target.classList.add('active'); const map = {'dashboard':'nav-dashboard', 'warehouse':'nav-warehouse', 'products':'nav-products', 'employees':'nav-employees', 'suppliers':'nav-suppliers', 'reports':'nav-reports'}; const navId = map[tabId] || 'nav-warehouse'; if(document.getElementById(navId)) document.getElementById(navId).classList.add('active'); }
    
    // --- RENDER BẢNG KIỂM KÊ ---
    renderCheckTable(data) {
        const tbody = document.getElementById('check-list-body');
        if(!tbody) return;
        
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400 italic">Kho đang trống, không có gì để kiểm kê!</td></tr>`;
            return;
        }

        const html = data.map((item, index) => `
            <tr class="border-b hover:bg-blue-50 transition-colors">
                <td class="p-3 font-mono text-xs text-gray-500">${item.maLo}</td>
                <td class="p-3 font-semibold text-gray-700">${item.tenSP}</td>
                <td class="p-3 text-sm text-gray-500">${item.hsd}</td>
                <td class="p-3 text-center font-bold text-blue-600">${item.tonHeThong}</td>
                <td class="p-3">
                    <input type="number" 
                           data-malo="${item.maLo}" 
                           value="${item.tonHeThong}" 
                           class="w-full border border-gray-300 rounded p-1 text-center focus:ring-2 focus:ring-blue-500 outline-none check-input"
                           oninput="app.calcDiff(this, ${item.tonHeThong}, 'diff-${index}')">
                </td>
                <td class="p-3 text-center font-bold text-gray-400" id="diff-${index}">0</td>
            </tr>
        `).join('');
        tbody.innerHTML = html;
    }

    // --- XỬ LÝ NÚT LƯU KIỂM KÊ ---
    onBtnLuuKiemKe() {
        const inputs = document.querySelectorAll('.check-input');
        const data = [];
        inputs.forEach(inp => {
            data.push({
                maLo: inp.dataset.malo,
                slThucTe: parseInt(inp.value) || 0
            });
        });
        this.controller.xuLyLuuKiemKe(data);
    }

    // --- CÁC HÀM CŨ GIỮ NGUYÊN ---
    renderDashboardStats(stats) { if(document.getElementById('dash-stat-items')) document.getElementById('dash-stat-items').innerText = stats.totalItems; if(document.getElementById('dash-stat-value')) document.getElementById('dash-stat-value').innerText = stats.totalValue.toLocaleString() + ' đ'; if(document.getElementById('dash-stat-today')) document.getElementById('dash-stat-today').innerText = stats.todayCount; if(document.getElementById('dash-stat-alert')) document.getElementById('dash-stat-alert').innerText = stats.alertCount + ' lô'; }
    renderActivityChart(labels, dataImport, dataExport) { const ctx = document.getElementById('activityChart'); if (!ctx) return; if (this.chartInstance) this.chartInstance.destroy(); this.chartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [ { label: 'Nhập kho', data: dataImport, backgroundColor: '#4CAF50', borderRadius: 4 }, { label: 'Xuất kho', data: dataExport, backgroundColor: '#FFCA28', borderRadius: 4 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { borderDash: [5, 5] } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } }); }
    renderReportTable(data) { const tbody = document.getElementById('rpt-body'); if(!tbody) return; if(data.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">Không có dữ liệu</td></tr>`; return; } const html = data.map(item => `<tr class="border-b border-gray-50 hover:bg-gray-50"><td class="p-3 font-mono text-gray-600">${item.date}</td><td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${item.type === 'import' ? 'bg-green-100 text-green-700' : item.type === 'export' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}">${item.type === 'import' ? 'Nhập kho' : item.type === 'export' ? 'Xuất kho' : 'Kiểm kê'}</span></td><td class="p-3 font-semibold text-gray-700">${item.desc}</td><td class="p-3 text-right font-bold">${item.qty}</td></tr>`).join(''); tbody.innerHTML = html; }
    renderWarehouseTable(reportData, stats) { if(document.getElementById('wh-stat-items')) document.getElementById('wh-stat-items').innerText = stats.totalItems; if(document.getElementById('wh-stat-value')) document.getElementById('wh-stat-value').innerText = stats.totalValue.toLocaleString() + ' đ'; if(document.getElementById('wh-stat-today')) document.getElementById('wh-stat-today').innerText = stats.todayCount; if(document.getElementById('wh-stat-alert')) document.getElementById('wh-stat-alert').innerText = stats.alertCount + ' lô'; const html = reportData.map(r => `<tr class="border-b hover:bg-white"><td class="p-3 font-semibold">${r.tenSP}</td><td class="p-3 text-center">${r.tongTon}</td><td class="p-3">${r.donVi}</td><td class="p-3 text-right">${(r.tongTon * r.gia).toLocaleString()}đ</td></tr>`).join(''); document.getElementById('wh-inventory-body').innerHTML = html; }
    renderProductOptions(dsSanPham) { const html = dsSanPham.map(s => `<option value="${s.maSP}">${s.tenSP}</option>`).join(''); const imp = document.getElementById('imp-product'); const exp = document.getElementById('exp-product'); if(imp) imp.innerHTML = html; if(exp) exp.innerHTML = html; }
    renderProductList(list) { const cats = [{id:'c1', name:'Sữa Hạt'}, {id:'c2', name:'Sữa Tươi'}, {id:'c3', name:'Ngũ Cốc'}]; document.getElementById('cat-list').innerHTML = cats.map(c => `<li class="flex justify-between p-2 bg-gray-50 mb-1 rounded"><span>${c.name}</span></li>`).join(''); document.getElementById('new-prod-cat').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join(''); const html = list.map(p => `<tr class="border-b"><td class="p-2 font-bold text-green-700">${p.tenSP}</td><td class="p-2 text-sm text-gray-500">${p.danhMucId}</td><td class="p-2">${p.donVi}</td><td class="p-2">${p.gia.toLocaleString()}</td><td class="p-2"><i onclick="app.delProd('${p.maSP}')" class="fas fa-trash text-red-400 cursor-pointer"></i></td></tr>`).join(''); document.getElementById('prod-list').innerHTML = html; }
    renderStaffList(list) { const html = list.map(e => `<div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 relative group"><img src="https://ui-avatars.com/api/?name=${e.tenNV}&background=random" class="w-12 h-12 rounded-full"><div><h4 class="font-bold text-gray-800">${e.tenNV}</h4><p class="text-xs text-green-600 font-bold uppercase">${e.chucVu}</p><p class="text-xs text-gray-400"><i class="fas fa-phone mr-1"></i>${e.sdt}</p></div><button onclick="app.delStaff('${e.maNV}')" class="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><i class="fas fa-trash"></i></button></div>`).join(''); document.getElementById('staff-list').innerHTML = html; }
    renderSupplierList(list) { const html = list.map(s => `<tr class="border-b hover:bg-white"><td class="p-4 font-bold text-gray-800">${s.tenNCC}</td><td class="p-4 text-gray-600"><i class="fas fa-phone-alt mr-2 text-green-500"></i>${s.sdt}</td><td class="p-4 text-right"><button onclick="app.delSup('${s.maNCC}')" class="btn-danger"><i class="fas fa-trash"></i></button></td></tr>`).join(''); document.getElementById('sup-list').innerHTML = html; }
    renderExportCart() { const html = this.exportCart.map(item => `<tr class="border-b border-dashed"><td class="py-2">${item.tenSP}</td><td class="py-2"><span class="bg-red-100 text-red-600 text-xs font-bold px-1 rounded">FEFO</span> ${item.maLo}</td><td class="py-2 font-bold">${item.soLuongLay}</td><td class="py-2 text-right text-xs text-gray-400">HSD: ${item.hsd}</td></tr>`).join(''); document.getElementById('exp-list-body').innerHTML = html; }

    onBtnNhapKhoClick() { const maSP = document.getElementById('imp-product').value; const sl = parseInt(document.getElementById('imp-qty').value); const hsd = document.getElementById('imp-exp').value; if (!sl || !hsd) return alert('Vui lòng nhập đủ thông tin'); this.controller.xuLyNhapKho(maSP, sl, hsd); }
    onBtnThemVaoGioClick() { const maSP = document.getElementById('exp-product').value; const sl = parseInt(document.getElementById('exp-qty').value); const tenSP = document.getElementById('exp-product').options[document.getElementById('exp-product').selectedIndex].text; const ketQua = this.controller.xuLyThemVaoGioXuat(maSP, sl); if (!ketQua.status) return alert(`Kho không đủ hàng! Thiếu ${ketQua.thieu}`); ketQua.chiTiet.forEach(item => this.exportCart.push({ ...item, tenSP })); this.renderExportCart(); }
    onBtnXuatKhoClick() { if (this.exportCart.length === 0) return alert('Giỏ hàng trống'); this.controller.xuLyXuatKho(this.exportCart); this.exportCart = []; this.renderExportCart(); }
    onBtnThemSP() { const ten = document.getElementById('new-prod-name').value; const cat = document.getElementById('new-prod-cat').value; const unit = document.getElementById('new-prod-unit').value; const gia = parseInt(document.getElementById('new-prod-price').value); if(ten && gia) { this.controller.themSP(ten, unit, gia, cat); document.getElementById('new-prod-name').value = ''; } }
    onBtnThemNV() { const ten = document.getElementById('st-name').value; const cv = document.getElementById('st-role').value; const sdt = document.getElementById('st-phone').value; if(ten) { this.controller.themNV(ten, cv, sdt); document.getElementById('add-staff-form').classList.add('hidden'); } }
    onBtnThemNCC() { const ten = document.getElementById('sup-name').value; const sdt = document.getElementById('sup-contact').value; if(ten) { this.controller.themNCC(ten, sdt); document.getElementById('sup-name').value = ''; } }
    onBtnLocBaoCao() { const start = document.getElementById('rpt-start').value; const end = document.getElementById('rpt-end').value; const type = document.getElementById('rpt-type').value; this.controller.xuLyLocBaoCao(start, end, type); }
}