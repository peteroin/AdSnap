// URL of your backend
const API_BASE = 'http://localhost:5000';

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    verifyToken(token);
  } else {
    document.getElementById('authOverlay').style.display = 'flex';
  }

  // Setup form event listeners
  setupAuthForms();
});

async function getAccountInfo(token) {
  const res = await fetch(`${API_BASE}/account`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch account info');
  }

  return await res.json();
}

async function verifyToken(token) {
  try {
    const res = await fetch(`${API_BASE}/account`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById('usernameDisplay').textContent = data.username;
      document.getElementById('authOverlay').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
    } else {
      localStorage.removeItem('token');
      document.getElementById('authOverlay').style.display = 'flex';
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    document.getElementById('authOverlay').style.display = 'flex';
  }
}

function setupAuthForms() {
  // Login Form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        try {
          const userInfo = await getAccountInfo(data.token);

          // Only store token if account info fetch succeeds
          localStorage.setItem('token', data.token);
          document.getElementById('usernameDisplay').textContent = userInfo.username;
          document.getElementById('authOverlay').style.display = 'none';
          document.getElementById('appContent').style.display = 'block';

          // Load initial account data
          loadAccountData();

          // Add this to your login.js after successful login
          document.getElementById('usernameDisplay').addEventListener('click', function () {
            document.getElementById('accountOverlay').classList.remove('hidden');
            setTimeout(() => {
              document.getElementById('accountOverlay').classList.add('active');
              loadAccountData();
            }, 10);
          });

        } catch (err) {
          document.getElementById('auth-message').textContent = 'Login failed. Please try again.';
        }
      } else {
        document.getElementById('auth-message').textContent = data.message || 'Login failed';
      }
    } catch (error) {
      document.getElementById('auth-message').textContent = 'Network error. Please try again.';
    }
  });

  // Signup Form
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        document.getElementById('auth-message').textContent = data.message || 'Signup successful! Please login.';
        toggleAuthForms();
      } else {
        document.getElementById('auth-message').textContent = data.message || 'Signup failed';
      }
    } catch (error) {
      document.getElementById('auth-message').textContent = 'Network error. Please try again.';
    }
  });

  // Toggle between login and signup forms
  document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthForms();
    document.getElementById('auth-message').textContent = 'Create your account';
  });

  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthForms();
    document.getElementById('auth-message').textContent = 'Sign in to continue';
  });

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
  });
}

function toggleAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  }
}
