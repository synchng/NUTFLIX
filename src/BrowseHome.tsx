import { useRef } from "react";
import {
  Play,
  Info,
  Plus,
  Check,
  Search,
  Smartphone,
  ChevronRight,
  ArrowUpRight,
  Focus,
  Music,
  MapPin,
} from "lucide-react";
import {
  actors,
  titles,
  titleList,
  itemsOf,
  itemSub,
  kindLabel,
  type Character,
  type Title,
  type TitleId,
} from "./data";

type Props = {
  onPlay: (time: number, id?: TitleId) => void;
  onDetails: (id: TitleId) => void;
  onCharacter: (id: string) => void;
  onActor: (characterId: string) => void;
  onPair: () => void;
  onSearch: () => void;
  onEdit: () => void;
  connected: boolean;
  titleId: TitleId;
  resume: number;
  saved: TitleId[];
  showSaved: boolean;
  onTab: (value: boolean) => void;
};
const hero = titles.sunshine;
const ostLink = (title: Title, track: { title: string; artist: string }) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title} ${title.name} OST`)}`;

function ItemTile({ c, onOpen }: { c: Character; onOpen: (id: string) => void }) {
  return (
    <button
      className={"character-tile" + (c.kind === "character" ? "" : " photo")}
      onClick={() => onOpen(c.id)}
      style={{ background: c.color }}
    >
      <img src={c.image} alt={c.name} loading="lazy" />
      <div className="character-tile-shade" />
      <span className="character-tile-name">
        {c.name}
        <small>{c.kind === "character" || c.kind === "person" ? itemSub(c) : kindLabel[c.kind]}</small>
      </span>
      <span className="tile-circle">
        <Plus size={18} />
      </span>
    </button>
  );
}

export function BrowseHome(p: Props) {
  const rows = useRef<HTMLElement>(null);
  // Resume only applies to the title the TV was last on.
  const heroResume = p.titleId === hero.id ? p.resume : 0;
  const people = itemsOf("sunshine").filter((c) => c.kind === "person");
  const things = itemsOf("sunshine").filter((c) => c.kind === "prop" || c.kind === "place");
  return (
    <div className="browse-page">
      <nav className="browse-nav" aria-label="주 메뉴">
        <button
          className="browse-brand"
          onClick={() => {
            p.onTab(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          NUTFLIX
        </button>
        <div className="browse-nav-links">
          <button className={!p.showSaved ? "current" : ""} onClick={() => p.onTab(false)}>
            홈
          </button>
          <button
            onClick={() => {
              p.onTab(false);
              setTimeout(() => rows.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }}
          >
            시리즈
          </button>
          <button className={p.showSaved ? "current" : ""} onClick={() => p.onTab(true)}>
            내가 찜한 콘텐츠
          </button>
        </div>
        <div className="browse-nav-actions">
          <button aria-label="검색" title="검색" onClick={p.onSearch}>
            <Search size={22} />
          </button>
          <button className="pair-nav" onClick={p.onPair} title="휴대폰 리모컨 연결">
            <Smartphone size={21} />
            <span>{p.connected ? "리모컨 연결됨" : "리모컨 연결"}</span>
            {p.connected && <i />}
          </button>
        </div>
      </nav>
      {p.showSaved ? (
        <main className="saved-page">
          <h1>내가 찜한 콘텐츠</h1>
          {p.saved.length ? (
            p.saved.map((id) => (
              <button key={id} className="episode-tile saved-tile" onClick={() => p.onDetails(id)}>
                <img src={titles[id].hero} alt={titles[id].name} />
                <span>
                  <strong>{titles[id].name}</strong>
                  <small>{titles[id].label}</small>
                </span>
                <Play size={23} />
              </button>
            ))
          ) : (
            <div className="saved-empty">
              <Plus size={38} />
              <h2>다시 만나고 싶은 이야기를 모아보세요.</h2>
              <p>작품 상세에서 + 버튼을 누르면 여기에 보관됩니다.</p>
              <button className="stream-button light" onClick={() => p.onTab(false)}>
                작품 둘러보기
              </button>
            </div>
          )}
        </main>
      ) : (
        <>
          <section className="billboard" aria-label={`추천 작품 ${hero.name}`}>
            <img className="billboard-image" src={hero.hero} alt={`${hero.name} 하이라이트 장면`} fetchPriority="high" />
            <div className="billboard-shade" />
            <div className="billboard-content">
              <div className="series-label">
                <span>N</span> SERIES
              </div>
              <h1>{hero.name}</h1>
              <p className="billboard-subtitle">{hero.genre}</p>
              <h2>{hero.tagline}</h2>
              <p className="billboard-description">{hero.summary}</p>
              <div className="billboard-actions">
                <button className="stream-button light" onClick={() => p.onPlay(heroResume, hero.id)}>
                  <Play size={24} fill="currentColor" />
                  {heroResume > 3 ? "이어서 재생" : "재생"}
                </button>
                <button className="stream-button translucent" onClick={() => p.onDetails(hero.id)}>
                  <Info size={24} />
                  상세 정보
                </button>
              </div>
              <div className="billboard-feature">
                <Focus size={16} />
                <span>보다가 궁금한 인물·소품·장소를 직접 가리켜 보세요</span>
              </div>
            </div>
            <span className="billboard-episode">{hero.label}</span>
          </section>
          <main className="browse-rows" ref={rows}>
            <section className="shelf">
              <div className="shelf-heading">
                <h2>NUTFLIX에서 탐색할 수 있는 작품</h2>
              </div>
              <div className="title-shelf">
                {titleList.map((t) => (
                  <button key={t.id} className="title-card" onClick={() => p.onDetails(t.id)}>
                    <div className="title-card-image">
                      <img src={t.hero} alt={t.name} loading="lazy" />
                      <span className="episode-play" onClick={(e) => { e.stopPropagation(); p.onPlay(p.titleId === t.id ? p.resume : 0, t.id); }}>
                        <Play size={22} fill="currentColor" />
                      </span>
                    </div>
                    <strong>{t.name}</strong>
                    <small>{t.genre}</small>
                    <em><Focus size={13} /> {t.explore}</em>
                  </button>
                ))}
              </div>
            </section>
            <section className="shelf" id="people">
              <div className="shelf-heading">
                <h2>{hero.name} · 화면 속 인물</h2>
                <button onClick={p.onSearch}>
                  모두 보기 <ChevronRight size={16} />
                </button>
              </div>
              <div className="character-shelf">
                {people.map((c) => <ItemTile key={c.id} c={c} onOpen={p.onCharacter} />)}
              </div>
            </section>
            <section className="shelf">
              <div className="shelf-heading">
                <h2>{hero.name} · 소품과 장소</h2>
              </div>
              <div className="character-shelf">
                {things.map((c) => <ItemTile key={c.id} c={c} onOpen={p.onCharacter} />)}
              </div>
            </section>
            <section className="shelf">
              <div className="shelf-heading">
                <h2>{hero.name} OST</h2>
              </div>
              <div className="ost-shelf">
                {hero.ost!.map((track) => (
                  <a key={track.part} className="ost-card" href={ostLink(hero, track)} target="_blank" rel="noreferrer">
                    <span className="ost-part">Part {track.part}</span>
                    <Music size={20} />
                    <strong>{track.title}</strong>
                    <small>{track.artist}</small>
                  </a>
                ))}
              </div>
              <p className="catalog-note">곡 목록은 위키백과 기준이에요. 누르면 YouTube에서 찾아봐요.</p>
            </section>
            <section className="shelf">
              <div className="shelf-heading">
                <h2>치이카와 · 목소리의 주인공</h2>
              </div>
              <div className="voice-shelf">
                {itemsOf("chiikawa").map((c) => {
                  const a = actors[c.voiceJp];
                  return (
                    <button className="voice-tile" key={c.id} onClick={() => p.onActor(c.id)}>
                      <div className="voice-tile-photo" style={{ background: c.color }}>
                        {c.voiceImage ? <img src={c.voiceImage} alt={c.voice} loading="lazy" /> : <span>{c.voiceJp[0]}</span>}
                      </div>
                      <strong>{c.voice}</strong>
                      <small>{c.voiceJp} · {c.name}</small>
                      <em>{a.works.length ? `출연작 ${a.works.length}개` : a.profile ? "공식 프로필" : "크레딧 확인"}</em>
                    </button>
                  );
                })}
              </div>
              <p className="catalog-note">일본어판 성우예요. 누르면 소속사 공식 프로필 기준의 다른 출연작을 볼 수 있어요.</p>
            </section>
          </main>
        </>
      )}
      <footer className="browse-footer">
        <span>NUTFLIX · Point & Discover</span>
        <div>
          <button onClick={p.onEdit}>장면 편집</button>
          {titleList.map((t) => (
            <a key={t.id} href={`https://www.youtube.com/watch?v=${t.video}`} target="_blank" rel="noreferrer">
              {t.name} 영상 원본
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

/** A title's music and filming places; `compact` folds both into one-line toggles for the phone. */
export function TitleExtras({ title, compact }: { title: Title; compact?: boolean }) {
  if (!title.ost) return null;
  const music = (
    <ol className="ost-list">
      {title.ost.map((track) => (
        <li key={track.part}>
          <a href={ostLink(title, track)} target="_blank" rel="noreferrer">
            <span>Part {track.part}</span>
            <strong>{track.title}</strong>
            <small>{track.artist} · {track.date}</small>
            <ArrowUpRight size={15} />
          </a>
        </li>
      ))}
    </ol>
  );
  const places = (
    <div className="place-list">
      {title.locations?.map((l) => (
        <div key={l.name} className="place-item">
          <strong><MapPin size={15} /> {l.name}</strong>
          <small>{l.area}</small>
          <p>{l.note}</p>
          <span>
            <a href={`https://map.naver.com/p/search/${encodeURIComponent(l.mapQuery)}`} target="_blank" rel="noreferrer">지도 ↗</a>
            <a href={l.source.url} target="_blank" rel="noreferrer">출처: {l.source.label} ↗</a>
          </span>
        </div>
      ))}
      {title.otherLocations && (
        <p className="small muted">그 밖의 촬영지(위키백과): {title.otherLocations.join(", ")}</p>
      )}
    </div>
  );
  if (compact)
    return (
      <div className="title-extras compact">
        <details>
          <summary><Music size={16} /> 이 작품의 음악 · OST {title.ost.length}곡</summary>
          {music}
        </details>
        <details>
          <summary><MapPin size={16} /> 촬영지</summary>
          {places}
        </details>
      </div>
    );
  return (
    <div className="title-extras">
      <h2 className="cast-heading"><Music size={20} /> 음악 · OST</h2>
      {music}
      <p className="small muted">곡 목록은 위키백과의 OST 표 기준이에요. 장면마다 흐르는 곡은 따로 표시하지 않았어요.</p>
      <h2 className="cast-heading"><MapPin size={20} /> 촬영지</h2>
      {places}
    </div>
  );
}

export function TitleDetails({
  title,
  onPlay,
  onSave,
  saved,
  onCharacter,
}: {
  title: Title;
  onPlay: (t: number) => void;
  onSave: () => void;
  saved: boolean;
  onCharacter: (id: string) => void;
}) {
  const items = itemsOf(title.id);
  return (
    <div className="title-details">
      <div className="title-details-art">
        <img src={title.hero} alt={title.name} />
        <div />
        <section>
          <h1>{title.name}</h1>
          <div className="billboard-actions">
            <button className="stream-button light" onClick={() => onPlay(0)}>
              <Play size={21} fill="currentColor" />
              재생
            </button>
            <button
              className="round-action"
              aria-label={saved ? "내가 찜한 콘텐츠에서 삭제" : "내가 찜한 콘텐츠에 추가"}
              aria-pressed={saved}
              onClick={onSave}
            >
              {saved ? <Check size={23} /> : <Plus size={23} />}
            </button>
          </div>
        </section>
      </div>
      <div className="title-details-body">
        <div className="title-metadata">
          <div>
            <div className="metadata-line">
              <strong>포인팅 탐색 지원</strong>
              {title.meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
              <span className="outline-label">YouTube</span>
            </div>
            <p>{title.summary}</p>
          </div>
          <p className="detail-cast">
            <span>{title.id === "chiikawa" ? "등장인물:" : "출연:"}</span> {title.cast}
            <br />
            <span>장르:</span> {title.genre}
            <br />
            <span>탐색:</span> {title.explore}
          </p>
        </div>
        <div className="episode-heading">
          <h2>영상</h2>
          <span>{title.source}</span>
        </div>
        <button className="episode-row" onClick={() => onPlay(0)}>
          <span className="episode-number">1</span>
          <div>
            <img src={title.hero} alt={title.label} />
            <Play size={25} />
          </div>
          <section>
            <strong>
              {title.label} <small>{title.length}</small>
            </strong>
            <p>보면서 화면 속 {title.id === "chiikawa" ? "캐릭터" : "인물·소품·장소"}를 직접 가리켜 탐색하세요.</p>
          </section>
        </button>
        <h2 className="cast-heading">이 작품에서 찾을 수 있는 것</h2>
        <div className="detail-character-row">
          {items.map((c) => (
            <button key={c.id} onClick={() => onCharacter(c.id)}>
              <div style={{ background: c.color }} className={c.kind === "character" ? "" : "photo"}>
                <img src={c.image} alt={c.name} />
              </div>
              <span>{c.name}</span>
              <small>{kindLabel[c.kind]}</small>
            </button>
          ))}
        </div>
        <TitleExtras title={title} />
      </div>
    </div>
  );
}
