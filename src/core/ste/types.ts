/** Severity a violation category carries: blocking vs stylistic. */
export type Severity = 'error' | 'warning';

/** Violation categories the STE rule set scores, in report order. */
export type ViolationCategory =
  | 'long_sentence(>20w)'
  | 'semicolon'
  | 'contraction'
  | 'passive_voice'
  | 'ing_main_verb'
  | 'nominalization'
  | 'phrasal_verb'
  | 'banned_word'
  | 'marketing_adjective'
  | 'modal_hedge'
  | 'long_paragraph(>6s)';