document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("artist-register-form");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const country = document.getElementById("country").value;
    const city = document.getElementById("city").value;

    const response = await fetch("/register/artist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username,
        email,
        password,
        country,
        city,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      sessionStorage.setItem("user_id", result.user_id);
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("user_type", "artist");

      alert("✅ Registration successful!");
      window.location.href = "/dashboard";
    } else {
      alert(`❌ Registration failed: ${result.error}`);
    }
  });
});


// Password toggle hidden
document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.querySelector(".btn-pass-show");

  toggleBtn.addEventListener("click", function (e) {
    e.preventDefault();

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      passwordInput.style.backgroundColor = "pink";
    } else {
      passwordInput.type = "password";
      passwordInput.style.backgroundColor = "";
    }
  });
});
