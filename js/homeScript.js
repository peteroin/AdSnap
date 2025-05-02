document.addEventListener('DOMContentLoaded', function() {
    // Animate feature cards when they come into view
    const featureCards = document.querySelectorAll('.feature-card');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });
  
    featureCards.forEach(card => {
      observer.observe(card);
    });
  });