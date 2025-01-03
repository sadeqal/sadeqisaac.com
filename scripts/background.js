document.addEventListener("DOMContentLoaded", () => {
  const background = document.querySelector('.background');

  // Set the number of debris elements based on screen width
  const debrisCount = window.innerWidth < 768 ? 100 : 300; // Fewer debris for mobile devices

  // Generate debris
  for (let i = 0; i < debrisCount; i++) {
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

  // Optional: Add an event listener to regenerate debris when the window is resized
  window.addEventListener('resize', () => {
      // Clear existing debris
      background.innerHTML = '';

      // Adjust debris count dynamically
      const updatedDebrisCount = window.innerWidth < 768 ? 100 : 300;

      for (let i = 0; i < updatedDebrisCount; i++) {
          const debris = document.createElement('div');

          const randomType = types[Math.floor(Math.random() * types.length)];
          debris.classList.add('debris', randomType);

          debris.style.top = Math.random() * 100 + 'vh';
          debris.style.left = Math.random() * 100 + 'vw';

          debris.style.animationDelay = Math.random() * 50 + 's';
          debris.style.animationDuration = Math.random() * 200 + 100 + 's';

          background.appendChild(debris);
      }
  });
});
  