document.addEventListener("DOMContentLoaded", function() {
    // Load artist profile data
    fetchArtistProfile();
    
    // Setup audio player controls
    setupAudioPlayers();

    function fetchArtistProfile() {
        // Get artist ID from URL or use current user if viewing own profile
        const pathParts = window.location.pathname.split('/');
        const artistId = pathParts[pathParts.length - 1] || sessionStorage.getItem('user_id');
        
        fetch(`/api/artist/${artistId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                
                // Update profile info
                document.querySelector('.hero-title').textContent = data.username;
                document.querySelector('.hero-subtitle a').textContent = data.title || 'Artist';
                document.querySelector('.hero-location').textContent = `${data.city}, ${data.country}`;
                document.querySelector('.hero-supporting').textContent = data.bio || 'No bio provided';
                
                // Update skills/equipment
                const equipmentList = document.querySelector('.equipment-list');
                if (equipmentList && data.skills) {
                    equipmentList.innerHTML = data.skills.map(skill => `<li> - ${skill}</li>`).join('');
                }
                
                // Update pricing
                const pricingList = document.querySelectorAll('.equipment-list')[1];
                if (pricingList && data.pricing) {
                    pricingList.innerHTML = data.pricing.map(price => 
                        `<li>${price.tier} - RWF ${price.price.toLocaleString()}</li>`
                    ).join('');
                }
                
                // Update social links if available
                if (data.socials) {
                    data.socials.forEach(social => {
                        const link = document.querySelector(`a[href*="${social.platform.toLowerCase()}"]`);
                        if (link) {
                            link.href = social.url;
                        }
                    });
                }
                
                // Update portfolio if available
                if (data.portfolio && data.portfolio.length > 0) {
                    const galleryContent = document.querySelector('.gallery-content');
                    galleryContent.innerHTML = '';
                    
                    data.portfolio.forEach((beat, index) => {
                        const beatItem = document.createElement('div');
                        beatItem.className = 'prod-beats-content';
                        beatItem.setAttribute('data-beat-id', index + 1);
                        beatItem.innerHTML = `
                            <h3>${beat.name.replace(/\.[^/.]+$/, "")}</h3>
                            <input type="range" class="progress-slider" value="0" min="0" max="100">
                            <div class="btn-controls">
                                <a class="play-toggle-btn">
                                    <img src="../static/images/icon-play.png" class="play-icon" alt="Play">
                                    <img src="../static/images/icon-pause.png" class="pause-icon" alt="Pause" style="display: none;">
                                </a>
                                <a class="volume-btn">
                                    <img src="../static/images/icon-volume.png" alt="Volume">
                                </a>
                                <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1" style="display: none;">
                            </div>
                            <audio class="audio-player" src="/upload/${beat.filename}"></audio>
                        `;
                        galleryContent.appendChild(beatItem);
                    });
                    
                    setupAudioPlayers();
                }
            })
            .catch(error => console.error('Error fetching artist profile:', error));
    }

    function setupAudioPlayers() {
        document.querySelectorAll('.prod-beats-content').forEach(container => {
            const audio = container.querySelector('.audio-player');
            const playBtn = container.querySelector('.play-toggle-btn');
            const playIcon = container.querySelector('.play-icon');
            const pauseIcon = container.querySelector('.pause-icon');
            const progressSlider = container.querySelector('.progress-slider');
            const volumeBtn = container.querySelector('.volume-btn');
            const volumeSlider = container.querySelector('.volume-slider');
            
            if (!audio) return;
            
            // Play/Pause toggle
            playBtn.addEventListener('click', function() {
                if (audio.paused) {
                    audio.play();
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'inline-block';
                } else {
                    audio.pause();
                    playIcon.style.display = 'inline-block';
                    pauseIcon.style.display = 'none';
                }
            });
            
            // Update progress slider as audio plays
            audio.addEventListener('timeupdate', function() {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressSlider.value = progress || 0;
            });
            
            // Seek when progress slider is moved
            progressSlider.addEventListener('input', function() {
                const seekTime = (this.value / 100) * audio.duration;
                audio.currentTime = seekTime;
            });
            
            // Volume control
            volumeBtn.addEventListener('click', function() {
                volumeSlider.style.display = volumeSlider.style.display === 'none' ? 'block' : 'none';
            });
            
            volumeSlider.addEventListener('input', function() {
                audio.volume = this.value;
            });
            
            // Reset when audio ends
            audio.addEventListener('ended', function() {
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
                progressSlider.value = 0;
            });
        });
    }
    
    // Contact button functionality
    const contactBtn = document.querySelector('.btn-stand');
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            const artistId = window.location.pathname.split('/').pop();
            if (sessionStorage.getItem('user_id')) {
                // User is logged in - redirect to chat
                window.location.href = `/synchat?artist=${artistId}`;
            } else {
                // User not logged in - redirect to login
                window.location.href = '/sign-in';
            }
        });
    }
});