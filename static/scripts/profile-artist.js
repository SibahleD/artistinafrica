document.addEventListener('DOMContentLoaded', function () {
    const players = document.querySelectorAll('.prod-beats-content');

    let currentAudio = null;

    players.forEach(player => {
        const audio = player.querySelector('.audio-player');
        const playToggleBtn = player.querySelector('.play-toggle-btn');
        const playIcon = player.querySelector('.play-icon');
        const pauseIcon = player.querySelector('.pause-icon');
        const progressSlider = player.querySelector('.progress-slider');
        const volumeBtn = player.querySelector('.volume-btn');
        const volumeSlider = player.querySelector('.volume-slider');

        // Toggle play/pause
        playToggleBtn.addEventListener('click', () => {
            if (audio.paused) {
                if (currentAudio && currentAudio !== audio) {
                    currentAudio.pause();
                    const prevPlayer = currentAudio.closest('.prod-beats-content');
                    if (prevPlayer) {
                        prevPlayer.querySelector('.play-icon').style.display = '';
                        prevPlayer.querySelector('.pause-icon').style.display = 'none';
                    }
                }
                currentAudio = audio;
                audio.play();
                playIcon.style.display = 'none';
                pauseIcon.style.display = '';
            } else {
                audio.pause();
                playIcon.style.display = '';
                pauseIcon.style.display = 'none';
            }
        });

        // Update icon state when playback ends
        audio.addEventListener('ended', () => {
            playIcon.style.display = '';
            pauseIcon.style.display = 'none';
        });

        // Update progress
        audio.addEventListener('timeupdate', () => {
            const value = (audio.currentTime / audio.duration) * 100;
            progressSlider.value = value || 0;
        });

        // Seek in track
        progressSlider.addEventListener('input', () => {
            audio.currentTime = (progressSlider.value / 100) * audio.duration;
        });

        // Volume control
        volumeSlider.addEventListener('input', () => {
            audio.volume = volumeSlider.value;
        });

        // Toggle volume slider visibility
        volumeBtn.addEventListener('click', () => {
            volumeSlider.style.display = volumeSlider.style.display === 'none' ? 'block' : 'none';
        });
    });
});
