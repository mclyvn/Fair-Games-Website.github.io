// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Thêm thư viện Database
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔥 CẤU HÌNH FIREBASE MỚI (Đã thêm databaseURL)
const firebaseConfig = {
  apiKey: "AIzaSyA7YRuDHYvWx5FJa7emMmEmZpbSbuCjTgA",
  authDomain: "fair-games-8769a.firebaseapp.com",
  // 👇 QUAN TRỌNG: Dòng này giúp kết nối đúng server bạn vừa tạo
  databaseURL: "https://fair-games-8769a-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "fair-games-8769a",
  storageBucket: "fair-games-8769a.firebasestorage.app",
  messagingSenderId: "984853931454",
  appId: "1:984853931454:web:6aac722bfe1a24d53f05ef"
};

// 🔗 KẾT NỐI
const app = initializeApp(firebaseConfig);

// 🔐 XUẤT RA ĐỂ DÙNG Ở FILE KHÁC
export const auth = getAuth(app);
export const db = getDatabase(app);