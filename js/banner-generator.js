class BannerGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.canvas = document.getElementById('bannerCanvas');
    if (!this.canvas) {
      // Create canvas if it doesn't exist
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'bannerCanvas';
      this.canvas.width = 800;
      this.canvas.height = 400;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.border = '1px solid rgba(255,255,255,0.2)';
      this.canvas.style.borderRadius = '8px';
      this.canvas.style.marginTop = '1rem';
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.initialized = true;
  }

  async generateBanner(productName, style, primaryColor, secondaryColor) {
    try {
      await this.initialize();
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Apply selected style
      switch(style) {
        case 'gradient':
          this.createGradientBackground(primaryColor, secondaryColor);
          break;
        case 'geometric':
          this.createGeometricBackground(primaryColor, secondaryColor);
          break;
        case 'minimal':
          this.createMinimalBackground(primaryColor);
          break;
        case 'dark':
          this.createDarkBackground();
          break;
        default:
          this.createGradientBackground(primaryColor, secondaryColor);
      }
      
      // Add product name text
      this.addProductText(productName, style, primaryColor);
      
      return { success: true, canvas: this.canvas };
    } catch (error) {
      console.error("Banner generation error:", error);
      return { success: false, error: error.message };
    }
  }

  createGradientBackground(color1, color2) {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  createGeometricBackground(color1, color2) {
    // Solid background
    this.ctx.fillStyle = color1;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Geometric pattern
    this.ctx.strokeStyle = color2;
    this.ctx.lineWidth = 2;
    
    for(let i = 0; i < 50; i++) {
      this.ctx.beginPath();
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = Math.random() * 100 + 50;
      
      if(Math.random() > 0.5) {
        this.ctx.arc(x, y, size/2, 0, Math.PI * 2);
      } else {
        this.ctx.rect(x, y, size, size);
      }
      this.ctx.stroke();
    }
  }

  createMinimalBackground(color) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Simple colored bar
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
  }

  createDarkBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a1128');
    gradient.addColorStop(1, '#1a237e');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addProductText(text, style, color) {
    let fontStyle, textColor;
    
    switch(style) {
      case 'minimal':
        fontStyle = 'bold 48px "Helvetica Neue", sans-serif';
        textColor = color;
        break;
      case 'dark':
        fontStyle = 'bold 52px "Arial", sans-serif';
        textColor = '#ffffff';
        break;
      default:
        fontStyle = 'bold 56px "Arial", sans-serif';
        textColor = this.getContrastColor(color);
    }
    
    this.ctx.font = fontStyle;
    this.ctx.fillStyle = textColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Wrap text if needed
    this.wrapText(text, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.8, 60);
  }

  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, y);
  }

  getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  downloadBanner() {
      if (!this.canvas) {
        console.error("Canvas not initialized for download");
        return false;
      }
      
      try {
        const link = document.createElement('a');
        const filename = `banner-${new Date().getTime()}.png`;
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      } catch (error) {
        console.error("Download failed:", error);
        return false;
      }
    }
  }