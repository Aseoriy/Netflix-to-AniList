let currentShowTitle = '';
let currentEpisodeNum = 0;
let hasUpdatedThisEpisode = false;
let settings = {
  updateTrigger: 'next_episode',
  percentageThreshold: 80,
  manualLink: false
};

// Load settings
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = result.settings;
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    settings = changes.settings.newValue;
  }
});

function parseEpisodeNumber(text) {
  if (!text) return null;
  // Look for patterns like "E5", "Ep. 5", "Episode 5"
  const match = text.match(/(?:E|Ep\.?\|Episode)\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

function extractVideoInfo() {
  // Netflix DOM changes frequently. Here are some common selectors.
  
  // Try finding the title elements
  let titleElement = document.querySelector('[data-uia="video-title"] h4') || 
                     document.querySelector('.video-title h4') ||
                     document.querySelector('h4.title');
                     
  // If we can't find a series title but there's a movie title (not episode)
  // AniList handles movies too, but we usually track series episodes.
  if (!titleElement) {
    titleElement = document.querySelector('[data-uia="video-title"]') || document.querySelector('.video-title');
  }

  let episodeElement = document.querySelector('[data-uia="video-title"] span:nth-child(2)') || 
                       document.querySelector('.video-title span:nth-child(2)');
                       
  // Fallback: sometimes title is in the document title: "S1:E1 Episode Title - Show Name"
  if (!titleElement && document.title) {
     const titleParts = document.title.split(' - ');
     if (titleParts.length > 1) {
         const showName = titleParts[titleParts.length - 2]; // Usually second to last before "Netflix"
         const episodeInfo = titleParts[0]; 
         
         const epNum = parseEpisodeNumber(episodeInfo);
         if (epNum !== null) {
            return { title: showName.trim(), episode: epNum };
         }
     }
  }

  if (titleElement) {
    const title = titleElement.textContent.trim();
    let episode = 1; // Default to 1 if we can't find it (e.g. movies)
    
    if (episodeElement) {
      const epText = episodeElement.textContent.trim();
      const parsedEp = parseEpisodeNumber(epText);
      if (parsedEp !== null) {
        episode = parsedEp;
      }
    }
    
    return { title, episode };
  }

  return null;
}

function updateAnilist(title, episode) {
  if (hasUpdatedThisEpisode) return;
  
  console.log(`Attempting to update AniList: ${title} Episode ${episode}`);
  hasUpdatedThisEpisode = true; // Prevent multiple updates for the same episode viewing

  chrome.runtime.sendMessage(
    { action: 'updateProgress', data: { title, episode } },
    (response) => {
      if (response && response.success) {
        console.log('Successfully updated AniList!');
        // Could show a small toast notification here on the video player!
      } else {
        console.error('Failed to update AniList', response ? response.error : 'Unknown error');
      }
    }
  );
}

// Observe DOM for the "Next Episode" button appearing or video progress
let observer = new MutationObserver((mutations) => {
  // Only run if we are on a watch page
  if (!window.location.pathname.startsWith('/watch/')) return;

  const info = extractVideoInfo();
  if (info) {
    // If title or episode changed, reset our update flag
    if (info.title !== currentShowTitle || info.episode !== currentEpisodeNum) {
      currentShowTitle = info.title;
      currentEpisodeNum = info.episode;
      hasUpdatedThisEpisode = false;
      console.log(`Detected watching: ${currentShowTitle} Ep ${currentEpisodeNum}`);
    }
  }

  if (settings.updateTrigger === 'next_episode') {
    // Look for the Next Episode button
    const nextEpButton = document.querySelector('[data-uia="next-episode-seamless-button"]') ||
                         document.querySelector('[data-uia="next-episode-seamless-button-draining"]');
                         
    if (nextEpButton && !hasUpdatedThisEpisode && currentShowTitle) {
      console.log('Next episode button detected, triggering update.');
      updateAnilist(currentShowTitle, currentEpisodeNum);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Check video progress periodically for the percentage trigger
setInterval(() => {
   if (!window.location.pathname.startsWith('/watch/')) return;
   if (settings.updateTrigger !== 'percentage') return;
   if (hasUpdatedThisEpisode || !currentShowTitle) return;

   const video = document.querySelector('video');
   if (video && video.duration > 0) {
      const percentage = (video.currentTime / video.duration) * 100;
      if (percentage >= settings.percentageThreshold) {
         console.log(`Watched ${percentage.toFixed(1)}%, triggering update.`);
         updateAnilist(currentShowTitle, currentEpisodeNum);
      }
   }
}, 5000); // Check every 5 seconds
