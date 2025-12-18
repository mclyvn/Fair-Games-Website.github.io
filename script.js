// ============================================================
// 1. IMPORT & CONFIG
// ============================================================
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get, child, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ============================================================
// 2. KHỞI TẠO BIẾN TOÀN CỤC
// ============================================================
let cart = []; 
let wishlist = []; 
let currentUser = null; 
let currentFilterTag = 'all'; // Biến lưu tag đang chọn

// Danh sách Link tải game
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

// Load giỏ hàng tạm thời
function loadGuestCartFromLocalStorage() {
    try {
        const raw = localStorage.getItem('guestCart');
        if (raw) cart = JSON.parse(raw) || [];
    } catch (e) { console.error(e); cart = []; }
}
loadGuestCartFromLocalStorage();

// ============================================================
// 3. XỬ LÝ AUTH (ĐĂNG NHẬP/ĐĂNG XUẤT)
// ============================================================
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

function updateUserBox(email) {
    const userBox = document.getElementById("userBox");
    const isInGameFolder = window.location.pathname.includes("/games/");
    const pathPrefix = isInGameFolder ? "../" : "";
    if (email) {
        userBox.innerHTML = `<a href="${pathPrefix}profile.html" style="color: #e74c3c; text-decoration: none; font-weight: bold; margin-right: 15px; display: inline-flex; align