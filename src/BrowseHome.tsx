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
  ExternalLink,
} from "lucide-react";
import { characters, works, sameVoice, episodes, CHIIKAWA, koFeatured, koVoice } from "./data";

type Props = {
  onPlay: (time: number) => void;
  onDetails: () => void;
  onCharacter: (id: string) => void;
  onKoWork: (index: number) => void;
  onPair: () => void;
  onSearch: () => void;
  onEdit: () => void;
  connected: boolean;
  resume: number;
  saved: boolean;
  onSave: () => void;
  showSaved: boolean;
  onTab: (value: boolean) => void;
};
export function BrowseHome(p: Props) {
  const cast = useRef<HTMLElement>(null);
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
          <button
            className={!p.showSaved ? "current" : ""}
            onClick={() => p.onTab(false)}
          >
            홈
          </button>
          <button
            onClick={() => {
              p.onTab(false);
              setTimeout(
                () =>
                  cast.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  }),
                0,
              );
            }}
          >
            캐릭터
          </button>
          <button
            className={p.showSaved ? "current" : ""}
            onClick={() => p.onTab(true)}
          >
            내가 찜한 콘텐츠
          </button>
        </div>
        <div className="browse-nav-actions">
          <button
            aria-label="캐릭터 검색"
            title="캐릭터 검색"
            onClick={p.onSearch}
          >
            <Search size={22} />
          </button>
          <button
            className="pair-nav"
            onClick={p.onPair}
            title="휴대폰 리모컨 연결"
          >
            <Smartphone size={21} />
            <span>{p.connected ? "리모컨 연결됨" : "리모컨 연결"}</span>
            {p.connected && <i />}
          </button>
        </div>
      </nav>
      {p.showSaved ? (
        <main className="saved-page">
          <h1>내가 찜한 콘텐츠</h1>
          {p.saved ? (
            <button className="episode-tile saved-tile" onClick={p.onDetails}>
              <img src="/catalog/chiikawa.jpg" alt="치이카와 51화" />
              <span>
                <strong>치이카와</strong>
                <small>51화 · 강해져라 1편</small>
              </span>
              <Play size={23} />
            </button>
          ) : (
            <div className="saved-empty">
              <Plus size={38} />
              <h2>다시 만나고 싶은 이야기를 모아보세요.</h2>
              <p>작품 상세에서 + 버튼을 누르면 여기에 보관됩니다.</p>
              <button
                className="stream-button light"
                onClick={() => p.onTab(false)}
              >
                작품 둘러보기
              </button>
            </div>
          )}
        </main>
      ) : (
        <>
          <section className="billboard" aria-label="추천 작품 치이카와">
            <img
              className="billboard-image"
              src="/catalog/chiikawa.jpg"
              alt="검과 망토를 두른 랏코"
              fetchPriority="high"
            />
            <div className="billboard-shade" />
            <div className="billboard-content">
              <div className="series-label">
                <span>?</span> SERIES
              </div>
              <h1>치이카와</h1>
              <p className="billboard-subtitle">먼가 작고 귀여운 녀석</p>
              <h2>작은 친구들의, 조금은 특별한 하루.</h2>
              <p className="billboard-description">
                치이카와와 친구들이 보내는 귀엽고도 엉뚱한 일상.
                <br />
                궁금한 친구를 가리키면, 새로운 이야기가 시작돼요.
              </p>
              <div className="billboard-actions">
                <button
                  className="stream-button light"
                  onClick={() => p.onPlay(p.resume)}
                >
                  <Play size={24} fill="currentColor" />
                  {p.resume > 3 ? "이어서 재생" : "재생"}
                </button>
                <button
                  className="stream-button translucent"
                  onClick={p.onDetails}
                >
                  <Info size={24} />
                  상세 정보
                </button>
              </div>
              <div className="billboard-feature">
                <Focus size={16} />
                <span>영상 속 캐릭터를 직접 선택해 보세요</span>
              </div>
            </div>
            <span className="billboard-episode">51화 · 강해져라 1편</span>
          </section>
          <main className="browse-rows">
            <section className="shelf" ref={cast} id="characters">
              <div className="shelf-heading">
                <h2>이 이야기의 친구들</h2>
                <button onClick={p.onSearch}>
                  모두 보기 <ChevronRight size={16} />
                </button>
              </div>
              <div className="character-shelf">
                {characters.filter((c) => c.work === undefined).map(({ id }) => {
                  const c = characters.find((c) => c.id === id)!;
                  return (
                    <button
                      className="character-tile"
                      key={id}
                      onClick={() => p.onCharacter(id)}
                      style={{ background: c.color }}
                    >
                      <img src={c.image} alt={c.name} />
                      <div className="character-tile-shade" />
                      <span className="character-tile-name">
                        {c.name}
                        <small>{koVoice(c) ?? c.voice}</small>
                      </span>
                      <span className="tile-circle">
                        <Plus size={18} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="shelf">
              <div className="shelf-heading">
                <h2>
                  {p.resume > 3
                    ? "이어서 시청하기"
                    : "지금 볼 수 있는 에피소드"}
                </h2>
              </div>
              <div className="episode-shelf">
                <button
                  className="episode-tile"
                  onClick={() => p.onPlay(p.resume)}
                >
                  <div className="episode-tile-image">
                    <img src="/catalog/chiikawa.jpg" alt="치이카와 51화 랏코" />
                    <span className="episode-play">
                      <Play size={22} fill="currentColor" />
                    </span>
                  </div>
                  <span>
                    <strong>치이카와</strong>
                    <small>51화 · 강해져라 1편</small>
                  </span>
                  {p.resume > 0 && (
                    <div className="episode-progress">
                      <i
                        style={{
                          width: `${Math.min(100, (p.resume / 91) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
                <div className="pointing-note">
                  <Focus size={25} />
                  <h3>시청 중 떠오른 궁금함까지.</h3>
                  <p>
                    영상을 멈추지 않고 캐릭터, 성우,
                    <br />
                    그리고 다른 작품으로 탐색을 이어가세요.
                  </p>
                  <button onClick={p.onPair}>
                    휴대폰으로 연결하기 <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            </section>
            <section className="shelf">
              <div className="shelf-heading">
                <h2>같은 목소리, 다른 이야기</h2>
              </div>
              <div className="works-shelf">
                {koFeatured.map((f) => (
                  <button
                    className="work-tile"
                    key={f.title}
                    aria-label={`${f.title}: ${f.cast.map((c) => `${c.actor} ${c.role}`).join(", ")}`}
                    onClick={() => p.onKoWork(koFeatured.indexOf(f))}
                  >
                    <img src={f.image} alt={f.title} loading="lazy" />
                    <div className="work-shade" />
                    <div className="work-tile-content">
                      <span>{f.title}</span>
                      <small>
                        {f.cast[0].actor} · {f.cast[0].role}
                        {f.cast.length > 1 && ` 외 먼작귀 성우 ${f.cast.length - 1}명`}
                      </small>
                    </div>
                    <span className="tile-circle">
                      <Info size={18} />
                    </span>
                  </button>
                ))}
              </div>
              <p className="catalog-note">
                먼작귀 한국어판 성우들의 다른 출연작이에요. 누르면 작품 상세
                정보로 이동해요.
              </p>
            </section>
          </main>
        </>
      )}
      <footer className="browse-footer">
        <span>NUTFLIX · Point & Discover</span>
        <div>
          <button onClick={p.onEdit}>장면 편집</button>
          <a
            href="https://www.youtube.com/watch?v=JXeE6pFSBoI"
            target="_blank"
            rel="noreferrer"
          >
            영상 원본
          </a>
          <a
            href="https://www.anime-chiikawa.jp/"
            target="_blank"
            rel="noreferrer"
          >
            공식 정보 출처
          </a>
        </div>
      </footer>
    </div>
  );
}
export function TitleDetails({
  onPlay,
  onSave,
  saved,
  onCharacter,
}: {
  onPlay: (t: number, video?: string) => void;
  onSave: () => void;
  saved: boolean;
  onCharacter: (id: string) => void;
}) {
  return (
    <div className="title-details">
      <div className="title-details-art">
        <img src="/catalog/chiikawa.jpg" alt="치이카와 랏코" />
        <div />
        <section>
          <h1>치이카와</h1>
          <div className="billboard-actions">
            <button className="stream-button light" onClick={() => onPlay(0)}>
              <Play size={21} fill="currentColor" />
              재생
            </button>
            <button
              className="round-action"
              aria-label={
                saved ? "내가 찜한 콘텐츠에서 삭제" : "내가 찜한 콘텐츠에 추가"
              }
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
              <strong>캐릭터 탐색 지원</strong>
              <span>애니메이션</span>
              <span>{episodes.length}개 에피소드</span>
              <span className="outline-label">YouTube</span>
            </div>
            <p>
              나가노의 만화에서 시작된 작고 귀여운 친구들의 이야기.
              <br />
              치이카와와 하치와레, 그리고 랏코의 만남을 함께해 보세요.
            </p>
          </div>
          <p className="detail-cast">
            <span>등장인물:</span> 치이카와, 하치와레, 랏코
            <br />
            <span>제목·엔딩:</span> 우사기
            <br />
            <span>탐색:</span> 캐릭터 · 한국어 더빙 성우 · 관련 작품
          </p>
        </div>
        <div className="episode-heading">
          <h2>에피소드</h2>
          <span>공개 영상 {episodes.length}개</span>
        </div>
        {episodes.map((e) => (
          <button className="episode-row" key={e.video} onClick={() => onPlay(0, e.video)}>
            <span className="episode-number">{e.number}</span>
            <div>
              <img
                src={e.video === CHIIKAWA ? "/catalog/chiikawa.jpg" : `https://i.ytimg.com/vi/${e.video}/hqdefault.jpg`}
                alt={e.title}
                loading="lazy"
              />
              <Play size={25} />
            </div>
            <section>
              <strong>
                {e.title} <small>{e.length}</small>
              </strong>
              <p>
                {e.video === CHIIKAWA
                  ? "작은 친구들과 랏코의 이야기를 보면서, 영상에 나온 캐릭터를 직접 탐색하세요."
                  : `${e.source} 전편 공개 영상. 치이카와·하치와레·우사기가 나오는 장면에서 직접 탐색하세요.`}
              </p>
            </section>
          </button>
        ))}
        <h2 className="cast-heading">등장인물 살펴보기</h2>
        <div className="detail-character-row">
          {characters.filter((c) => c.work === undefined).map((c) => (
            <button key={c.id} onClick={() => onCharacter(c.id)}>
              <div style={{ background: c.color }}>
                <img src={c.image} alt={c.name} />
              </div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkDetails({
  index,
  onWork,
  onCharacter,
  onPlay,
  onTitle,
}: {
  index: number;
  onWork: (index: number) => void;
  onCharacter: (id: string) => void;
  onPlay: (index: number) => void;
  onTitle: () => void;
}) {
  const w = works[index];
  const owner = characters.find((c) => c.id === w.owner)!;
  const cast = characters.filter((c) => c.work === index);
  const others = cast.flatMap(sameVoice);
  return (
    <div className="title-details">
      <div className="title-details-art">
        <img src={w.image} alt={w.name} />
        <div />
        <section>
          <h1>{w.name}</h1>
          <div className="billboard-actions">
            <button className="stream-button light" onClick={() => onPlay(index)}>
              <Play size={21} fill="currentColor" />
              재생
            </button>
            <a className="round-action" href={w.url} target="_blank" rel="noreferrer" aria-label="작품 공식 사이트">
              <ExternalLink size={21} />
            </a>
          </div>
        </section>
      </div>
      <div className="title-details-body">
        <div className="title-metadata">
          <div>
            <div className="metadata-line">
              <strong>같은 목소리</strong>
              <span>애니메이션</span>
              <span>{w.genre}</span>
            </div>
            <p>{w.summary}</p>
          </div>
          <p className="detail-cast">
            <span>원제:</span> {w.jp}
            <br />
            <span>성우:</span> {owner.voice} ({owner.voiceJp})
            <br />
            <span>담당 배역:</span> {w.role} ({w.roleJp})
          </p>
        </div>
        <div className="episode-heading">
          <h2>영상</h2>
          <span>공식 영상 1개</span>
        </div>
        <button className="episode-row" onClick={() => onPlay(index)}>
          <span className="episode-number">1</span>
          <div>
            <img src={`https://i.ytimg.com/vi/${w.video}/hqdefault.jpg`} alt={w.name + " 영상"} />
            <Play size={25} />
          </div>
          <section>
            <strong>{w.name}</strong>
            <p>{w.videoLabel}</p>
          </section>
        </button>
        {others.length > 0 && (
          <>
            <h2 className="cast-heading">{owner.voice}의 다른 작품</h2>
            <div className="works-shelf">
              {others.map((o) => (
                <button
                  className="work-tile"
                  key={o.id}
                  onClick={() => (o.work === undefined ? onTitle() : onWork(o.work))}
                >
                  <img
                    src={o.work === undefined ? "/catalog/chiikawa.jpg" : works[o.work].image}
                    alt={o.work === undefined ? "치이카와" : works[o.work].name}
                    loading="lazy"
                  />
                  <div className="work-shade" />
                  <div className="work-tile-content">
                    <span>{o.work === undefined ? "치이카와" : works[o.work].name}</span>
                    <small>{o.name}</small>
                  </div>
                  <span className="tile-circle">
                    <Info size={18} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        <h2 className="cast-heading">등장인물 살펴보기</h2>
        <div className="detail-character-row">
          {cast.map((c) => (
            <button key={c.id} onClick={() => onCharacter(c.id)}>
              <div style={{ background: c.color }}>
                <img src={c.image} alt={c.name} />
              </div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <p className="catalog-note">
          시청 제공 여부는 작품 공식 사이트에서 확인해 주세요.
        </p>
      </div>
    </div>
  );
}


export function KoWorkDetails({
  index,
  onPlay,
  onActor,
}: {
  index: number;
  onPlay: (index: number) => void;
  onActor: (actor: string) => void;
}) {
  const f = koFeatured[index];
  return (
    <div className="title-details">
      <div className="title-details-art">
        <img src={f.image} alt={f.title} />
        <div />
        <section>
          <h1>{f.title}</h1>
          <div className="billboard-actions">
            <button className="stream-button light" onClick={() => onPlay(index)}>
              <Play size={21} fill="currentColor" />
              재생
            </button>
          </div>
        </section>
      </div>
      <div className="title-details-body">
        <div className="title-metadata">
          <div>
            <div className="metadata-line">
              <strong>같은 목소리</strong>
              <span>애니메이션</span>
              <span>{f.genre}</span>
            </div>
            <p>{f.summary}</p>
          </div>
          <p className="detail-cast">
            <span>한국어판 출연:</span> {f.cast.map((c) => c.actor).join(", ")}
            <br />
            <span>먼작귀 성우:</span> {f.cast.length}명
          </p>
        </div>
        <div className="episode-heading">
          <h2>영상</h2>
          <span>공식 영상 1개</span>
        </div>
        <button className="episode-row" onClick={() => onPlay(index)}>
          <span className="episode-number">1</span>
          <div>
            <img src={`https://i.ytimg.com/vi/${f.video}/hqdefault.jpg`} alt={f.title + " 영상"} />
            <Play size={25} />
          </div>
          <section>
            <strong>{f.title}</strong>
            <p>{f.videoLabel}</p>
          </section>
        </button>
        <h2 className="cast-heading">먼작귀 성우가 맡은 배역</h2>
        <div className="detail-character-row">
          {f.cast.map((c) => {
            const ch = characters.find((ch) => koVoice(ch) === c.actor);
            return (
              <button key={c.actor} onClick={() => onActor(c.actor)}>
                <div style={{ background: ch?.color ?? "#333" }}>
                  {ch && <img src={ch.image} alt={ch.name} />}
                </div>
                <span>
                  {c.actor} · {c.role}
                  {ch && <small>먼작귀 {ch.koName ?? ch.name}</small>}
                </span>
              </button>
            );
          })}
        </div>
        <p className="catalog-note">
          출연작 목록은 제작자가 정리한 자료예요. 시청 제공 여부는 각 작품의 공식 사이트에서 확인해 주세요.
        </p>
      </div>
    </div>
  );
}
