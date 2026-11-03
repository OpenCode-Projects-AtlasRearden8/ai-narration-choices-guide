/**
 * Listening-rubric scoring logic. Pure functions, testable under Node.
 * Five dimensions, each scored 1-5; totals map to decision bands.
 */
var DIMENSIONS = [
  'Voice-book fit',
  'Pacing and rhythm',
  'Character differentiation',
  'Technical polish',
  'Chapter consistency'
];

function band(total) {
  if (total >= 21) return { label: 'Strong yes', action: 'offer' };
  if (total >= 16) return { label: 'Caution - try one more sample', action: 'second-audition' };
  if (total >= 11) return { label: 'Not for this book', action: 'cross-off' };
  return { label: 'Hard no', action: 'reject' };
}

function evaluate(scores) {
  // scores: array of 5 integers, clamped to 1..5
  var clean = DIMENSIONS.map(function (d, i) {
    var v = typeof scores[i] === 'number' ? Math.round(scores[i]) : 0;
    return Math.max(1, Math.min(5, v));
  });
  var total = clean.reduce(function (a, b) { return a + b; }, 0);
  return {
    dimensions: DIMENSIONS,
    scores: clean,
    total: total,
    broken: clean.some(function (v) { return v <= 2; }),
    band: band(total)
  };
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { DIMENSIONS: DIMENSIONS, band: band, evaluate: evaluate };
}
if (typeof window !== 'undefined') {
  window.rubric = { DIMENSIONS: DIMENSIONS, band: band, evaluate: evaluate };
}
