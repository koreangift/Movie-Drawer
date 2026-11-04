export async function GET(request) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token) return Response.json({ error: 'TMDB token is not configured' }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const path = params.get('path');
  const query = params.get('query')?.trim();
  if (path !== 'movie/popular' && path !== 'search/movie' && !/^movie\/[1-9]\d{0,9}$/.test(path ?? '')) {
    return Response.json({ error: 'Invalid movie endpoint' }, { status: 400 });
  }
  if (path === 'search/movie' && (!query || query.length > 200)) {
    return Response.json({ error: 'Invalid search query' }, { status: 400 });
  }

  const url = new URL(path, 'https://api.themoviedb.org/3/');
  url.searchParams.set('language', 'ko-KR');
  if (path === 'search/movie') {
    url.searchParams.set('query', query);
    url.searchParams.set('include_adult', 'false');
  }
  try {
    const response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      return Response.json({ error: 'TMDB request failed' }, { status: response.status === 404 ? 404 : 502 });
    }
    return Response.json(await response.json());
  } catch {
    return Response.json({ error: 'TMDB is unavailable' }, { status: 502 });
  }
}
