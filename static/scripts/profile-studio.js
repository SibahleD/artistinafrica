// Get the modal
var modal = document.getElementById("modal-container");

// Get the button that opens the modal
var btn = document.getElementById("btn-book-studio");

// Get the "Close" button inside the modal form
var closeBtn = document.getElementById("btn-close-modal");

// Function to open the modal with animation
btn.onclick = function () {
  modal.classList.add("show");
  modal.style.display = "flex";
};

// Function to close the modal with a delay after animation
function closeModal() {
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 400); // Match this to your CSS animation duration
}

// When the user clicks the "Close" button inside the form, close the modal
closeBtn.onclick = function (e) {
  e.preventDefault(); // Prevent form submission or reset
  closeModal();
};

// When the user clicks anywhere outside of the modal content, close it
window.onclick = function (event) {
  if (event.target === modal) {
    closeModal();
  }
};

  let slideIndex = 0;
  showSlides(slideIndex);

  function showSlides(n) {
    let slides = document.querySelectorAll(".gallery-slide");
    let dots = document.querySelectorAll(".dot");

    // wrap around
    if (n >= slides.length) { slideIndex = 0; }
    if (n < 0) { slideIndex = slides.length - 1; }

    slides.forEach(slide => slide.style.display = "none");
    dots.forEach(dot => dot.classList.remove("active"));

    slides[slideIndex].style.display = "block";
    dots[slideIndex].classList.add("active");
  }

  function plusSlides(n) {
    showSlides(slideIndex += n);
  }

  function currentSlide(n) {
    showSlides(slideIndex = n);
  }

  document.querySelector(".prev").addEventListener("click", () => plusSlides(-1));
  document.querySelector(".next").addEventListener("click", () => plusSlides(1));

  document.querySelectorAll(".dot").forEach((dot, index) => {
    dot.addEventListener("click", () => currentSlide(index));
  });

  // Optional: Auto-play
  setInterval(() => {
    plusSlides(1);
  }, 5000); // Change slide every 5s
