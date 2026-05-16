const CLIENT_ID = '41599';

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          updateTrigger: 'next_episode', // 'next_episode' or 'percentage'
          percentageThreshold: 80,
          manualLink: false
        }
      });
    }
  });
});

function addLog(message, isSuccess = true) {
  chrome.storage.local.get(['activityLogs'], (result) => {
    let logs = result.activityLogs || [];
    logs.unshift({ time: Date.now(), message, isSuccess });
    if (logs.length > 50) logs.pop();
    chrome.storage.local.set({ activityLogs: logs });
  });
}

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['anilistToken'], (result) => {
      if (result.anilistToken) {
        resolve(result.anilistToken);
      } else {
        reject(new Error('No token found. Please connect your AniList account.'));
      }
    });
  });
}

function login() {
  return new Promise((resolve, reject) => {
    const redirectUrl = chrome.identity.getRedirectURL();
    console.log("Redirect URL:", redirectUrl); // User needs this for Anilist Developer settings
    
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${CLIENT_ID}&response_type=token`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }

        if (responseUrl) {
          // Parse access token from the response URL hash
          const url = new URL(responseUrl);
          const params = new URLSearchParams(url.hash.substring(1)); // Remove the #
          const token = params.get('access_token');
          
          if (token) {
            chrome.storage.local.set({ anilistToken: token }, () => {
              resolve(token);
            });
          } else {
            reject('Token not found in response');
          }
        } else {
          reject('No response URL');
        }
      }
    );
  });
}

async function logout() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['anilistToken'], () => {
      resolve();
    });
  });
}

// Anilist API interaction
async function searchAnime(title) {
  const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        episodes
        status
      }
    }
  `;

  const variables = {
    search: title
  };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  
  // Return the best match. 
  // TODO: Implement more robust "Starts With" fuzzy matching here if necessary, 
  // but Anilist's search usually brings the closest match first.
  return data.data.Media; 
}

async function updateAnimeProgress(media, episode) {
  const token = await getAccessToken();
  
  let status = "CURRENT";
  if (media.episodes && episode >= media.episodes) {
    status = "COMPLETED";
  }
  
  const query = `
    mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
      SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
        id
        status
        progress
      }
    }
  `;

  const variables = {
    mediaId: media.id,
    progress: episode,
    status: status
  };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  
  return data.data.SaveMediaListEntry;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'login') {
    login().then(() => sendResponse({ success: true }))
           .catch((err) => sendResponse({ success: false, error: err }));
    return true; // Keep message channel open for async response
  } 
  
  if (request.action === 'logout') {
    logout().then(() => sendResponse({ success: true }));
    return true;
  }
  
  if (request.action === 'getRedirectUrl') {
     sendResponse({ url: chrome.identity.getRedirectURL() });
     return false;
  }

  if (request.action === 'updateProgress') {
    const { title, episode } = request.data;
    console.log(`Received update request: ${title} Ep ${episode}`);
    
    // 1. Search for the anime
    searchAnime(title)
      .then(media => {
        if (!media) {
          throw new Error("Anime not found on AniList");
        }
        
        console.log(`Found matching AniList media: ID ${media.id}, Title: ${media.title.english || media.title.romaji}`);
        
        // Check if names are "close enough". For now, trust the first result.
        // In the future, we can add the 'starts with' logic here by comparing media.title with Netflix title.
        
        // 2. Update progress
        return updateAnimeProgress(media, episode);
      })
      .then(result => {
        console.log(`Successfully updated progress to episode ${result.progress}`);
        addLog(`Updated ${title} to Episode ${episode}`, true);
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error(`Failed to update progress:`, error);
        let errorMsg = error.message;
        if (!errorMsg) {
          try {
             errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
          } catch(e) {
             errorMsg = 'Unknown error';
          }
        }
        addLog(`Failed: ${title} Ep ${episode} - ${errorMsg}`, false);
        sendResponse({ success: false, error: errorMsg });
      });
      
    return true; // async
  }
});
