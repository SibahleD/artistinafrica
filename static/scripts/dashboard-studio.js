document.addEventListener("DOMContentLoaded", function () {
  // Load studio data when page loads
  fetchStudioData();

  // Edit Profile button
  document
    .getElementById("btn-edit-profile")
    .addEventListener("click", function () {
      const modal = document.getElementById("edit-profile-modal");
      if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
        document.body.style.opacity = 1;

        // Set default tab and load data
        const firstTab = document.querySelector(
          ".edit-menu-list li[data-section='general']"
        );
        if (firstTab) firstTab.click(); // Triggers tab switch and populates form
      }
    });

  // Cancel buttons
  document.querySelectorAll('.btn-edit[type="button"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = document.getElementById("edit-profile-modal");
      if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
          modal.style.display = "none";
          document.body.style.overflow = "auto";
        }, 300); // Match the transition duration
      }
    });
  });

  // Optional: close if clicked on overlay
  document
    .querySelector(".edit-profile-overlay")
    .addEventListener("click", function () {
      const modal = document.getElementById("edit-profile-modal");
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }, 300);
    });

  const menuItems = document.querySelectorAll(".edit-menu-list li");
  const sections = document.querySelectorAll(".edit-section");

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      const sectionToShow = this.getAttribute("data-section");

      // Remove active state from all menu items
      menuItems.forEach((i) => i.classList.remove("active"));

      // Hide all sections
      sections.forEach((section) => {
        section.style.display =
          section.getAttribute("data-name") === sectionToShow
            ? "block"
            : "none";
      });

      // Add active class to the selected item
      this.classList.add("active");

      // Populate only that section
      populateEditFormFields(sectionToShow);
    });
  });

  // Optional: activate the first section by default
  if (menuItems.length > 0) {
    menuItems[0].click();
  }

  // Equipment upload functionality
  const equipmentAddBtn = document.querySelector(".equipment-add");
  if (equipmentAddBtn) {
    equipmentAddBtn.addEventListener("click", function () {
      document.getElementById("equipment-add-modal").classList.remove("hidden");
    });
  }

  // Studio image upload functionality
  const studioImageAddBtn = document.querySelector(".studio-image-add");
  if (studioImageAddBtn) {
    studioImageAddBtn.addEventListener("click", function () {
      document.getElementById("studio-image-modal").classList.remove("hidden");
    });
  }

  // Close modals
  document.querySelectorAll(".modal-close-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest(".modal").classList.add("hidden");
    });
  });

  // Handle file uploads
  document.querySelectorAll("[data-upload-type]").forEach((uploadArea) => {
    const fileInput = uploadArea.querySelector('input[type="file"]');
    const uploadTrigger = uploadArea.querySelector(".upload-trigger");

    uploadTrigger.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      handleFiles(this.files, uploadArea.dataset.uploadType);
    });

    // Drag and drop functionality
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });

    uploadArea.addEventListener("drop", function (e) {
      const dt = e.dataTransfer;
      handleFiles(dt.files, uploadArea.dataset.uploadType);
    });
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    e.currentTarget.classList.add("highlight");
  }

  function unhighlight(e) {
    e.currentTarget.classList.remove("highlight");
  }

  function handleFiles(files, uploadType) {
    if (files.length > 0) {
      const file = files[0];
      let allowedExtensions;

      if (uploadType === "equipment") {
        allowedExtensions = /(\.jpg|\.jpeg|\.png|\.pdf)$/i;
      } else {
        allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
      }

      if (allowedExtensions.exec(file.name)) {
        const previewContainer = document.getElementById(
          `${uploadType}-preview-container`
        );
        const fileName = document.getElementById(`${uploadType}-file-name`);

        fileName.textContent = file.name;
        previewContainer.style.display = "block";

        if (uploadType === "studio-image" && file.type.match("image.*")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const preview = previewContainer.querySelector(".file-preview");
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;">`;
          };
          reader.readAsDataURL(file);
        }

        // Set up upload button for this file
        document.querySelector(`.${uploadType}-submit-btn`).onclick =
          function () {
            uploadFile(file, uploadType);
          };
      } else {
        alert(
          `Please upload only ${
            uploadType === "equipment" ? "images or PDFs" : "images"
          }`
        );
      }
    }
  }

  function uploadFile(file, uploadType) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_type", uploadType);

    fetch("/upload-studio-file", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert("File uploaded successfully!");
          document
            .querySelector(`#${uploadType}-add-modal`)
            .classList.add("hidden");
          // Refresh the relevant section
          if (uploadType === "studio-image") {
            fetchStudioGallery();
          } else if (uploadType === "equipment") {
            fetchStudioEquipment();
          }
        } else {
          alert("Error uploading file: " + (data.error || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error uploading file");
      });
  }

  // Fetch studio data from backend
  function fetchStudioData() {
    fetch("/api/studio-data")
      .then((response) => response.json())
      .then((data) => {
        if (!data) return;

        // Update profile section
        document.getElementById("studio-name").textContent =
          data.studio_name || "username_1";
        document.getElementById("studio-owner").textContent =
          data.username || "Unknown";
        document.getElementById("studio-location").textContent =
          data.studio_location || "no location";
        document.getElementById("studio-bio").textContent =
          data.studio_bio || "no_bio";

        // Update pricing
        const pricingList = document.getElementById("pricing-list");
        if (pricingList) {
          pricingList.innerHTML = "";

          if (Array.isArray(data.pricing) && data.pricing.length > 0) {
            data.pricing.forEach((item) => {
              console.log(item);
              const li = document.createElement("li");
              li.textContent = `${item.service_type}: ${item.price} RWF`;
              pricingList.appendChild(li);
            });
          } else {
            pricingList.innerHTML = "<li>No Prices listed yet.</li>";
          }
        }

        // Update equipment and gallery
        if (Array.isArray(data.equipment) && data.equipment.length > 0) {
          fetchStudioEquipment();
        } else {
          document.getElementById("equipment-list").innerHTML =
            "<li>No equipment listed yet.</li>";
        }

        if (Array.isArray(data.gallery) && data.gallery.length > 0) {
          fetchStudioGallery();
        } else {
          document.querySelector(".gallery-content").innerHTML =
            "<li>No Gallery listed yet.</li>";
        }
      })
      .catch((error) => {
        console.error("Error fetching studio data:", error);
      });
  }

  // Fetch studio equipment
  function fetchStudioEquipment() {
    fetch("/api/studio-equipment")
      .then((response) => response.json())
      .then((data) => {
        const equipmentList = document.getElementById("equipment-list");
        if (equipmentList) {
          equipmentList.innerHTML = "";

          console.log("Equipment:", equipmentList.innerHTML);

          if (Array.isArray(data) && data.length > 0) {
            data.forEach((item) => {
              const li = document.createElement("li");
              li.innerHTML = `
              <strong>${item.equipment_name}</strong>
              ${
                item.file_name
                  ? `<a href="/uploads/${item.file_name}" target="_blank">View Documentation</a>`
                  : ""
              }
            `;
              equipmentList.appendChild(li);
            });

            // Add delete handlers
            if (typeof deleteEquipment === "function") {
              document.querySelectorAll(".btn-delete").forEach((btn) => {
                btn.addEventListener("click", function () {
                  deleteEquipment(this.dataset.equipmentId);
                });
              });
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching equipment:", error);
      });
  }

  // Fetch studio gallery
  function fetchStudioGallery() {
    fetch("/api/studio-gallery")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          const galleryContent = document.querySelector(".gallery-content");
          galleryContent.innerHTML = "";

          data.forEach((item) => {
            const galleryItem = document.createElement("div");
            galleryItem.className = "gallery-item";
            galleryItem.innerHTML = `
                        <img src="/uploads/${item.file_name}" alt="Studio Image">
                        <button class="btn-delete" data-image-id="${item.image_id}">Delete</button>
                    `;
            galleryContent.appendChild(galleryItem);
          });

          // Add delete button handlers
          document.querySelectorAll(".btn-delete").forEach((btn) => {
            btn.addEventListener("click", function () {
              deleteGalleryImage(this.dataset.imageId);
            });
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching gallery:", error);
      });
  }

  function deleteEquipment(equipmentId) {
    if (confirm("Are you sure you want to delete this equipment?")) {
      fetch(`/api/studio-equipment/${equipmentId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            fetchStudioEquipment();
          } else {
            alert(
              "Error deleting equipment: " + (data.error || "Unknown error")
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error deleting equipment");
        });
    }
  }

  function deleteGalleryImage(imageId) {
    if (confirm("Are you sure you want to delete this image?")) {
      fetch(`/api/studio-gallery/${imageId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            fetchStudioGallery();
          } else {
            alert("Error deleting image: " + (data.error || "Unknown error"));
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error deleting image");
        });
    }
  }

  // Booking form submission
  const bookingForm = document.getElementById("new-booking-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        studio_id: this.elements["studio_id"].value,
        service_type: this.elements["service_type"].value,
        booking_date: this.elements["booking_date"].value,
        time_slot: this.elements["time_slot"].value,
        notes: this.elements["notes"].value,
      };

      fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrf_token"), // Add if using CSRF
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Booking created successfully!");
            this.reset();
            document.getElementById("time-slots").style.display = "none";
            document.getElementById("selected-date").textContent = "";

            // Refresh bookings list
            fetchStudioBookings();
          } else {
            alert("Error creating booking: " + (data.error || "Unknown error"));
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error creating booking");
        });
    });
  }

  // Fetch studio bookings
  function fetchStudioBookings() {
    fetch("/api/studio-bookings")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          const bookingsContainer = document.querySelector(
            ".bookings-container"
          );
          bookingsContainer.innerHTML = "";

          data.forEach((booking) => {
            const bookingCard = document.createElement("div");
            bookingCard.className = "booking-card";
            bookingCard.innerHTML = `
                        <div class="booking-header">
                            <h4>${booking.client_name} - ${
              booking.service_type
            }</h4>
                            <span class="booking-status ${booking.status}">${
              booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
            }</span>
                        </div>
                        <div class="booking-details">
                            <p><strong>Date:</strong> ${
                              booking.booking_date
                            }</p>
                            <p><strong>Time:</strong> ${booking.time_slot}</p>
                            <p><strong>Notes:</strong> ${
                              booking.notes || "None"
                            }</p>
                        </div>
                        <div class="booking-actions">
                            <button class="btn-action ${
                              booking.status === "pending" ? "confirm" : "edit"
                            }" data-booking-id="${booking.booking_id}">
                                ${
                                  booking.status === "pending"
                                    ? "Confirm"
                                    : "Reschedule"
                                }
                            </button>
                            <button class="btn-action cancel" data-booking-id="${
                              booking.booking_id
                            }">
                                ${
                                  booking.status === "pending"
                                    ? "Decline"
                                    : "Cancel"
                                }
                            </button>
                        </div>
                    `;
            bookingsContainer.appendChild(bookingCard);
          });

          // Add event listeners to action buttons
          document.querySelectorAll(".btn-action.confirm").forEach((btn) => {
            btn.addEventListener("click", function () {
              updateBookingStatus(this.dataset.bookingId, "confirmed");
            });
          });

          document.querySelectorAll(".btn-action.cancel").forEach((btn) => {
            btn.addEventListener("click", function () {
              updateBookingStatus(this.dataset.bookingId, "cancelled");
            });
          });

          document.querySelectorAll(".btn-action.edit").forEach((btn) => {
            btn.addEventListener("click", function () {
              rescheduleBooking(this.dataset.bookingId);
            });
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching bookings:", error);
      });
  }

  function updateBookingStatus(bookingId, newStatus) {
    fetch(`/api/studio-bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(`Booking ${newStatus} successfully!`);
          fetchStudioBookings();
        } else {
          alert(`Error: ${data.error || "Failed to update booking status"}`);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error updating booking status");
      });
  }

  function rescheduleBooking(bookingId) {
    // In a real app, you'd show a modal with a form to select new date/time
    const newDate = prompt("Enter new booking date (YYYY-MM-DD):");
    const newTime = prompt("Enter new time slot (HH:MM - HH:MM):");

    if (newDate && newTime) {
      fetch(`/api/studio-bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_date: newDate,
          time_slot: newTime,
          status: "rescheduled",
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Booking rescheduled successfully!");
            fetchStudioBookings();
          } else {
            alert(`Error: ${data.error || "Failed to reschedule booking"}`);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error rescheduling booking");
        });
    }
  }

  function populateEditFormFields(section = "general") {
    fetch("/api/studio-data")
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        // GENERAL section
        if (section === "general") {
          document.getElementById("studio-name").value = data.studio_name || "";
          document.getElementById("studio-location").value =
            data.studio_location || "";
          document.getElementById("studio-bio").value = data.studio_bio || "";
        }

        // PRICING section
        if (section === "pricing") {
          const pricingListEdit = document.getElementById("pricing-list-edit");
          if (pricingListEdit) {
            pricingListEdit.innerHTML = "";
            if (Array.isArray(data.pricing)) {
              data.pricing.forEach((item) => {
                const div = document.createElement("div");
                div.className = "pricing-item";
                div.textContent = `${item.service_type}: ${item.price} RWF`;
                pricingListEdit.appendChild(div);
              });
            }
          }
        }

        // EQUIPMENT section
        if (section === "equipment") {
          const equipmentList = document.getElementById("studioEquipmentList");
          if (equipmentList) {
            equipmentList.innerHTML = "";
            if (Array.isArray(data.equipment)) {
              data.equipment.forEach((item) => {
                const div = document.createElement("div");
                div.className = "equipment-item";
                div.innerHTML = `<span>${item.equipment_name}</span>`;
                equipmentList.appendChild(div);
              });
            }
          }
        }

        // GALLERY section
        if (section === "gallery") {
          const galleryPreview = document.querySelector(".gallery-preview");
          if (galleryPreview) {
            galleryPreview.innerHTML = "";
            if (Array.isArray(data.gallery)) {
              data.gallery.forEach((item) => {
                const img = document.createElement("img");
                img.src = `/uploads/${item.file_name}`;
                img.alt = "Gallery Image";
                img.className = "gallery-thumb";
                galleryPreview.appendChild(img);
              });
            }
          }
        }
      });
  }

  // Add Equipment
  document
    .querySelector(".add-equipment .btn-add")
    ?.addEventListener("click", () => {
      const newEquipment = document
        .getElementById("new-equipment")
        .value.trim();
      if (!newEquipment) return;

      const equipmentList = document.getElementById("studioEquipmentList");
      const equipmentItem = document.createElement("div");
      equipmentItem.className = "equipment-item";
      equipmentItem.innerHTML = `
            <input type="text" value="${newEquipment}" readonly>
            <div class="equipment-actions">
                <button class="btn-edit-equipment">Edit</button>
                <button class="btn-delete-equipment">Delete</button>
            </div>
        `;
      equipmentList.appendChild(equipmentItem);

      // Clear input
      document.getElementById("new-equipment").value = "";
    });

  // Add Pricing
  document
    .querySelector(".add-pricing .btn-add")
    ?.addEventListener("click", () => {
      const serviceType = document.getElementById("service-type").value;
      const servicePrice = document.getElementById("service-price").value;

      if (!serviceType || !servicePrice) return;

      const pricingList = document.querySelector(".pricing-list");
      const pricingItem = document.createElement("div");
      pricingItem.className = "pricing-item";
      pricingItem.innerHTML = `
            <div class="pricing-detail">
                <span class="service-type">${serviceType}</span>
                <span class="service-price">${parseInt(
                  servicePrice
                ).toLocaleString()} RWF</span>
            </div>
            <div class="pricing-actions">
                <button class="btn-edit-pricing">Edit</button>
                <button class="btn-delete-pricing">Delete</button>
            </div>
        `;
      pricingList.appendChild(pricingItem);

      // Clear inputs
      document.getElementById("service-price").value = "";
    });

  // Form Submission
  // Form Submission
  const editForm = document.querySelector(".edit-profile-form");
  editForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const userId = sessionStorage.getItem("user_id");
      if (!userId) throw new Error("User not logged in");

      // Collect form data - only include if not empty
      const formData = new FormData();

      const studioName = document.getElementById("studio-name").value.trim();
      if (studioName) formData.append("studio_name", studioName);
      console.log("Sent Studio name:", studioName);

      const studioLocation = document
        .getElementById("studio-location")
        .value.trim();
      if (studioLocation) formData.append("studio_location", studioLocation);
      console.log("Sent location name:", studioLocation);

      const studioBio = document.getElementById("studio-desc").value.trim();
      if (studioBio) formData.append("studio_bio", studioBio);
      console.log("Sent bio name:", studioBio);

      // Collect equipment - filter out empty values
      const equipment = [];
      document
        .querySelectorAll("#studioEquipmentList input")
        .forEach((input) => {
          const value = input.value.trim();
          if (value) equipment.push(value);
        });
      if (equipment.length > 0) {
        formData.append("equipment", JSON.stringify(equipment));
      }

      // Collect pricing - filter out invalid entries
      const pricing = [];
      document
        .querySelectorAll(".pricing-list pricing-item")
        .forEach((item) => {
          const serviceType = item
            .querySelector(".service-type")
            .textContent.trim();
          const priceText = item
            .querySelector(".service-price")
            .textContent.replace(/\D/g, "");
          const price = parseFloat(priceText);

          if (serviceType && !isNaN(price)) {
            pricing.push({
              service_type: serviceType,
              price: price,
            });
          }
        });
      if (pricing.length > 0) {
        console.log("Sent pricing: ", pricing);
        formData.append("pricing", JSON.stringify(pricing));
      }

      // Handle gallery uploads - only include valid files
      const galleryUpload = document.getElementById("gallery-upload");
      if (galleryUpload.files.length > 0) {
        for (let i = 0; i < galleryUpload.files.length; i++) {
          const file = galleryUpload.files[i];
          if (file.size > 0) {
            // Only include non-empty files
            formData.append("gallery_files", file);
          }
        }
      }

      // Collect gallery captions - filter out empty captions
      const captions = [];
      document
        .querySelectorAll(".gallery-preview-item .gallery-caption-input")
        .forEach((input) => {
          const caption = input.value.trim();
          if (caption) captions.push(caption);
        });
      if (captions.length > 0) {
        formData.append("gallery_captions", JSON.stringify(captions));
      }

      // Send to server
      const response = await fetch(`/api/studio/${userId}/update`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      alert("Profile updated successfully!");
      location.reload();
    } catch (error) {
      console.error("Update error:", error);
      alert("Error updating profile: " + error.message);
    }
  });
});
