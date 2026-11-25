const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const STORAGE_BOOKS = "libra_books_v1";
const STORAGE_LOANS = "libra_loans_v1";

const defaultBooks = [
  {id:1,name:"Clean Code",author:"Robert C. Martin",category:"Technology",quantity:5,borrowed:2},
  {id:2,name:"The Pragmatic Programmer",author:"Andrew Hunt",category:"Technology",quantity:4,borrowed:1},
  {id:3,name:"The Little Prince",author:"Antoine de Saint-Exupéry",category:"Novel",quantity:6,borrowed:0},
  {id:4,name:"A Brief History of Time",author:"Stephen Hawking",category:"Science",quantity:3,borrowed:1},
  {id:5,name:"Learning JavaScript",author:"Ethan Brown",category:"Education",quantity:7,borrowed:0}
];
let books = load(STORAGE_BOOKS, defaultBooks);
let loans = load(STORAGE_LOANS, [
  {id:101,bookId:1,borrower:"Nguyễn Minh Anh",borrowDate:"2025-11-20",returnDate:"",status:"borrowed"},
  {id:102,bookId:2,borrower:"Trần Hoàng Nam",borrowDate:"2025-11-21",returnDate:"",status:"borrowed"},
  {id:103,bookId:4,borrower:"Lê Thu Hà",borrowDate:"2025-11-18",returnDate:"2025-11-23",status:"returned"}
]);

function load(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function save() {
  localStorage.setItem(STORAGE_BOOKS, JSON.stringify(books));
  localStorage.setItem(STORAGE_LOANS, JSON.stringify(loans));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function bookById(id) { return books.find(book => book.id === Number(id)); }
function available(book) { return book.quantity - book.borrowed; }
function statusBadge(book) {
  return available(book) > 0 ? '<span class="badge">Có sẵn</span>' : '<span class="badge out">Hết sách</span>';
}
function dateText(date) {
  if (!date) return "—";
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}
function renderStats() {
  $("#stat-total").textContent = books.reduce((sum, book) => sum + book.quantity, 0);
  $("#stat-available").textContent = books.reduce((sum, book) => sum + available(book), 0);
  $("#stat-borrowed").textContent = books.reduce((sum, book) => sum + book.borrowed, 0);
  $("#stat-titles").textContent = books.length;
}
function renderBookRow(book, showActions = false) {
  return `<tr>
    <td><span class="book-title">${escapeHTML(book.name)}</span></td>
    <td>${escapeHTML(book.author)}</td><td>${escapeHTML(book.category)}</td>
    <td>${statusBadge(book)}</td><td>${available(book)} / ${book.quantity}</td>
    ${showActions ? `<td><div class="actions"><button class="mini" data-edit="${book.id}">Sửa</button><button class="mini danger" data-delete="${book.id}">Xóa</button></div></td>` : ""}
  </tr>`;
}
function renderBooks() {
  const query = ($("#search")?.value || "").toLowerCase().trim();
  const category = $("#category-filter")?.value || "";
  const filtered = books.filter(book =>
    `${book.name} ${book.author}`.toLowerCase().includes(query) &&
    (!category || book.category === category)
  );
  $("#books-list").innerHTML = filtered.map(book => renderBookRow(book, true)).join("");
  $("#empty-books").classList.toggle("hidden", filtered.length > 0);
  $("#recent-books").innerHTML = books.slice(0,5).map(book => renderBookRow(book)).join("");
  renderStats();
}
function renderLoans() {
  const query = ($("#loan-search")?.value || "").toLowerCase().trim();
  const filter = $("#loan-filter")?.value || "all";
  const filtered = loans.filter(loan => {
    const book = bookById(loan.bookId);
    const text = `${book?.name || "Sách đã xóa"} ${loan.borrower}`.toLowerCase();
    return text.includes(query) && (filter === "all" || loan.status === filter);
  });
  $("#loans-list").innerHTML = filtered.map(loan => {
    const book = bookById(loan.bookId);
    return `<tr>
      <td><span class="book-title">${escapeHTML(book?.name || "Sách đã xóa")}</span></td>
      <td>${escapeHTML(loan.borrower)}</td><td>${dateText(loan.borrowDate)}</td><td>${dateText(loan.returnDate)}</td>
      <td>${loan.status === "borrowed" ? '<span class="badge out">Đang mượn</span>' : '<span class="badge">Đã trả</span>'}</td>
      <td>${loan.status === "borrowed" ? `<button class="mini" data-return="${loan.id}">Trả sách</button>` : "—"}</td>
    </tr>`;
  }).join("");
  $("#empty-loans").classList.toggle("hidden", filtered.length > 0);
  renderStats();
}
function renderAll() { renderBooks(); renderLoans(); }
function openBookDialog(book = null) {
  $("#book-form").reset();
  $("#book-id").value = book?.id || "";
  $("#book-modal-title").textContent = book ? "Cập nhật sách" : "Thêm sách mới";
  $("#book-name").value = book?.name || "";
  $("#book-author").value = book?.author || "";
  $("#book-category").value = book?.category || "Technology";
  $("#book-quantity").value = book?.quantity || 1;
  $("#book-dialog").showModal();
}
function openLoanDialog() {
  const availableBooks = books.filter(book => available(book) > 0);
  if (!availableBooks.length) return showToast("Hiện không có sách để cho mượn.");
  $("#loan-book").innerHTML = availableBooks.map(book => `<option value="${book.id}">${escapeHTML(book.name)} (còn ${available(book)})</option>`).join("");
  $("#borrow-date").value = new Date().toISOString().slice(0,10);
  $("#borrower").value = "";
  $("#loan-dialog").showModal();
}
function switchPage(page) {
  $$(".page").forEach(section => section.classList.add("hidden"));
  $(`#${page}-page`).classList.remove("hidden");
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  $("#page-title").textContent = page === "dashboard" ? "Tổng quan" : page === "books" ? "Quản lý sách" : "Mượn / trả sách";
  $("#header-add").classList.toggle("hidden", page === "loans");
}
$$(".nav-item").forEach(button => button.addEventListener("click", () => switchPage(button.dataset.page)));
$$("[data-goto]").forEach(button => button.addEventListener("click", () => switchPage(button.dataset.goto)));
$("#header-add").addEventListener("click", () => openBookDialog());
$("#add-book").addEventListener("click", () => openBookDialog());
$("#new-loan").addEventListener("click", openLoanDialog);
$("#search").addEventListener("input", renderBooks);
$("#category-filter").addEventListener("change", renderBooks);
$("#loan-search").addEventListener("input", renderLoans);
$("#loan-filter").addEventListener("change", renderLoans);

$("#book-form").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#book-id").value;
  const quantity = Number($("#book-quantity").value);
  const existing = id ? bookById(id) : null;
  if (existing && quantity < existing.borrowed) return showToast(`Số lượng phải ít nhất là ${existing.borrowed} vì đang có sách được mượn.`);
  const data = {
    id: id ? Number(id) : Date.now(),
    name: $("#book-name").value.trim(),
    author: $("#book-author").value.trim(),
    category: $("#book-category").value,
    quantity,
    borrowed: existing?.borrowed || 0
  };
  if (existing) books = books.map(book => book.id === existing.id ? data : book);
  else books.unshift(data);
  save(); renderAll(); $("#book-dialog").close(); showToast(existing ? "Đã cập nhật sách." : "Đã thêm sách mới.");
});
$("#loan-form").addEventListener("submit", event => {
  event.preventDefault();
  const book = bookById($("#loan-book").value);
  if (!book || available(book) < 1) return showToast("Sách này hiện không còn bản có sẵn.");
  book.borrowed++;
  loans.unshift({id:Date.now(),bookId:book.id,borrower:$("#borrower").value.trim(),borrowDate:$("#borrow-date").value,returnDate:"",status:"borrowed"});
  save(); renderAll(); $("#loan-dialog").close(); showToast("Đã tạo lượt mượn sách.");
});
document.addEventListener("click", event => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  const ret = event.target.closest("[data-return]");
  if (edit) openBookDialog(bookById(edit.dataset.edit));
  if (del) {
    const book = bookById(del.dataset.delete);
    if (!book) return;
    if (book.borrowed > 0) return showToast("Không thể xóa sách đang có lượt mượn chưa trả.");
    if (confirm(`Bạn có chắc muốn xóa "${book.name}"?`)) {
      books = books.filter(item => item.id !== book.id);
      save(); renderAll(); showToast("Đã xóa sách.");
    }
  }
  if (ret) {
    const loan = loans.find(item => item.id === Number(ret.dataset.return));
    if (!loan || loan.status !== "borrowed") return;
    const book = bookById(loan.bookId);
    if (book) book.borrowed = Math.max(0, book.borrowed - 1);
    loan.status = "returned"; loan.returnDate = new Date().toISOString().slice(0,10);
    save(); renderAll(); showToast("Đã ghi nhận trả sách.");
  }
});
$$("[data-close]").forEach(button => button.addEventListener("click", () => $(`#${button.dataset.close}`).close()));
$("#today").textContent = new Date().toLocaleDateString("vi-VN", {weekday:"short",day:"2-digit",month:"short",year:"numeric"});
renderAll();
