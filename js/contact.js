/* Contact form handling.
   Ships working out of the box via a mailto: link (no backend needed).
   To collect submissions properly instead, set FORM_ENDPOINT below to a
   Formspree (or similar) endpoint URL. The fetch branch will be used
   automatically and the mailto fallback is skipped. */

const FORM_ENDPOINT = 'https://formspree.io/f/mdeaewrd';
const DEST_EMAIL = 'kmdesignsstudios@gmail.com'; // swap to whichever inbox should receive these

(function contactForm(){
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('.form-status');
  if(!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const get = (k) => (data.get(k) || '').toString().trim();

    const name = get('name');
    const email = get('email');

    if(!name || !email){
      setStatus('Please fill in your name and email.', 'error');
      return;
    }

    if(FORM_ENDPOINT){
      setStatus('Sending…', '');
      try{
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data,
        });
        if(res.ok){
          setStatus('Sent. I\'ll reply within a day or two.', 'ok');
          form.reset();
        } else {
          throw new Error('bad response');
        }
      } catch(err){
        setStatus('Something went wrong. Email me directly instead.', 'error');
      }
      return;
    }

    // fallback: open the visitor's mail client with everything prefilled
    const subject = `New project inquiry: ${get('business') || name}`;
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      get('business') && `Business: ${get('business')}`,
      get('socials') && `Socials: ${get('socials')}`,
      get('type') && `Project type: ${get('type')}`,
      get('timeline') && `Timeline: ${get('timeline')}`,
      '',
      get('message') || '(no message provided)',
    ].filter(Boolean);

    const mailto = `mailto:${DEST_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
    setStatus('Opening your email client…', 'ok');
  });

  function setStatus(msg, state){
    status.textContent = msg;
    status.dataset.state = state;
  }
})();
