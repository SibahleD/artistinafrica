document.addEventListener("DOMContentLoaded", function () {
  // Load user data
  fetchUserData();

  // Setup form sections with enhanced tab switching
  setupFormSections();

  // Setup form validation
  setupFormValidation();

  // Setup form submission
  setupFormSubmission();

  // Setup skill management
  setupSkillManagement();

  // Setup pricing management
  setupPricingManagement();

  // Setup profile picture preview
  setupProfilePicturePreview();

  // Setup confirmation dialogs
  setupConfirmations();

  // Setup dirty form detection
  setupDirtyFormDetection();
});

function setupFormValidation() {
  // Password validation
  const passwordForm = document.querySelector(".edit-profile-password");
  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      const newPass = document.getElementById("password-new").value;
      const confirmPass = document.getElementById("password-again").value;

      if (newPass !== confirmPass) {
        e.preventDefault();
        showAlert("Passwords do not match", "error");
        return;
      }

      if (newPass.length < 8) {
        e.preventDefault();
        showAlert("Password must be at least 8 characters", "error");
        return;
      }
    });
  }

  // General info validation
  const generalForm = document.querySelector(".edit-profile-general");
  if (generalForm) {
    generalForm.addEventListener("submit", function (e) {
      const username = document.getElementById("username").value;
      if (!username || username.length < 3) {
        e.preventDefault();
        showAlert("Username must be at least 3 characters", "error");
        return;
      }
    });
  }
}

function setupProfilePicturePreview() {
  const profilePicInput = document.getElementById("profile-pic-input");
  const profilePic = document.querySelector(".profile-pic");

  if (profilePicInput && profilePic) {
    profilePicInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();

        reader.onload = function (event) {
          profilePic.src = event.target.result;
          // Mark form as dirty
          document
            .querySelector(".edit-profile-general")
            .classList.add("dirty");
        };

        reader.readAsDataURL(file);
      }
    });
  }
}

function setupConfirmations() {
  // Delete skill confirmation
  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("delete-skill")) {
      e.preventDefault();
      showConfirmationDialog(
        "Delete Skill",
        "Are you sure you want to delete this skill?",
        () => {
          const skillItem = e.target.closest(".skill-item");
          deleteSkill(skillItem.getAttribute("data-skill-id"));
          skillItem.remove();
        }
      );
    }

    // Delete pricing confirmation
    if (e.target && e.target.classList.contains("btn-delete-price")) {
      e.preventDefault();
      const priceId = e.target.getAttribute("data-price-id");
      showConfirmationDialog(
        "Delete Pricing Tier",
        "Are you sure you want to delete this pricing tier?",
        () => deletePricing(priceId)
      );
    }
  });
}

function showConfirmationDialog(title, message, confirmCallback) {
  const dialog = document.createElement("div");
  dialog.className = "confirmation-dialog";
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="dialog-buttons">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-confirm">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector(".btn-cancel").addEventListener("click", () => {
    dialog.remove();
  });

  dialog.querySelector(".btn-confirm").addEventListener("click", () => {
    confirmCallback();
    dialog.remove();
  });
}

function setupDirtyFormDetection() {
  const forms = document.querySelectorAll(".edit-profile-form > form");

  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        form.classList.add("dirty");
      });
    });
  });

  // Warn before leaving if forms are dirty
  window.addEventListener("beforeunload", (e) => {
    const dirtyForms = document.querySelectorAll(
      ".edit-profile-form > form.dirty"
    );
    if (dirtyForms.length > 0) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    }
  });

  // Handle cancel buttons
  document.querySelectorAll('.btn-edit[type="button"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const form = this.closest("form");
      if (form.classList.contains("dirty")) {
        showConfirmationDialog(
          "Unsaved Changes",
          "You have unsaved changes. Are you sure you want to cancel?",
          () => {
            form.classList.remove("dirty");
            form.reset();
            // Additional cleanup if needed
          }
        );
      } else {
        form.reset();
      }
    });
  });
}

function fetchUserData() {
  const userId = sessionStorage.getItem("user_id");
  if (!userId) {
    window.location.href = "/sign-in";
    return;
  }

  fetch(`/api/user/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error(data.error);
        return;
      }

      // General info
      document.getElementById("username").value = data.username || "";
      document.getElementById("user_title").value = data.user_title || "";
      document.getElementById("user_bio").value = data.user_bio || "";
      document.getElementById("country").value = data.country || "Rwanda";
      document.getElementById("city").value = data.city || "";

      // Profile picture
      if (data.avatar_url) {
        document.querySelector(".profile-pic").src = data.avatar_url;
      }

      // Skills
      if (data.skills && data.skills.length > 0) {
        const skillList = document.getElementById("skillList");
        skillList.innerHTML = "";

        data.skills.forEach((skill) => {
          console.log(data.skills);
          console.log(skill.skill_name);
          addSkillToDOM(skill.skill_name);
        });
      }

      // Socials
      if (data.socials) {
        data.socials.forEach((social) => {
          const input = document.getElementById(
            `socials-${social.platform.toLowerCase()}-link`
          );
          if (input) {
            input.value = social.url || "";
          }
        });
      }

      // Pricing
      if (data.pricing && data.pricing.length > 0) {
        const pricingContainer = document.querySelector(".edit-lease-existing");
        pricingContainer.innerHTML = "<h3>Existing Leases</h3>";

        data.pricing.forEach((price) => {
          const priceElement = document.createElement("div");
          priceElement.className = "lease-listing";
          priceElement.innerHTML = `
                            <h3>${price.tier}</h3>
                            <p>${price.price} RWF</p>
                            <button class="btn-delete-price" data-price-id="${price.id}">Delete</button>
                        `;
          pricingContainer.appendChild(priceElement);
        });

        // Add delete event listeners
        document.querySelectorAll(".btn-delete-price").forEach((btn) => {
          btn.addEventListener("click", function () {
            const priceId = this.getAttribute("data-price-id");
            deletePricing(priceId);
          });
        });
      }
    })
    .catch((error) => console.error("Error fetching user data:", error));
}

function setupFormSections() {
  const menuItems = document.querySelectorAll(".edit-menu-list li");
  const forms = document.querySelectorAll(".edit-profile-form > form");

  // Hide all forms initially
  forms.forEach((form) => form.classList.remove("active"));

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      const sectionName = this.getAttribute("data-section");

      // Hide all forms and remove active class from menu items
      forms.forEach((form) => form.classList.remove("active"));
      menuItems.forEach((menuItem) => menuItem.classList.remove("active"));

      // Show selected form and mark menu item as active
      const activeForm = document.querySelector(`.edit-profile-${sectionName}`);
      if (activeForm) {
        activeForm.classList.add("active");
        this.classList.add("active");

        // Store current active tab in sessionStorage
        sessionStorage.setItem("lastActiveTab", sectionName);
      }
    });
  });

  // Restore last active tab if available
  const lastActiveTab = sessionStorage.getItem("lastActiveTab");
  if (lastActiveTab) {
    const tabToActivate = document.querySelector(
      `[data-section="${lastActiveTab}"]`
    );
    if (tabToActivate) tabToActivate.click();
  } else if (menuItems.length > 0) {
    menuItems[0].click(); // Default to first tab
  }
}

function setupFormSubmission() {
  const forms = document.querySelectorAll(".edit-profile-form");

  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const sectionName = this.getAttribute("data-name");
      const userId = sessionStorage.getItem("user_id");
      const formData = new FormData();

      // Handle file upload separately for general form
      if (
        sectionName === "general" &&
        document.getElementById("profile-pic-input").files.length > 0
      ) {
        formData.append(
          "avatar",
          document.getElementById("profile-pic-input").files[0]
        );
      }

      // Add other form data
      const data = {
        section: sectionName,
        user_id: userId,
      };
      

      if (sectionName === "general") {
        data.username = document.getElementById("username").value;
        data.user_title = document.getElementById("user_title").value;
        data.user_bio = document.getElementById("user_bio").value;
        data.country = document.getElementById("country").value;
        data.city = document.getElementById("city").value;
      } else if (sectionName === "password") {
        data.old_password = document.getElementById("password-old").value;
        data.new_password = document.getElementById("password-new").value;
      } else if (sectionName === "socials") {
        data.socials = {
          facebook: document.getElementById("socials-fb-link").value,
          instagram: document.getElementById("socials-ig-link").value,
          twitter: document.getElementById("socials-x-link").value,
          youtube: document.getElementById("socials-youtube-link").value,
          other: document.getElementById("socials-spotify-link").value,
        };
      } else if (sectionName === "booking") {
        data.bookings = {
          tier: document.getElementById("booking-type").value,
          price: document.getElementById("booking-price").value,
        };
      }

      formData.append("data", JSON.stringify(data));

      fetch("/api/update-profile", {
        method: "POST",
        section: sectionName,
        body: formData,
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            alert(result.error);
          } else {
            alert("Profile updated successfully!");
            if (sectionName === "general" && result.avatar_url) {
              document.querySelector(".profile-pic").src = result.avatar_url;
            }
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed to update profile");
        });
    });
  });
}

function setupSkillManagement() {
  // Add new skill
  window.addSkill = function () {
    const newSkillInput = document.getElementById("newSkill");
    const skillText = newSkillInput.value.trim();

    if (skillText) {
      console.log(skillText);
      addSkillToDOM(skillText);

      // Save to server
      const userId = sessionStorage.getItem("user_id");
      fetch("/api/add-skill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          skill_name: skillText,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
          }
        });

      newSkillInput.value = "";
    }
  };

  // Setup edit/delete for existing skills
  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("edit-skill")) {
      const skillItem = e.target.closest(".skill-item");
      const input = skillItem.querySelector("input");
      input.disabled = !input.disabled;

      if (!input.disabled) {
        input.focus();
        e.target.textContent = "Save";
      } else {
        e.target.textContent = "Edit";
        updateSkill(skillItem.getAttribute("data-skill-id"), input.value);
      }
    }

    if (e.target && e.target.classList.contains("delete-skill")) {
      const skillItem = e.target.closest(".skill-item");
      if (confirm("Are you sure you want to delete this skill?")) {
        deleteSkill(skillItem.getAttribute("data-skill-id"));
        skillItem.remove();
      }
    }
  });
}

function addSkillToDOM(skill_name, skillId) {
  const skillList = document.getElementById("skillList");
  const skillItem = document.createElement("div");
  skillItem.className = "skill-item";
  skillItem.setAttribute("data-skill-id", skillId || "new");

  skillItem.innerHTML = `
            <input value="${skill_name}" disabled>
            <div class="skill-actions">
                <button class="edit-skill">Edit</button>
                <button class="delete-skill">Delete</button>
            </div>
        `;

  skillList.appendChild(skillItem);
}

function updateSkill(skillId, newText) {
  const userId = sessionStorage.getItem("user_id");
  fetch("/api/update-skill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      skill_id: skillId,
      new_skill: newText,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error(data.error);
      }
    });
}

function deleteSkill(skillId) {
  const userId = sessionStorage.getItem("user_id");
  fetch("/api/delete-skill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      skill_id: skillId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error(data.error);
      }
    });
}

function setupPricingManagement() {
  // Add new pricing tier
  document
    .querySelector(".btn-add-lease")
    ?.addEventListener("click", function () {
      const leaseType = document.getElementById("lease-type").value;
      const leasePrice = document.getElementById("lease-price").value;

      if (!leasePrice || isNaN(leasePrice)) {
        alert("Please enter a valid price");
        return;
      }

      const userId = sessionStorage.getItem("user_id");
      fetch("/api/add-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          tier: leaseType,
          price: parseFloat(leasePrice),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
          } else {
            alert("Pricing tier added successfully!");
            fetchUserData(); // Refresh the pricing list
          }
        });
    });
}

function deletePricing(priceId) {
  const userId = sessionStorage.getItem("user_id");
  fetch("/api/delete-pricing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      price_id: priceId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        alert("Pricing tier deleted successfully!");
        fetchUserData(); // Refresh the pricing list
      }
    });
}
