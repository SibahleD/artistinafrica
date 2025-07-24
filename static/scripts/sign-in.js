document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok) {
            sessionStorage.setItem("user_id", result.user_id);
            sessionStorage.setItem("username", result.username);
            sessionStorage.setItem("user_type", result.user_type);

            const cachedUsername = sessionStorage.getItem("username");
            const cachedUserType = sessionStorage.getItem("user_type");
            const cachedUserId = sessionStorage.getItem("user_id");

            console.log("✅ Logged in as:", cachedUsername, `(${cachedUserType})`);
            console.log(`UserID: ${cachedUserId}`)
            console.log(`Welcome ${cachedUsername}!\nUser Type: ${cachedUserType}`);

            alert("✅ Login successful!");
            window.location.href = "/";
        } else {
            alert(`❌ Login failed: ${result.error}`);
        }
    });
});


// Password visibility toggle
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
