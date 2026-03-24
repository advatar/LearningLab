const DEFAULT_CALLBACK_REASON = 'The iProov ceremony did not complete successfully.'

export type IProovMobileLaunchOptions = {
  issuerBaseUrl: string
  callbackUrl: string
  session: string
}

export type IProovMobilePageOptions = {
  session: string
  callbackUrl: string
  validateUrl: string
  webhookUrl: string
  sdkScriptUrl: string
  ceremonyBaseUrl: string
  token: string | null
  mode: 'demo' | 'real'
}

export function buildIProovMobileLaunchUrl(options: IProovMobileLaunchOptions) {
  const url = new URL('/iproov/mobile/start', options.issuerBaseUrl)
  url.searchParams.set('session', options.session)
  url.searchParams.set('callback_url', options.callbackUrl)
  return url.toString()
}

export function parseIProovMobileCallbackUrl(raw: unknown) {
  const value = String(raw || '').trim()
  if (!value) {
    throw new Error('callback_url is required')
  }

  let url: URL
  try {
    url = new URL(value)
  } catch (_error) {
    throw new Error('callback_url must be a valid absolute URL')
  }

  if (url.protocol === 'javascript:') {
    throw new Error('callback_url uses an unsupported protocol')
  }

  return url.toString()
}

export function renderIProovMobilePage(options: IProovMobilePageOptions) {
  const state = {
    session: options.session,
    callbackUrl: options.callbackUrl,
    validateUrl: options.validateUrl,
    webhookUrl: options.webhookUrl,
    sdkScriptUrl: options.sdkScriptUrl,
    ceremonyBaseUrl: options.ceremonyBaseUrl,
    token: options.token,
    mode: options.mode
  }

  const stateJson = safeScriptJson(state)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LearningLab iProov</title>
  <style>
    :root {
      color-scheme: light;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at top, #f5efe1, transparent 42%),
        linear-gradient(180deg, #fbf8f0 0%, #f0eadc 100%);
      color: #1f2a37;
    }
    main {
      width: min(32rem, calc(100vw - 2rem));
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid rgba(31, 42, 55, 0.1);
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 20px 50px rgba(31, 42, 55, 0.12);
    }
    h1 {
      margin: 0 0 0.75rem;
      font-size: 1.35rem;
    }
    p {
      margin: 0 0 1rem;
      line-height: 1.5;
    }
    #status {
      margin-bottom: 1rem;
      padding: 0.75rem 0.9rem;
      border-radius: 0.85rem;
      background: #eef3f6;
      color: #274050;
      font-size: 0.95rem;
    }
    #ceremony {
      min-height: 4rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 0.85rem 1.2rem;
      font: inherit;
      cursor: pointer;
    }
    .primary {
      background: #0f766e;
      color: #fff;
    }
    .secondary {
      background: #d4dce3;
      color: #253746;
    }
    .muted {
      font-size: 0.85rem;
      color: #516170;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <main>
    <h1>Complete iProov</h1>
    <p>This page was opened by the LearningLab wallet fork. Finish the liveness step here and you will be returned to the wallet automatically.</p>
    <div id="status">Preparing the iProov ceremony...</div>
    <div id="ceremony"></div>
    <div class="muted">Session <code>${escapeHtml(options.session)}</code></div>
  </main>
  <script type="application/json" id="iproov-state">${stateJson}</script>
  <script>
    const state = JSON.parse(document.getElementById('iproov-state').textContent);
    const statusNode = document.getElementById('status');
    const ceremonyNode = document.getElementById('ceremony');

    function setStatus(message) {
      statusNode.textContent = message;
    }

    function redirectToWallet(passed, reason) {
      const callback = new URL(state.callbackUrl);
      callback.searchParams.set('session', state.session);
      callback.searchParams.set('passed', passed ? 'true' : 'false');
      if (reason) callback.searchParams.set('reason', reason);
      window.location.replace(callback.toString());
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      let payload = {};
      try {
        payload = await response.json();
      } catch (_error) {
        payload = {};
      }
      return { response, payload };
    }

    async function finishDemo(passed) {
      setStatus(passed ? 'Saving demo success and returning to the wallet...' : 'Saving demo failure and returning to the wallet...');
      await postJson(state.webhookUrl, {
        session: state.session,
        signals: { matching: { passed } }
      });
      redirectToWallet(passed, passed ? '' : ${JSON.stringify(DEFAULT_CALLBACK_REASON)});
    }

    function renderDemoButtons() {
      ceremonyNode.innerHTML = '';
      const actions = document.createElement('div');
      actions.className = 'actions';

      const passButton = document.createElement('button');
      passButton.className = 'primary';
      passButton.textContent = 'Pass Demo Liveness';
      passButton.addEventListener('click', () => finishDemo(true));

      const failButton = document.createElement('button');
      failButton.className = 'secondary';
      failButton.textContent = 'Fail Demo Liveness';
      failButton.addEventListener('click', () => finishDemo(false));

      actions.appendChild(passButton);
      actions.appendChild(failButton);
      ceremonyNode.appendChild(actions);
      setStatus('Demo mode is active. Choose an outcome to continue back to the wallet.');
    }

    async function validateRealCeremony() {
      setStatus('Validating the iProov result with the issuer...');
      const { response, payload } = await postJson(state.validateUrl, { session: state.session });
      if (response.ok && payload && payload.passed) {
        redirectToWallet(true, '');
        return;
      }
      const reason = payload && (payload.reason || payload.message) ? String(payload.reason || payload.message) : ${JSON.stringify(DEFAULT_CALLBACK_REASON)};
      redirectToWallet(false, reason);
    }

    async function ensureIProovSdk() {
      if (customElements.get('iproov-me')) return;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = state.sdkScriptUrl;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load the iProov web SDK.'));
        document.head.appendChild(script);
      });
    }

    async function launchRealCeremony() {
      if (!state.token) {
        throw new Error('This iProov session does not have a ceremony token.');
      }
      await ensureIProovSdk();
      setStatus('Waiting for the iProov ceremony to complete...');
      ceremonyNode.innerHTML = '';
      const ceremony = document.createElement('iproov-me');
      ceremony.setAttribute('token', state.token);
      if (state.ceremonyBaseUrl) {
        ceremony.setAttribute('base_url', state.ceremonyBaseUrl);
      }
      ceremony.addEventListener('passed', () => {
        validateRealCeremony().catch((error) => {
          redirectToWallet(false, error && error.message ? String(error.message) : ${JSON.stringify(DEFAULT_CALLBACK_REASON)});
        });
      }, { once: true });
      ceremony.addEventListener('failed', (event) => {
        const detail = event && event.detail ? event.detail : {};
        const reason = detail.message || detail.reason?.message || detail.reason || ${JSON.stringify(DEFAULT_CALLBACK_REASON)};
        redirectToWallet(false, String(reason));
      });
      ceremony.addEventListener('error', (event) => {
        const detail = event && event.detail ? event.detail : {};
        const reason = detail.message || detail.reason?.message || detail.reason || 'The iProov SDK reported an error.';
        redirectToWallet(false, String(reason));
      });
      ceremony.addEventListener('canceled', () => {
        redirectToWallet(false, 'The iProov ceremony was canceled.');
      });
      ceremonyNode.appendChild(ceremony);
    }

    (async () => {
      try {
        if (state.mode === 'real') {
          await launchRealCeremony();
          return;
        }
        renderDemoButtons();
      } catch (error) {
        const reason = error && error.message ? String(error.message) : 'Unable to launch the iProov ceremony.';
        setStatus(reason);
        redirectToWallet(false, reason);
      }
    })();
  </script>
</body>
</html>`
}

function safeScriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
