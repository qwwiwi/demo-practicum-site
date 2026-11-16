(() => {
  const gallery = document.querySelector('.site-gallery');
  const photos = [...gallery.querySelectorAll('.gallery-photo')];
  const viewer = gallery.querySelector('.photo-viewer');
  const image = viewer.querySelector('img');
  const caption = viewer.querySelector('figcaption');
  const counter = viewer.querySelector('.viewer-count');
  let current = 0;

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = photo.href;
    image.alt = photo.querySelector('img').alt;
    caption.textContent = photo.querySelector('.photo-label').textContent;
    counter.textContent = (current + 1) + ' / ' + photos.length;
  }

  photos.forEach((photo, index) => {
    photo.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showPhoto(index);
      viewer.showModal();
    });
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => showPhoto(current + Number(button.dataset.direction)));
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showPhoto(current - 1);
    if (event.key === 'ArrowRight') showPhoto(current + 1);
  });
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
})();
