document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.querySelector(".btn-pass-show");

    toggleBtn.addEventListener("click", function (e) {
        e.preventDefault(); // prevent form submission

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordInput.style.backgroundColor = "pink";
        } else {
            passwordInput.type = "password";
            passwordInput.style.backgroundColor = "";
        }
    });
});
