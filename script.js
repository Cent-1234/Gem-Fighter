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

// Dropdowns for Minting Probabilities (Updated Logic)
document.querySelectorAll('.probability-dropdown .dropdown-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const parentDropdown = button.closest('.probability-dropdown');
        const dropdownContent = button.nextElementSibling; // This is the <ul> with class dropdown-content
        const isOpen = parentDropdown.classList.contains('open');

        // Close all other open dropdowns
        document.querySelectorAll('.probability-dropdown').forEach(dropdown => {
            if (dropdown !== parentDropdown && dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                // Find the .dropdown-content inside this other dropdown and set its maxHeight to null
                dropdown.querySelector('.dropdown-content').style.maxHeight = null;
            }
        });

        // Toggle the clicked dropdown
        if (isOpen) {
            parentDropdown.classList.remove('open');
            dropdownContent.style.maxHeight = null;
        } else {
            parentDropdown.classList.add('open');
            // Set max-height to scrollHeight for smooth expansion
            dropdownContent.style.maxHeight = dropdownContent.scrollHeight + 'px';
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