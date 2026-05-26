const PROXY_PREFIX = '/proxy/';

self.addEventListener('fetch', event => {
    if (!event.request.url.includes(PROXY_PREFIX)) return;

    const realUrl = event.request.url.split(PROXY_PREFIX)[1];

    event.respondWith(
        fetch(realUrl)
        .then(async response => {
            if (response.headers.get('content-type')?.includes('text/html')) {
                let text = await response.text();
                
                text = text.replace(
                    /(href|src|action)=["']([^"']*)["']/gi,
                    (match, attr, url) => {
                        if (url.startsWith('http')) return `${attr}="${PROXY_PREFIX}${url}"`;
                        if (url.startsWith('//')) return `${attr}="${PROXY_PREFIX}https:${url}"`;
                        if (url.startsWith('/')) {
                            try {
                                const base = new URL(realUrl).origin;
                                return `${attr}="${PROXY_PREFIX}${base}${url}"`;
                            } catch(e) {}
                        }
                        return match;
                    }
                );
                return new Response(text, { headers: response.headers });
            }
            return response;
        })
        .catch(() => new Response('Proxy Error', { status: 503 }))
    );
});
