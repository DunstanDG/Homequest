import { lastSevenDays } from './rewardsLogic'
import type { Ymd } from '@/family/types'
import '@/ui/celebrate.css'

/** A small week of dots: which of the last seven days had some StudyQuest. Rest days are just empty dots. */
export function WeekDots({ played, today }: { played: (day: Ymd) => boolean; today: Ymd }) {
  const { days } = lastSevenDays(played, today)
  return (
    <span className="week-dots" aria-hidden="true">
      {days.map((d) => (
        <i key={d.day} className={`${d.played ? 'on' : ''}${d.today ? ' today' : ''}`} />
      ))}
    </span>
  )
}
