document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const statusText = document.getElementById('status-text');
  const redirectUriCode = document.getElementById('redirect-uri');
  
  // Settings elements
  const updateTriggerSelect = document.getElementById('update-trigger');
  const percentageGroup = document.getElementById('percentage-setting-group');
  const percentageThresholdInput = document.getElementById('percentage-threshold');
  const percentageDisplay = document.getElementById('percentage-display');
  const manualLinkInput = document.getElementById('manual-link');

  // Load initial state
  updateAuthUI();
  loadSettings();
  
  // Get redirect URI for user info
  chrome.runtime.sendMessage({ action: 'getRedirectUrl' }, (response) => {
    if (response && response.url) {
      redirectUriCode.textContent = response.url;
    } else {
      redirectUriCode.textContent = 'Error getting URI';
    }
  });

  function updateAuthUI() {
    chrome.storage.local.get(['anilistToken'], (result) => {
      if (result.anilistToken) {
        statusText.innerHTML = '<span class="status-dot connected"></span> Connected to AniList';
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
      } else {
        statusText.innerHTML = '<span class="status-dot disconnected"></span> Not connected to AniList';
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
      }
    });
  }

  function loadSettings() {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || {
        updateTrigger: 'next_episode',
        percentageThreshold: 80,
        manualLink: false
      };
      
      updateTriggerSelect.value = settings.updateTrigger;
      percentageThresholdInput.value = settings.percentageThreshold;
      percentageDisplay.textContent = settings.percentageThreshold + '%';
      manualLinkInput.checked = settings.manualLink;
      
      togglePercentageVisibility(settings.updateTrigger);
    });
  }
  
  function saveSettings() {
    const settings = {
      updateTrigger: updateTriggerSelect.value,
      percentageThreshold: parseInt(percentageThresholdInput.value, 10),
      manualLink: manualLinkInput.checked
    };
    
    chrome.storage.sync.set({ settings });
  }

  function togglePercentageVisibility(triggerValue) {
    if (triggerValue === 'percentage') {
      percentageGroup.style.display = 'block';
    } else {
      percentageGroup.style.display = 'none';
    }
  }

  // Event Listeners
  loginBtn.addEventListener('click', () => {
    loginBtn.textContent = 'Connecting...';
    loginBtn.disabled = true;
    
    chrome.runtime.sendMessage({ action: 'login' }, (response) => {
      loginBtn.textContent = 'Connect AniList';
      loginBtn.disabled = false;
      
      if (response && response.success) {
        updateAuthUI();
      } else {
        alert('Login failed: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
      if (response && response.success) {
        updateAuthUI();
      }
    });
  });

  updateTriggerSelect.addEventListener('change', (e) => {
    togglePercentageVisibility(e.target.value);
    saveSettings();
  });
  
  percentageThresholdInput.addEventListener('input', (e) => {
    percentageDisplay.textContent = e.target.value + '%';
  });
  
  percentageThresholdInput.addEventListener('change', () => {
    saveSettings();
  });
  
  manualLinkInput.addEventListener('change', () => {
    saveSettings();
  });

  function loadLogs() {
    chrome.storage.local.get(['activityLogs'], (result) => {
      const logList = document.getElementById('activity-log');
      const logs = result.activityLogs || [];
      
      logList.innerHTML = '';
      
      if (logs.length === 0) {
        logList.innerHTML = '<li class="log-item empty">No recent activity</li>';
        return;
      }
      
      logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        
        const date = new Date(log.time);
        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        li.innerHTML = `
          <span class="log-time">${timeStr}</span>
          <span style="color: ${log.isSuccess ? 'var(--success)' : 'var(--netflix-red)'}">
            ${log.message}
          </span>
        `;
        logList.appendChild(li);
      });
    });
  }

  // Load logs initially
  loadLogs();

  // Listen for new logs
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.activityLogs) {
      loadLogs();
    }
  });
});
