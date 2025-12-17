// 1. IMPORT CÁC THƯ VIỆN CẦN THIẾT
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 2. KHỞI TẠO BIẾN TOÀN CỤC
let cart = []; 
let currentUser = null; 

// 3. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- ĐÃ ĐĂNG NHẬP ---
        currentUser = user;
        console.log("User:", user.email);
        updateUserBox(user.email); 
        loadCartFromFirebase(user.uid); // Tải giỏ hàng về
    } else {
        // --- KHÁCH VÃNG LAI (CHƯA LOGIN) ---
        currentUser = null;
        console.log("Chưa đăng nhập");
        updateUserBox(null);
        
        // QUAN TRỌNG: Xóa sạch giỏ hàng trong RAM và vẽ lại giao diện trống
        cart = []; 
        window.renderCart(); 
        
        // Cập nhật số lượng về 0 ngay lập tức
        const countLabel = document.getElementById('cart-count');
        if(countLabel) countLabel.innerText = "0";
    }
});

// 4. CÁC HÀM XỬ LÝ DỮ LIỆU
function loadCartFromFirebase(userId) {
    const dbRef = ref(db);
    get(child(dbRef, `carts/${userId}`)).then((snapshot) => {
        if (snapshot.exists()) {
            cart = snapshot.val(); 
        } else {
            cart = []; 
        }
        window.renderCart(); 
    }).catch((error) => console.error("Lỗi:", error));
}

function saveData() {
    // Chỉ lưu nếu đã đăng nhập
    if (currentUser) {
        set(ref(db, `carts/${currentUser.uid}`), cart)
            .catch((err) => console.error("Lỗi lưu:", err));
    }
}

// 5. CÁC CHỨC NĂNG GIAO DIỆN

// Hàm vẽ giỏ hàng
window.renderCart = function() {
    const container = document.getElementById('cartItems');
    const countLabel = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cartTotal');
    
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    // Nếu chưa đăng nhập hoặc giỏ rỗng
    if (!currentUser || cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; margin-top: 30px; color: #888;">
                <i class="fas fa-shopping-basket" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>Giỏ hàng trống</p>
            </div>`;
    }

    // Vẫn chạy vòng lặp để tính tiền (trường hợp đã login)
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

// --- HÀM THÊM VÀO GIỎ (SỬA ĐỔI QUAN TRỌNG) ---
window.addToCart = function(name, price, image) {
    // 1. Kiểm tra: Nếu CHƯA đăng nhập thì chặn luôn
    if (!currentUser) {
        // Hiện hộp thoại hỏi người dùng
        if (confirm("⚠️ Bạn cần đăng nhập để mua game này!\nBấm OK để đến trang đăng nhập.")) {
            window.location.href = "login.html";
        }
        return; // Dừng hàm tại đây, không cho thêm vào giỏ
    }

    // 2. Nếu đã đăng nhập thì chạy bình thường
    cart.push({ name, price, image });
    saveData();
    window.renderCart();
    
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar && !sidebar.classList.contains('open')) window.toggleCart();
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveData(); 
    window.renderCart();
};

// Hàm mở/đóng giỏ hàng
window.toggleCart = function() {
    // Tùy chọn: Nếu muốn chặt chẽ hơn, chưa đăng nhập thì không cho mở giỏ hàng luôn
    // if (!currentUser) { alert("Vui lòng đăng nhập!"); return; }
    
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
};

// 6. XỬ LÝ THANH TOÁN
window.openCheckout = function() {
    if(cart.length === 0) { alert("Giỏ hàng trống!"); return; }
    
    // Kiểm tra lại lần nữa cho chắc
    if (!currentUser) {
        alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        window.location.reload();
        return;
    }

    document.getElementById('paymentTotal').innerText = '$' + cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    document.getElementById('checkoutModal').style.display = 'flex';
    window.toggleCart(); 
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
    btn.disabled = true;
    
    setTimeout(() => {
        alert(`Thanh toán thành công! Key game đã gửi về email: ${currentUser.email}`);
        cart = [];
        saveData();
        window.renderCart();
        window.closeCheckout();
        btn.innerText = originalText;
        btn.style.background = "#e74c3c";
        btn.disabled = false;
    }, 1500);
};

// 7. TÌM KIẾM VÀ USER BOX
window.searchGame = function() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.getElementsByClassName('product-card');

    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
        if (title.includes(input)) {
            cards[i].style.display = "flex"; 
        } else {
            cards[i].style.display = "none";
        }
    }
};

function updateUserBox(email) {
    const userBox = document.getElementById("userBox");
    if (email) {
        userBox.innerHTML = `<span>${email}</span><button onclick="logout()">Đăng xuất</button>`;
    } else {
        userBox.innerHTML = `<a href="login.html">Đăng nhập</a>`;
    }
}

window.logout = function() {
    signOut(auth).then(() => location.reload()).catch((error) => console.error(error));
};

// --- HIỆU ỨNG SCROLL REVEAL (CUỘN ĐẾN ĐÂU HIỆN ĐẾN ĐÓ) ---
window.addEventListener('scroll', reveal);

function reveal() {
    var reveals = document.querySelectorAll('.reveal');

    for (var i = 0; i < reveals.length; i++) {
        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint = 100; // Khoảng cách từ dưới lên để bắt đầu hiện

        if (revealtop < windowheight - revealpoint) {
            reveals[i].classList.add('active');
        } else {
            reveals[i].classList.remove('active'); // Nếu muốn cuộn ngược lại thì ẩn đi (tuỳ chọn)
        }
    }
}

// Gọi hàm 1 lần khi tải trang để hiện những cái đang thấy
reveal();