document.addEventListener("DOMContentLoaded", function () {
    // Dashboard redirection
    const dashboardBtn = document.getElementById("btn-dashboard");

    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", function () {
            const userType = sessionStorage.getItem("user_type");

            switch (userType) {
                case "artist":
                    window.location.href = "/dashboard-artist";
                    break;
                case "studio_owner":
                    window.location.href = "/dashboard-studio";
                    break;
                case "service_provider":
                    window.location.href = "/dashboard-service";
                    break;
                default:
                    console.log(userType);
                    sessionStorage.clear();
                    alert("User is logged out. Redirecting to login page");
                    window.location.href = "/sign-in";
                    break;
            }
        });
    }
    // Settings Redirect
    const settingsBtn = document.getElementById("btn-settings");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", function () {
            window.location.href = "/user-settings";
        });
    }

    // Bookings Redirect
    const bookingsBtn = document.getElementById("btn-bookings");
    if (bookingsBtn) {
        bookingsBtn.addEventListener("click", function () {
            const userType = sessionStorage.getItem("user_type");

            if (!userType) {
                
                return;
            }

            switch (userType.toLowerCase()) {
                case "artist":
                    window.location.href = "/booking-artist";
                    break;
                case "studio_owner":
                    window.location.href = "/booking-manager";
                    break;
                case "service_provider":
                    window.location.href = "/booking-manager";
                    break;
                default:
                    alert("Unknown user type.");
            }
        });
    }

    // SynChat Redirect
    const chatBtn = document.getElementById("btn-chat");
    if (chatBtn) {
        chatBtn.addEventListener("click", function () {
            window.location.href = "/synchat";
        });
    }

    // Delete Account Redirect
    const deleteBtn = document.querySelector(".btn-delete");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
            window.location.href = "/delete-account";
        });
    }

    // Logout Functionality
    const logoutBtn = document.getElementById("btn-signout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            // Clear sessionStorage
            sessionStorage.clear();
            // Optional: Add a call to your Flask logout route if needed
            // Redirect to login
            window.location.href = "/sign-in";
        });
    }

    // === Profile modal toggle ===
    const userIcon = document.querySelector(".header-user");
    const profileModal = document.querySelector(".profile-modal");

    if (userIcon && profileModal) {
        userIcon.addEventListener("click", (e) => {
            e.preventDefault();
            profileModal.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!profileModal.contains(e.target) && !userIcon.contains(e.target)) {
                profileModal.classList.remove("show");
            }
        });
    }
});
