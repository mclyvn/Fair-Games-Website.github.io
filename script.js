// 1. IMPORT CÁC THƯ VIỆN CẦN THIẾT
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 2. KHỞI TẠO BIẾN TOÀN CỤC
let cart = []; // Biến chứa danh sách giỏ hàng
let currentUser = null; // Biến lưu thông tin người đang đăng nhập

// 3. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP (QUAN TRỌNG NHẤT)
// Hàm này chạy ngay khi web tải xong để kiểm tra xem là Ai đang vào web
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP ---
        currentUser = user;
        console.log("Đang đăng nhập với email:", user.email);
        updateUserBox(user.email); // Cập nhật giao diện User
        loadCartFromFirebase(user.uid); // Tải giỏ hàng từ Mây về
    } else {
        // --- TRƯỜNG HỢP: KHÁCH VÃNG LAI ---
        currentUser = null;
        console.log("Chưa đăng nhập (Khách)");
        updateUserBox(null);
        loadCartFromLocal(); // Tải giỏ hàng từ máy tính cá nhân
    }
});

// 4. CÁC HÀM XỬ LÝ DỮ LIỆU (LOAD & SAVE)

// Tải từ Firebase (Cho User)
function loadCartFromFirebase(userId) {
    const dbRef = ref(db);
    get(child(dbRef, `carts/${userId}`)).then((snapshot) => {
        if (snapshot.exists()) {
            cart = snapshot.val(); // Lấy dữ liệu từ DB gán vào biến cart
        } else {
            cart = []; // Chưa mua gì
        }
        window.renderCart(); // Vẽ lại giao diện
    }).catch((error) => {
        console.error("Lỗi tải giỏ hàng:", error);
    });
}

// Tải từ LocalStorage (Cho Khách)
function loadCartFromLocal() {
    const data = localStorage.getItem('GUEST_CART'); // Đổi tên key để không lẫn
    cart = data ? JSON.parse(data) : [];
    window.renderCart();
}

// Hàm Lưu Dữ Liệu Thông Minh (Tự chọn nơi lưu)
function saveData() {
    if (currentUser) {
        // Nếu là User -> Lưu lên Firebase
        // Đường dẫn: carts / ID_Của_User
        set(ref(db, `carts/${currentUser.uid}`), cart)
            .then(() => console.log("Đã đồng bộ lên Firebase"))
            .catch((err) => console.error("Lỗi lưu:", err));
    } else {
        // Nếu là Khách -> Lưu vào máy
        localStorage.setItem('GUEST_CART', JSON.stringify(cart));
    }
}

// 5. CÁC HÀM CHỨC NĂNG (GẮN VÀO WINDOW ĐỂ HTML GỌI ĐƯỢC)

// Hàm hiển thị giỏ hàng ra màn hình
window.renderCart = function() {
    const container = document.getElementById('cartItems');
    const countLabel = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cartTotal');
    
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center; margin-top: 20px;">Giỏ hàng trống</p>';
    }

    cart.forEach((item, index) => {
        total += item.price;
        let priceText = item.price === 0 ? "Free" : `$${item.price}`;
        
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <h4>${item.name}</h4>
                    <p>${priceText}</p>
                </div>
                <span class="remove-item" onclick="removeFromCart(${index})">Xóa</span>
            </div>
        `;
    });

    if(countLabel) countLabel.innerText = cart.length;
    if(totalLabel) totalLabel.innerText = '$' + total.toFixed(2);
};

// Hàm thêm vào giỏ
window.addToCart = function(name, price, image) {
    cart.push({ name, price, image });
    saveData(); // Gọi hàm lưu thông minh
    window.renderCart();
    
    // Mở sidebar báo hiệu
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar && !sidebar.classList.contains('open')) window.toggleCart();
};

// Hàm xóa khỏi giỏ
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveData(); // Cập nhật lại
    window.renderCart();
};

// Bật tắt Sidebar
window.toggleCart = function() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
};

// 6. XỬ LÝ THANH TOÁN

window.openCheckout = function() {
    if(cart.length === 0) { alert("Giỏ hàng trống!"); return; }
    
    // Bắt buộc đăng nhập mới được thanh toán (để lưu game vào kho)
    if (!currentUser) {
        alert("Bạn cần Đăng nhập để thanh toán và lưu game!");
        window.location.href = "login.html";
        return;
    }

    document.getElementById('paymentTotal').innerText = '$' + cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    document.getElementById('checkoutModal').style.display = 'flex';
    window.toggleCart(); // Đóng sidebar
};

window.closeCheckout = function() {
    document.getElementById('checkoutModal').style.display = 'none';
};

window.processPayment = function(e) {
    e.preventDefault();
    const btn = document.querySelector('.pay-btn');
    const originalText = btn.innerText;
    
    btn.innerText = "Đang xử lý...";
    btn.style.background = "#777";
    btn.disabled = true; // Chặn bấm liên tục
    
    setTimeout(() => {
        alert(`Thanh toán thành công! Key game đã gửi về email: ${currentUser.email}`);
        
        // Reset giỏ hàng
        cart = [];
        saveData(); // Xóa trên database/local
        window.renderCart();
        window.closeCheckout();
        
        btn.innerText = originalText;
        btn.style.background = "#e74c3c";
        btn.disabled = false;
    }, 1500);
};

// 7. CÁC HÀM PHỤ TRỢ KHÁC

// Hàm tìm kiếm game
window.searchGame = function() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.getElementsByClassName('product-card');

    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
        if (title.includes(input)) {
            cards[i].style.display = "flex"; // Chỉnh lại display cho phù hợp CSS flex
        } else {
            cards[i].style.display = "none";
        }
    }
};

// Hàm cập nhật giao diện User (Góc trên phải)
function updateUserBox(email) {
    const userBox = document.getElementById("userBox");
    if (email) {
        // Nếu đã đăng nhập
        userBox.innerHTML = `
            <span>${email}</span>
            <button onclick="logout()">Đăng xuất</button>
        `;
    } else {
        // Nếu chưa đăng nhập
        userBox.innerHTML = `
            <a href="login.html">Đăng nhập</a>
        `;
    }
}

// Hàm Đăng Xuất (Global)
window.logout = function() {
    signOut(auth).then(() => {
        // Đăng xuất xong thì reload trang để reset mọi thứ
        location.reload(); 
    }).catch((error) => {
        console.error(error);
    });
};