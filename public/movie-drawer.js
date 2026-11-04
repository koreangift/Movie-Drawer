
const movies = [
  { title: '기생충', original_title: 'Parasite', release_date: '2019-05-30', genre: '드라마 · 스릴러', vote_average: 8.5, overview: '기택의 아들 기우가 부유한 박 사장 가족의 과외 교사가 되면서 두 가족의 삶이 얽히기 시작한다.', symbol: '▥', accent: '#45694e' },
  { title: '인터스텔라', original_title: 'Interstellar', release_date: '2014-11-06', genre: 'SF · 모험', vote_average: 8.7, overview: '지구의 환경이 악화되자 우주비행사 쿠퍼는 인류가 살아갈 새로운 터전을 찾기 위해 우주로 떠난다.', symbol: '◉', accent: '#735a38' },
  { title: '라라랜드', original_title: 'La La Land', release_date: '2016-12-07', genre: '로맨스 · 뮤지컬', vote_average: 8.0, overview: '배우 지망생 미아와 재즈 피아니스트 세바스찬은 로스앤젤레스에서 만나 각자의 꿈을 향해 나아간다.', symbol: '✦', accent: '#704d87' }
];

const search = document.querySelector('#search');
const query = document.querySelector('#query');
const results = document.querySelector('#results');
const details = document.querySelector('#details');
const token = document.querySelector('#token');
const resultsTitle = document.querySelector('#results-title');
const status = document.querySelector('#status');
let activeSearch;
const serverAuth = Symbol('server authentication');
let activeDetail;
const detailStatus = document.querySelector('#detail-status');
const searchRetry = document.querySelector('#search-retry');
const detailRetry = document.querySelector('#detail-retry');

function resetSearchRetry() {
  searchRetry.hidden = true;
  searchRetry.onclick = null;
}

function showSearchError(message, term) {
  status.textContent = message;
  searchRetry.hidden = false;
  searchRetry.onclick = () => {
    const accessToken = token.value.trim() || serverAuth;
    searchTmdb(term, accessToken);
  };
}

function renderDetails(movie) {
  document.querySelector('#movie-title').textContent = movie.title;
  document.querySelector('#movie-meta').textContent =
    [movie.genre, movie.release_date || '개봉일 미정'].filter(Boolean).join(' · ');
  document.querySelector('#movie-overview').textContent =
    movie.overview || '등록된 줄거리가 없습니다.';
}

function requestMovieData(path, params, accessToken, signal) {
  const url = accessToken === serverAuth
    ? new URL('/api/tmdb', location.origin)
    : new URL('https://api.themoviedb.org/3/' + path);
  url.search = new URLSearchParams(params);
  const headers = { Accept: 'application/json' };
  if (accessToken === serverAuth) {
    url.searchParams.set('path', path);
  } else {
    headers.Authorization = 'Bearer ' + accessToken;
  }
  return fetch(url, { headers, signal });
}

async function openDetails(movie, accessToken) {
  renderDetails(movie);
  detailStatus.hidden = true;
  detailRetry.hidden = true;
  detailRetry.onclick = null;
  if (!details.open) details.showModal();
  if (!accessToken) return;

  const request = new AbortController();
  activeDetail?.abort();
  activeDetail = request;
  detailStatus.hidden = false;
  detailStatus.textContent = '상세 정보를 불러오는 중입니다…';

  try {
    const response = await requestMovieData('movie/' + movie.id, { language: 'ko-KR' }, accessToken, request.signal);
    if (!response.ok) throw new Error('TMDB request failed');
    const data = await response.json();
    if (activeDetail !== request || !details.open) return;

    renderDetails({
      title: data.title || movie.title,
      release_date: data.release_date || movie.release_date,
      overview: data.overview || movie.overview,
      genre: data.genres?.map(genre => genre.name).join(' · ')
    });
    detailStatus.hidden = true;
  } catch {
    if (activeDetail === request && details.open) {
      detailStatus.textContent = '상세 정보를 가져오지 못했습니다. 아래 버튼으로 다시 시도하세요.';
      detailRetry.hidden = false;
      detailRetry.onclick = () => openDetails(movie, token.value.trim() || accessToken);
    }
  } finally {
    if (activeDetail === request) activeDetail = undefined;
  }
}

details.addEventListener('close', () => {
  if (details.open) return;
  activeDetail?.abort();
  detailRetry.onclick = null;
});

async function searchTmdb(term, accessToken) {
  activeSearch?.abort();
  const request = new AbortController();
  activeSearch = request;
  resetSearchRetry();
  const heading = term ? 'TMDB 검색 결과' : 'TMDB 인기 영화';
  resultsTitle.textContent = heading;
  results.replaceChildren();
  status.textContent = '영화를 검색하는 중입니다…';
  try {
    const path = term ? 'search/movie' : 'movie/popular';
    const params = term ? { query: term, include_adult: 'false', language: 'ko-KR' } : { language: 'ko-KR' };
    const response = await requestMovieData(path, params, accessToken, request.signal);
    if (request.signal.aborted) return;
    if (response.status === 503 && accessToken === serverAuth) {
      renderMovies(term);
      status.textContent += ' · 실시간 검색은 TMDB 설정에서 토큰을 입력하면 사용할 수 있습니다.';
      return;
    }
    if (!response.ok) {
      showSearchError(response.status === 401
        ? '인증에 실패했습니다. API Read Access Token을 확인한 뒤 다시 검색하세요.'
        : 'TMDB 요청에 실패했습니다. 잠시 후 다시 검색하세요.', term);
      return;
    }
    const data = await response.json();
    if (!request.signal.aborted) renderCards(data.results, heading, accessToken);
  } catch {
    if (!request.signal.aborted) showSearchError('TMDB에 연결할 수 없습니다. 연결을 확인한 뒤 다시 시도하세요.', term);
  } finally {
    if (activeSearch === request) activeSearch = undefined;
  }
}

function renderMovies(searchTerm = '') {
  resetSearchRetry();
  const term = searchTerm.trim().toLowerCase();
  const matches = movies.filter(movie =>
    [movie.title, movie.original_title].some(title => title.toLowerCase().includes(term))
  );
  renderCards(matches, term ? '샘플 검색 결과' : '샘플 영화');
}

function renderCards(matches, heading, accessToken) {
  resultsTitle.textContent = heading;
  document.querySelector('#status').textContent = matches.length ? matches.length + '편' : '일치하는 영화가 없습니다. 다른 제목으로 검색해 보세요.';
  results.replaceChildren(...matches.map(movie => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';

    const art = document.createElement('span');
    art.className = movie.symbol ? 'art' : 'art placeholder';
    art.setAttribute('aria-hidden', 'true');
    art.style.setProperty('--accent', movie.accent || '#454b5c');
    art.textContent = movie.symbol || '포스터 없음';
    if (movie.poster_path) {
      const poster = document.createElement('img');
      poster.className = 'poster';
      poster.alt = '';
      poster.loading = 'lazy';
      poster.addEventListener('error', () => { art.textContent = '포스터 없음'; }, { once: true });
      poster.src = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
      art.replaceChildren(poster);
    }

    const caption = document.createElement('span');
    caption.className = 'caption';
    const title = document.createElement('strong');
    title.textContent = movie.title;
    const meta = document.createElement('small');
    meta.textContent = [(movie.release_date || '').slice(0, 4) || '연도 미정', movie.vote_count === 0 ? '평점 없음' : '★ ' + movie.vote_average.toFixed(1)].join(' · ');
    caption.append(title, meta);
    card.append(art, caption);

    card.addEventListener('click', () => openDetails(movie, accessToken));
    return card;
  }));
}

search.addEventListener('submit', event => {
  event.preventDefault();
  const term = query.value.trim();
  searchTmdb(term, token.value.trim() || serverAuth);
});
query.addEventListener('input', () => {
  if (!query.value.trim()) {
    searchTmdb('', token.value.trim() || serverAuth);
  }
});
searchTmdb('', serverAuth);
