// controller.js - CONTROL LAYER - V10

class QLNhapKhoControl {
    constructor(db) { this.db = db; }
    nhapKho(maSP, soLuong, hsd) {
        const maLo = 'L' + Date.now().toString().slice(-6); const loMoi = new LoHang(maLo, maSP, hsd, soLuong); this.db.dsLoHang.push(loMoi);
        const tenSP = this.db.dsSanPham.find(s => s.maSP === maSP)?.tenSP || maSP;
        const todayStr = new Date().toLocaleDateString('en-CA');
        this.db.lichSuGD.push({ date: todayStr, type: 'import', qty: soLuong, desc: `Nhập ${soLuong} ${tenSP}` });
        this.db.saveChanges();
    }
}

class QLXuatKhoControl {
    constructor(db) { this.db = db; }
    timLoHangDeXuat(maSP, soLuongCan) {
        let cacLo = this.db.dsLoHang.filter(l => l.maSP === maSP && l.soLuong > 0);
        cacLo.sort((a, b) => new Date(a.ngayHetHan) - new Date(b.ngayHetHan));
        let ketQua = []; let conLai = soLuongCan;
        for (let lo of cacLo) {
            if (conLai <= 0) break; let lay = Math.min(conLai, lo.soLuong);
            ketQua.push({ maLo: lo.maLo, hsd: lo.ngayHetHan, soLuongLay: lay, maSP: lo.maSP }); conLai -= lay;
        }
        if (conLai > 0) return { status: false, thieu: conLai }; return { status: true, chiTiet: ketQua };
    }
    thucHienXuat(chiTietXuat) {
        let totalQty = 0; chiTietXuat.forEach(item => { let loHang = this.db.dsLoHang.find(l => l.maLo === item.maLo); if (loHang) loHang.soLuong -= item.soLuongLay; totalQty += item.soLuongLay; });
        const todayStr = new Date().toLocaleDateString('en-CA');
        this.db.lichSuGD.push({ date: todayStr, type: 'export', qty: totalQty, desc: `Xuất kho ${chiTietXuat.length} lô` });
        this.db.saveChanges();
    }
}

// --- CONTROLLER MỚI: QUẢN LÝ KIỂM KÊ ---
class QLKiemKeControl {
    constructor(db) { this.db = db; }

    layDanhSachKiemKe() {
        // Lấy tất cả lô hàng đang có số lượng > 0 để kiểm kê
        return this.db.dsLoHang.filter(l => l.soLuong > 0).map(l => {
            const sp = this.db.dsSanPham.find(s => s.maSP === l.maSP);
            return {
                maLo: l.maLo,
                tenSP: sp ? sp.tenSP : l.maSP,
                hsd: l.ngayHetHan,
                tonHeThong: l.soLuong
            };
        });
    }

    luuKetQuaKiemKe(ketQua) {
        // ketQua là mảng [{maLo, slThucTe}, ...]
        ketQua.forEach(item => {
            this.db.capNhatKiemKe(item.maLo, item.slThucTe);
        });
        return true;
    }
}

class MainController {
    constructor() {
        this.db = new DbContext();
        this.ctrlNhap = new QLNhapKhoControl(this.db);
        this.ctrlXuat = new QLXuatKhoControl(this.db);
        this.ctrlKiemKe = new QLKiemKeControl(this.db); // Khởi tạo Controller Kiểm kê
        this.view = new MainView(this);
        this.init();
    }

    init() { if (this.db.auth.isLoggedIn()) { this.showApp(); } else { this.view.toggleLogin(true); } }
    handleLogin() { const u = document.getElementById('login-user').value; const p = document.getElementById('login-pass').value; if (this.db.auth.login(u, p)) { this.showApp(); } else { alert("Sai thông tin! Thử: admin / 123456"); } }
    handleLogout() { this.db.auth.logout(); this.view.toggleLogin(true); }
    showApp() { this.view.toggleLogin(false); this.updateDataLists(); this.view.switchTab('dashboard'); this.updateDashboard(); this.setupDateDefaults(); }
    setupDateDefaults() { const today = new Date(); const lastWeek = new Date(); lastWeek.setDate(today.getDate() - 7); const startInp = document.getElementById('rpt-start'); const endInp = document.getElementById('rpt-end'); if(startInp) startInp.value = lastWeek.toLocaleDateString('en-CA'); if(endInp) endInp.value = today.toLocaleDateString('en-CA'); }
    
    chuyenTab(tabId) { 
        this.view.switchTab(tabId); 
        if (tabId === 'warehouse') this.updateWarehouseData(); 
        if (tabId === 'dashboard') this.updateDashboard(); 
        if (tabId === 'reports') this.xuLyLocBaoCao(document.getElementById('rpt-start').value, document.getElementById('rpt-end').value, 'all');
        
        // Load dữ liệu khi vào tab kiểm kê
        if (tabId === 'check-form') {
            const data = this.ctrlKiemKe.layDanhSachKiemKe();
            this.view.renderCheckTable(data);
        }
    }
    
    updateDataLists() { this.view.renderProductList(this.db.dsSanPham); this.view.renderStaffList(this.db.dsNhanVien); this.view.renderSupplierList(this.db.dsNhaCungCap); this.view.renderProductOptions(this.db.dsSanPham); }
    xuLyNhapKho(maSP, soLuong, hsd) { this.ctrlNhap.nhapKho(maSP, soLuong, hsd); alert('Nhập kho thành công!'); this.chuyenTab('warehouse'); }
    xuLyThemVaoGioXuat(maSP, soLuong) { return this.ctrlXuat.timLoHangDeXuat(maSP, soLuong); }
    xuLyXuatKho(chiTietXuat) { this.ctrlXuat.thucHienXuat(chiTietXuat); alert('Xuất kho thành công!'); this.chuyenTab('warehouse'); }
    
    // Xử lý sự kiện lưu kiểm kê từ View
    xuLyLuuKiemKe(dataInputs) {
        if(confirm("Xác nhận cập nhật số lượng tồn kho theo thực tế?")) {
            this.ctrlKiemKe.luuKetQuaKiemKe(dataInputs);
            alert("Đã cân bằng kho thành công!");
            this.chuyenTab('warehouse'); // Quay về kho để xem kết quả
        }
    }

    themSP(ten, donVi, gia, danhMucId) { this.db.themSanPham(ten, donVi, gia, danhMucId); this.updateDataLists(); }
    xoaSP(id) { if(confirm('Xóa SP?')) { this.db.xoaSanPham(id); this.updateDataLists(); } }
    themNV(ten, chucVu, sdt) { this.db.themNhanVien(ten, chucVu, sdt); this.updateDataLists(); }
    xoaNV(id) { if(confirm('Xóa NV?')) { this.db.xoaNhanVien(id); this.updateDataLists(); } }
    themNCC(ten, sdt) { this.db.themNhaCungCap(ten, sdt); this.updateDataLists(); }
    xoaNCC(id) { if(confirm('Xóa NCC?')) { this.db.xoaNhaCungCap(id); this.updateDataLists(); } }
    
    xuLyLocBaoCao(start, end, type) { let data = this.db.lichSuGD; if(start && end) data = data.filter(item => item.date >= start && item.date <= end); if(type !== 'all') data = data.filter(item => item.type === type); data.sort((a,b) => new Date(b.date) - new Date(a.date)); this.view.renderReportTable(data); }
    updateDashboard() { let totalItems = this.db.dsLoHang.reduce((sum, l) => sum + l.soLuong, 0); let totalValue = this.db.dsLoHang.reduce((sum, l) => { let gia = this.db.dsSanPham.find(s=>s.maSP === l.maSP)?.gia || 0; return sum + (l.soLuong * gia); }, 0); const todayStr = new Date().toLocaleDateString('en-CA'); const todayCount = this.db.lichSuGD.filter(h => h.date === todayStr).length; const warningDate = new Date(); warningDate.setDate(warningDate.getDate() + 30); const alertCount = this.db.dsLoHang.filter(l => l.soLuong > 0 && new Date(l.ngayHetHan) < warningDate).length; this.view.renderDashboardStats({totalItems, totalValue, todayCount, alertCount}); const labels = []; const dataImport = []; const dataExport = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('en-CA'); labels.push(d.getDate() + '/' + (d.getMonth() + 1)); const dayTrans = this.db.lichSuGD.filter(h => h.date === dStr); const imp = dayTrans.filter(h => h.type === 'import').reduce((sum, h) => sum + (h.qty || 0), 0); const exp = dayTrans.filter(h => h.type === 'export').reduce((sum, h) => sum + (h.qty || 0), 0); dataImport.push(imp); dataExport.push(exp); } this.view.renderActivityChart(labels, dataImport, dataExport); }
    updateWarehouseData() { let report = this.db.dsSanPham.map(sp => { let tongTon = this.db.dsLoHang.filter(l => l.maSP === sp.maSP).reduce((sum, l) => sum + l.soLuong, 0); return { ...sp, tongTon }; }); let totalItems = this.db.dsLoHang.reduce((sum, l) => sum + l.soLuong, 0); let totalValue = this.db.dsLoHang.reduce((sum, l) => { let gia = this.db.dsSanPham.find(s=>s.maSP === l.maSP)?.gia || 0; return sum + (l.soLuong * gia); }, 0); const todayStr = new Date().toLocaleDateString('en-CA'); const todayCount = this.db.lichSuGD.filter(h => h.date === todayStr).length; const warningDate = new Date(); warningDate.setDate(warningDate.getDate() + 30); const alertCount = this.db.dsLoHang.filter(l => l.soLuong > 0 && new Date(l.ngayHetHan) < warningDate).length; this.view.renderWarehouseTable(report, { totalItems, totalValue, todayCount, alertCount }); }
    xuLyNapMau() { if(confirm("Nạp lại dữ liệu mẫu?")) { localStorage.removeItem('NutriStockDB_V10'); location.reload(); } }
    xuLyXoaTrang() { if(confirm("XÓA SẠCH DỮ LIỆU?")) { this.db.wipeData(); location.reload(); } }
}