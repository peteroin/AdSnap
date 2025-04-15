function generateAdCampaign() {
    const output = document.getElementById('outputSection');
    output.innerHTML = `
      <div class="output-card">
        <h3>Social Media Posts</h3>
        <ul>
          <li>Post 1: "Introducing the future of your lifestyle. Try it today!"</li>
          <li>Post 2: "Sleek. Smart. Essential. Your next favorite product."</li>
          <li>Post 3: "Why wait? Elevate your game with our latest release!"</li>
        </ul>
      </div>

      <div class="output-card">
        <h3>Ad Captions</h3>
        <p>"Turn heads and win hearts – it's not just a product, it's a revolution."</p>
        <p>"Bold design meets unbeatable performance – now available!"</p>
        <p>"The ad your feed's been waiting for – discover more today."</p>
      </div>

      <div class="output-card">
        <h3>Banner Designs</h3>
        <p>Mockup banners generated via DALL·E and styled using Canva API or Figma plugin.</p>
        <p>(Image outputs would be shown here dynamically)</p>
      </div>
    `;
  }