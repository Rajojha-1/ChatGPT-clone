const logoButton = document.getElementsByClassName('logo_tog')[0];
const dropdown = document.getElementsByClassName('something')[0];

logoButton.addEventListener('click', (event) => {
  dropdown.classList.toggle('hidden');
  event.stopPropagation();
});

document.addEventListener('click', () => {
  dropdown.classList.add('hidden');
});
const accounthold = document.getElementsByClassName('accounthold')[0];
const accountopen = document.getElementsByClassName('accountopen')[0];
accounthold.addEventListener('click', (event) => {
  accountopen.classList.toggle('hidden');
  event.stopPropagation();
});
document.addEventListener('click', () => {
  accountopen.classList.add('hidden');
});


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementsByClassName('send_btn')[0];
  let clickedOnce = false;

  btn.addEventListener('click', () => {
    if (!clickedOnce) {
      document.body.classList.add('landing_active'); // only add, no toggle
      clickedOnce = true; // mark it as done
    }
  });
});
