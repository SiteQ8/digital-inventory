// Runs before the page paints: the hero's words wait for their entrance instead of flashing.
// If the page script is late, the second class lets them show anyway.
document.documentElement.classList.add('m-enter');
setTimeout(function () { document.documentElement.classList.add('m-enter-done'); }, 700);
