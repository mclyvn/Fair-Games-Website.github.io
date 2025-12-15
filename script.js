let cart = [];
let total = 0;

// Mở/Đóng giỏ hàng
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

// Thêm vào giỏ
function addToCart(name, price, image) {
    // Thêm sản phẩm vào mảng
    cart.push({ name, price, image });
    
    // Cập nhật lại giao diện giỏ hàng
    renderCart();
    
    // Tự động mở giỏ hàng để user thấy
    const sidebar = document.getElementById('cartSidebar');
    if (!sidebar.classList.contains('open')) {
        toggleCart();
    }
}

// Xóa khỏi giỏ
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

// Vẽ lại giỏ hàng (Render)
function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    cartItemsContainer.innerHTML = ''; // Xóa cũ
    total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">Giỏ hàng trống trơn :(</p>';
    }

    cart.forEach((item, index) => {
        total += item.price;
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>$${item.price}</p>
                <span class="remove-item" onclick="removeFromCart(${index})">Xóa</span>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Cập nhật số lượng và tổng tiền
    cartCount.innerText = cart.length;
    cartTotal.innerText = '$' + total.toFixed(2);
}
