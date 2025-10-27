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

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close nav menu when a link is clicked (optional, but good UX)
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });

    // Close nav menu when clicking outside of it
    document.addEventListener('click', (event) => {
      if (
        !navLinks.contains(event.target) &&
        !hamburgerMenu.contains(event.target) &&
        navLinks.classList.contains('active')
      ) {
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

async function showWalletModalAndWait() {
  return new Promise((resolve, reject) => {
    walletModal.classList.add('show');
  });
}

const mintButtons = document.querySelectorAll('.mintBtn');

mintButtons.forEach((mintBtn) => {
  mintBtn.addEventListener('click', async () => {
    try {
      if (
        !(
          localStorage.getItem('walletProvider') &&
          localStorage.getItem('walletAddress')
        )
      ) {
        if (window.ethereum?.isMetaMask) {
          try {
            await showWalletModalAndWait(); //walletModal.classList.add('show');
            // await connectWithMetaMask();
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
      }

      let provider;
      if (window.ethereum?.isMetaMask) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else if (window.wcProvider) {
        provider = new ethers.BrowserProvider(window.wcProvider);
      } else {
        showToast('No Wallet connected', 'error');
        mintButtons.forEach((mintBtn) => {
          mintBtn.textContent = 'Connect Wallet & Mint';
        });
        return;
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const contract = new ethers.Contract(
        '0x1dc59c50d21514895a88d10f17af8fb1017e6a37',
        [
          'function getPrice() view returns (uint256)',
          'function purchase(uint256 amount) payable',
        ],
        signer
      );

      const priceInWei = await contract.getPrice();
      const balance = await provider.getBalance(address);
      if (balance < priceInWei) {
        showToast(
          `Not enough BNB. You need at least ${(
            (Number(priceInWei) + 50000000000000) /
            10 ** 18
          ).toFixed(4)} BNB in the wallet.`,
          'error'
        );
        return;
      }
      const tx = await contract.purchase(1, {
        value: priceInWei.toString(),
      });
      await tx.wait();
    } catch (err) {
      // if (err.Message.includes('insufficient funds'))
      //   showToast('Not enough BNB in the wallet', 'error');
      console.error('❌ Mint-Error:', err);
    }
  });
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

const connectWithMetaMask = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await switchToBSC(window.ethereum);
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      setConnected(address);
      localStorage.setItem('walletProvider', 'metamask');
      resolve();
    } catch (err) {
      reject(err);
    }
  });
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
  await switchToBSC(wcProvider);
  const ethersProvider = new ethers.BrowserProvider(wcProvider);
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();
  setConnected(address);
  localStorage.setItem('walletProvider', 'walletconnect');

  wcProvider.on('disconnect', () => {
    clearConnection();
  });
};

const switchToBSC = async (provider) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }], // 56 in hex
    });
  } catch (err) {
    if (err.code === 4902) {
      // Chain hinzufügen
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x38',
            chainName: 'Binance Smart Chain Mainnet',
            nativeCurrency: {
              name: 'Binance Coin',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com'],
          },
        ],
      });
    } else {
      console.error('Chain switch failed:', err);
      throw err;
    }
  }
};

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
  mintButtons.forEach((mintBtn) => {
    mintBtn.textContent = 'Connect Wallet & Mint';
  });
};

loadWalletConnect(() => {
  (async () => {
    const savedProvider = localStorage.getItem('walletProvider');

    if (savedProvider === 'metamask' && window.ethereum?.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          await switchToBSC(window.ethereum);
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
          await switchToBSC(wcProvider);
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
    if (
      localStorage.getItem('walletProvider') &&
      localStorage.getItem('walletAddress')
    ) {
      await clearConnection();
    } else {
      if (window.ethereum?.isMetaMask) {
        try {
          walletModal.classList.add('show');
          // await connectWithMetaMask();
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
    }
  });
});

const contractAbi = [
  'function totalSupply() view returns (uint256)',
  'function getPrice() view returns (uint256)',
];

async function updateMintInfo() {
  try {
    const mintCounter = document.getElementById('mintCounter');
    if (mintCounter) {
      const provider = new ethers.JsonRpcProvider(
        'https://bsc-dataseed.binance.org'
      );
      const contract = new ethers.Contract(
        '0x1DC59c50d21514895A88D10F17Af8fB1017E6A37',
        contractAbi,
        provider
      );

      const total = await contract.totalSupply();
      const priceWei = await contract.getPrice();

      const priceBNB = Number(ethers.formatEther(priceWei)).toFixed(3);
      var priceUSDT = 0;

      const res = await fetch(
        'https://www.binance.com/api/v3/ticker/price?symbol=BNBUSDT'
      );
      if (res.ok) {
        const data = await res.json();
        priceUSDT = (
          Number(data.price) * Number(ethers.formatEther(priceWei))
        ).toFixed(2);
      }

      document.getElementById('mintCounter').textContent = `Minted: ${Number(
        total
      ).toLocaleString()} / 50,000`;
      document.getElementById(
        'mintPrice'
      ).textContent = `Price: ${priceBNB} BNB${
        priceUSDT != 0 ? ` / $${priceUSDT}` : ''
      }`;

      document.getElementById(
        'nftprice'
      ).textContent = `The mint price is currently at $${priceUSDT} worth of BNB per NFTs. The
            exact BNB amount is auto-converted based on current market rates.`;
    }
  } catch (err) {
    console.error(err);
  }
}

updateMintInfo();
setInterval(updateMintInfo, 30000);

async function loadWalletModal() {
  if (document.getElementById('walletModal')) return;

  try {
    const response = await fetch('wallet-modal.html');
    const html = await response.text();
    document.body.insertAdjacentHTML('beforeend', html);
    initWalletModal();
  } catch (err) {
    console.error('❌ Fehler beim Laden des Modals:', err);
  }
}

function initWalletModal() {
  const walletModal = document.getElementById('walletModal');
  const closeModal = document.getElementById('closeModal');

  // Modal schließen
  closeModal.addEventListener('click', () => {
    walletModal.classList.remove('show');
  });
  window.addEventListener('click', (e) => {
    if (e.target === walletModal) {
      walletModal.classList.remove('show');
    }
  });

  // Wallet Auswahl
  document.getElementById('connectMetaMask').onclick = async () => {
    walletModal.classList.remove('show');
    await connectWithMetaMask();
  };
  document.getElementById('connectTrust').onclick = async () => {
    walletModal.classList.remove('show');
    await connectWithMetaMask(); // Trust Wallet funktioniert im Browser auch über window.ethereum
  };
  document.getElementById('connectSafePal').onclick = async () => {
    walletModal.classList.remove('show');
    await connectWithMetaMask(); // SafePal Extension nutzt ebenfalls window.ethereum
  };
  document.getElementById('connectWalletConnect').onclick = async () => {
    walletModal.classList.remove('show');
    await connectWithWalletConnect();
  };
}

document.addEventListener('DOMContentLoaded', loadWalletModal);

// ===== Play Modal logic =====
(function () {
  const playBtn = document.getElementById('playNowBtn');
  const modal = document.getElementById('playModal');
  if (!playBtn || !modal) return;

  const closeSelectors = '[data-close]';
  const focusableSel = [
    'a[href]',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  let lastFocused = null;

  const openModal = () => {
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus first focusable in dialog
    const first = modal.querySelector(focusableSel);
    if (first) first.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  playBtn.addEventListener('click', openModal);

  // Close via backdrop or X
  modal.addEventListener('click', (e) => {
    if (e.target.matches(closeSelectors) || e.target.closest(closeSelectors)) {
      closeModal();
    }
  });

  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('is-open') && e.key === 'Escape') {
      closeModal();
    }
  });

  // Optional: small toast confirmation when a download starts
  modal.querySelectorAll('a[download]').forEach((a) => {
    a.addEventListener('click', () => {
      if (typeof showToast === 'function') {
        showToast('Starting download…', 'success');
      }
      // close after a short delay
      setTimeout(closeModal, 300);
    });
  });
})();
