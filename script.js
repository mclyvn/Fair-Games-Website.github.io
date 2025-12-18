// 1. IMPORT
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get, child, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 2. KHỞI TẠO BIẾN
let cart = []; 
let wishlist = []; 
let currentUser = null; 

// --- DATABASE LINK TẢI GAME ---
const GAME_DATABASE = {
    "Ace Slayer": "PASTE_LINK_GOOGLE_DRIVE_VAO_DAY",
    "Bunny Adventure": "PASTE_LINK_GOOGLE_DRIVE_VAO_DAY",
    "PUBG Mobile": "https://www.pubgmobile.com/en-US/home.shtml",
    "Elden Ring": "https://store.steampowered.com/app/1245620/Elden_Ring/",
    "FreeFire": "https://ff.garena.com/vn/",
    "Earth 2130": "PASTE_LINK_GOOGLE_DRIVE_VAO_DAY",
    "UFO Attack": "PASTE_LINK_GOOGLE_DRIVE_VAO_DAY",
    "Apple Collector": "PASTE_LINK_GOOGLE_DRIVE_VAO_DAY",
    "Monster Hunter": "https://store.steampowered.com/app/582010/Monster_Hunter_World/",
    "Resident Evil": "https://store.steampowered.com/app/2050650/Resident_Evil_4/",
    "ARK: Survival Ascended": "https://store.steampowered.com/app/2399830/ARK_Survival_Ascended/",
    "Minecraft": "https://www.minecraft.net/en-us/download"
};

function loadGuestCartFromLocalStorage() {
    try {
        const raw = localStorage.getItem('guestCart');
        if (raw) cart = JSON.parse(raw) || [];
    } catch (e) { console.error(e); cart = []; }
}
loadGuestCartFromLocalStorage();

// 3. AUTH & LOAD DATA
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        updateUserBox(user.email); 
        loadCartFromFirebase(user.uid);
        loadWishlistFromFirebase(user.uid); 
    } else {
        currentUser = null;
        updateUserBox(null);
        loadGuestCartFromLocalStorage();
        window.renderCart();
        wishlist = []; 
        updateWishlistUI();
        const countLabel = document.getElementById('cart-count');
        if(countLabel) countLabel.innerText = "0";
    }
});

// 4. DATA FUNCTIONS (CART & WISHLIST)
function loadCartFromFirebase(userId) {
    const dbRef = ref(db);
    get(child(dbRef, `carts/${userId}`)).then((snapshot) => {
        cart = snapshot.exists() ? snapshot.val() : [];
        window.renderCart(); 
    }).catch(console.error);
}

function loadWishlistFromFirebase(userId) {
    const wishRef = ref(db, `users/${userId}/wishlist`);
    onValue(wishRef, (snapshot) => {
        wishlist = snapshot.exists() ? snapshot.val() : [];
        updateWishlistUI(); 
    });
}

function saveData() {
    if (currentUser) {
        set(ref(db, `carts/${currentUser.uid}`), cart).catch(console.error);
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
}

// 5. WISHLIST LOGIC
window.toggleWishlist = function(gameName) {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để thêm vào Yêu thích!");
        return;
    }
    const index = wishlist.indexOf(gameName);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast(`Đã xóa ${gameName} khỏi Yêu thích`, true);
    } else {
        wishlist.push(gameName);
        showToast(`Đã thêm ${gameName} vào Yêu thích`);
    }
    set(ref(db, `users/${currentUser.uid}/wishlist`), wishlist)
        .catch((err) => console.error("Lỗi lưu wishlist:", err));
};

function updateWishlistUI() {
    const buttons = document.querySelectorAll('.wishlist-btn');
    buttons.forEach(btn => {
        const gameName = btn.getAttribute('data-game');
        if (wishlist.includes(gameName)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 6. CART UI & LOGIC
window.renderCart = function() {
    const container = document.getElementById('cartItems');
    const countLabel = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cartTotal');
    if (!container) return;
    
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        const loginNote = !currentUser ? '<p style="color:#bbb; font-size:0.9em; margin-top:6px;">Đăng nhập để lưu giỏ hàng.</p>' : '';
        container.innerHTML = `<div style="text-align: center; margin-top: 30px; color: #888;"><i class="fas fa-shopping-basket" style="font-size: 40px; margin-bottom: 10px;"></i><p>Giỏ hàng trống</p>${loginNote}</div>`;
    }

    cart.forEach((item, index) => {
        total += item.price;
        let priceText = item.price === 0 ? "Free" : `$${item.price}`;
        let displayImg = item.image;
        if (window.location.pathname.includes("/games/")) { displayImg = "../" + item.image; }

        container.innerHTML += `
            <div class="cart-item">
                <img src="${displayImg}" alt="${item.name}">
                <div><h4>${item.name}</h4><p>${priceText}</p></div>
                <span class="remove-item" onclick="removeFromCart(${index})">Xóa</span>
            </div>`;
    });

    if(countLabel) countLabel.innerText = cart.length;
    if(totalLabel) totalLabel.innerText = '$' + total.toFixed(2);
};

document.body.insertAdjacentHTML('beforeend', `<div id="toast"><i class="fas fa-check-circle"></i> <span id="toast-msg">Đã thêm vào giỏ!</span></div>`);

window.addToCart = function(name, price, imageSrc) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) { showToast(`"${name}" đã có trong giỏ hàng rồi!`, true); return; }

    cart.push({ name, price, image: imageSrc });
    saveData();
    window.renderCart(); 
    
    // Animation bay vào giỏ
    const productImg = document.querySelector('.detail-img') || document.querySelector(`img[alt="${name}"]`);
    const cartIcon = document.querySelector('.cart-icon');
    if (productImg && cartIcon) {
        const flyImg = productImg.cloneNode();
        flyImg.classList.add('fly-item');
        document.body.appendChild(flyImg);
        const imgRect = productImg.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();
        flyImg.style.top = imgRect.top + "px"; flyImg.style.left = imgRect.left + "px";
        flyImg.style.width = imgRect.width + "px"; flyImg.style.height = imgRect.height + "px";
        setTimeout(() => {
            flyImg.style.top = (cartRect.top + 10) + "px"; flyImg.style.left = (cartRect.left + 10) + "px";
            flyImg.style.width = "20px"; flyImg.style.height = "20px"; flyImg.style.opacity = "0.5";
        }, 50);
        setTimeout(() => {
            flyImg.remove(); cartIcon.classList.add('cart-shake');
            setTimeout(() => cartIcon.classList.remove('cart-shake'), 400);
            showToast(`Đã thêm "${name}" thành công!`);
        }, 800);
    } else {
        showToast(`Đã thêm "${name}" thành công!`);
        if(cartIcon) { cartIcon.classList.add('cart-shake'); setTimeout(() => cartIcon.classList.remove('cart-shake'), 400); }
    }
};

function showToast(message, isWarning = false) {
    const toast = document.getElementById("toast");
    const msgSpan = document.getElementById("toast-msg");
    msgSpan.innerText = message;
    toast.style.backgroundColor = isWarning ? "#e74c3c" : "#27ae60"; 
    toast.querySelector('i').className = isWarning ? "fas fa-heart-broken" : "fas fa-check-circle";
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

window.removeFromCart = function(index) { cart.splice(index, 1); saveData(); window.renderCart(); };
window.toggleCart = function() { document.getElementById('cartSidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('active'); };

// 7. FILTER & SORT
window.filterGame = function(category) {
    let buttons = document.getElementsByClassName('filter-btn');
    for (let btn of buttons) {
        btn.classList.remove('active');
        if (btn.innerText.includes(category) || (category === 'all' && btn.innerText === 'Tất cả')) btn.classList.add('active');
    }
    if(event && event.target) event.target.classList.add('active');

    let cards = document.getElementsByClassName('product-card');
    for (let card of cards) {
        let genre = card.querySelector('.genre').innerText;
        let price = card.querySelector('.price').innerText;
        if (category === 'all') card.style.display = "";
        else if (category === 'Free') { if (price.includes('Free')) card.style.display = ""; else card.style.display = "none"; }
        else { if (genre.includes(category)) card.style.display = ""; else card.style.display = "none"; }
    }
};

window.sortGames = function() {
    let sortValue = document.getElementById('sortSelect').value;
    let container = document.getElementById('gameGrid');
    let cards = Array.from(container.getElementsByClassName('product-card'));

    cards.sort((a, b) => {
        let priceA = a.querySelector('.price').innerText;
        let priceB = b.querySelector('.price').innerText;
        let nameA = a.querySelector('h3').innerText.toLowerCase();
        let nameB = b.querySelector('h3').innerText.toLowerCase();
        let valA = priceA.includes('Free') ? 0 : parseFloat(priceA.replace('$', ''));
        let valB = priceB.includes('Free') ? 0 : parseFloat(priceB.replace('$', ''));

        if (sortValue === 'price_asc') return valA - valB;
        else if (sortValue === 'price_desc') return valB - valA;
        else if (sortValue === 'name_az') return nameA.localeCompare(nameB);
        else if (sortValue === 'name_za') return nameB.localeCompare(nameA);
        else return 0;
    });
    container.innerHTML = "";
    cards.forEach(card => container.appendChild(card));
    window.dispatchEvent(new Event('scroll'));
};

// 8. PAYMENT & QR
const MY_BANK = { BANK_ID: 'MB', ACCOUNT_NO: '0357876625', ACCOUNT_NAME: 'DO QUANG THANG', TEMPLATE: 'compact2' };
window.openCheckout = function() {
    if (cart.length === 0) { alert("Giỏ hàng đang trống!"); return; }
    if (!currentUser) { alert("Vui lòng đăng nhập!"); window.location.href = "login.html"; return; }
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
    modal.style.display = "flex"; 
    window.toggleCart(); 
};
window.closePaymentModal = function() { document.getElementById('paymentModal').style.display = "none"; };
window.confirmPayment = function() {
    const btn = document.querySelector('.confirm-pay-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ĐANG KIỂM TRA...';
    btn.style.opacity = "0.7"; btn.disabled = true;
    setTimeout(() => {
        const itemsWithLinks = cart.map(item => { return { ...item, downloadLink: GAME_DATABASE[item.name] || "#" }; });
        const orderData = {
            items: itemsWithLinks,
            total: cart.reduce((sum, item) => sum + item.price, 0),
            date: new Date().toLocaleString('vi-VN'),
            paymentMethod: 'QR Transfer',
            status: 'Completed'
        };
        push(ref(db, `orders/${currentUser.uid}`), orderData)
        .then(() => {
            alert("Thanh toán thành công!");
            cart = []; saveData(); window.renderCart(); window.closePaymentModal();
            const isInGameFolder = window.location.pathname.includes("/games/");
            window.location.href = isInGameFolder ? "../profile.html" : "profile.html";
        })
        .catch((err) => { console.error(err); alert("Lỗi kết nối!"); })
        .finally(() => { btn.innerHTML = originalText; btn.style.opacity = "1"; btn.disabled = false; });
    }, 2000);
};

// 9. UI HELPER & LOGOUT
window.searchGame = function() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.getElementsByClassName('product-card');
    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
        cards[i].style.display = title.includes(input) ? "" : "none";
    }
};

// Tag Filter Function
window.filterByTag = function(tag) {
    let cards = document.getElementsByClassName('product-card');
    
    // Update active button state
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Filter cards based on tag
    for (let i = 0; i < cards.length; i++) {
        let cardTags = cards[i].getAttribute('data-tags');
        
        if (tag === 'all') {
            cards[i].style.display = "";
        } else if (cardTags && cardTags.includes(tag)) {
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
        userBox.innerHTML = `<a href="${pathPrefix}profile.html" style="color: #e74c3c; text-decoration: none; font-weight: bold; margin-right: 15px; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-user-circle" style="font-size: 1.2em;"></i><span style="text-transform: none;">${email.split('@')[0]}</span></a><button onclick="logout()" style="padding: 5px 10px; background: transparent; border: 1px solid #666; color: #ccc; cursor: pointer; border-radius: 4px;">Đăng xuất</button>`;
    } else {
        userBox.innerHTML = `<a href="${pathPrefix}login.html" style="color: #fff; text-decoration: none; font-weight: bold;">Đăng nhập</a>`;
    }
}
window.logout = function() { signOut(auth).then(() => location.reload()).catch(console.error); };
window.addEventListener('scroll', reveal);
function reveal() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        if (revealtop < windowheight - 50) { reveals[i].classList.add('active'); } 
        else { reveals[i].classList.remove('active'); }
    }
}
reveal();
const logo = document.querySelector('.logo');
if (logo) { logo.style.cursor = 'pointer'; logo.addEventListener('click', function() { const isInGameFolder = window.location.pathname.includes("/games/"); window.location.href = (isInGameFolder ? "../" : "") + "index.html"; }); }

// 10. TAWK.TO & CHAT MENU (ĐÃ FIX SCOPE)
const PAGE_ID = "981930334992893"; 
const TAWK_SRC = 'https://embed.tawk.to/69439d6ea93b66197f06d88c/1jco1tu20'; 

const styleChat = document.createElement('style');
styleChat.innerHTML = `
    .chat-container { position: fixed; bottom: 30px; right: 30px; z-index: 999999; display: flex; flex-direction: column-reverse; align-items: center; gap: 15px; transition: 0.3s; }
    .chat-container.hidden { display: none !important; }
    .main-chat-btn { width: 60px; height: 60px; background: #e74c3c; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; cursor: pointer; box-shadow: 0 0 20px rgba(231, 76, 60, 0.6); transition: 0.3s; position: relative; }
    .main-chat-btn:hover { transform: scale(1.1); }
    .chat-container.active .main-chat-btn { background: #333; transform: rotate(45deg); }
    .sub-chat-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; cursor: pointer; text-decoration: none; opacity: 0; transform: translateY(20px) scale(0); pointer-events: none; transition: 0.4s; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
    .chat-container.active .sub-chat-btn { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    .btn-mess { background: #0084FF; transition-delay: 0.1s; } 
    .btn-tawk { background: #03a84e; transition-delay: 0.05s; }
    .sub-chat-btn::before { content: attr(data-tooltip); position: absolute; right: 60px; background: rgba(0,0,0,0.8); color: #fff; padding: 5px 10px; border-radius: 5px; font-size: 12px; opacity: 0; transition: 0.3s; pointer-events: none; white-space: nowrap; }
    .sub-chat-btn:hover::before { opacity: 1; }
    
    #tawk-bubble-container, .tawk-bubble-container, div[class*="tawk-bubble"] { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
    .tawk-min-container { display: none !important; }
`;
document.head.appendChild(styleChat);

const chatHTML = `
    <div class="chat-container" id="chatMenu">
        <div class="main-chat-btn" onclick="toggleChatMenu()"><i class="fas fa-comment-dots"></i></div>
        <a href="https://m.me/${PAGE_ID}" target="_blank" class="sub-chat-btn btn-mess" data-tooltip="Chat Facebook"><i class="fab fa-facebook-messenger"></i></a>
        <div onclick="openTawk()" class="sub-chat-btn btn-tawk" data-tooltip="Chat trực tiếp"><i class="fas fa-headset"></i></div>
    </div>`;
document.body.insertAdjacentHTML('beforeend', chatHTML);

// Các hàm toàn cục cho Chat
window.toggleChatMenu = function() { document.getElementById('chatMenu').classList.toggle('active'); };
window.openTawk = function() { if (window.Tawk_API) { window.Tawk_API.showWidget(); window.Tawk_API.maximize(); document.getElementById('chatMenu').classList.add('hidden'); } };

// Cấu hình Tawk.to dùng biến window
window.Tawk_API = window.Tawk_API || {};
window.Tawk_LoadStart = new Date();
window.Tawk_API.onLoad = function(){ window.Tawk_API.hideWidget(); };
window.Tawk_API.onChatMaximized = function(){ document.getElementById('chatMenu').classList.add('hidden'); };
window.Tawk_API.onChatMinimized = function(){ window.Tawk_API.hideWidget(); document.getElementById('chatMenu').classList.remove('hidden'); };
window.Tawk_API.onChatHidden = function(){ document.getElementById('chatMenu').classList.remove('hidden'); };

(function(){
    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
    s1.async=true; s1.src=TAWK_SRC; s1.charset='UTF-8'; s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0);
})();

setInterval(() => { if (window.Tawk_API && !window.Tawk_API.isChatMaximized()) { const menu = document.getElementById('chatMenu'); if (menu && menu.classList.contains('hidden')) { window.Tawk_API.hideWidget(); menu.classList.remove('hidden'); } } }, 1000);