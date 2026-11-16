(() => {
  const dialog = document.getElementById('detail');
  const title = document.getElementById('detail-title');
  const content = document.getElementById('detail-body');
  const close = document.getElementById('close-detail');
  const scroll = document.createElement('div');
  scroll.className = 'detail-scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-labelledby', title.id);
  dialog.setAttribute('aria-labelledby', title.id);
  close.autofocus = true;
  dialog.append(scroll);
  scroll.append(title, content);
  dialog.addEventListener('close', () => { scroll.scrollTop = 0; });
})();
