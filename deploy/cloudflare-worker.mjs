const proxiedPaths = ['/api', '/socket.io', '/uploads', '/labs', '/health'];

function errorResponse(message, status = 503) {
  return Response.json({ success: false, error: { code: 'BACKEND_UNAVAILABLE', message } }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!proxiedPaths.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))) {
      return env.ASSETS.fetch(request);
    }
    if (!env.BACKEND_ORIGIN || !env.EDGE_PROXY_SECRET) return errorResponse('Fixify deployment is awaiting backend configuration.');
    let upstream;
    try {
      upstream = new URL(env.BACKEND_ORIGIN);
      if (upstream.protocol !== 'https:' && upstream.hostname !== 'localhost' && upstream.hostname !== '127.0.0.1') throw new Error('HTTPS required');
      upstream.pathname = url.pathname;
      upstream.search = url.search;
    } catch { return errorResponse('Fixify backend configuration is invalid.'); }
    const headers = new Headers(request.headers);
    headers.set('x-fixify-gateway', env.EDGE_PROXY_SECRET);
    headers.delete('x-fixify-client-ip');
    const visitorIp = request.headers.get('CF-Connecting-IP');
    if (visitorIp) headers.set('x-fixify-client-ip', visitorIp);
    try {
      const forwarded = new Request(upstream, request);
      for (const [name, value] of headers) forwarded.headers.set(name, value);
      forwarded.headers.delete('x-fixify-client-ip');
      if (visitorIp) forwarded.headers.set('x-fixify-client-ip', visitorIp);
      const response = await fetch(forwarded, { redirect: 'manual' });
      // Return WebSocket upgrades unchanged, including their socket handle.
      if (response.status === 101) return response;
      if (url.pathname.startsWith('/api/') && response.headers.get('content-type')?.includes('text/html')) {
        return errorResponse('The free backend is starting. Please retry shortly.');
      }
      const result = new Response(response.body, response);
      if (url.pathname.startsWith('/api/')) result.headers.set('Cache-Control', 'no-store');
      return result;
    } catch { return errorResponse('The backend is temporarily unavailable. Please retry shortly.'); }
  },
};
