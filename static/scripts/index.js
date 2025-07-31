document.addEventListener('DOMContentLoaded', function() {
    // Horizontal scroll functionality
    const container = document.querySelector('.studios-content');
    container.addEventListener('wheel', function(event) {
        if (event.deltaY !== 0) {
            event.preventDefault();
            container.scrollLeft += event.deltaY * 1;
        }
    });

    // Load trending studios
    loadTrendingStudios();
});

function loadTrendingStudios() {
    fetch('/api/trending-studios')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(studios => {
            const studiosContainer = document.querySelector('.studios-content');
            studiosContainer.innerHTML = ''; // Clear existing content

            studios.forEach(studio => {
                const studioElement = document.createElement('div');
                studioElement.className = 'sel-icon';
                
                // Use the image from the database or a default image
                const imageUrl = studio.image_url || '../static/images/default-studio.jpg';
                
                sessionStorage.setItem("studio_id", studio.studio_id);

                studioElement.innerHTML = `
                    <img src="${imageUrl}" alt="${studio.studio_name}">
                    <div class="stu-listing-title">
                        <h3>${studio.studio_name}</h3>
                    </div>
                    <p>${studio.studio_location || studio.city || ''} • ${studio.city || studio.country || ''}</p>
                    <a class="btn-view" href="/profile-studio/${studio.studio_id}">
                        More
                    </a>
                `;
                studiosContainer.appendChild(studioElement);
            });
        })
        .catch(error => {
            console.error('Error loading studios:', error);
            // Optionally show an error message to the user
            const studiosContainer = document.querySelector('.studios-content');
            studiosContainer.innerHTML = '<p>Unable to load studios at this time. Please try again later.</p>';
        });
}