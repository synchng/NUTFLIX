import { ExternalLink, Play } from "lucide-react";
import type { Character } from "./data";
import { actors } from "./data";
import { workInfo } from "./workInfo";

/** Detail of one work from a voice actor's official profile, with an official clip when one was found. */
export function WorkClip({
  title,
  role,
  character,
  onOpen,
}: {
  title: string;
  role: string;
  character: Character;
  onOpen: (title: string, role: string) => void;
}) {
  const info = workInfo[title];
  const clip = info?.clip;
  const ko = info?.ko;
  const profile = actors[character.voiceJp]?.profile;
  // Same voice, other titles: hop straight to their detail pages.
  const related = (actors[character.voiceJp]?.works ?? []).filter(([t]) => t !== title);
  return (
    <div className="title-details work-clip">
      <div className="work-clip-video">
        {clip ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${clip.video}?autoplay=1&rel=0&playsinline=1`}
            title={`${ko?.title ?? title} 공식 영상`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="work-clip-empty">
            <p>공식 채널에서 이 작품의 클립을 찾지 못했어요.</p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${role}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              YouTube에서 찾아보기 <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
      <div className="title-details-body">
        <h1 className="work-clip-title">{ko?.title ?? title}</h1>
        <p className="work-clip-original">원제 {title}</p>
        <div className="title-metadata">
          <div>
            <div className="metadata-line">
              <strong>{clip?.kind === "character" ? "캐릭터 PV" : clip ? "작품 공식 PV" : "클립 없음"}</strong>
              <span>애니메이션</span>
              {clip && <span className="outline-label">{clip.channel}</span>}
            </div>
            {clip?.kind === "pv" && (
              <p className="small muted">작품 전체 PV라서 이 배역이 나오지 않거나 잠깐만 나올 수 있어요.</p>
            )}
            {ko?.summary ? (
              <>
                <p>{ko.summary}</p>
                <a href={info.wiki} target="_blank" rel="noreferrer" className="small muted">
                  작품 소개: 일본어 위키백과를 번역 ↗
                </a>
              </>
            ) : (
              <p className="muted">작품 소개를 확인할 수 있는 자료를 찾지 못했어요.</p>
            )}
          </div>
          <p className="detail-cast">
            <span>배역:</span> {ko?.role ?? role} ({role})
            <br />
            <span>성우:</span> {character.voice} ({character.voiceJp})
            <br />
            <span>치이카와에서:</span> {character.name}
          </p>
        </div>
        {profile && (
          <p>
            <a href={profile} target="_blank" rel="noreferrer">
              {character.voice} 공식 프로필 ↗
            </a>
          </p>
        )}
        {related.length > 0 && (
          <>
            <h2 className="cast-heading">{character.voice}의 다른 출연작</h2>
            <div className="related-works">
              {related.map(([t, r]) => {
                const video = workInfo[t]?.clip?.video;
                return (
                  <button key={t + r} className="related-work" onClick={() => onOpen(t, r)}>
                    <div>
                      {video ? <img src={`https://i.ytimg.com/vi/${video}/mqdefault.jpg`} alt="" loading="lazy" /> : <span>{t[0]}</span>}
                      {video && <Play size={18} fill="currentColor" />}
                    </div>
                    <strong>{workInfo[t]?.ko.title ?? t}</strong>
                    <small>{workInfo[t]?.ko.role ?? r}</small>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
