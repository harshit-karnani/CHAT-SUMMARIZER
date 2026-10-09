(function() {
  window.__egress = window.__egress || [];
  function logEgress(url, method, bodyBytes) {
    var urlStr = String(url || '');
    var host = '';
    var pathname = '';
    try {
      var parsed = new URL(urlStr, window.location.href);
      host = parsed.hostname;
      pathname = parsed.pathname;
    } catch {
      host = '';
      pathname = '';
    }
    var entry = {
      url: urlStr,
      method: String(method || 'GET').toUpperCase(),
      bodyBytes: Number(bodyBytes || 0),
      host: host,
      pathname: pathname,
      ts: Date.now()
    };
    window.__egress.push(entry);
    try {
      window.dispatchEvent(new CustomEvent('egress-call', { detail: entry }));
    } catch {}
  }

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      var method = (init && init.method) ? init.method : (input && input.method ? input.method : 'GET');
      var bodyBytes = 0;
      if (init && init.body) {
        bodyBytes = typeof init.body === 'string' ? init.body.length : (init.body.byteLength || init.body.size || 0);
      }
      logEgress(url, method, bodyBytes);
      return origFetch.apply(this, arguments);
    };
  }

  if (window.XMLHttpRequest) {
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__egress_method = method;
      this.__egress_url = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
      var bodyBytes = 0;
      if (body) {
        bodyBytes = typeof body === 'string' ? body.length : (body.byteLength || body.size || 0);
      }
      logEgress(this.__egress_url, this.__egress_method, bodyBytes);
      return origSend.apply(this, arguments);
    };
  }

  if (navigator && navigator.sendBeacon) {
    var origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url, data) {
      var bodyBytes = 0;
      if (data) {
        bodyBytes = typeof data === 'string' ? data.length : (data.byteLength || data.size || 0);
      }
      logEgress(url, 'POST', bodyBytes);
      return origBeacon(url, data);
    };
  }

  window.__egressSubscribe = function(fn) {
    var handler = function(e) {
      if (typeof fn === 'function') {
        fn(e.detail);
      }
    };
    window.addEventListener('egress-call', handler);
    return function() {
      window.removeEventListener('egress-call', handler);
    };
  };
})();
