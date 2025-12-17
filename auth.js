import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ==========================================
// 1. PHẦN DÙNG CHUNG (CHO CẢ TRANG CHỦ & LOGIN)
// ==========================================

// Hàm đăng xuất (Gắn vào window để gọi được từ onclick="logout()" bên HTML)
window.logout = function () {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("userEmail"); // Xóa thông tin lưu tạm
      window.location.reload(); // Tải lại trang để cập nhật giao diện
    })
    .catch((error) => {
      console.error("Lỗi đăng xuất:", error);
    });
};

// Theo dõi trạng thái đăng nhập để lưu vào LocalStorage
onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem("userEmail", user.email);
  } else {
    localStorage.removeItem("userEmail");
  }
});

// ==========================================
// 2. PHẦN RIÊNG CHO TRANG LOGIN (LOGIN.HTML)
// ==========================================

// Kiểm tra xem có nút submitBtn không (nghĩa là đang ở trang Login)
const submitBtn = document.getElementById("submitBtn");

if (submitBtn) {
  // --- BIẾN TRẠNG THÁI ---
  let isLoginMode = true;

  // --- LẤY CÁC PHẦN TỬ HTML ---
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const titleEl = document.getElementById("title");
  const switchBtn = document.getElementById("switchBtn");
  const switchText = document.getElementById("switchText");
  const msgEl = document.getElementById("authMessage");

  // --- XỬ LÝ SỰ KIỆN ---
  submitBtn.addEventListener("click", () => {
    const email = emailEl.value;
    const password = passwordEl.value;
    showMsg("Đang xử lý...", "blue");

    if (isLoginMode) {
      handleLogin(email, password);
    } else {
      handleRegister(email, password);
    }
  });

  switchBtn.addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    updateUI();
  });

  // ... (Phần đầu file giữ nguyên) ...

  // --- CÁC HÀM HỖ TRỢ (Chỉ dùng trong trang Login) ---
  function updateUI() {
    showMsg(""); // Xóa thông báo lỗi cũ
    
    if (isLoginMode) {
      // Chế độ ĐĂNG NHẬP
      titleEl.innerText = "Đăng nhập";
      
      // 👇 QUAN TRỌNG: Dùng innerHTML để giữ lại icon + Chữ thường
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
      
      switchText.innerText = "Chưa có tài khoản?";
      switchBtn.innerText = "Đăng ký ngay";
    } else {
      // Chế độ ĐĂNG KÝ
      titleEl.innerText = "Đăng ký tài khoản";
      
      // 👇 QUAN TRỌNG: Dùng innerHTML để giữ lại icon + Chữ thường
      submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Đăng ký';
      
      switchText.innerText = "Đã có tài khoản?";
      switchBtn.innerText = "Đăng nhập ngay";
    }
  }

// ... (Phần còn lại giữ nguyên) ...

  function handleLogin(email, password) {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showMsg("✅ Đăng nhập thành công!", "green");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      })
      .catch((error) => handleError(error));
  }

  function handleRegister(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showMsg("✅ Đăng ký thành công! Đang vào...", "green");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      })
      .catch((error) => handleError(error));
  }

  function showMsg(msg, color = "red") {
    if (msgEl) {
      msgEl.style.color = color;
      msgEl.innerText = msg;
    }
  }

  function handleError(error) {
    console.error(error);
    let message = error.message;
    if (error.code === "auth/invalid-email") message = "Email không hợp lệ.";
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    )
      message = "Sai email hoặc mật khẩu.";
    if (error.code === "auth/email-already-in-use")
      message = "Email này đã được đăng ký.";
    if (error.code === "auth/weak-password")
      message = "Mật khẩu phải có ít nhất 6 ký tự.";
    showMsg("⚠️ " + message);
  }
}