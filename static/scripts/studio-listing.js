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
