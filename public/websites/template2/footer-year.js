document.addEventListener('DOMContentLoaded', function() {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}); 