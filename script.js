// script.js

// Scroll-triggered animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Animate paragraphs
            const paragraphs = entry.target.querySelectorAll('p');
            paragraphs.forEach((p, index) => {
                p.style.animation = `fadeInUp 0.8s ${index * 0.2}s forwards`;
            });

            // Animate NFT card
            const nftCard = entry.target.querySelector('.nft-card');
            if (nftCard) {
                nftCard.style.animation = 'fadeInUp 0.8s 0.3s forwards';
            }

            // Animate list items
            const listItems = entry.target.querySelectorAll('li');
            listItems.forEach((item, index) => {
                item.style.animation = `slideInRight 0.6s ${index * 0.2}s forwards`;
            });
        }
    });
}, { threshold: 0.1 });

// Observe all sections
document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
});

// Mobile social menu toggle
const mobileToggle = document.querySelector('.mobile-social-toggle');
const socialDropdown = document.querySelector('.social-dropdown');

if (mobileToggle && socialDropdown) {
    mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileToggle.classList.toggle('active');
        socialDropdown.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (socialDropdown.classList.contains('active')) {
            mobileToggle.classList.remove('active');
            socialDropdown.classList.remove('active');
        }
    });

    // Prevent dropdown close when clicking inside
    socialDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Toggle ALL Minting Probability Dropdowns open/close together
// Responsive Dropdown Logic
document.querySelectorAll('.probability-dropdown .dropdown-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const isDesktop = window.innerWidth > 768;
    const clickedDropdown = button.closest('.probability-dropdown');
    const clickedContent = clickedDropdown.querySelector('.dropdown-content');
    const isOpen = clickedDropdown.classList.contains('open');

    if (isDesktop) {
      const allDropdowns = document.querySelectorAll('.probability-dropdown');
      const anyOpen = [...allDropdowns].some(d => d.classList.contains('open'));

      if (anyOpen) {
        // CLOSE ALL
        allDropdowns.forEach(d => {
          d.classList.remove('open');
          d.querySelector('.dropdown-content').style.maxHeight = null;
        });
      } else {
        // OPEN ALL
        allDropdowns.forEach(d => {
          d.classList.add('open');
          const content = d.querySelector('.dropdown-content');
          content.style.maxHeight = content.scrollHeight + 'px';
        });
      }

    } else {
      // Mobile: toggle only this one
      if (isOpen) {
        clickedDropdown.classList.remove('open');
        clickedContent.style.maxHeight = null;
      } else {
        clickedDropdown.classList.add('open');
        clickedContent.style.maxHeight = clickedContent.scrollHeight + 'px';
      }
    }
  });
});



document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const active = header.classList.contains('active');
      document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));
      document.querySelectorAll('.accordion-content').forEach(c => c.style.maxHeight = null);
  
      if (!active) {
        header.classList.add('active');
        const content = header.nextElementSibling;
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  
    // Enable keyboard accessibility
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });