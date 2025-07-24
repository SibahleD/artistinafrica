document.addEventListener("DOMContentLoaded", function () {
    // Dashboard redirection
    const dashboardBtn = document.getElementById("btn-dashboard");

    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", function () {
            const userType = sessionStorage.getItem("user_type");

            if (!userType) {
                showLoginModal(); // Show modal if not logged in\
                window.location.href = "/sign-in";
                return;
            }

            switch (userType.toLowerCase()) {
                case "artist":
                    window.location.href = "/dashboard-artist";
                    break;
                case "studio owner":
                    window.location.href = "/dashboard-studio";
                    break;
                case "service provider":
                    window.location.href = "/dashboard-service";
                    break;
                default:
                    alert("Unknown user type.");
                    break;
            }
        });
    }

    // Profile modal toggle
    const userIcon = document.querySelector(".header-user");
    const profileModal = document.querySelector(".profile-modal");

    if (userIcon && profileModal) {
        userIcon.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default behavior
            profileModal.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!profileModal.contains(e.target) && !userIcon.contains(e.target)) {
                profileModal.classList.remove("show");
            }
        });
    }
});

// ✅ Show login modal
function showLoginModal() {
    if (!document.getElementById("login-modal")) {
        const modal = document.createElement("div");
        modal.id = "login-modal";
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>Please log in</h3>
                <p>You must be logged in to access your dashboard.</p>
                <button class="modal-close-btn" onclick="closeLoginModal()">Close</button>
                <a href="/sign-in"><button class="modal-login-btn">Log In</button></a>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function closeLoginModal() {
    const modal = document.getElementById("login-modal");
    if (modal) {
        modal.remove();
    }
}
