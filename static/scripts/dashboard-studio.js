document.addEventListener("DOMContentLoaded", async () => {
  // === Profile Loading ===
  const userId = sessionStorage.getItem("user_id");
  if (!userId) return alert("User not logged in.");

  // Studio Name
  document.getElementById("studio-name").textContent = "Studio Name";

  // Owner Name
  document.getElementById("owner-name").textContent = "Owner Name";

  // Location
  document.getElementById("studio-location").textContent = "City, Country";

  // Avatar
  const avatar = document.querySelector(".hero-avatar-image");
  avatar.src = "../static/images/studio-placeholder.png";

  // Bio
  document.querySelector(".studio-bio").textContent =
    "No description available";

  // Equipment
  const equipmentList = document.getElementById("equipment-list");
  equipmentList.innerHTML = "<li>No equipment listed</li>";

  // Pricing
  const pricingList = document.getElementById("pricing-list");
  pricingList.innerHTML = "<li>No pricing information</li>";

  // Social Links
  const socialLinks = document.querySelector(".hero-social-links");
  socialLinks.innerHTML = "<p>No social links available</p>";

  // Gallery
  const galleryContent = document.querySelector(".gallery-content");
  galleryContent.innerHTML = "<p>No gallery images available</p>";

  // Bookings
  const bookingsContainer = document.querySelector(".bookings-container");
  bookingsContainer.innerHTML = "<p>No upcoming bookings</p>";

  // Initialize booking action handlers
  initializeBookingActions();

  // === Gallery Upload Modal ===
  const addGalleryBtn = document.querySelector(".beat-add");
  const galleryModal = document.createElement("div");
  galleryModal.className = "gallery-modal hidden";
  galleryModal.innerHTML = `
    <div class="gallery-modal-overlay"></div>
    <div class="gallery-modal-content">
      <h3>Add Gallery Photos</h3>
      <div class="drop-area" id="gallery-drop-area">
        <p>Drag & drop images here or</p>
        <button class="btn-upload" id="gallery-upload-trigger">Select Files</button>
        <input type="file" id="gallery-file-input" accept="image/*" multiple style="display:none;">
      </div>
      <div class="gallery-preview-container hidden" id="gallery-preview-container">
        <div class="gallery-previews" id="gallery-previews"></div>
      </div>
      <div class="modal-buttons">
        <button class="modal-close-btn">Cancel</button>
        <button class="modal-submit-btn">Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(galleryModal);

  const galleryFileInput = document.getElementById("gallery-file-input");
  const galleryUploadTrigger = document.getElementById(
    "gallery-upload-trigger"
  );
  const galleryPreviews = document.getElementById("gallery-previews");
  const galleryPreviewContainer = document.getElementById(
    "gallery-preview-container"
  );
  const gallerySubmitBtn = galleryModal.querySelector(".modal-submit-btn");
  const galleryCloseBtn = galleryModal.querySelector(".modal-close-btn");
  const galleryDropArea = document.getElementById("gallery-drop-area");

  // Show modal
  addGalleryBtn?.addEventListener("click", () => {
    galleryModal.classList.remove("hidden");
    clearGalleryPreviews();
  });

  // Close modal
  galleryCloseBtn?.addEventListener("click", () => {
    galleryModal.classList.add("hidden");
    clearGalleryPreviews();
  });

  // Close on overlay click
  galleryModal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("gallery-modal-overlay")) {
      galleryModal.classList.add("hidden");
      clearGalleryPreviews();
    }
  });

  // Click to upload
  galleryUploadTrigger?.addEventListener("click", () =>
    galleryFileInput.click()
  );

  // Handle file selection
  galleryFileInput?.addEventListener("change", () => {
    if (galleryFileInput.files.length) {
      previewGalleryFiles(galleryFileInput.files);
    }
  });

  // Drag and drop events
  ["dragenter", "dragover"].forEach((eventName) =>
    galleryDropArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      galleryDropArea.classList.add("dragover");
    })
  );

  ["dragleave", "drop"].forEach((eventName) =>
    galleryDropArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      galleryDropArea.classList.remove("dragover");
    })
  );

  // Handle dropped files
  galleryDropArea?.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length) {
      galleryFileInput.files = files;
      previewGalleryFiles(files);
    }
  });

  // Submit gallery upload
  gallerySubmitBtn?.addEventListener("click", async () => {
    const files = galleryFileInput.files;
    if (!files.length) return alert("Please select at least one file.");

    alert("Gallery upload functionality would be implemented here");
    galleryModal.classList.add("hidden");
    galleryFileInput.value = "";
    clearGalleryPreviews();
  });

  // Clear gallery previews
  function clearGalleryPreviews() {
    galleryPreviewContainer.classList.add("hidden");
    galleryPreviews.innerHTML = "";
    galleryFileInput.value = "";
  }

  // Preview gallery files
  function previewGalleryFiles(files) {
    galleryPreviews.innerHTML = "";

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const preview = document.createElement("div");
      preview.className = "gallery-preview-item";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.alt = "Gallery Preview";

      const captionInput = document.createElement("input");
      captionInput.type = "text";
      captionInput.placeholder = "Image caption...";
      captionInput.className = "gallery-caption-input";
      captionInput.dataset.filename = file.name;

      preview.appendChild(img);
      preview.appendChild(captionInput);
      galleryPreviews.appendChild(preview);
    });

    if (galleryPreviews.children.length > 0) {
      galleryPreviewContainer.classList.remove("hidden");
    }
  }

  // === Booking Actions ===
  function initializeBookingActions() {
    document.querySelectorAll(".btn-action.confirm").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        alert("Booking confirmation would be implemented here");
      });
    });

    document
      .querySelectorAll(".btn-action.decline, .btn-action.cancel")
      .forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const action = e.target.classList.contains("decline")
            ? "decline"
            : "cancel";

          if (!confirm(`Are you sure you want to ${action} this booking?`))
            return;

          alert(`Booking ${action} would be implemented here`);
        });
      });

    document.querySelectorAll(".btn-action.edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        alert("Reschedule functionality would open a modal here");
      });
    });
  }

  // === Edit Profile Button ===
  const editProfileBtn = document.getElementById("btn-edit-profile");
  editProfileBtn?.addEventListener("click", () => {
    const editModal = document.querySelector(".edit-profile-modal");
    editModal.classList.add("active");

    // Initialize tab switching
    const menuItems = document.querySelectorAll(".edit-menu-list li");
    const sections = document.querySelectorAll(".edit-section");

    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        const sectionName = item.dataset.section;

        // Update active menu item
        menuItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Show/hide sections and enable/disable their inputs
        sections.forEach((section) => {
          const isActive = section.dataset.name === sectionName;
          section.classList.toggle("active", isActive);

          // Enable inputs in active section, disable in others
          section
            .querySelectorAll("input, select, textarea, button")
            .forEach((el) => {
              el.disabled = !isActive;
            });
        });
      });
    });

    // Set first tab as active by default
    if (menuItems.length > 0) {
      menuItems[0].click();
    }

    // Add this near the top with your other variables
    let currentPrices = [];

    // Function to render the pricing list
    function renderPricingList() {
      const pricingList = document.getElementById("pricing-list-edit");
      pricingList.innerHTML = "";

      currentPrices.forEach((price, index) => {
        const priceItem = document.createElement("div");
        priceItem.className = "price-item";
        priceItem.innerHTML = `
      <div class="price-item-content">
        <select class="edit-service-type" data-index="${index}">
          <option value="Hourly Recording">Hourly Recording</option>
          <option value="Mixing and Mastering">Mixing and Mastering</option>
          <option value="Full Day Rental">Full Day Rental</option>
        </select>
        <input type="number" class="edit-service-price" data-index="${index}" 
               value="${price.price}" placeholder="Price in RWF">
        <button class="btn-remove-price" data-index="${index}">Remove</button>
      </div>
    `;
        pricingList.appendChild(priceItem);
      });

      // Add event listeners for the editable fields
      document.querySelectorAll(".edit-service-type").forEach((select) => {
        select.addEventListener("change", (e) => {
          const index = e.target.dataset.index;
          currentPrices[index].service_type = e.target.value;
        });
      });

      document.querySelectorAll(".edit-service-price").forEach((input) => {
        input.addEventListener("change", (e) => {
          const index = e.target.dataset.index;
          currentPrices[index].price = parseFloat(e.target.value);
        });
      });

      document.querySelectorAll(".btn-remove-price").forEach((button) => {
        button.addEventListener("click", (e) => {
          const index = e.target.dataset.index;
          currentPrices.splice(index, 1);
          renderPricingList();
        });
      });
    }

    // Update the add price button functionality
    document.getElementById("btn-add-price")?.addEventListener("click", () => {
      const serviceTypeSelect = document.getElementById("service-type");
      const serviceType = serviceTypeSelect.value;
      const servicePriceInput = document.getElementById("service-price");
      const price = servicePriceInput.value;


      console.log("Service Type:", serviceType);
      console.log("Price:", price);

      if (!serviceType || serviceType === "") {
        alert("Please select a service type");
        return;
      }

      if (isNaN(price)) {
        alert("Please enter a valid price");
        return;
      }

      if (price <= 0) {
        alert("Please enter a positive price value");
        return;
      }

      // Initialize currentPrices if it doesn't exist
      if (!currentPrices) {
        currentPrices = [];
      }

      currentPrices.push({
        service_type: serviceType,
        price: price,
      });

      renderPricingList();

      // Reset the form
      serviceTypeSelect.value = "";
      priceInput.value = "";
    });
  });

  // Close edit modal when clicking outside
  document
    .querySelector(".edit-profile-overlay")
    ?.addEventListener("click", () => {
      document.querySelector(".edit-profile-modal").classList.remove("active");
    });

  // Add equipment
  document
    .querySelector(".add-equipment button")
    ?.addEventListener("click", () => {
      const input = document.querySelector(".add-equipment input");
      const value = input.value.trim();
      if (!value) return;

      const list = document.getElementById("studioEquipmentList");
      const li = document.createElement("li");
      li.textContent = value;
      list.appendChild(li);
      input.value = "";
    });

  // Add pricing
  document
    .querySelector(".add-pricing button")
    ?.addEventListener("click", () => {
      const serviceType = document.getElementById("service-type").value;
      const price = document.getElementById("service-price").value;

      if (!serviceType || !price) return;

      const list = document.querySelector(".pricing-list");
      const li = document.createElement("li");
      li.textContent = `${serviceType}: ${price} RWF`;
      list.appendChild(li);

      // Reset inputs
      document.getElementById("service-type").value = "";
      document.getElementById("service-price").value = "";
    });
});

document
  .querySelector(".add-equipment button")
  ?.addEventListener("click", () => {
    const input = document.querySelector(".add-equipment input");
    const value = input.value.trim();
    if (!value) return;

    const list = document.getElementById("studioEquipmentList");
    const li = document.createElement("li");
    li.textContent = value;
    list.appendChild(li);
    input.value = "";
  });

// Form submission
document
  .querySelector(".edit-profile-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    alert("Profile update would be implemented here");
  });
