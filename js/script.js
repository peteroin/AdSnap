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

async function saveCampaignToDB(campaignData) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    console.log('Saving campaign data:', campaignData);

    const response = await fetch('http://localhost:5000/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(campaignData)
    });

    // First check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with:', errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Then try to parse as JSON
    try {
      const data = await response.json();
      console.log('Campaign saved successfully:', data);
      return data.id;
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      throw new Error('Invalid response from server');
    }
    
  } catch (error) {
    console.error('Error saving campaign:', error);
    showError(`Failed to save campaign: ${error.message}`);
    return null;
  }
}

function displayCampaignResults(result, campaignName) {
  // Parse the AI response
  const textSections = parseMarkdownResponse(result.textContent);
  console.log("Parsed sections:", textSections);
  
  const output = document.getElementById('outputSection');
  
  // Create banner HTML if generation was successful
  let bannerHTML = '';
  let bannerTab = '';
  if (result.bannerResult?.success) {
    bannerTab = '<div class="campaign-tab" onclick="switchTab(\'banners\')">Banner Ads</div>';
    bannerHTML = `
      <div class="campaign-content" id="banners-content">
        <h3>Generated Banner</h3>
        <div id="bannerContainer">
          <!-- Canvas will be inserted here by BannerGenerator -->
        </div>
        <div class="banner-actions">
          <button onclick="bannerGenerator.downloadBanner()" class="copy-btn">
            Download Banner
          </button>
          <button onclick="shareOnTwitter(bannerGenerator.getImageUrl())" class="share-btn twitter-btn">
            <i class="fa fa-twitter"></i> Share on Twitter
          </button>
          <button onclick="shareOnLinkedIn(bannerGenerator.getImageUrl())" class="share-btn linkedin-btn">
            <i class="fa fa-linkedin"></i> Share on LinkedIn
          </button>
        </div>
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
      <ul class="sharing-list">
        ${textSections['Social Media Posts']?.map(post => {
          const cleanPost = post.replace(/^- /, '').trim();
          return `
            <li>
              <div class="post-content">${cleanPost}</div>
              <div class="sharing-buttons">
                <button onclick="shareOnTwitter(null, '${cleanPost}')" class="share-btn twitter-btn small">
                  <i class="fa fa-twitter"></i> Tweet
                </button>
                <button onclick="shareOnLinkedIn(null, '${cleanPost}')" class="share-btn linkedin-btn small">
                  <i class="fa fa-linkedin"></i> Share
                </button>
              </div>
            </li>`;
        }).join('') || '<li>No social media posts generated</li>'}
      </ul>
      <button class="copy-btn" onclick="copyToClipboard('social-content')">Copy All</button>
    </div>
    
    <div class="campaign-content" id="captions-content">
      <h3>Ad Captions</h3>
      <ul class="sharing-list">
        ${textSections['Ad Captions']?.map(caption => {
          const cleanCaption = caption.replace(/^- /, '').trim();
          return `
            <li>
              <div class="post-content">${cleanCaption}</div>
              <div class="sharing-buttons">
                <button onclick="shareOnTwitter(null, '${cleanCaption}')" class="share-btn twitter-btn small">
                  <i class="fa fa-twitter"></i> Tweet
                </button>
                <button onclick="shareOnLinkedIn(null, '${cleanCaption}')" class="share-btn linkedin-btn small">
                  <i class="fa fa-linkedin"></i> Share
                </button>
              </div>
            </li>`;
        }).join('') || '<li>No ad captions generated</li>'}
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

  // Add PDF download button after all content
  const downloadButton = document.createElement('div');
  downloadButton.style.textAlign = 'center';
  downloadButton.style.marginTop = '20px';
  downloadButton.innerHTML = `
    <button onclick="downloadCampaignPDF(${JSON.stringify(textSections)}, window.bannerGenerator)" 
            class="download-btn">
      <i class="fa fa-file-pdf"></i> Download PDF Report
    </button>
  `;
  output.appendChild(downloadButton);
  
  // If banner was generated, move the canvas to the banner container
  if (result.bannerResult?.success) {
    const bannerContainer = document.getElementById('bannerContainer');
    if (bannerContainer && bannerGenerator.canvas) {
      bannerContainer.innerHTML = ''; // Clear any existing content
      bannerContainer.appendChild(bannerGenerator.canvas);
    }
  }

  // Prepare campaign data to save
  const campaignData = {
    name: campaignName,
    description: document.getElementById('productDescription').value,
    category: document.getElementById('productCategory').value,
    tone: document.getElementById('brandTone').value,
    banner_style: document.getElementById('bannerStyle').value,
    primary_color: document.getElementById('primaryColor').value,
    secondary_color: document.getElementById('secondaryColor').value,
    generated_content: result.textContent
  };

  // Save the campaign and update UI
  saveCampaignToDB(campaignData)
    .then(campaignId => {
      if (campaignId) {
        console.log('Campaign saved with ID:', campaignId);
        // Show success notification
        showNotification('Campaign saved successfully!', 'success');
        // Refresh the account data
        if (typeof window.loadAccountData === 'function') {
          window.loadAccountData();
        }
      }
    })
    .catch(error => {
      console.error('Error saving campaign:', error);
      showNotification('Failed to save campaign', 'error');
    });
}

async function generateAdCampaign() {
  // Get form values
  const campaignName = document.getElementById('campaignName').value || `Campaign ${new Date().toLocaleDateString()}`;
  const productName = document.getElementById('productName').value;
  const productCategory = document.getElementById('productCategory').value;
  const brandTone = document.getElementById('brandTone').value;
  const productDescription = document.getElementById('productDescription').value;
  
  // Validate inputs
  if (!productName || !productCategory || !productDescription) {
    showError("Please fill in all required fields");
    return;
  }

  hideError();
  showLoading();
  
  try {
    const geminiService = new GeminiService();
    
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
    }, campaignName);
    
  } catch (error) {
    console.error('Full error:', error);
    showError(`Error: ${error.message}`);
    document.getElementById('outputSection').innerHTML = `
      <div class="error-message">
        <p>Failed to generate campaign. Please try again.</p>
        <p>Technical details: ${error.message}</p>
        ${error.response ? `<pre>${JSON.stringify(error.response, null, 2)}</pre>` : ''}
      </div>
    `;
  } finally {
    hideLoading();
  }
}

// Make functions available globally for HTML onclick handlers
window.switchTab = switchTab;
window.copyToClipboard = copyToClipboard;

function shareOnTwitter(imageUrl = null, text = null) {
  let tweetText = "🚀 Just created this amazing ad using AdSnap! #AdMagic";
  
  if (text) {
    tweetText = text;
  }
  
  const encodedText = encodeURIComponent(`${tweetText}${imageUrl ? '\n' + imageUrl : ''}`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  window.open(twitterUrl, "_blank");
}

function shareOnLinkedIn(imageUrl = null, text = null) {
  if (text) {
    // For text posts, use the feed sharing URL
    const encodedText = encodeURIComponent(text);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?text=${encodedText}`;
    window.open(linkedInUrl, "_blank");
  } else {
    // For images, use the regular URL sharing
    const linkedInURL = window.location.origin;
    const encodedUrl = encodeURIComponent(linkedInURL);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(linkedInUrl, "_blank");
  }
}

// Add this to make account-related functions available globally
window.viewCampaignDetails = viewCampaignDetails;
window.hideAccountOverlay = handleAccountOverlayClose;

// Make sharing functions available globally
window.shareOnTwitter = shareOnTwitter;
window.shareOnLinkedIn = shareOnLinkedIn;

// Add these helper functions
function formatSocialPost(post) {
  return encodeURIComponent(`${post} \n\nCreated with #AdSnap #AdMagic`);
}

function formatAdCaption(caption) {
  return encodeURIComponent(`${caption} \n\nCreated with #AdSnap #AdMagic`);
}

function generatePDFContent(textSections, bannerGenerator) {
  // Create a container for PDF content
  const pdfContent = document.createElement('div');
  pdfContent.id = 'pdf-content';
  pdfContent.style.padding = '20px';
  pdfContent.style.background = '#fff';
  pdfContent.style.maxWidth = '800px';
  pdfContent.style.margin = '0 auto';
  
  // Add campaign content
  pdfContent.innerHTML = `
    <h1 style="color: #333; text-align: center;">Ad Campaign Report</h1>
    <hr style="margin: 20px 0">
    
    <h2 style="color: #444;">Social Media Posts</h2>
    <ul style="line-height: 1.6">
      ${textSections['Social Media Posts']?.map(post => 
        `<li>${post}</li>`
      ).join('') || '<li>No social media posts generated</li>'}
    </ul>
    
    <h2 style="color: #444;">Ad Captions</h2>
    <ul style="line-height: 1.6">
      ${textSections['Ad Captions']?.map(caption => 
        `<li>${caption}</li>`
      ).join('') || '<li>No ad captions generated</li>'}
    </ul>
    
    <h2 style="color: #444;">Email Campaign</h2>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
      ${textSections['Email Campaign']?.join('<br><br>').replace(/^- /gm, '') || 'No email content generated'}
    </div>
    
    <h2 style="color: #444;">Banner Concepts</h2>
    <ul style="line-height: 1.6">
      ${textSections['Banner Concepts']?.map(concept => 
        `<li>${concept}</li>`
      ).join('') || '<li>No banner concepts generated</li>'}
    </ul>
  `;
  
  // If banner exists, add it to PDF
  if (bannerGenerator.canvas) {
    const bannerSection = document.createElement('div');
    bannerSection.innerHTML = `
      <h2 style="color: #444;">Generated Banner</h2>
      <img src="${bannerGenerator.canvas.toDataURL('image/png')}" 
           style="max-width: 100%; height: auto; margin: 10px 0;">
    `;
    pdfContent.appendChild(bannerSection);
  }
  
  return pdfContent;
}

async function downloadCampaignPDF(textSections, bannerGenerator) {
  try {
    console.log('Starting PDF download...'); // Debug log
    
    // Show loading state
    const downloadBtn = event.currentTarget;
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating PDF...';
    downloadBtn.disabled = true;

    // First, ensure html2pdf is loaded
    if (typeof html2pdf === 'undefined') {
      console.log('Loading html2pdf library...'); // Debug log
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://raw.githack.com/eKoopmans/html2pdf/master/dist/html2pdf.bundle.min.js';
        script.onload = () => {
          console.log('html2pdf loaded successfully'); // Debug log
          resolve();
        };
        script.onerror = (error) => {
          console.error('Failed to load html2pdf:', error); // Debug log
          reject(new Error('Failed to load PDF generator'));
        };
        document.head.appendChild(script);
      });
    }

    // Verify html2pdf is available
    if (typeof html2pdf === 'undefined') {
      throw new Error('PDF generator failed to load');
    }

    console.log('Creating PDF content...'); // Debug log
    
    // Create PDF content
    const pdfContent = document.createElement('div');
    pdfContent.id = 'pdf-content';
    pdfContent.style.padding = '20px';
    pdfContent.style.background = '#fff';
    pdfContent.style.maxWidth = '800px';
    pdfContent.style.margin = '0 auto';
    pdfContent.style.fontFamily = 'Arial, sans-serif';

    // Add campaign content
    pdfContent.innerHTML = `
      <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Ad Campaign Report</h1>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #444;">Social Media Posts</h2>
        <ul style="line-height: 1.6">
          ${Array.isArray(textSections['Social Media Posts']) ? 
            textSections['Social Media Posts'].map(post => 
              `<li style="margin-bottom: 10px;">${post}</li>`
            ).join('') : '<li>No social media posts generated</li>'}
        </ul>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #444;">Ad Captions</h2>
        <ul style="line-height: 1.6">
          ${Array.isArray(textSections['Ad Captions']) ? 
            textSections['Ad Captions'].map(caption => 
              `<li style="margin-bottom: 10px;">${caption}</li>`
            ).join('') : '<li>No ad captions generated</li>'}
        </ul>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #444;">Email Campaign</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          ${Array.isArray(textSections['Email Campaign']) ? 
            textSections['Email Campaign'].join('<br><br>') : 'No email content generated'}
        </div>
      </div>
    `;

    // Add banner if exists
    if (bannerGenerator?.canvas) {
      console.log('Adding banner to PDF...'); // Debug log
      const bannerSection = document.createElement('div');
      bannerSection.style.marginBottom = '30px';
      bannerSection.innerHTML = `
        <h2 style="color: #444;">Generated Banner</h2>
        <img src="${bannerGenerator.canvas.toDataURL('image/png')}" 
             style="max-width: 100%; height: auto; margin: 10px 0;">
      `;
      pdfContent.appendChild(bannerSection);
    }

    // Add timestamp
    const timestamp = new Date().toLocaleString();
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '30px';
    footer.style.color = '#666';
    footer.innerHTML = `Generated on ${timestamp}`;
    pdfContent.appendChild(footer);

    // Add to document temporarily
    document.body.appendChild(pdfContent);

    console.log('Generating PDF...'); // Debug log

    // Configure PDF options
    const opt = {
      margin: 10,
      filename: 'ad-campaign-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true // Enable logging for html2canvas
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    // Generate PDF
    try {
      await html2pdf().from(pdfContent).set(opt).save();
      console.log('PDF generated successfully'); // Debug log
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      throw pdfError;
    }

    // Cleanup
    document.body.removeChild(pdfContent);
    
    // Restore button state
    downloadBtn.innerHTML = originalText;
    downloadBtn.disabled = false;

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF report: ' + error.message);
    
    // Restore button state
    if (event?.currentTarget) {
      const downloadBtn = event.currentTarget;
      downloadBtn.innerHTML = '<i class="fa fa-file-pdf"></i> Download PDF Report';
      downloadBtn.disabled = false;
    }
  }
}
