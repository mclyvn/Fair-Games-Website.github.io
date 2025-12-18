// 1. IMPORT CÁC THƯ VIỆN CẦN THIẾT
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// 👇 Đã thêm 'push' vào đây để chức năng thanh toán hoạt động
import { ref, set, get, child, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 2. KHỞI TẠO BIẾN TOÀN CỤC
let cart = []; 
let currentUser = null; 

// Load guest cart from localStorage so non-logged users can add items
function loadGuestCartFromLocalStorage() {
    try {
        const raw = localStorage.getItem('guestCart');
        if (raw) cart = JSON.parse(raw) || [];
    } catch (e) {
        console.error('Failed to load guest cart:', e);
        cart = [];
    }
}

loadGuestCartFromLocalStorage();

// 3. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        updateUserBox(user.email); 
        loadCartFromFirebase(user.uid);
    } else {
        currentUser = null;
        updateUserBox(null);
        // keep/restore guest cart so users can add items before login
        loadGuestCartFromLocalStorage();
        window.renderCart();
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
    if (currentUser) {
        set(ref(db, `carts/${currentUser.uid}`), cart)
            .catch((err) => console.error("Lỗi lưu:", err));
    } else {
        // persist guest cart locally so non-logged users can keep items
        try {
            localStorage.setItem('guestCart', JSON.stringify(cart));
        } catch (e) {
            console.error('Failed to save guest cart:', e);
        }
    }
}

// 5. CÁC CHỨC NĂNG GIAO DIỆN
window.renderCart = function() {
    const container = document.getElementById('cartItems');
    const countLabel = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cartTotal');
    
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        const loginNote = !currentUser ? '<p style="color:#bbb; font-size:0.9em; margin-top:6px;">Đăng nhập để lưu giỏ hàng.</p>' : '';
        container.innerHTML = `
            <div style="text-align: center; margin-top: 30px; color: #888;">
                <i class="fas fa-shopping-basket" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>Giỏ hàng trống</p>
                ${loginNote}
            </div>`;
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

// Tạo Toast thông báo
document.body.insertAdjacentHTML('beforeend', `<div id="toast"><i class="fas fa-check-circle"></i> <span id="toast-msg">Đã thêm vào giỏ!</span></div>`);

window.addToCart = function(name, price, imageSrc) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        showToast(`"${name}" đã có trong giỏ hàng rồi!`, true);
        return;
    }

    cart.push({ name, price, image: imageSrc });
    saveData();
    window.renderCart(); 
    
    // Hiệu ứng Bay
    const productImg = document.querySelector('.detail-img'); 
    const cartIcon = document.querySelector('.cart-icon');

    if (productImg && cartIcon) {
        const flyImg = productImg.cloneNode();
        flyImg.classList.add('fly-item');
        document.body.appendChild(flyImg);

        const imgRect = productImg.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();

        flyImg.style.top = imgRect.top + "px";
        flyImg.style.left = imgRect.left + "px";
        flyImg.style.width = imgRect.width + "px";
        flyImg.style.height = imgRect.height + "px";

        setTimeout(() => {
            flyImg.style.top = (cartRect.top + 10) + "px";
            flyImg.style.left = (cartRect.left + 10) + "px";
            flyImg.style.width = "20px";
            flyImg.style.height = "20px";
            flyImg.style.opacity = "0.5";
        }, 50);

        setTimeout(() => {
            flyImg.remove(); 
            cartIcon.classList.add('cart-shake');
            setTimeout(() => cartIcon.classList.remove('cart-shake'), 400);
            showToast(`Đã thêm "${name}" thành công!`);
        }, 800);
    } else {
        showToast(`Đã thêm "${name}" thành công!`);
        if(cartIcon) {
            cartIcon.classList.add('cart-shake');
            setTimeout(() => cartIcon.classList.remove('cart-shake'), 400);
        }
    }
};

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    const msgSpan = document.getElementById("toast-msg");
    
    msgSpan.innerText = message;
    if (isError) {
        toast.style.backgroundColor = "#e74c3c";
        toast.querySelector('i').className = "fas fa-exclamation-circle";
    } else {
        toast.style.backgroundColor = "#27ae60";
        toast.querySelector('i').className = "fas fa-check-circle";
    }
    toast.className = "show";
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveData(); 
    window.renderCart();
};

window.toggleCart = function() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
};

// ==========================================
// 10. CHỨC NĂNG THANH TOÁN QR (VIETQR) - CHÍNH THỨC
// ==========================================

const MY_BANK = {
    BANK_ID: 'MB', 
    ACCOUNT_NO: '0357876625', 
    ACCOUNT_NAME: 'DO QUANG THANG', 
    TEMPLATE: 'compact2' 
};

// 1. Mở Modal Thanh Toán & Tạo QR
window.openCheckout = function() {
    if (cart.length === 0) {
        alert("Giỏ hàng đang trống!");
        return;
    }
    if (!currentUser) {
        alert("Vui lòng đăng nhập để thanh toán!");
        window.location.href = "login.html";
        return;
    }

    const modal = document.getElementById('paymentModal');
    const qrImg = document.getElementById('qrImage');
    const payAmount = document.getElementById('payAmount');
    const transferContent = document.getElementById('transferContent');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const orderId = 'FAIR' + Math.floor(Math.random() * 10000);

    payAmount.innerText = `$${total.toFixed(2)} (Khoảng ${(total * 24000).toLocaleString()} VND)`;
    transferContent.innerText = orderId;

    const vndAmount = total * 24000;
    const qrSource = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-${MY_BANK.TEMPLATE}.png?amount=${vndAmount}&addInfo=${orderId}&accountName=${encodeURIComponent(MY_BANK.ACCOUNT_NAME)}`;
    
    qrImg.src = qrSource;

    // 👇 Đã sửa thành 'flex' để căn giữa
    modal.style.display = "flex"; 
    window.toggleCart(); 
};

// 2. Đóng Modal
window.closePaymentModal = function() {
    document.getElementById('paymentModal').style.display = "none";
};

// 3. Xử lý khi bấm "Tôi đã thanh toán"
window.confirmPayment = function() {
    const btn = document.querySelector('.confirm-pay-btn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ĐANG KIỂM TRA...';
    btn.style.opacity = "0.7";
    btn.disabled = true;

    setTimeout(() => {
        const orderData = {
            items: cart,
            total: cart.reduce((sum, item) => sum + item.price, 0),
            date: new Date().toLocaleString('vi-VN'),
            paymentMethod: 'QR Transfer',
            status: 'Completed'
        };

        push(ref(db, `orders/${currentUser.uid}`), orderData)
        .then(() => {
            alert("Thanh toán thành công! Cảm ơn bạn đã ủng hộ.");
            cart = [];
            saveData();
            window.renderCart();
            window.closePaymentModal();
            
            const isInGameFolder = window.location.pathname.includes("/games/");
            window.location.href = isInGameFolder ? "../profile.html" : "profile.html";
        })
        .catch((err) => {
            console.error(err);
            alert("Lỗi kết nối! Nhưng cứ coi như thành công nhé ^^");
            cart = [];
            saveData();
            window.renderCart();
            window.closePaymentModal();
        })
        .finally(() => {
            btn.innerHTML = originalText;
            btn.style.opacity = "1";
            btn.disabled = false;
        });

    }, 2000);
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

function updateUserBox(email) {
    const userBox = document.getElementById("userBox");
    const isInGameFolder = window.location.pathname.includes("/games/");
    const pathPrefix = isInGameFolder ? "../" : "";

    if (email) {
        userBox.innerHTML = `
            <a href="${pathPrefix}profile.html" style="color: #e74c3c; text-decoration: none; font-weight: bold; margin-right: 15px; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fas fa-user-circle" style="font-size: 1.2em;"></i> 
                <span style="text-transform: none;">${email.split('@')[0]}</span>
            </a>
            <button onclick="logout()" style="padding: 5px 10px; background: transparent; border: 1px solid #666; color: #ccc; cursor: pointer; border-radius: 4px;">
                Đăng xuất
            </button>
        `;
    } else {
        userBox.innerHTML = `
            <a href="${pathPrefix}login.html" style="color: #fff; text-decoration: none; font-weight: bold;">Đăng nhập</a>
        `;
    }
}

window.logout = function() {
    signOut(auth).then(() => location.reload()).catch((error) => console.error(error));
};

// --- SCROLL REVEAL ---
window.addEventListener('scroll', reveal);
function reveal() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint = 50;
        if (revealtop < windowheight - revealpoint) {
            reveals[i].classList.add('active');
        } else {
            reveals[i].classList.remove('active');
        }
    }
}
reveal();

// --- CLICK LOGO VỀ TRANG CHỦ ---
const logo = document.querySelector('.logo');
if (logo) {
    logo.style.cursor = 'pointer'; 
    logo.addEventListener('click', function() {
        const isInGameFolder = window.location.pathname.includes("/games/");
        const pathPrefix = isInGameFolder ? "../" : "";
        window.location.href = pathPrefix + "index.html";
    });
}