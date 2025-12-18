<!-- Copilot instructions for contributors and AI agents -->
# Copilot / AI Agent Instructions

Short, action-focused guidance to help an AI developer be productive in this repo.

1. Project purpose
- This is a small static website served as a GitHub Pages site (no build tool).
- Main logic lives in plain ES modules (browser imports) under the repo root.

2. Key files & responsibilities
- `firebase.js`: Firebase initialization and exported `auth` and `db` objects. Changing `databaseURL` or credentials affects runtime immediately.
- `auth.js`: Login/register flows using Firebase Auth. UI elements are selected by id (e.g., `submitBtn`, `email`, `password`). Preserve the DOM ids when modifying auth UI.
- `script.js`: Primary client app logic — cart management, UI render (`window.renderCart`), QR payment generation (`openCheckout` / `confirmPayment`), and `onAuthStateChanged` handler that loads/saves `carts/${userId}` in the Realtime Database.
- HTML pages: `index.html`, `login.html`, `profile.html`, and `games/*.html` — these rely on global `window.*` functions from `script.js` and `auth.js` for onclick handlers.

3. Important patterns & conventions
- No bundler: use CDN ES module imports (e.g., Firebase v10 CDN). Keep import paths intact.
- DOM-first UI: code updates UI via `innerHTML` and element ids. Many functions are attached to `window` so HTML can call them directly (e.g., `onclick="logout()"`). If you refactor to modules, update HTML call sites.
- Realtime Database paths: carts are stored at `carts/${user.uid}`, orders at `orders/${user.uid}`. Use `ref(db, 'carts/' + uid)` and `push(ref(db, 'orders/' + uid), orderData)` consistently.
- Localization: user-facing strings are Vietnamese. Preserve language unless asked otherwise.
- Path handling: pages detect if they are inside `/games/` using `window.location.pathname.includes('/games/')` and adjust relative links via `pathPrefix` — keep this logic when moving files.

4. Common tasks and examples
- Add an item to cart (JS): call `window.addToCart(name, price, imageSrc)` or push to `cart` array and then `saveData()` and `window.renderCart()`.
- Persisting cart: `saveData()` writes `carts/${currentUser.uid}`. Ensure `currentUser` is set by Firebase `onAuthStateChanged` before saving.
- Create order: `push(ref(db, 'orders/' + currentUser.uid), orderData)` and then clear `cart` + `saveData()`.

5. Testing & running locally
- No build step — open `index.html` (or pages in `games/`) in a browser. Use a local static server for correct module import resolution if needed (e.g., `python -m http.server 8000` from repo root).

6. Safety & secrets
- `firebase.js` contains the Firebase config for the project. These are intentionally in source for a client web app; do NOT move to server-side without updating the deployment model.

7. When editing
- Prefer minimal, local changes: preserve exported names from `firebase.js` (`auth`, `db`) and global `window` function names used by HTML.
- If changing an element id referenced in JS, update all HTML pages under root and `games/`.

8. Where to look next
- Read `script.js` for cart/payment flow and `auth.js` for login flow. See `firebase.js` to understand data endpoints.

If any section is unclear or you want additional examples (e.g., refactor `window` functions into modules), tell me which part to expand.
