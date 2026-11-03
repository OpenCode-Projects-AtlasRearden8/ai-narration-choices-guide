/* Shared page behaviour — no dependencies. Checks off worksheets, nothing else. */
document.addEventListener('change', function (e) {
  if (e.target.matches('.check input[type="checkbox"]')) {
    var li = e.target.closest('.check');
    if (li) {
      var label = li.querySelector('span');
      if (label) label.style.textDecoration = e.target.checked ? 'line-through' : 'none';
    }
  }
});
