// Initialize banner generator
const bannerGenerator = new BannerGenerator();

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  generateBtn.addEventListener('click', generateAdCampaign);
});

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function hideError() {
  const errorElement = document.getElementById('errorMessage');
  errorElement.style.display = 'none';
}

function showLoading() {
  const output = document.getElementById('outputSection');
  output.innerHTML = `
    <div class="loading-text">
      <div class="loader"></div>
      <span>Generating your custom ad campaign with AI...</span>
    </div>
    <div class="progress-bar">
      <div class="progress" id="progressBar"></div>
    </div>
  `;
  
  // Animate progress bar
  let progress = 0;
  const progressBar = document.getElementById('progressBar');
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
    }
    progressBar.style.width = `${progress}%`;
  }, 300);
}

function switchTab(tabName) {
  // Hide all content
  document.querySelectorAll('.campaign-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Deactivate all tabs
  document.querySelectorAll('.campaign-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Activate selected tab and content
  document.getElementById(`${tabName}-content`).classList.add('active');
  event.currentTarget.classList.add('active');
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const textToCopy = element.innerText || element.textContent;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    // Show feedback
    const btn = event.currentTarget;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

function parseMarkdownResponse(response) {
  console.log("Raw API response:", response); // Debugging line
  
  const sections = {};
  let currentSection = null;
  
  // Split by lines and remove empty lines
  const lines = response.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Check for section headers (###)
    const sectionMatch = line.match(/^###\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      sections[currentSection] = [];
    } 
    // Add content to current section
    else if (currentSection && line.trim()) {
      // Remove markdown list markers if present
      const cleanedLine = line.replace(/^-\s+/, '').trim();
      sections[currentSection].push(cleanedLine);
    }
  });
  
  return sections;
}

function displayCampaignResults(result) {
  // Parse the AI response
  const textSections = parseMarkdownResponse(result.textContent);
  console.log("Parsed sections:", textSections); // Debugging line
  
  const output = document.getElementById('outputSection');
  
  // Create banner HTML if generation was successful
  let bannerHTML = '';
  let bannerTab = '';
  if (result.bannerResult?.success) {
    bannerTab = '<div class="campaign-tab" onclick="switchTab(\'banners\')">Banner Ads</div>';
    bannerHTML = `
      <div class="campaign-content" id="banners-content">
        <h3>Generated Banner</h3>
        ${result.bannerResult.canvas.outerHTML}
        <button onclick="bannerGenerator.downloadBanner()" class="copy-btn">
          Download Banner
        </button>
        <h4 style="margin-top: 2rem;">Banner Concepts</h4>
        <ul>
          ${textSections['Banner Concepts']?.map(concept => `<li>${concept}</li>`).join('') || '<li>No banner concepts generated</li>'}
        </ul>
      </div>
    `;
  }

  // Generate the full output HTML
  output.innerHTML = `
    <div class="campaign-tabs">
      <div class="campaign-tab active" onclick="switchTab('social')">Social Media</div>
      <div class="campaign-tab" onclick="switchTab('captions')">Ad Captions</div>
      <div class="campaign-tab" onclick="switchTab('email')">Email Content</div>
      ${bannerTab}
    </div>
    
    <div class="campaign-content active" id="social-content">
      <h3>Social Media Posts</h3>
      <ul>
        ${textSections['Social Media Posts']?.map(post => `<li>${post.replace(/^- /, '').trim()}</li>`).join('') || '<li>No social media posts generated</li>'}
      </ul>
      <button class="copy-btn" onclick="copyToClipboard('social-content')">Copy All</button>
    </div>
    
    <div class="campaign-content" id="captions-content">
      <h3>Ad Captions</h3>
      <ul>
        ${textSections['Ad Captions']?.map(caption => `<li>${caption.replace(/^- /, '').trim()}</li>`).join('') || '<li>No ad captions generated</li>'}
      </ul>
      <button class="copy-btn" onclick="copyToClipboard('captions-content')">Copy All</button>
    </div>
    
    <div class="campaign-content" id="email-content">
      <h3>Email Campaign</h3>
      <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
        ${textSections['Email Campaign']?.join('<br>').replace(/^- /gm, '').trim() || 'No email content generated'}
      </div>
      <button class="copy-btn" onclick="copyToClipboard('email-content')">Copy Content</button>
    </div>
    
    ${bannerHTML}
  `;
  
  // Reinitialize canvas if banner was generated
  if (result.bannerResult?.success) {
    bannerGenerator.canvas = document.querySelector('#banners-content canvas');
    bannerGenerator.ctx = bannerGenerator.canvas.getContext('2d');
  }
}

async function generateAdCampaign() {
  // Get form values
  const productName = document.getElementById('productName').value;
  const productCategory = document.getElementById('productCategory').value;
  const brandTone = document.getElementById('brandTone').value;
  const productDescription = document.getElementById('productDescription').value;
  const apiKey = document.getElementById('geminiKey').value;
  
  // Validate inputs
  if (!productName || !productCategory || !productDescription || !apiKey) {
    showError("Please fill in all required fields");
    return;
  }

  hideError();
  showLoading();
  
  try {
    const geminiService = new GeminiService(apiKey);
    
    const productDetails = {
      productName,
      productCategory,
      brandTone,
      productDescription
    };
    
    console.log("Sending prompt to Gemini:", geminiService.createAdPrompt(productDetails)); // Debug
    
    // Generate text content
    const textResponse = await geminiService.generateAdCampaign(productDetails);
    console.log("Raw API response:", textResponse); // Debug
    
    // Generate banner
    const bannerResult = await bannerGenerator.generateBanner(
      productName,
      document.getElementById('bannerStyle').value,
      document.getElementById('primaryColor').value,
      document.getElementById('secondaryColor').value
    );
    console.log("Banner result:", bannerResult); // Debug

    displayCampaignResults({
      textContent: textResponse,
      bannerResult: bannerResult
    });
    
  } catch (error) {
    console.error('Full error:', error); // More detailed error logging
    showError(`Error: ${error.message}`);
    document.getElementById('outputSection').innerHTML = `
      <div class="error-message">
        <p>Failed to generate campaign. Please try again.</p>
        <p>Technical details: ${error.message}</p>
        ${error.response ? `<pre>${JSON.stringify(error.response, null, 2)}</pre>` : ''}
      </div>
    `;
  }
}

// Make functions available globally for HTML onclick handlers
window.switchTab = switchTab;
window.copyToClipboard = copyToClipboard;