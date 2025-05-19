document.addEventListener("DOMContentLoaded", function () {
    // Toggle visibility of feedback per topic
    document.querySelectorAll(".topic-title").forEach(function (el) {
        el.addEventListener("click", function () {
            const container = this.nextElementSibling;
            container.style.display = (container.style.display === "none" || container.style.display === "") ? "block" : "none";
        });
    });

    // Hide feedback item
    document.querySelectorAll(".hide-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const parent = this.closest(".feedback-item");
            parent.style.display = "none";
            // TODO: Optional - Send AJAX to save this preference
        });
    });

    // Live search filtering
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("keyup", function () {
            const query = this.value.toLowerCase();
            document.querySelectorAll(".feedback-item").forEach(function (item) {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? "block" : "none";
            });
        });
    }
});
