import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLearner, useNow } from '@/app/context'
import { STATUS_LABEL, statusOf, type WordStatus } from '@/spelling/model'
import { summarise } from '@/spelling/round'
import { canSpeak, speak } from '@/spelling/speak'
import { TIER_LABEL, WORDS, WORD_BY_ID, type SpellingWord } from '@/spelling/words'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { ScreenHead, SectionHead, Seg } from '@/ui/fam'
import { Backronym } from './SpellingPlay'

const SIZES = [5, 10, 15] as const
const KEY = 'hq.spell.size'
const savedSize = (): number => {
  try {
    const n = Number(localStorage.getItem(KEY))
    return (SIZES as readonly number[]).includes(n) ? n : 10
  } catch {
    return 10
  }
}

const DOTS = [0, 1, 2, 3, 4]

/** Box level as five dots, so progress is visible at a glance. */
export function BoxDots({ box, seen }: { box: number; seen: boolean }) {
  return (
    <span className="box-dots" aria-label={seen ? `Level ${box} of 5` : 'Not tried yet'}>
      {DOTS.map((d) => (
        <i key={d} className={seen && d < box ? 'on' : ''} />
      ))}
    </span>
  )
}

type Filter = 'tricky' | WordStatus | 'all'

/** Spelling home: where she is, start a round, and the words she has met. */
export function Spelling() {
  const nav = useNavigate()
  const state = useLearner()
  const now = useNow(60_000)
  const stats = state.spelling
  const sum = useMemo(() => summarise(stats), [stats])
  const [size, setSize] = useState(savedSize)
  const [filter, setFilter] = useState<Filter>('tricky')
  const [open, setOpen] = useState<SpellingWord | undefined>()
  const [all, setAll] = useState(false)
  const met = WORDS.length - sum.counts.new
  const dueNow = WORDS.filter((w) => stats[w.id] && stats[w.id]!.seen > 0 && stats[w.id]!.dueTs <= now).length

  const choose = (n: number) => {
    setSize(n)
    try {
      localStorage.setItem(KEY, String(n))
    } catch {
      /* fine: it just will not be remembered */
    }
  }

  const list = useMemo(() => {
    const metWords = WORDS.filter((w) => (stats[w.id]?.seen ?? 0) > 0)
    if (filter === 'all') return metWords
    if (filter === 'tricky') return metWords.filter((w) => sum.tricky.includes(w.id))
    return metWords.filter((w) => statusOf(stats[w.id]) === filter)
  }, [filter, stats, sum.tricky])

  return (
    <div className="screen spelling">
      <ScreenHead title="Spelling" eyebrow="Learn" onBack={() => nav('/learn')} />

      <section className="card spell-hero">
        <div className="row-between tight">
          <div>
            <p className="eyebrow">Level</p>
            <h2 className="spell-level">
              {sum.level} <span className="muted">of {sum.levels}</span>
            </h2>
          </div>
          <div className="spell-stats">
            <span>
              <b>{sum.counts.known}</b> known
            </span>
            <span>
              <b>{sum.counts.getting}</b> getting there
            </span>
            <span>
              <b>{sum.counts.learning}</b> practising
            </span>
          </div>
        </div>
        <Bar value={met / WORDS.length} tone="xp" label="Words met" />
        <p className="note">
          {met === 0 ? `${WORDS.length} words to learn, starting with the easiest.` : `${met} of ${WORDS.length} words met. ${dueNow ? `${dueNow} ready to practise.` : 'Nothing is due right now, but a round still keeps them fresh.'}`}
        </p>
        <div className="row-between">
          <span className="muted small">Words in a round</span>
          <Seg value={String(size)} onChange={(v) => choose(Number(v))} options={SIZES.map((n) => ({ id: String(n), label: String(n) }))} label="Words in a round" />
        </div>
        <button type="button" className="btn primary big block" onClick={() => nav(`/spelling/play?n=${size}`)}>
          <Icon name="play" size={20} /> {met === 0 ? 'Start spelling' : 'Start a round'}
        </button>
      </section>

      {met > 0 && (
        <>
          <SectionHead title="Words so far" sub="Words you get right come back less often, but they never stop coming back." />
          <Seg
            value={filter}
            onChange={setFilter}
            label="Filter words"
            options={[
              { id: 'tricky', label: `Tricky (${sum.tricky.length})` },
              { id: 'getting', label: 'Getting there' },
              { id: 'known', label: 'Known' },
              { id: 'all', label: 'All' },
            ]}
          />
          {list.length === 0 ? (
            <p className="note">{filter === 'tricky' ? 'Nothing tricky at the moment. Nice.' : 'No words here yet.'}</p>
          ) : (
            <ul className="word-list">
              {(all ? list : list.slice(0, 12)).map((w) => (
                <li key={w.id}>
                  <button type="button" className="word-row" onClick={() => setOpen(w)}>
                    <strong>{w.id}</strong>
                    <span className="muted small">{TIER_LABEL[w.tier]}</span>
                    <BoxDots box={stats[w.id]?.box ?? 0} seen />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list.length > 12 && (
            <button type="button" className="btn ghost small" onClick={() => setAll(!all)}>
              {all ? 'Show fewer' : `Show all ${list.length}`}
            </button>
          )}
        </>
      )}

      <WordSheet word={open} onClose={() => setOpen(undefined)} />
    </div>
  )
}

function WordSheet({ word, onClose }: { word?: SpellingWord; onClose: () => void }) {
  const state = useLearner()
  const w = word ? WORD_BY_ID.get(word.id) : undefined
  const s = w ? state.spelling[w.id] : undefined
  return (
    <Sheet open={!!w} onClose={onClose} title={w?.id}>
      {w && (
        <>
          <p className="lead">{w.clue}</p>
          <p className="muted">
            {w.pos} · sounds like <b>{w.phonetic}</b> {canSpeak() && <button type="button" className="icon-btn small" onClick={() => speak(w.id)} aria-label="Hear it">🔊</button>}
          </p>
          {w.backronym && (
            <p className="spell-trick">
              <span className="eyebrow">Memory trick</span>
              <Backronym text={w.backronym} />
            </p>
          )}
          <div className="row-between">
            <span className="pill">{STATUS_LABEL[statusOf(s)]}</span>
            <BoxDots box={s?.box ?? 0} seen={!!s} />
          </div>
          {s && (
            <p className="note">
              Asked {s.seen} time{s.seen === 1 ? '' : 's'}: {s.clean} first time with no help, {s.skips} skipped. {w.lists.join(' and ')} list.
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
