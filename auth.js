(function () {
  var authMode = 'login';
  var form;
  var submitButton;
  var modeButton;
  var authTitle;
  var authSub;
  var authStatus;
  var emailInput;
  var passwordInput;
  var signInNav;
  var signUpNav;
  var githubButton;
  var googleButton;

  function setStatus(message, tone) {
    if (!authStatus) {
      return;
    }

    authStatus.textContent = message || '';
    authStatus.className = tone ? 'auth-status ' + tone : 'auth-status';
  }

  function syncButtons() {
    var loginActive = authMode === 'login';
    submitButton.textContent = loginActive ? 'Sign In to DecodeLabs' : 'Create Account';
    modeButton.textContent = loginActive ? 'Need an account? Sign Up' : 'Already have an account? Sign In';
    authTitle.textContent = loginActive ? 'Welcome back' : 'Create your account';
    authSub.textContent = loginActive
      ? 'Secure JWT sign-in backed by the DecodeLabs API.'
      : 'Create a new student account with hashed password storage.';
    if (signInNav && signUpNav) {
      signInNav.classList.toggle('active', loginActive);
      signUpNav.classList.toggle('active', !loginActive);
    }
  }

  function setMode(mode) {
    authMode = mode;
    syncButtons();
    setStatus('');
  }

  function consumeOAuthHashToken() {
    if (!window.location.hash) {
      return false;
    }

    var hash = window.location.hash.charAt(0) === '#' ? window.location.hash.slice(1) : window.location.hash;
    var params = new URLSearchParams(hash);
    var oauthState = params.get('oauth');
    var token = params.get('token');
    var provider = params.get('provider');
    var message = params.get('message');

    if (oauthState !== 'success' && oauthState !== 'error') {
      return false;
    }

    history.replaceState({}, document.title, window.location.pathname + window.location.search);

    if (oauthState === 'success' && token) {
      window.apiClient.setToken(token);
      setStatus((provider || 'OAuth') + ' sign-in successful.', 'success');
      notify('dashboard');
      showPage('dashboard');
      return true;
    }

    setStatus(message || 'OAuth sign-in failed.', 'error');
    showPage('auth');
    return true;
  }

  function startOAuth(provider) {
    window.location.href = '/api/auth/' + provider;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      setStatus('Email and password are required.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus(authMode === 'login' ? 'Signing in...' : 'Creating account...', 'info');

    try {
      var payload = { email: email, password: password };
      var response = authMode === 'login'
        ? await window.apiClient.login(payload)
        : await window.apiClient.register(payload);

      window.apiClient.setToken(response.token);
      passwordInput.value = '';
      setStatus(response.message || 'Success', 'success');
      notify('dashboard');
      showPage('dashboard');
    } catch (error) {
      setStatus(error.message || 'Authentication failed', 'error');
    } finally {
      submitButton.disabled = false;
    }
  }

  async function hydrateSession() {
    if (!window.apiClient.getToken()) {
      return;
    }

    try {
      await window.apiClient.me();
      if (window.currentPage === 'auth') {
        setStatus('Existing session found.', 'success');
      }
    } catch (_error) {
      window.apiClient.clearToken();
    }
  }

  async function refreshDashboard() {
    if (!window.apiClient.getToken()) {
      return;
    }

    try {
      var data = await window.apiClient.dashboard();
      var greeting = document.querySelector('.dash-greeting');
      var greetingSub = document.querySelector('.dash-greeting-sub');

      if (greeting && data.user) {
        var localName = (data.user.email || 'student').split('@')[0];
        var displayName = localName.charAt(0).toUpperCase() + localName.slice(1);
        greeting.textContent = 'Welcome back, ' + displayName + ' 👋';
      }

      if (greetingSub && data.stats) {
        greetingSub.textContent = 'JWT session active · ' + data.stats.tasksDone + ' tasks done · ' + data.stats.streakDays + ' day streak';
      }
    } catch (error) {
      if (error && /token/i.test(error.message || '')) {
        await logout();
        return;
      }
      setStatus('Unable to load protected dashboard data.', 'error');
    }
  }

  async function logout() {
    try {
      await window.apiClient.logout();
    } catch (_error) {
      // Ignore logout errors; local token cleanup still happens.
    }

    window.apiClient.clearToken();
    setMode('login');
    setStatus('You have been signed out.', 'success');
    showPage('auth');
  }

  function protectDashboard(pageName) {
    if (pageName !== 'dashboard') {
      return true;
    }

    var token = window.apiClient.getToken();
    if (!token) {
      setStatus('Please sign in to access the dashboard.', 'error');
      showPage('auth');
      return false;
    }

    return true;
  }

  function bindElements() {
    form = document.getElementById('auth-form');
    submitButton = document.getElementById('auth-submit');
    modeButton = document.getElementById('auth-mode-toggle');
    authTitle = document.getElementById('auth-title');
    authSub = document.getElementById('auth-subtitle');
    authStatus = document.getElementById('auth-status');
    emailInput = document.getElementById('auth-email');
    passwordInput = document.getElementById('auth-password');
    signInNav = document.getElementById('nav-signin');
    signUpNav = document.getElementById('nav-signup');
    githubButton = document.getElementById('oauth-github');
    googleButton = document.getElementById('oauth-google');

    if (!form) {
      return;
    }

    form.addEventListener('submit', handleSubmit);
    modeButton.addEventListener('click', function () {
      setMode(authMode === 'login' ? 'register' : 'login');
    });
    githubButton.addEventListener('click', function () {
      startOAuth('github');
    });
    googleButton.addEventListener('click', function () {
      startOAuth('google');
    });

    setMode('login');
    consumeOAuthHashToken();
    hydrateSession();
  }

  window.logout = logout;
  window.requirePageAccess = protectDashboard;
  window.refreshDashboard = refreshDashboard;
  window.currentPage = 'home';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindElements);
  } else {
    bindElements();
  }
})();
