import Script from 'next/script';

export default function Home() {
  return (
    <>
      <header><span>▣</span> MOVIE DRAWER</header>
      <main>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">영화 탐색</p>
        <h1 id="hero-title">오늘은 무슨 영화?</h1>
        <p>영화 제목을 검색하고 카드에서 작품 정보를 확인하세요.</p>
        <form id="search" role="search">
          <input id="query" type="search" aria-label="영화 제목" placeholder="예: 기생충, 인터스텔라" />
          <button type="submit">검색</button>
        </form>
        <details className="credentials">
          <summary>TMDB 실시간 검색 설정</summary>
          <label htmlFor="token">API Read Access Token</label>
          <input id="token" type="password" autoComplete="off" spellCheck={false} aria-describedby="token-help" />
          <p id="token-help">토큰을 입력한 뒤 영화 제목을 검색하세요. 토큰을 비워 두면 샘플 영화 3편에서 검색합니다. 입력한 토큰은 이 페이지에만 유지됩니다.</p>
        </details>
      </section>
      <section aria-labelledby="results-title">
        <div className="section-title"><h2 id="results-title">샘플 영화</h2><p id="status" role="status"></p></div>
        <button className="retry" id="search-retry" type="button" hidden>검색 다시 시도</button>
        <div id="results" className="grid"></div>
      </section>
      </main>
      <footer>Movie Drawer · 영화 데이터 및 포스터 제공 <a href="https://www.themoviedb.org/">TMDB</a><br />This product uses the TMDB API but is not endorsed or certified by TMDB.</footer>
      <dialog id="details" aria-labelledby="movie-title">
        <form method="dialog"><button autoFocus>닫기</button></form>
        <h2 id="movie-title"></h2>
        <p id="detail-status" role="status" hidden></p>
        <button className="retry" id="detail-retry" type="button" hidden>상세 정보 다시 시도</button>
        <p id="movie-meta"></p>
        <p id="movie-overview"></p>
      </dialog>
      <Script src="/movie-drawer.js" strategy="afterInteractive" />
    </>
  );
}
