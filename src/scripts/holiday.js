document.addEventListener("DOMContentLoaded", () => {
        // Load the muted background video once the document is ready.
        const heroVideo = document.getElementById("hero-video");
        if (heroVideo) {
          const toggle = document.getElementById('holiday-video-toggle');
          if (toggle) {
            toggle.hidden = false;
            const updateLabel = () => { toggle.textContent = heroVideo.paused ? 'Play video' : 'Pause video'; };
            heroVideo.addEventListener('play', updateLabel);
            heroVideo.addEventListener('pause', updateLabel);
            toggle.addEventListener('click', () => {
              if (heroVideo.paused) heroVideo.play().catch(updateLabel);
              else heroVideo.pause();
            });
            updateLabel();
          }
          const source = heroVideo.querySelector("source");
          if (source && source.dataset.src) {
            source.src = source.dataset.src;
            heroVideo.load();
            heroVideo.play().catch((err) => {
              console.log("Auto-play was prevented:", err);
            });
          }
        }


});
