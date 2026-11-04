import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { hashString, makeRng, uid } from '@/engine/rng'
import { useApp, useFamily, useMe } from '@/app/context'
import { spellTurn } from '@/spelling/actions'
import { buildRound } from '@/spelling/round'
import { canHint, cleanCount, currentTurn, finishTurn, guess, hintFor, moreHint, nextTurn, progressOf, startRound, toPractise, type RoundState } from '@/spelling/session'
import { canSpeak, speak } from '@/spelling/speak'
import { WORD_BY_ID, type SpellingWord } from '@/spelling/words'
import { Icon } from '@/ui/icons'
import { Bar, buzz } from '@/ui/primitives'

/** A memory trick with the first letter of every word picked out, so the eye finds the spelling in it. */
export function Backronym({ text }: { text: string }) {
  return (
    <span className="backronym">
      {text.split(/\s+/).map((w, i) => {
        const at = w.search(/[A-Za-z]/)
        return (
          <span key={i} className="bk-word">
            {w.slice(0, at)}
            <b>{w.charAt(at)}</b>
            {w.slice(at + 1)}{' '}
          </span>
        )
      })}
    </span>
  )
}

/** The word as a row of letter boxes; `null` letters are still to be found. */
export function Letters({ slots, tone }: { slots: (string | null)[]; tone?: 'good' | 'bad' }) {
  return (
    <div className={`spell-slots${tone ? ` ${tone}` : ''}`} style={{ ['--n' as string]: slots.length }} aria-label={`${slots.length} letters`}>
      {slots.map((c, i) => (
        <span key={i} className={`slot${c ? ' on' : ''}`}>
          {c ?? ''}
        </span>
      ))}
    </div>
  )
}

const KIND_LABEL = { new: 'New word', due: 'Practice', spot: 'Quick check' } as const

/** A round of spelling: the definition first, then hints, until she gets it or skips it. */
export function SpellingPlay() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { repo, act } = useApp()
  const f = useFamily()
  const me = useMe()
  const size = Math.max(3, Math.min(20, Number(params.get('n')) || 10))
  const newRound = (): RoundState => {
    const now = Date.now()
    const rng = makeRng((now ^ hashString(repo.learnerId)) >>> 0)
    return startRound(buildRound({ stats: repo.get().spelling, now, size, rng }), uid('rd'), now)
  }
  const [round, setRoundState] = useState<RoundState>(newRound)
  const ref = useRef(round)
  const setRound = (r: RoundState) => {
    ref.current = r
    setRoundState(r)
  }
  const [text, setText] = useState('')
  const [shake, setShake] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const turn = currentTurn(round)
  const word: SpellingWord | undefined = turn ? WORD_BY_ID.get(turn.wordId) : undefined

  useEffect(() => {
    if (round.phase === 'ask') inputRef.current?.focus()
    else if (round.phase === 'right' || round.phase === 'shown') nextRef.current?.focus()
  }, [round.phase, round.idx])

  const finish = (r: RoundState, outcome: 'right' | 'skipped') =>
    finishTurn(r, outcome, Date.now(), (res) => {
      const t = spellTurn(repo.learnerId, repo.get(), res, Date.now())
      act([t.event])
      return { quality: t.quality, xp: t.xp }
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = ref.current
    const w = currentWord(r)
    if (!w) return
    const g = guess(r, w, text)
    if (g.result === 'empty') return
    if (g.result === 'right') {
      setText('')
      setRound(finish(g.state, 'right'))
    } else {
      setRound(g.state)
      setShake((n) => n + 1)
      buzz(60)
      setText('')
      inputRef.current?.focus()
    }
  }
  const skip = () => {
    const r = ref.current
    const w = currentWord(r)
    if (w) {
      setText('')
      setRound(finish(r, 'skipped'))
    }
  }
  const next = () => {
    setText('')
    setRound(nextTurn(ref.current, Date.now()))
  }
  const another = () => {
    setText('')
    setRound(newRound())
  }

  if (round.phase === 'done') return <Summary round={round} onAgain={another} onDone={() => nav('/spelling', { replace: true })} economyRate={f.economy[f.economy.length - 1]?.xpPerCoin} name={me?.name} />
  if (!turn || !word) return null

  const hint = hintFor(round, word)
  const shown = round.phase === 'right' || round.phase === 'shown'
  const step = Math.min(round.words, round.finished.filter((x) => x.ask === 'first').length + (turn.ask === 'first' && !shown ? 1 : 0)) || 1
  const last = round.finished[round.finished.length - 1]

  return (
    <div className="screen spell-play">
      <header className="spell-top">
        <button type="button" className="icon-btn" onClick={() => nav('/spelling', { replace: true })} aria-label="Stop for now">
          <Icon name="x" />
        </button>
        <Bar value={progressOf(round)} tone="good" label="Round progress" />
        <span className="spell-count">
          {step}/{round.words}
        </span>
      </header>

      <section className={`card spell-card${round.phase === 'right' ? ' right' : round.phase === 'shown' ? ' shown' : ''}`} key={`${round.idx}`}>
        <div className="spell-tags">
          <span className="pill">{turn.ask === 'retry' ? 'One more go' : KIND_LABEL[turn.kind]}</span>
          {hint.showPos && <span className="pill">{word.pos}</span>}
        </div>
        <p className="eyebrow">{shown ? (round.phase === 'right' ? 'Yes!' : 'The word is') : 'Spell the word that means'}</p>
        {shown ? <Letters slots={word.id.split('')} tone={round.phase === 'right' ? 'good' : undefined} /> : <p className="spell-def">{word.definition}</p>}
        {shown && <p className="muted spell-def small">{word.clue}</p>}
      </section>

      {!shown && (
        <>
          {hint.slots.length > 0 && <Letters slots={hint.slots} />}
          {hint.showSound && (
            <p className="spell-sound">
              Sounds like <b>{word.phonetic}</b>
              {canSpeak() && (
                <button type="button" className="icon-btn small" onClick={() => speak(word.id)} aria-label="Hear the word">
                  🔊
                </button>
              )}
            </p>
          )}
          {hint.backronym && (
            <p className="spell-trick">
              <span className="eyebrow">Memory trick</span>
              <Backronym text={hint.backronym} />
            </p>
          )}
          {round.wrong.length > 0 && (
            <p className="spell-wrong note bad" key={shake}>
              Not quite{round.wrong.length ? `: "${round.wrong[round.wrong.length - 1]}"` : ''}. {hint.lettersOnly ? 'Here is another letter.' : 'Here is another hint.'}
            </p>
          )}
          <form onSubmit={submit} className="spell-form">
            <input
              ref={inputRef}
              className={`tbox spell-input${round.wrong.length ? ' bad' : ''}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="Type the word"
              aria-label="Your spelling"
            />
            <button type="submit" className="btn primary big" disabled={!text.trim()}>
              Check
            </button>
          </form>
          <div className="btn-row spell-actions">
            <button type="button" className="btn" disabled={!canHint(round, word)} onClick={() => setRound(moreHint(ref.current, word))}>
              <Icon name="bulb" size={18} /> {round.level === 0 ? 'Give me a hint' : 'Another hint'}
            </button>
            <button type="button" className="btn ghost" onClick={skip}>
              {round.level >= 1 || round.tries > 0 ? 'Show me' : 'Skip'}
            </button>
          </div>
        </>
      )}

      {shown && (
        <>
          <p className="spell-sound">
            Sounds like <b>{word.phonetic}</b>
            {canSpeak() && (
              <button type="button" className="icon-btn small" onClick={() => speak(word.id)} aria-label="Hear the word">
                🔊
              </button>
            )}
          </p>
          {word.backronym && (round.phase === 'shown' || last?.quality !== 'clean') && (
            <p className="spell-trick">
              <span className="eyebrow">Memory trick</span>
              <Backronym text={word.backronym} />
            </p>
          )}
          {round.phase === 'right' && last && (
            <p className="spell-praise">
              {last.quality === 'clean' ? (round.combo >= 3 ? `First time! ${round.combo} in a row.` : 'First time!') : last.quality === 'light' ? 'Got it!' : 'You got there in the end.'} <span className="xp-gain">+{last.xp} XP</span>
            </p>
          )}
          {round.phase === 'shown' && <p className="note">No problem. This one will come round again soon.</p>}
          <button ref={nextRef} type="button" className="btn primary big block" onClick={next}>
            {round.idx + 1 >= round.queue.length ? 'Finish' : 'Next word'} <Icon name="chevron" size={18} />
          </button>
        </>
      )}
    </div>
  )
}

const currentWord = (r: RoundState): SpellingWord | undefined => {
  const t = currentTurn(r)
  return t ? WORD_BY_ID.get(t.wordId) : undefined
}

function Summary({ round, onAgain, onDone, economyRate, name }: { round: RoundState; onAgain: () => void; onDone: () => void; economyRate?: number; name?: string }) {
  const clean = cleanCount(round)
  const practise = toPractise(round)
  const coins = economyRate ? Math.floor(round.xp / economyRate) : undefined
  const firsts = round.finished.filter((x) => x.ask === 'first')
  return (
    <div className="screen spell-summary">
      <div className="sum-hero">
        <div className="spell-trophy">
          <Icon name="star" size={44} />
        </div>
        <h1>{clean === round.words ? 'Perfect round!' : clean / Math.max(1, round.words) >= 0.6 ? `Nice one${name ? `, ${name}` : ''}!` : 'Good practice!'}</h1>
        <p className="lead">
          {clean} of {round.words} spelt first time
        </p>
        <p className="spell-xp">
          <Icon name="bolt" size={20} /> +{round.xp} XP{coins ? ` · about ${coins} coin${coins === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <section className="card">
        <h3>How each word went</h3>
        <ul className="spell-results">
          {firsts.map((r, i) => {
            const w = WORD_BY_ID.get(r.wordId)
            return (
              <li key={`${r.wordId}${i}`} className={`res-${r.quality}`}>
                <span className="res-mark" aria-hidden="true">
                  {r.quality === 'clean' ? '✓' : r.quality === 'skip' ? '✗' : '~'}
                </span>
                <strong>{w?.id ?? r.wordId}</strong>
                <span className="muted small">{r.quality === 'clean' ? 'first time' : r.quality === 'light' ? 'with a hint' : r.quality === 'heavy' ? 'lots of hints' : 'skipped'}</span>
              </li>
            )
          })}
        </ul>
        {practise.length > 0 && <p className="note">The {practise.length === 1 ? 'word' : `${practise.length} words`} marked ~ or ✗ will come back soon, so they stick.</p>}
      </section>

      <div className="btn-row">
        <button type="button" className="btn primary big" onClick={onAgain}>
          Another round
        </button>
        <button type="button" className="btn big" onClick={onDone}>
          Done for now
        </button>
      </div>
    </div>
  )
}

