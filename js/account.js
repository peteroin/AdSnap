// js/account.js
document.addEventListener('DOMContentLoaded', function() {
  initializeAccountPage();
});

function initializeAccountPage() {
  // Cache DOM elements
  const accountOverlay = document.getElementById('accountOverlay');
  const closeAccountBtn = document.getElementById('closeAccount');
  const accountTabs = document.querySelectorAll('.account-tab');
  const campaignModal = document.getElementById('campaignModal');
  const closeModalBtn = document.getElementById('closeModal');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const settingsForm = document.getElementById('settingsForm');

  // Event listeners
  usernameDisplay?.addEventListener('click', handleAccountOverlayOpen);
  closeAccountBtn?.addEventListener('click', handleAccountOverlayClose);
  closeModalBtn?.addEventListener('click', handleModalClose);
  settingsForm?.addEventListener('submit', handleSettingsSubmit);

  // Tab switching
  accountTabs.forEach(tab => {
    tab.addEventListener('click', handleTabSwitch);
  });

  // Make functions available globally
  window.viewCampaign = viewCampaignDetails;
  window.hideAccountOverlay = handleAccountOverlayClose;
}

// Account overlay handlers
function handleAccountOverlayOpen() {
  const accountOverlay = document.getElementById('accountOverlay');
  accountOverlay.classList.remove('hidden');
  setTimeout(() => {
    accountOverlay.classList.add('active');
    loadAccountData();
  }, 10);
}

function handleAccountOverlayClose() {
  const accountOverlay = document.getElementById('accountOverlay');
  accountOverlay.classList.remove('active');
  setTimeout(() => accountOverlay.classList.add('hidden'), 300);
}

// Tab switching
function handleTabSwitch() {
  const accountTabs = document.querySelectorAll('.account-tab');
  
  // Remove active class from all tabs
  accountTabs.forEach(t => t.classList.remove('active'));
  
  // Add active class to clicked tab
  this.classList.add('active');
  
  // Hide all tab contents
  document.querySelectorAll('.account-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Show corresponding tab content
  const tabId = this.getAttribute('data-tab');
  document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Modal handlers
function handleModalClose() {
  const campaignModal = document.getElementById('campaignModal');
  campaignModal.classList.remove('active');
  setTimeout(() => campaignModal.classList.add('hidden'), 300);
}

// Settings form
async function handleSettingsSubmit(e) {
  e.preventDefault();
  const newUsername = document.getElementById('changeName').value;
  const newEmail = document.getElementById('changeEmail').value;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    const response = await fetch('/account/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        username: newUsername,
        email: newEmail
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      showNotification('Account updated successfully!', 'success');
      loadAccountData(); // Refresh account info
    } else {
      throw new Error(data.message || 'Update failed');
    }
  } catch (error) {
    showNotification(error.message || 'Error updating account', 'error');
    console.error('Account update error:', error);
  }
}

// Load account data from server
async function loadAccountData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found - please login again');
    }
    
    showLoadingState(true, 'Loading your campaigns...');
    
    const [accountResponse, campaignsResponse] = await Promise.all([
      fetch('/account', {
        headers: { 'Authorization': token }
      }),
      fetch('/campaigns', {
        headers: { 'Authorization': token }
      })
    ]);

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      throw new Error(errorData.message || 'Failed to fetch account info');
    }
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      throw new Error(errorData.message || 'Failed to fetch campaigns');
    }

    const accountInfo = await accountResponse.json();
    const campaigns = await campaignsResponse.json();
    
    updateAccountUI(accountInfo, campaigns);
    
  } catch (error) {
    console.error('Failed to load account data:', error);
    showNotification(`Error: ${error.message}`, 'error');
    showErrorState(error.message);
  } finally {
    showLoadingState(false);
  }
}

// Update account UI
function updateAccountUI(accountInfo, campaigns) {
  // Update account info
  document.getElementById('accountUsername').textContent = accountInfo.username;
  document.getElementById('accountEmail').textContent = accountInfo.email;
  document.getElementById('memberSince').textContent = new Date(accountInfo.created_at).toLocaleDateString();
  document.getElementById('campaignsCount').textContent = campaigns.length;
  
  // Update avatar
  const avatarImg = document.getElementById('userAvatar');
  avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(accountInfo.username)}&background=4a90e2&color=fff`;
  
  // Update campaigns list
  updateCampaignsList(campaigns);
  
  // Pre-fill settings form
  document.getElementById('changeName').value = accountInfo.username;
  document.getElementById('changeEmail').value = accountInfo.email;
}

// Update campaigns list UI
function updateCampaignsList(campaigns) {
  const campaignsList = document.getElementById('campaignsList');
  
  if (!campaigns || campaigns.length === 0) {
    showEmptyState('No campaigns generated yet');
    return;
  }
  
  // Sort campaigns by date (newest first)
  campaigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  campaignsList.innerHTML = campaigns.map(campaign => `
    <div class="campaign-item" onclick="viewCampaignDetails('${campaign.id}')">
      <div class="campaign-date">${new Date(campaign.created_at).toLocaleDateString()}</div>
      <div class="campaign-name">${campaign.name || 'Unnamed Campaign'}</div>
      <div class="campaign-category">${campaign.category || 'No category'}</div>
      <div class="campaign-preview">
        ${campaign.generated_content ? 
          extractPreviewText(campaign.generated_content) : 
          'No content preview available'}
      </div>
    </div>
  `).join('');
}

// Extract preview text from generated content
function extractPreviewText(content) {
  // Try to find the first section with actual content
  const firstSection = content.split('###')[1];
  if (!firstSection) return 'Generated content available...';
  
  const firstLines = firstSection.split('\n')
    .filter(line => line.trim() && !line.startsWith('###'))
    .slice(0, 3);
    
  return firstLines.map(line => line.replace(/^- /, '').trim()).join(' ') + '...';
}

// View campaign details
async function viewCampaignDetails(campaignId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    showModalLoading(true, 'Loading campaign details...');
    
    const response = await fetch(`/campaigns/${campaignId}`, {
      headers: { 'Authorization': token }
    });
    
    if (!response.ok) throw new Error('Failed to load campaign details');
    
    const campaign = await response.json();
    updateCampaignModal(campaign);
    
    // Show modal
    const campaignModal = document.getElementById('campaignModal');
    campaignModal.classList.remove('hidden');
    setTimeout(() => campaignModal.classList.add('active'), 10);
    
  } catch (error) {
    console.error('Failed to load campaign details:', error);
    showNotification(error.message || 'Error loading campaign details', 'error');
  } finally {
    showModalLoading(false);
  }
}

// Update campaign modal content
function updateCampaignModal(campaign) {
  document.getElementById('modalCampaignName').textContent = campaign.name || 'Unnamed Campaign';
  document.getElementById('modalCampaignDate').textContent = new Date(campaign.created_at).toLocaleDateString();
  document.getElementById('modalCampaignCategory').textContent = campaign.category || 'No category';
  document.getElementById('modalCampaignTone').textContent = campaign.tone || 'Not specified';
  
  // Format the generated content with proper line breaks
  const formattedContent = campaign.generated_content 
    ? campaign.generated_content.replace(/\n/g, '<br>')
    : 'No content available';
  
  document.getElementById('modalGeneratedContent').innerHTML = formattedContent;
  
  // Banner details
  document.getElementById('modalBannerStyle').textContent = campaign.banner_style || 'Not specified';
  
  const colors = [];
  if (campaign.primary_color) colors.push(`Primary: ${campaign.primary_color}`);
  if (campaign.secondary_color) colors.push(`Secondary: ${campaign.secondary_color}`);
  document.getElementById('modalBannerColors').textContent = colors.join(', ') || 'Not specified';
}

// UI Helper functions
function showEmptyState(message) {
  const campaignsList = document.getElementById('campaignsList');
  campaignsList.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
      <button class="cyber-button small" onclick="hideAccountOverlay()">Create Your First Campaign</button>
    </div>
  `;
}

function showErrorState(errorMessage) {
  const campaignsList = document.getElementById('campaignsList');
  campaignsList.innerHTML = `
    <div class="empty-state">
      <p>Failed to load campaigns</p>
      <p class="error-detail">${errorMessage}</p>
      <button class="cyber-button small" onclick="loadAccountData()">Try Again</button>
    </div>
  `;
}

function showLoadingState(show, message = 'Loading...') {
  const campaignsList = document.getElementById('campaignsList');
  if (show) {
    campaignsList.innerHTML = `
      <div class="loading-state">
        <div class="cyber-spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
}

function showModalLoading(show, message = 'Loading...') {
  const modalContent = document.querySelector('.modal-body');
  if (!modalContent) return;
  
  if (show) {
    const loader = document.createElement('div');
    loader.className = 'modal-loading';
    loader.innerHTML = `
      <div class="cyber-spinner"></div>
      <p>${message}</p>
    `;
    modalContent.innerHTML = '';
    modalContent.appendChild(loader);
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}