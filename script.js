let cart = JSON.parse(localStorage.getItem('MY_CART')) || [];

window.onload = function() {
    renderCart();
};

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

function addToCart(name, price, image) {
    cart.push({ name, price, image });
    saveCart();
    renderCart();
    
    // Mở giỏ hàng khi thêm
    const sidebar = document.getElementById('cartSidebar');
    if (!sidebar.classList.contains('open')) toggleCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('MY_CART', JSON.stringify(cart));
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const countLabel = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cartTotal');
    
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center;">Giỏ hàng trống</p>';
    }

    cart.forEach((item, index) => {
        total += item.price;
        let priceText = item.price === 0 ? "Free" : `$${item.price}`;
        
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <h4 style="font-size:14px;">${item.name}</h4>
                    <p style="color:#e74c3c; font-size:12px;">${priceText}</p>
                </div>
                <span class="remove-item" onclick="removeFromCart(${index})">Xóa</span>
            </div>
        `;
    });

    if(countLabel) countLabel.innerText = cart.length;
    if(totalLabel) totalLabel.innerText = '$' + total.toFixed(2);
}

/* --- XỬ LÝ THANH TOÁN --- */
function openCheckout() {
    if(cart.length === 0) { alert("Giỏ hàng trống!"); return; }
    document.getElementById('paymentTotal').innerText = '$' + cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    document.getElementById('checkoutModal').style.display = 'flex';
    toggleCart(); // Đóng sidebar
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function processPayment(e) {
    e.preventDefault();
    const btn = document.querySelector('.pay-btn');
    btn.innerText = "Đang xử lý...";
    btn.style.background = "#777";
    
    setTimeout(() => {
        alert("Thanh toán thành công! Key game đã gửi về email.");
        cart = [];
        saveCart();
        renderCart();
        closeCheckout();
        btn.innerText = "Xác nhận thanh toán";
        btn.style.background = "#e74c3c";
    }, 1500);
}

/* --- CHỨC NĂNG TÌM KIẾM GAME --- */
function searchGame() {
    // 1. Lấy nội dung người dùng nhập vào và chuyển thành chữ thường
    let input = document.getElementById('searchInput').value.toLowerCase();
    
    // 2. Lấy danh sách tất cả các thẻ game
    let cards = document.getElementsByClassName('product-card');

    // 3. Duyệt qua từng thẻ để kiểm tra
    for (let i = 0; i < cards.length; i++) {
        // Lấy tên game trong thẻ h3
        let title = cards[i].getElementsByTagName('h3')[0].innerText.toLowerCase();

        // Kiểm tra: Nếu tên game có chứa từ khóa (input)
        if (title.includes(input)) {
            cards[i].style.display = ""; // Hiển thị bình thường
        } else {
            cards[i].style.display = "none"; // Ẩn đi
        }
    }
}