import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import { FetcherOfImages } from './js/fetchImages';

import { Notify } from 'notiflix/build/notiflix-notify-aio';
import 'notiflix/dist/notiflix-notify-aio-3.2.6.min.js';

const searchFormRef = document.querySelector('.search-form');
const galleryRef = document.querySelector('.gallery');

const loadMoreBtn = document.querySelector('.load-more');
const observer = new IntersectionObserver(intersectingHandler);
observer.observe(loadMoreBtn);

searchFormRef.addEventListener('submit', onSubmitForm);

const fetcherOfImages = new FetcherOfImages();
const simpleLightbox = initializeSimpleLightbox();

function onSubmitForm(e) {
  e.preventDefault();

  fetchImages();
}

let reachedLastPage = false;
async function fetchImages() {
  const query = searchFormRef.elements.searchQuery.value.trim();
  if (query === '') {
    return;
  }
  try {
    if (reachedLastPage) {
      return;
    }
    const { data } = await fetcherOfImages.getImages(query);
    const lastPage = Math.ceil(data.totalHits / 40);
    if (data.totalHits === 0) {
      // galleryRef.innerHTML = '';
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    if (fetcherOfImages.page === 1) {
      galleryRef.innerHTML = renderGallery(data.hits);
      Notify.success(`Hooray! We found ${data.totalHits} images.`);
    }  if (fetcherOfImages.page === lastPage) {
      console.log(fetcherOfImages.page, lastPage);
      // reachedLastPage = true;
      Notify.failure("We're sorry, but you've reached the end of search results.");
      return;
    } else {
      galleryRef.insertAdjacentHTML('beforeend', renderGallery(data.hits));
      setScrollbehavior();
    }
    simpleLightbox.refresh();
   
  } catch (error) {
    if (error.response && error.response.status === 400) {
      Notify.info("We're sorry, but you've reached the end of search results.");
    } else {
      Notify.failure('Something went wrong. Try again!');
    }
  }
}

function initializeSimpleLightbox() {
  return new SimpleLightbox('.gallery a');
}

function renderGallery(images) {
  return images
    .map(
      ({
        webformatURL: preview,
        largeImageURL: original,
        tags: description,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="photo-card">
                    <a class="gallery__link" href="${original}">
                        <img src="${preview}" alt="${description}" loading="lazy" />
                        <div class="info">
                            <p class="info-item">
                            <b>Likes</b>
                            ${likes}
                            </p>
                            <p class="info-item">
                            <b>Views</b>
                            ${views}
                            </p>
                            <p class="info-item">
                            <b>Comments</b>
                            ${comments}
                            </p>
                            <p class="info-item">
                            <b>Downloads</b>
                            ${downloads}
                            </p>
                        </div>
                    </a>
                 </div>`;
      }
    )
    .join('');
}

function setScrollbehavior() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function intersectingHandler(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      fetchImages();
    }
  });
}