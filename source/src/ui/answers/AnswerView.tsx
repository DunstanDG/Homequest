import type { Item } from '@/engine/types'
import { ChoiceAnswer } from './choice'
import { ExprAnswer } from './expr'
import { MatchAnswer } from './match'
import { NumericAnswer } from './numeric'
import { OrderAnswer } from './order'
import { RevealAnswer } from './reveal'
import { TextAnswer } from './text'
import type { AnswerProps } from './shared'

type Common = Omit<AnswerProps<Item>, 'item'>

/** Picks the right input for an item. Mount with key={item.id} so state resets per question. */
export function AnswerView({ item, ...rest }: { item: Item } & Common) {
  switch (item.kind) {
    case 'numeric':
      return <NumericAnswer item={item} {...rest} />
    case 'expr':
      return <ExprAnswer item={item} {...rest} />
    case 'choice':
      return <ChoiceAnswer item={item} {...rest} />
    case 'order':
      return <OrderAnswer item={item} {...rest} />
    case 'match':
      return <MatchAnswer item={item} {...rest} />
    case 'text':
      return <TextAnswer item={item} {...rest} />
    case 'reveal':
      return <RevealAnswer item={item} {...rest} />
  }
}
