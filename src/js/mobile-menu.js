const openMobileMenuBtn = document.querySelector('.js-open-mobile-menu');
const closeMobileMenuBtn = document.querySelector('.js-close-mobile-menu');
const mobileMenuElem = document.querySelector('.js-mobile-menu');
const mobileMenuListElem = document.querySelector('.js-mobile-menu-list');

openMobileMenuBtn.addEventListener('click', onOpenMobileMenu);
closeMobileMenuBtn.addEventListener('click', onCloseMobileMenu);
mobileMenuListElem.addEventListener('click', onCheckCloseMobileMenu);

function onOpenMobileMenu() {
  mobileMenuElem.classList.add('is-open');
}

function onCloseMobileMenu() {
  mobileMenuElem.classList.remove('is-open');
}

function onCheckCloseMobileMenu(e) {
  if (e.target !== e.currentTarget) {
    onCloseMobileMenu();
  }
}
