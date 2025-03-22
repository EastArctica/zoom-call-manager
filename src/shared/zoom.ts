const ZOOM_CLIENT_ID = 'TSO3CnwYSEG6N2O5rFtuw';
const ZOOM_CLIENT_SECRET = '1SRbJ9hdFinLAtL0t9dakBX72B5w0zh5';
const ZOOM_REDIRECT_URI = 'zoom-call-manager://auth';
const verifierUUID = crypto.randomUUID();
const cachedData = new Map<string, ZoomAccessTokenResponse>();

function _arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export type ZoomAccessTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  api_url: string;
};

export async function getAccessToken(code: string) {
  // FIXME: Because of weird bugs this function can be called multiple times and it causes issues because the code is only valid once
  if (cachedData.get(code)) {
    return cachedData.get(code)!;
  }

  const authBasic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
  const req = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authBasic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `code=${encodeURIComponent(code)}&grant_type=authorization_code&redirect_uri=${encodeURI(ZOOM_REDIRECT_URI)}&code_verifier=${encodeURIComponent(verifierUUID)}`,
  });
  if (req.status !== 200) {
    throw new Error('Error received from api');
  }

  const res = (await req.json()) as ZoomAccessTokenResponse;
  cachedData.set(code, res);
  console.log(res);
  return res;
}

export async function refreshAccessToken(refresh_token: string) {
  const authBasic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
  const req = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authBasic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `refresh_token=${refresh_token}&grant_type=refresh_token`,
  });
  if (req.status !== 200) {
    throw new Error('Error received from api');
  }

  const res = (await req.json()) as ZoomAccessTokenResponse;
  return res;
}

export async function getAuthorizeUrl() {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifierUUID),
  );
  const url = new URL('https://zoom.us/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', ZOOM_CLIENT_ID);
  url.searchParams.set('code_challenge', _arrayBufferToBase64(hash));
  url.searchParams.set('redirect_uri', encodeURI(ZOOM_REDIRECT_URI));
  url.searchParams.set('code_challenge_method', 'S256');

  return url;
}
