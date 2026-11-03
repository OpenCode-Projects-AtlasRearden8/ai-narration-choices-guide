/**
 * Decision-tree logic for the Audiobook Voice Decision Guide.
 * Pure functions with no DOM access so they can run under Node in tests.
 *
 * Answers shape:
 *   {
 *     bookType: 'fiction-dialogue' | 'fiction-quiet' | 'nonfiction',
 *     budgetRung: 0 | 1 | 2 | 3 | 4,
 *     schedule: 'this-month' | 'patient',
 *     authorVoice: 'yes' | 'no' | 'unsure'
 *   }
 */
function recommend(answers) {
  var a = answers || {};
  var bookType = a.bookType || 'nonfiction';
  var budgetRung = typeof a.budgetRung === 'number' ? a.budgetRung : 1;
  var schedule = a.schedule || 'patient';
  var authorVoice = a.authorVoice || 'unsure';

  // The author wants their own voice as the brand and is patient: DIY
  if (authorVoice === 'yes' && schedule === 'patient') {
    return {
      decision: 'diy',
      rung: 0,
      title: 'Record it yourself (Rung 0)',
      why: 'You want the author voice as the brand and you have the patience for the ' +
        'recording craft. Follow the companion Audiobook Recording Handbook for mic, ' +
        'room, and editing. The launch-day QC ritual in this guide still applies to you.'
    };
  }

  // Dialogue-heavy fiction pushes toward human narration
  if (bookType === 'fiction-dialogue') {
    if (budgetRung >= 2) {
      return {
        decision: 'human',
        rung: Math.min(budgetRung, 4),
        title: 'Hire a human narrator (Rung ' + budgetRung + ')',
        why: 'Dialogue-heavy fiction lives or dies on character differentiation, which ' +
          'is the weakest axis of AI voices today. Your budget already reaches a human, ' +
          'so spend it there.'
      };
    }
    return {
      decision: 'consider-waiting',
      rung: 1,
      title: 'AI voice is the weakest trade for this book',
      why: 'Dialogue-heavy fiction is where AI narration is mismatched today, and your ' +
        'budget cannot yet reach a reliable human (Rung 2+). Consider recording it ' +
        'yourself, or ship a disclosed AI edition now and let its sales fund a human ' +
        'narrator on the next book.'
    };
  }

  // Nonfiction: AI voice is reasonable when speed or cost dominates
  if (bookType === 'nonfiction' && (schedule === 'this-month' || budgetRung <= 1)) {
    return {
      decision: 'ai',
      rung: 1,
      title: 'Order the AI voice (Rung 1)',
      why: 'Nonfiction holds up well under AI narration, and your schedule or budget ' +
        'signals you value speed and cost over performance depth. Choose a catalog ' +
        'voice, score the sample with the listening rubric, and disclose the narration ' +
        'honestly in your own description.'
    };
  }

  // Patient author with a real budget: a human narrator is the best default
  if (budgetRung >= 2) {
    return {
      decision: 'human',
      rung: Math.min(budgetRung, 4),
      title: 'Hire a human narrator (Rung ' + budgetRung + ')',
      why: 'You are patient and your budget reaches professional floors, so the craft ' +
        'investment is the best default across genres.'
    };
  }

  // Everything is a shrug: cheapest acceptable version now, human on the next book
  return {
    decision: 'cheap-ai-now',
    rung: 1,
    title: 'Cheapest acceptable version now (Rung 1), human next book',
    why: 'Ship the AI edition at a normal price, disclose honestly, and let this ' +
      'book\u2019s audiobook revenue fund a human narrator for the next one. That is ' +
      'the budget-ladder mechanic working as designed.'
  };
}

/* Node/browser interop: export for tests, attach to window for the site. */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { recommend: recommend };
}
if (typeof window !== 'undefined') {
  window.decisionTree = { recommend: recommend };
}
