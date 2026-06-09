(function () {
  var API_BASE = '';
  var TOKEN_KEY = 'decodelabs_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function request(path, options) {
    var config = options || {};
    var headers = new Headers(config.headers || {});
    var token = getToken();

    if (token) {
      headers.set('Authorization', 'Bearer ' + token);
    }

    var body = config.body;
    if (body && !(body instanceof FormData) && typeof body !== 'string') {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }

    var response = await fetch(API_BASE + path, {
      method: config.method || 'GET',
      headers: headers,
      body: body
    });

    var data = {};
    try {
      data = await response.json();
    } catch (_error) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  window.apiClient = {
    request: request,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    register: function (payload) {
      return request('/api/auth/register', { method: 'POST', body: payload });
    },
    login: function (payload) {
      return request('/api/auth/login', { method: 'POST', body: payload });
    },
    logout: function () {
      return request('/api/auth/logout', { method: 'POST' });
    },
    me: function () {
      return request('/api/auth/me');
    },
    dashboard: function () {
      return request('/api/dashboard');
    },
    profile: function () {
      return request('/api/profile');
    }
  };
})();
