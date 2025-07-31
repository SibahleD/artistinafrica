document.addEventListener("DOMContentLoaded", function () {
  // Get studio ID from URL or use a default
  const urlParams = new URLSearchParams(window.location.search);
  const studioId = getStudioIdFromURL() || "1";

  // DOM elements
  const bookBtn = document.getElementById("btn-book-studio");
  const bookingModal = document.getElementById("booking-modal");
  const cancelBtn = document.getElementById("cancel-booking");
  const bookingForm = document.getElementById("booking-form");
  const studioNameEl = document.getElementById("modal-studio-name");
  const serviceTypeSelect = document.getElementById("service-type");
  const dateInput = document.getElementById("booking-date");
  const timeSlotSelect = document.getElementById("time-slot");

  // Load studio data
  fetchStudioDetails(studioId);

  // Booking button click handler
  if (bookBtn) {
    bookBtn.addEventListener("click", function () {
      // Directly open the booking modal (assuming user is authenticated)
      openBookingModal();
    });
  }

  // Cancel button handler
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeBookingModal);
  }

  // Date input change handler
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      const selectedDate = this.value;
      if (selectedDate) {
        fetchAvailableTimeSlots(studioId, selectedDate);
      }
    });
  }

  // Form submission handler
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      createBooking(studioId);
    });
  }

  function openBookingModal() {
    // Set studio ID in form
    document.getElementById("studio-id").value = studioId;

    const modalContent = document.querySelector(".modal-booking-content");
    modalContent.style.opacity = "1";
    modalContent.style.transform = "scale(1)";
    // Set studio name in modal
    studioNameEl.textContent =
      document.querySelector(".hero-title").textContent;
    bookingModal.style.display = "block";
    fetchStudioServices(studioId);

    // Show modal
    bookingModal.style.display = "block";
  }

  function closeBookingModal() {
    bookingModal.style.display = "none";
    bookingForm.reset();
  }

  function fetchStudioServices(studioId) {
    fetch(`/api/studio/${studioId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.pricing && data.pricing.length > 0) {
          serviceTypeSelect.innerHTML =
            '<option value="">Select a service</option>';
          data.pricing.forEach((service) => {
            const option = document.createElement("option");
            option.value = service.service_type;
            option.textContent = `${service.service_type} - ${service.price} RWF`;
            serviceTypeSelect.appendChild(option);
          });
        }
      });
  }

  function fetchAvailableTimeSlots(studioId, date) {
    fetch(`/api/studio-availability/${date}?studio_id=${studioId}`)
      .then((response) => response.json())
      .then((data) => {
        timeSlotSelect.innerHTML =
          '<option value="">Select a time slot</option>';
        if (data.available_slots && data.available_slots.length > 0) {
          data.available_slots.forEach((slot) => {
            const option = document.createElement("option");
            option.value = slot;
            option.textContent = slot;
            timeSlotSelect.appendChild(option);
          });
        } else {
          const option = document.createElement("option");
          option.textContent = "No available slots";
          option.disabled = true;
          timeSlotSelect.appendChild(option);
        }
      });
  }

  function getStudioIdFromURL() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1]; // last segment
  }

  function fetchStudioDetails(studioId) {
    fetch(`/api/studio/${studioId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);

        // Update text fields
        document.querySelector(".hero-title").textContent = data.studio_name;
        document.querySelector(".hero-subtitle span a").textContent =
          data.username;
        document.querySelector(".hero-location").textContent =
          data.studio_location;
        document.querySelector(".hero-supporting").textContent =
          data.studio_bio || "no Bio listed yet.";

        // Listing amenities
        if (data.amenities && data.amenities.length > 0) {
          const equipmentList = document.getElementById("equipment-list");
          equipmentList.innerHTML = ""; // Clear existing items

          data.amenities.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = `- ${item}`;
            equipmentList.appendChild(li);
          });
        } else {
          document.getElementById("equipment-list").innerHTML =
            "<li>No equipment listed</li>";
        }

        if (data.pricing && data.pricing.length > 0) {
          const pricingList = document.getElementById("pricing-list");
          pricingList.innerHTML = ""; // Clear existing items

          data.pricing.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = `${
              item.service_type
            }: ${item.price.toLocaleString()} RWF`;
            pricingList.appendChild(li);
          });
        } else {
          document.getElementById("pricing-list").innerHTML =
            "<li>No pricing information available</li>";
        }

        // Gallery images
        updateGallery(data.gallery);
      })
      .catch((err) => {
        console.error("Failed to load studio data:", err);
      });
  }

  function updateGallery(images) {
    const slideContainer = document.querySelector(".gallery-slideshow");
    const dotContainer = document.querySelector(".dot-container");
    slideContainer.innerHTML = "";
    dotContainer.innerHTML = "";

    if (!images || images.length === 0) {
      slideContainer.innerHTML = "<p>No images available.</p>";
      return;
    }

    images.forEach((imgSrc, index) => {
      const slide = document.createElement("div");
      slide.className = "gallery-slide fade";
      slide.innerHTML = `<img src="${imgSrc}" alt="Studio Image ${index + 1}">`;
      slideContainer.appendChild(slide);

      const dot = document.createElement("span");
      dot.className = "dot";
      dotContainer.appendChild(dot);
    });
  }



    fetchStudioDetails(studioId);

    function openBookingModal() {
      // Set studio ID in form
      document.getElementById("studio-id").value = studioId;

      const modalContent = document.querySelector(".modal-booking-content");
      modalContent.style.opacity = "1";
      modalContent.style.transform = "scale(1)";
      studioNameEl.textContent =
        document.querySelector(".hero-title").textContent;
      bookingModal.style.display = "block";
      fetchStudioServices(studioId);
    }

    function closeBookingModal() {
      bookingModal.style.display = "none";
      bookingForm.reset();
    }

    function fetchStudioServices(studioId) {
      fetch(`/api/studio/${studioId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.pricing && data.pricing.length > 0) {
            serviceTypeSelect.innerHTML =
              '<option value="">Select a service</option>';
            data.pricing.forEach((service) => {
              const option = document.createElement("option");
              option.value = service.service_type;
              option.textContent = `${service.service_type} - ${service.price} RWF`;
              serviceTypeSelect.appendChild(option);
            });
          }
        })
        .catch((error) => console.error("Error fetching services:", error));
    }

    function fetchAvailableTimeSlots(studioId, date) {
      fetch(`/api/studio-availability/${date}?studio_id=${studioId}`)
        .then((response) => response.json())
        .then((data) => {
          timeSlotSelect.innerHTML =
            '<option value="">Select a time slot</option>';
          if (data.available_slots && data.available_slots.length > 0) {
            data.available_slots.forEach((slot) => {
              const option = document.createElement("option");
              option.value = slot;
              option.textContent = slot;
              timeSlotSelect.appendChild(option);
            });
          } else {
            const option = document.createElement("option");
            option.textContent = "No available slots";
            option.disabled = true;
            timeSlotSelect.appendChild(option);
          }
        })
        .catch((error) => console.error("Error fetching time slots:", error));
    }

    function createBooking(studioId) {
      const formData = new FormData(bookingForm);

      // Convert FormData to JSON
      const bookingData = {};
      formData.forEach((value, key) => {
        bookingData[key] = value;
      });

      fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Booking created successfully!");
            closeBookingModal();
            // Optionally refresh the page or update UI
          } else {
            alert("Error: " + (data.error || "Failed to create booking"));
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed to create booking");
        });
    }

    // Form submission handler
    if (bookingForm) {
      bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        createBooking(studioId);
      });
    }

    function getStudioIdFromURL() {
      const pathParts = window.location.pathname.split("/");
      return pathParts[pathParts.length - 1]; // last segment
    }

    function fetchStudioDetails(studioId) {
      fetch(`/api/studio/${studioId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);

          // Update text fields
          document.querySelector(".hero-title").textContent = data.studio_name;
          document.querySelector(".hero-subtitle span a").textContent =
            data.username;
          document.querySelector(".hero-location").textContent =
            data.studio_location;
          document.querySelector(".hero-supporting").textContent =
            data.studio_bio || "no Bio listed yet.";

          // Listing amenities
          if (data.amenities && data.amenities.length > 0) {
            const equipmentList = document.getElementById("equipment-list");
            equipmentList.innerHTML = ""; // Clear existing items

            data.amenities.forEach((item) => {
              const li = document.createElement("li");
              li.textContent = `- ${item}`;
              equipmentList.appendChild(li);
            });
          } else {
            document.getElementById("equipment-list").innerHTML =
              "<li>No equipment listed</li>";
          }

          if (data.pricing && data.pricing.length > 0) {
            const pricingList = document.getElementById("pricing-list");
            pricingList.innerHTML = ""; // Clear existing items

            data.pricing.forEach((item) => {
              const li = document.createElement("li");
              li.textContent = `${
                item.service_type
              }: ${item.price.toLocaleString()} RWF`;
              pricingList.appendChild(li);
            });
          } else {
            document.getElementById("pricing-list").innerHTML =
              "<li>No pricing information available</li>";
          }

          // Gallery images
          updateGallery(data.gallery);
        })
        .catch((err) => {
          console.error("Failed to load studio data:", err);
        });
    }

    function updateGallery(images) {
      const slideContainer = document.querySelector(".gallery-slideshow");
      const dotContainer = document.querySelector(".dot-container");
      slideContainer.innerHTML = "";
      dotContainer.innerHTML = "";

      if (!images || images.length === 0) {
        slideContainer.innerHTML = "<p>No images available.</p>";
        return;
      }

      images.forEach((imgSrc, index) => {
        const slide = document.createElement("div");
        slide.className = "gallery-slide fade";
        slide.innerHTML = `<img src="${imgSrc}" alt="Studio Image ${
          index + 1
        }">`;
        slideContainer.appendChild(slide);

        const dot = document.createElement("span");
        dot.className = "dot";
        dotContainer.appendChild(dot);
      });
    }

    // Booking button click handler
    if (bookBtn) {
      bookBtn.addEventListener("click", function () {
        openBookingModal();
      });
    }

    // Cancel button handler
    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeBookingModal);
    }

    // Date input change handler
    if (dateInput) {
      dateInput.addEventListener("change", function () {
        const selectedDate = this.value;
        if (selectedDate) {
          fetchAvailableTimeSlots(studioId, selectedDate);
        }
      });
    }

    // Form submission handler
    if (bookingForm) {
      bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        createBooking();
      });
    }
  });

