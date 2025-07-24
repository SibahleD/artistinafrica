document.addEventListener("DOMContentLoaded", async () => {
  // === Profile Loading ===
  const userId = sessionStorage.getItem("user_id");
  if (!userId) return alert("User not logged in.");

  try {
    const response = await fetch(`/api/artist/${userId}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to load profile.");

    // Username
    document.getElementById("user-username").textContent =
      data.username || "No username";

    // Title
    document.getElementById("user-title").textContent =
      data.user_title || "No title available";

    // Location
    document.getElementById("user-location").textContent =
      data.location || "No location provided";

    // Avatar fallback
    const avatar = document.querySelector(".hero-avatar-image");
    avatar.src =
      data.avatar_url && data.avatar_url.trim() !== ""
        ? data.avatar_url
        : "../static/images/avatar-placeholder.png";

    // Bio
    const bio = document.querySelector(".user-bio");
    bio.textContent = data.user_bio?.trim() || "No bio available";

    // Skills
    const skillsList = document.querySelector(".skills-list");
    skillsList.innerHTML = "";
    if (data.skills?.length) {
      data.skills.forEach((skill) => {
        const li = document.createElement("li");
        li.textContent = skill;
        skillsList.appendChild(li);
      });
    } else {
      skillsList.innerHTML = "<li>No listed skills</li>";
    }

    // Pricing
    const pricingList = document.querySelector(".pricing-list");
    pricingList.innerHTML = "";
    if (data.pricing?.length) {
      data.pricing.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.tier}: ${item.price} RWF`;
        pricingList.appendChild(li);
      });
    } else {
      pricingList.innerHTML = "<li>No pricing information</li>";
    }

    // Socials
    const socialLinks = document.querySelector(".hero-social-links");
    socialLinks.innerHTML = "";
    if (data.socials?.length) {
      data.socials.forEach((social) => {
        const a = document.createElement("a");
        a.href = `https://www.${social.platform.toLowerCase()}.com/${
          social.username
        }`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `
          <img src="../static/images/icon-${social.platform.toLowerCase()}.png" alt="${
          social.platform
        } Icon" class="hero-social-icon">
          ${social.platform}
        `;
        socialLinks.appendChild(a);
      });
    } else {
      socialLinks.innerHTML = "<p>No social links available</p>";
    }

    // Portfolio
    const portfolio = document.querySelector(".portfolio-content");
    portfolio.innerHTML = "";

    if (data.portfolio?.length) {
      data.portfolio.forEach((file) => {
        if (!file.file_name) {
          console.warn("Skipping file with missing file_name:", file);
          return;
        }
        // Build src using file_name (since file_url doesn't exist)
        const audioSrc = `../upload/${file.file_name}`;

        const item = document.createElement("div");
        item.className = "prod-beats-content";
        item.innerHTML = `
      <h3>${file.file_name.split(".")[0]}</h3>
      <audio class="audio-player" src="${audioSrc}" preload="metadata"></audio>
      <input type="range" class="progress-slider" min="0" max="100" value="0" />
      <div class="btn-controls">
        <a class="play-toggle-btn" href="javascript:void(0);"title="Play">
          <img src="../static/images/icon-play.png" width="20px" alt="Play Icon">
        </a>
        <a class="pause-icon" href="javascript:void(0);" title="Pause" style="display:none;">
          <img src="../static/images/icon-pause.png" width="20px" alt="Pause Icon">
        </a>
        <a class="volume-btn" href="javascript:void(0);" title="Volume">
          <img src="../static/images/icon-volume.png" width="20px" alt="Volume Icon">
        </a>
      </div>
      <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1" style="display:none;" />
    `;
        portfolio.appendChild(item);
      });
    } else {
      portfolio.innerHTML = "<p>No beats uploaded yet</p>";
    }

    // Initialize audio controls for portfolio after loading items
    initializeAudioControls();
  } catch (err) {
    alert("❌ Error loading profile: " + err.message);
  }

  // === Upload Modal Logic and Preview ===
  const beatModal = document.getElementById("beat-add-modal");
  const addBeatBtn = document.querySelector(".beat-add");
  const closeBtn = beatModal.querySelector(".modal-close-btn");
  const dropArea = document.getElementById("drop-area");
  const uploadTrigger = document.getElementById("beat-upload-trigger");
  const fileInput = document.getElementById("beat-file-input");
  const submitBtn = beatModal.querySelector(".modal-submit-btn");

  const previewContainer = document.getElementById("file-preview-container");
  const fileNameElem = document.getElementById("file-name");
  const filePreviewElem = document.getElementById("file-preview");

  // Hide preview container initially
  previewContainer.classList.add("hidden");

  // Show modal
  addBeatBtn?.addEventListener("click", () => {
    beatModal.classList.remove("hidden");
    clearPreview();
  });

  // Close modal on Cancel button
  closeBtn?.addEventListener("click", () => {
    beatModal.classList.add("hidden");
    clearPreview();
  });

  // Close on outside click (click on overlay div)
  beatModal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("beat-modal-overlay")) {
      beatModal.classList.add("hidden");
      clearPreview();
    }
  });

  // Click-to-upload trigger
  uploadTrigger?.addEventListener("click", () => fileInput.click());

  // Drag events styling
  ["dragenter", "dragover"].forEach((eventName) =>
    dropArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add("dragover");
    })
  );

  ["dragleave", "drop"].forEach((eventName) =>
    dropArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove("dragover");
    })
  );

  // Handle dropped files
  dropArea?.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      previewFile(files[0]);
    }
  });

  // Handle selected files
  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length) {
      previewFile(fileInput.files[0]);
    }
  });

  // Submit file upload
  submitBtn?.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please select a file first.");

    const editedName = fileNameElem.value.trim();
    if (!editedName) return alert("Please enter a valid filename.");

    const ext = file.name.split(".").pop();
    const newFileName = editedName + "." + ext;

    const renamedFile = new File([file], newFileName, { type: file.type });

    const formData = new FormData();
    formData.append("file", renamedFile);

    try {
      const response = await fetch("/upload-beat", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        alert("❌ Upload failed: " + result.error);
      } else {
        alert("✅ " + result.message + ": " + result.filename);
        beatModal.classList.add("hidden");
        fileInput.value = "";
        clearPreview();
        location.reload();
      }
    } catch (err) {
      alert("❌ Upload error: " + err.message);
    }
  });

  // Clear preview helper
  function clearPreview() {
    previewContainer.classList.add("hidden");
    fileNameElem.value = "";
    filePreviewElem.innerHTML = "";
  }

  // Preview file helper
  function previewFile(file) {
    if (!previewContainer || !fileNameElem || !filePreviewElem) return;

    const baseName =
      file.name.lastIndexOf(".") !== -1
        ? file.name.substring(0, file.name.lastIndexOf("."))
        : file.name;

    fileNameElem.value = baseName;
    filePreviewElem.innerHTML = "";

    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      filePreviewElem.appendChild(img);
    } else if (fileType.startsWith("audio/")) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = URL.createObjectURL(file);
      filePreviewElem.appendChild(audio);
    } else {
      filePreviewElem.innerHTML = "<p>Unsupported file type</p>";
    }

    previewContainer.classList.remove("hidden");
  }

  // === Audio Controls for portfolio beats ===
  function initializeAudioControls() {
    const players = document.querySelectorAll(".prod-beats-content");

    let currentAudio = null;

    players.forEach((player) => {
      const audio = player.querySelector(".audio-player");
      const playToggleBtn = player.querySelector(".play-toggle-btn");
      const pauseIcon = player.querySelector(".pause-icon");
      const progressSlider = player.querySelector(".progress-slider");
      const volumeBtn = player.querySelector(".volume-btn");
      const volumeSlider = player.querySelector(".volume-slider");

      if (!audio || !playToggleBtn || !pauseIcon) return;

      // Toggle play/pause
      playToggleBtn.addEventListener("click", () => {
        if (audio.paused) {
          if (currentAudio && currentAudio !== audio) {
            currentAudio.pause();
            const prevPlayer = currentAudio.closest(".prod-beats-content");
            if (prevPlayer) {
              const prevPlay = prevPlayer.querySelector(".play-toggle-btn");
              const prevPause = prevPlayer.querySelector(".pause-icon");
              if (prevPlay) prevPlay.style.display = "";
              if (prevPause) prevPause.style.display = "none";
            }
          }
          currentAudio = audio;
          console.log("Attempting to play audio:", audio.src);
          audio.play();
          playToggleBtn.style.display = "none";
          pauseIcon.style.display = "";
        } else {
          console.log("Attempting to pause audio:", audio.src);
          audio.pause();
          playToggleBtn.style.display = "";
          pauseIcon.style.display = "none";
        }
      });

      // Pause icon click also pauses audio and toggles icons
      pauseIcon.addEventListener("click", () => {
        if (!audio.paused) {
          audio.pause();
          playToggleBtn.style.display = "";
          pauseIcon.style.display = "none";
        }
      });

      // Update icon state when playback ends
      audio.addEventListener("ended", () => {
        playToggleBtn.style.display = "";
        pauseIcon.style.display = "none";
      });

      // Update progress slider as audio plays
      audio.addEventListener("timeupdate", () => {
        if (!progressSlider) return;
        const value = (audio.currentTime / audio.duration) * 100;
        progressSlider.value = value || 0;
      });

      // Seek in track
      progressSlider?.addEventListener("input", () => {
        audio.currentTime = (progressSlider.value / 100) * audio.duration;
      });

      // Volume control
      volumeSlider?.addEventListener("input", () => {
        audio.volume = volumeSlider.value;
      });

      // Toggle volume slider visibility
      volumeBtn?.addEventListener("click", () => {
        if (!volumeSlider) return;
        volumeSlider.style.display =
          volumeSlider.style.display === "none" ? "block" : "none";
      });
    });
  }
});
