const labReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* live email validation demo */
(function liveValidation(){
  const input = document.querySelector('#lab-email');
  const status = document.querySelector('#lab-email-status');
  if(!input || !status) return;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  input.addEventListener('input', () => {
    const val = input.value.trim();
    input.classList.remove('is-valid', 'is-invalid');
    status.textContent = '';
    if(!val) return;
    if(re.test(val)){
      input.classList.add('is-valid');
      status.textContent = '✓';
    } else {
      input.classList.add('is-invalid');
    }
  });
})();

/* tilt card */
(function tiltCard(){
  if(labReducedMotion) return;
  const card = document.querySelector('#lab-tilt-card');
  if(!card) return;
  const strength = 10;
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(500px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(500px) rotateX(0) rotateY(0)';
  });
})();
