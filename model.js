// model.js - ENTITY & DATA LAYER - V10

class AuthModel {
    constructor() { this.currentUser = sessionStorage.getItem('nutriUser'); }
    login(username, password) {
        if (username === 'admin' && password === '123456') { this.currentUser = username; sessionStorage.setItem('nutriUser', username); return true; }
        return false;
    }
    logout() { this.currentUser = null; sessionStorage.removeItem('nutriUser'); }
    isLoggedIn() { return !!this.currentUser; }
}

class SanPham { constructor(maSP, tenSP, donVi, gia, danhMucId) { this.maSP = maSP; this.tenSP = tenSP; this.donVi = donVi; this.gia = gia; this.danhMucId = danhMucId; } }
class LoHang { constructor(maLo, maSP, ngayHetHan, soLuong) { this.maLo = maLo; this.maSP = maSP; this.ngayHetHan = ngayHetHan; this.soLuong = soLuong; } }
class NhaCungCap { constructor(maNCC, tenNCC, sdt) { this.maNCC = maNCC; this.tenNCC = tenNCC; this.sdt = sdt; } }
class NhanVien { constructor(maNV, tenNV, chucVu, sdt) { this.maNV = maNV; this.tenNV = tenNV; this.chucVu = chucVu; this.sdt = sdt; } }

class DbContext {
    constructor() {
        const saved = JSON.parse(localStorage.getItem('NutriStockDB_V10')) || {};
        this.auth = new AuthModel();
        
        this.dsSanPham = saved.dsSanPham || this._seedSanPham();
        this.dsLoHang = saved.dsLoHang || this._seedLoHang();
        this.dsNhaCungCap = saved.dsNhaCungCap || this._seedNCC();
        this.dsNhanVien = saved.dsNhanVien || this._seedNV();
        this.lichSuGD = saved.lichSuGD || this._seedHistory();
    }

    saveChanges() {
        localStorage.setItem('NutriStockDB_V10', JSON.stringify({
            dsSanPham: this.dsSanPham, dsLoHang: this.dsLoHang,
            dsNhaCungCap: this.dsNhaCungCap, dsNhanVien: this.dsNhanVien,
            lichSuGD: this.lichSuGD
        }));
    }

    // CRUD
    themSanPham(ten, donVi, gia, danhMucId) { this.dsSanPham.push(new SanPham('sp'+Date.now(), ten, donVi, gia, danhMucId)); this.saveChanges(); }
    xoaSanPham(maSP) { this.dsSanPham = this.dsSanPham.filter(s => s.maSP !== maSP); this.saveChanges(); }
    themNhanVien(ten, chucVu, sdt) { this.dsNhanVien.push(new NhanVien('nv'+Date.now(), ten, chucVu, sdt)); this.saveChanges(); }
    xoaNhanVien(maNV) { this.dsNhanVien = this.dsNhanVien.filter(n => n.maNV !== maNV); this.saveChanges(); }
    themNhaCungCap(ten, sdt) { this.dsNhaCungCap.push(new NhaCungCap('ncc'+Date.now(), ten, sdt)); this.saveChanges(); }
    xoaNhaCungCap(maNCC) { this.dsNhaCungCap = this.dsNhaCungCap.filter(n => n.maNCC !== maNCC); this.saveChanges(); }
    
    // LOGIC MỚI: Cập nhật kiểm kê
    capNhatKiemKe(maLo, slThucTe) {
        const lo = this.dsLoHang.find(l => l.maLo === maLo);
        if (lo) {
            const chenhLech = slThucTe - lo.soLuong;
            if (chenhLech !== 0) {
                // Cập nhật số lượng mới
                lo.soLuong = slThucTe;
                
                // Ghi lịch sử
                const todayStr = new Date().toLocaleDateString('en-CA');
                this.lichSuGD.push({
                    date: todayStr,
                    type: 'check', // Loại giao dịch mới
                    qty: Math.abs(chenhLech),
                    desc: `Kiểm kê lô ${maLo}: ${chenhLech > 0 ? 'Thừa' : 'Thiếu'} ${Math.abs(chenhLech)} (Thực tế: ${slThucTe})`
                });
            }
        }
        this.saveChanges();
    }

    wipeData() { this.dsSanPham = []; this.dsLoHang = []; this.dsNhaCungCap = []; this.dsNhanVien = []; this.lichSuGD = []; this.saveChanges(); }

    _seedSanPham() { return [ new SanPham('sp1', 'Sữa Hạnh Nhân', 'Thùng', 250000, 'c1'), new SanPham('sp2', 'Sữa Đậu Nành', 'Thùng', 180000, 'c1'), new SanPham('sp3', 'Sữa Yến Mạch', 'Thùng', 320000, 'c1') ]; }
    _seedLoHang() { return [ new LoHang('L001', 'sp1', '2025-12-01', 50), new LoHang('L002', 'sp2', '2025-11-20', 30) ]; }
    _seedNCC() { return [new NhaCungCap('ncc1', 'Vinamilk Dist', '090123456')]; }
    _seedNV() { return [new NhanVien('nv1', 'Nguyễn Văn A', 'Quản lý', '0901111111')]; }
    _seedHistory() {
        let history = []; const types = ['import', 'export']; const products = ['Sữa Hạnh Nhân', 'Sữa Đậu Nành'];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(); date.setDate(date.getDate() - i); const dateStr = date.toLocaleDateString('en-CA');
            const count = Math.floor(Math.random() * 2) + 1; 
            for(let k=0; k<count; k++) {
                const type = types[Math.floor(Math.random() * types.length)]; const qty = Math.floor(Math.random() * 15) + 5; const prod = products[Math.floor(Math.random() * products.length)];
                history.push({ date: dateStr, type: type, qty: qty, desc: `${type === 'import' ? 'Nhập' : 'Xuất'} ${qty} ${prod}` });
            }
        }
        return history;
    }
}