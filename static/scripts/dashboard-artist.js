document.addEventListener("DOMContentLoaded", function () {
  // Load user data
  fetchUserData();

  // Load portfolio beats
  fetchPortfolioBeats();

  // Setup beat upload modal
  setupBeatUploadModal();

  // Edit profile button
  const editProfileBtn = document.getElementById("btn-edit-profile");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", function () {
      window.location.href = "/user-settings";
    });
  }

  function fetchUserData() {
    fetch("/api/artist-profile")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
          return;
        }

        // Update profile info
        document.getElementById("user-username").textContent = data.username;
        document.getElementById("user-title").textContent =
          data.user_title || "No Title FOund";
        document.getElementById("user-location").textContent = `${data.city}, ${data.country}`;
        document.querySelector(".user-bio").textContent = data.user_bio || "No Bio Found";
        document.getElementById("hero-avatar-image").src = data.avatar_url;

        // Update skills
        const skillsList = document.getElementById("skills-list");
        if (skillsList && data.skills) {
          skillsList.innerHTML = data.skills
            .map((skill) => `<li>${skill}</li>`)
            .join("");
        }

        // Update pricing
        const pricingList = document.getElementById("pricing-list");
        if (pricingList && data.pricing) {
          pricingList.innerHTML = data.pricing
            .map((price) => `<li>${price.tier}: ${price.price} RWF</li>`)
            .join("");
        }

        // Update social links if available
        if (data.socials) {
          data.socials.forEach((social) => {
            const link = document.querySelector(
              `a[href*="${social.platform.toLowerCase()}"]`
            );
            if (link) {
              link.href = social.url;
            }
          });
        }
      })
      .catch((error) => console.error("Error fetching user data:", error));
  }

  function fetchPortfolioBeats() {
    fetch("/api/artist-portfolio")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
          return;
        }

        const portfolioContent = document.querySelector(".portfolio-content");
        if (portfolioContent && data.files) {
          // Clear existing content except the upload button
          const uploadInput =
            portfolioContent.querySelector('input[type="file"]');
          portfolioContent.innerHTML = "";

          data.files.forEach((file) => {
            

            const beatItem = document.createElement("div");
            beatItem.className = "prod-beats-content";
            beatItem.innerHTML = `
        <h3>${file.filename}</h3>
        <div class="btn-controls">
            <a class="play-btn" data-file="${file.filename}">
                <img src="../static/images/icon-play.png">
            </a>
            <a class="pause-btn" style="display:none">
                <img src="../static/images/icon-pause.png">
            </a>
            <a class="volume-btn">
                <img src="../static/images/icon-volume.png">
            </a>
        </div>
    `;
            portfolioContent.appendChild(beatItem);
          });

          // Re-add the upload input
          if (uploadInput) {
            portfolioContent.appendChild(uploadInput);
          }

          // Setup audio controls
          setupAudioControls();
        }
      })
      .catch((error) =>
        console.error("Error fetching portfolio beats:", error)
      );
  }

  function setupAudioControls() {
    document.querySelectorAll(".play-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const filename = this.getAttribute("data-file");
        const audio = new Audio(`/upload/${filename}`);

        // Toggle play/pause
        const parent = this.parentElement;
        const pauseBtn = parent.querySelector(".pause-btn");

        this.style.display = "none";
        pauseBtn.style.display = "inline-block";

        audio.play();

        pauseBtn.onclick = function () {
          audio.pause();
          this.style.display = "none";
          btn.style.display = "inline-block";
        };

        // Handle when audio ends
        audio.onended = function () {
          pauseBtn.style.display = "none";
          btn.style.display = "inline-block";
        };
      });
    });
  }

  function setupBeatUploadModal() {
    const beatAdd = document.querySelector(".beat-add");
    const modal = document.getElementById("beat-add-modal");
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("beat-file-input");
    const uploadTrigger = document.getElementById("beat-upload-trigger");
    const modalCloseBtn = document.querySelector(".modal-close-btn");
    const modalSubmitBtn = document.querySelector(".modal-submit-btn");

    if (!beatAdd || !modal) return;

    beatAdd.addEventListener("click", function () {
      modal.classList.remove("hidden");
    });

    modalCloseBtn.addEventListener("click", function () {
      modal.classList.add("hidden");
      resetFilePreview();
    });

    uploadTrigger.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function (e) {
      handleFiles(e.target.files);
    });

    // Drag and drop functionality
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach((eventName) => {
      dropArea.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      dropArea.classList.add("highlight");
    }

    function unhighlight() {
      dropArea.classList.remove("highlight");
    }

    dropArea.addEventListener("drop", function (e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    });

    modalSubmitBtn.addEventListener("click", function () {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      fetch("/upload-beat", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
          } else {
            alert("Beat uploaded successfully!");
            modal.classList.add("hidden");
            resetFilePreview();
            fetchPortfolioBeats(); // Refresh the list
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed to upload beat");
        });
    });
  }

  function handleFiles(files) {
    const file = files[0];
    if (!file) return;

    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload an audio file (MP3, WAV, or OGG)");
      return;
    }

    // Update file preview
    document.getElementById("file-name").textContent = file.name.replace(
      /\.[^/.]+$/,
      ""
    );

    const filePreview = document.getElementById("file-preview-container");
    filePreview.style.display = "block";

    const audio = new Audio(URL.createObjectURL(file));

    // Setup preview controls
    const playBtn = document.getElementById("preview-play");
    const pauseBtn = document.getElementById("preview-pause");

    playBtn.onclick = function () {
      audio.play();
      playBtn.style.display = "none";
      pauseBtn.style.display = "inline-block";
    };

    pauseBtn.onclick = function () {
      audio.pause();
      pauseBtn.style.display = "none";
      playBtn.style.display = "inline-block";
    };
  }

  function resetFilePreview() {
    document.getElementById("file-name").textContent = "";
    document.getElementById("file-preview-container").style.display = "none";
    document.getElementById("beat-file-input").value = "";
  }
});
