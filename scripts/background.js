document.addEventListener("DOMContentLoaded", () => {
    const background = document.querySelector('.background');
  
    // Generate debris
    for (let i = 0; i < 300; i++) {
      const debris = document.createElement('div');
  
      // Assign random type
      const types = ['star', 'blue', 'yellow', 'red', 'purple', 'milkyway'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      debris.classList.add('debris', randomType);
  
      // Randomize position
      debris.style.top = Math.random() * 100 + 'vh';
      debris.style.left = Math.random() * 100 + 'vw';
  
      // Randomize animation delay and duration for variety
      debris.style.animationDelay = Math.random() * 50 + 's'; 
      debris.style.animationDuration = Math.random() * 200 + 100 + 's';
  
      background.appendChild(debris);
    }
  });
  