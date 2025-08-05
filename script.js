// script.js

// Scroll-triggered animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
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
  },
  { threshold: 0.1 }
);

// Observe all sections
document.querySelectorAll('.section').forEach((section) => {
  observer.observe(section);
});

// Mobile social menu toggle (existing code, ensure it doesn't conflict)
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

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close nav menu when a link is clicked (optional, but good UX)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });

    // Close nav menu when clicking outside of it
    document.addEventListener('click', (event) => {
      if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
      }
    });
  }
});


// Toggle ALL Minting Probability Dropdowns open/close together
// Responsive Dropdown Logic
document
  .querySelectorAll('.probability-dropdown .dropdown-toggle')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const isDesktop = window.innerWidth > 768;
      const clickedDropdown = button.closest('.probability-dropdown');
      const clickedContent = clickedDropdown.querySelector('.dropdown-content');
      const isOpen = clickedDropdown.classList.contains('open');

      if (isDesktop) {
        const allDropdowns = document.querySelectorAll('.probability-dropdown');
        const anyOpen = [...allDropdowns].some((d) =>
          d.classList.contains('open')
        );

        if (anyOpen) {
          // CLOSE ALL
          allDropdowns.forEach((d) => {
            d.classList.remove('open');
            d.querySelector('.dropdown-content').style.maxHeight = null;
          });
        } else {
          // OPEN ALL
          allDropdowns.forEach((d) => {
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

document.querySelectorAll('.accordion-header').forEach((header) => {
  header.addEventListener('click', () => {
    const active = header.classList.contains('active');
    document
      .querySelectorAll('.accordion-header')
      .forEach((h) => h.classList.remove('active'));
    document
      .querySelectorAll('.accordion-content')
      .forEach((c) => (c.style.maxHeight = null));

    if (!active) {
      header.classList.add('active');
      const content = header.nextElementSibling;
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });

  // Enable keyboard accessibility
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      header.click();
    }
  });
});

// Walletconnect
window.process = { env: { NODE_ENV: 'production' } };

function loadWalletConnect(callback) {
  const script = document.createElement('script');
  script.src =
    'https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.19.0/dist/index.umd.js';
  script.onload = callback;
  document.body.appendChild(script);
}

const mintButtons = document.querySelectorAll('.mintBtn');

mintButtons.forEach((mintBtn) => {
  mintBtn.addEventListener('click', async () => {
    try {
      let provider;

      if (window.ethereum?.isMetaMask) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else if (window.wcProvider) {
        provider = new ethers.BrowserProvider(window.wcProvider);
      } else {
        alert('❌ No Wallet connected');
        mintButtons.forEach((mintBtn) => {
          mintBtn.textContent = 'Connect Wallet & Mint';
        });
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        '0x1dc59c50d21514895a88d10f17af8fb1017e6a37',
        [
          'function getPrice() view returns (uint256)',
          'function purchase(uint256 amount) payable',
        ],
        signer
      );

      const priceInWei = await contract.getPrice();
      const tx = await contract.purchase(1, {
        value: priceInWei,
      });
      await tx.wait();
    } catch (err) {
      console.error('❌ Mint-Error:', err);
    }
  });
});

loadWalletConnect(() => {
  const connectBtn = document.getElementById('connectWallet');

  const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
  const truncateEthAddress = (address) => {
    const match = address && address.match(truncateRegex);
    if (!match) return address;
    return `${match[1]}…${match[2]}`;
  };

  const setConnected = (address) => {
    connectBtn.textContent = truncateEthAddress(address);
    mintButtons.forEach((mintBtn) => {
      mintBtn.textContent = 'Mint Now';
    });
    localStorage.setItem('walletAddress', address);
  };

  const clearConnection = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletProvider');
    connectBtn.textContent = 'Connect';
    mintBtn.textContent = 'Connect Wallet & Mint';
  };

  const connectWithMetaMask = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const ethersProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();
    setConnected(address);
    localStorage.setItem('walletProvider', 'metamask');
  };

  const connectWithWalletConnect = async () => {
    const EthereumProvider =
      globalThis['@walletconnect/ethereum-provider'].EthereumProvider;

    const wcProvider = await EthereumProvider.init({
      projectId: '083305249ab43e78f20f52ad13fa95cb',
      chains: [56],
      showQrModal: true,
      metadata: {
        name: 'HODL',
        description:
          '$HODL: THE ULTIMATE REWARD TOKEN!\n\nEarn maximum passive income with $HODL on Binance Smart Chain! Its innovative contract incurs a 5% tax on every transaction, with a sell bot generating BNB rewards for all holders. Claim your share every 7 days.',
        url: 'https://hodltoken.net/',
        icons: ['https://hodltoken.net/icons/icon-96x96.png'],
      },
    });

    window.wcProvider = wcProvider;

    await wcProvider.connect();
    const ethersProvider = new ethers.BrowserProvider(wcProvider);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();
    setConnected(address);
    localStorage.setItem('walletProvider', 'walletconnect');

    wcProvider.on('disconnect', () => {
      clearConnection();
    });
  };

  (async () => {
    const savedProvider = localStorage.getItem('walletProvider');
    if (savedProvider === 'metamask' && window.ethereum?.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          setConnected(accounts[0]);
        }
      } catch (err) {
        console.warn('MetaMask Auto-Reconnect error:', err);
      }
    } else if (savedProvider === 'walletconnect') {
      try {
        const EthereumProvider =
          globalThis['@walletconnect/ethereum-provider'].EthereumProvider;

        const wcProvider = await EthereumProvider.init({
          projectId: '083305249ab43e78f20f52ad13fa95cb',
          chains: [56],
          showQrModal: false,
          metadata: {
            name: 'HODL',
            description:
              '$HODL: THE ULTIMATE REWARD TOKEN!\n\nEarn maximum passive income with $HODL on Binance Smart Chain! Its innovative contract incurs a 5% tax on every transaction, with a sell bot generating BNB rewards for all holders. Claim your share every 7 days.',
            url: 'https://hodltoken.net/',
            icons: ['https://hodltoken.net/icons/icon-96x96.png'],
          },
        });

        window.wcProvider = wcProvider;

        if (await wcProvider.isAuthorized()) {
          await wcProvider.connect();
          const ethersProvider = new ethers.BrowserProvider(wcProvider);
          const signer = await ethersProvider.getSigner();
          const address = await signer.getAddress();
          setConnected(address);

          wcProvider.on('disconnect', () => {
            clearConnection();
          });
        } else {
          clearConnection();
        }
      } catch (err) {
        console.warn('WalletConnect Auto-Reconnect error:', err);
        clearConnection();
      }
    }
  })();

  // 🔘 Button-Klick für Connect
  connectBtn.addEventListener('click', async () => {
    if (window.ethereum?.isMetaMask) {
      try {
        await connectWithMetaMask();
      } catch (err) {
        console.error('MetaMask Error:', err);
      }
    } else {
      try {
        await connectWithWalletConnect();
      } catch (err) {
        console.error('WalletConnect Error:', err);
      }
    }
  });
});