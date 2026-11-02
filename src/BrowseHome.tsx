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
} from "lucide-react";
import { characters, actors, episode } from "./data";

type Props = {
  onPlay: (time: number) => void;
  onDetails: () => void;
  onCharacter: (id: string) => void;
  onActor: (characterId: string) => void;
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
              <img src="/catalog/chiikawa.jpg" alt="치이카와" />
              <span>
                <strong>치이카와</strong>
                <small>{episode.label}</small>
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
              alt="토벌 도구를 든 치이카와와 하치와레"
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
            <span className="billboard-episode">{episode.label}</span>
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
                {characters.map((c) => {
                  const id = c.id;
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
                        <small>{c.voice}</small>
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
                    <img src="/catalog/chiikawa.jpg" alt="치이카와" />
                    <span className="episode-play">
                      <Play size={22} fill="currentColor" />
                    </span>
                  </div>
                  <span>
                    <strong>치이카와</strong>
                    <small>{episode.label}</small>
                  </span>
                  {p.resume > 0 && (
                    <div className="episode-progress">
                      <i
                        style={{
                          width: `${Math.min(100, (p.resume / 330) * 100)}%`,
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
                <h2>목소리의 주인공</h2>
              </div>
              <div className="voice-shelf">
                {characters.map((c) => {
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
              <p className="catalog-note">
                일본어판 성우예요. 누르면 소속사 공식 프로필 기준의 다른 출연작을 볼 수 있어요.
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
            href={`https://www.youtube.com/watch?v=${episode.video}`}
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
  onPlay: (t: number) => void;
  onSave: () => void;
  saved: boolean;
  onCharacter: (id: string) => void;
}) {
  return (
    <div className="title-details">
      <div className="title-details-art">
        <img src="/catalog/chiikawa.jpg" alt="치이카와와 하치와레" />
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
              <span>5개 에피소드</span>
              <span className="outline-label">YouTube</span>
            </div>
            <p>
              나가노의 만화에서 시작된 작고 귀여운 친구들의 이야기.
              <br />
              토벌 랭커를 꿈꾸는 치이카와와 하치와레, 그리고 랏코의 이야기를 함께해 보세요.
            </p>
          </div>
          <p className="detail-cast">
            <span>등장인물:</span> {characters.map((c) => c.name).join(", ")}
            <br />
            <span>성우:</span> 일본어판 (공식 캐스트)
            <br />
            <span>탐색:</span> 캐릭터 · 성우 · 공식 프로필 출연작
          </p>
        </div>
        <div className="episode-heading">
          <h2>에피소드</h2>
          <span>{episode.source}</span>
        </div>
        <button className="episode-row" onClick={() => onPlay(0)}>
          <span className="episode-number">51~55</span>
          <div>
            <img src="/catalog/chiikawa.jpg" alt={episode.label} />
            <Play size={25} />
          </div>
          <section>
            <strong>
              「토벌 랭커」 편 <small>{episode.length}</small>
            </strong>
            <p>51화부터 55화까지 이어 보면서, 영상에 나온 캐릭터를 직접 가리켜 탐색하세요.</p>
          </section>
        </button>
        <h2 className="cast-heading">등장인물 살펴보기</h2>
        <div className="detail-character-row">
          {characters.map((c) => (
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

