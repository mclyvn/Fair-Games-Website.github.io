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
    
    if (!currentUser) return; // Chắc chắn đã đăng nhập

    const btn = document.querySelector('.pay-btn');
    const originalText = btn.innerText;
    
    btn.innerText = "Đang xử lý...";
    btn.style.background = "#777";
    btn.disabled = true;
    
    // --- ĐOẠN MỚI: LƯU VÀO LỊCH SỬ MUA HÀNG ---
    const orderData = {
        items: cart, // Lưu danh sách game đang có trong giỏ
        total: cart.reduce((sum, item) => sum + item.price, 0),
        date: new Date().toLocaleString('vi-VN'),
        customerName: document.querySelector('input[placeholder="Họ tên"]').value
    };

    // Đẩy vào nhánh: orders / ID_Của_User / [Danh sách đơn hàng]
    push(ref(db, `orders/${currentUser.uid}`), orderData)
    .then(() => {
        // Sau khi lưu xong thì mới báo thành công và xóa giỏ
        alert(`Thanh toán thành công! Game đã được thêm vào thư viện.`);
        
        cart = []; // Xóa giỏ hàng trong RAM
        saveData(); // Cập nhật giỏ hàng rỗng lên Firebase (nhánh carts)
        window.renderCart();
        window.closeCheckout();
        
        btn.innerText = originalText;
        btn.style.background = "#e74c3c";
        btn.disabled = false;

        // Chuyển hướng sang trang Profile để xem game vừa mua
        window.location.href = "profile.html";
    })
    .catch((error) => {
        console.error("Lỗi thanh toán:", error);
        alert("Lỗi kết nối, vui lòng thử lại!");
        btn.disabled = false;
        btn.innerText = originalText;
    });
};

// 7. TÌM KIẾM VÀ USER BOX
window.searchGame = function() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.getElementsByClassName('product-card');

    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
        if (title.includes(input)) {
            cards[i].style.display = ""; 
        } else {
            cards[i].style.display = "none";
        }
    }
};

// Hàm cập nhật giao diện User (Góc trên phải)
function updateUserBox(email) {
    const userBox = document.getElementById("userBox");
    
    // Kiểm tra xem người dùng đang đứng ở đâu?
    // Nếu đường dẫn có chữ "/games/", nghĩa là đang ở trong thư mục game -> cần lùi ra ngoài (../)
    const isInGameFolder = window.location.pathname.includes("/games/");
    const pathPrefix = isInGameFolder ? "../" : "";

    // Tìm đoạn này trong hàm updateUserBox
if (email) {
    // Sửa dòng này: Thêm thẻ <a href="profile.html"> bao quanh email
    userBox.innerHTML = `
        <a href="profile.html" style="color: #e74c3c; text-decoration: none; font-weight: bold; margin-right: 10px;">
            <i class="fas fa-user-circle"></i> ${email}
        </a>
        <button onclick="logout()">Đăng xuất</button>
    `;
}else {
        // Nếu chưa đăng nhập -> Tự động thêm ../ nếu đang ở trang game
        userBox.innerHTML = `
            <a href="${pathPrefix}login.html">Đăng nhập</a>
        `;
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
        var revealpoint = 50; // Khoảng cách từ dưới lên để bắt đầu hiện

        if (revealtop < windowheight - revealpoint) {
            reveals[i].classList.add('active');
        } else {
            reveals[i].classList.remove('active'); // Nếu muốn cuộn ngược lại thì ẩn đi (tuỳ chọn)
        }
    }
}

// Gọi hàm 1 lần khi tải trang để hiện những cái đang thấy
reveal();


// ==========================================
// 8. CHỨC NĂNG BÌNH LUẬN (COMMENT SYSTEM)
// ==========================================

// Hàm gửi bình luận
window.postComment = function(gameId) {
    if (!currentUser) {
        alert("Bạn cần đăng nhập để bình luận!");
        window.location.href = "../login.html"; // Chuyển hướng về trang login
        return;
    }

    const input = document.getElementById('commentInput');
    const content = input.value.trim();

    if (content === "") {
        alert("Vui lòng nhập nội dung!");
        return;
    }

    // Tạo đối tượng bình luận
    const newComment = {
        user: currentUser.email,
        content: content,
        time: new Date().toLocaleString()
    };

    // Lưu vào Firebase: comments / gameId / [danh sách]
    // Lưu ý: Đây là cách lưu đơn giản bằng cách lấy list cũ về rồi push list mới
    const dbRef = ref(db);
    get(child(dbRef, `comments/${gameId}`)).then((snapshot) => {
        let comments = snapshot.exists() ? snapshot.val() : [];
        if (!Array.isArray(comments)) comments = []; // Đảm bảo nó là mảng
        
        comments.push(newComment);

        set(ref(db, `comments/${gameId}`), comments)
            .then(() => {
                input.value = ""; // Xóa ô nhập
                window.loadComments(gameId); // Tải lại danh sách
            })
            .catch((err) => console.error(err));
    });
};

// Hàm tải bình luận (Cần export để file html gọi được)
window.loadComments = function(gameId) {
    const list = document.getElementById('commentList');
    if (!list) return;

    const dbRef = ref(db);
    get(child(dbRef, `comments/${gameId}`)).then((snapshot) => {
        if (snapshot.exists()) {
            const comments = snapshot.val();
            list.innerHTML = ""; // Xóa cũ
            
            // Duyệt ngược để hiện comment mới nhất lên đầu
            for (let i = comments.length - 1; i >= 0; i--) {
                let c = comments[i];
                let userInitial = c.user.charAt(0).toUpperCase();
                
                list.innerHTML += `
                    <div class="single-comment">
                        <div class="c-avatar">${userInitial}</div>
                        <div style="flex: 1;">
                            <h4 style="color: #e74c3c; margin-bottom: 5px;">${c.user} <span style="font-size:12px; color:#666; margin-left:10px;">${c.time}</span></h4>
                            <p style="color: #ccc;">${c.content}</p>
                        </div>
                    </div>
                `;
            }
        } else {
            list.innerHTML = "<p style='color:#666; text-align:center'>Chưa có bình luận nào. Hãy là người đầu tiên!</p>";
        }
    }).catch((err) => console.error(err));
};
