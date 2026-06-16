// Sukro Hotel - Main JS

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', function() {
      menu.classList.toggle('hidden');
    });
  }

  // Set min date for date inputs to today
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  dateInputs.forEach(input => {
    input.min = today;
    if (!input.value) input.value = today;
  });

  // Lightbox for gallery
  const galleryImages = document.querySelectorAll('.gallery-img');
  if (galleryImages.length > 0) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <img src="" alt="" />
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    galleryImages.forEach(img => {
      img.addEventListener('click', function() {
        lightboxImg.src = this.dataset.full || this.src;
        lightboxImg.alt = this.alt;
        lightbox.classList.add('active');
      });
      img.style.cursor = 'pointer';
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('active');
    });
  }

  // Contact form submission
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name');
      const email = data.get('email');
      const phone = data.get('phone');
      const checkin = data.get('checkin');
      const checkout = data.get('checkout');
      const room = data.get('room');
      const guests = data.get('guests');
      const message = data.get('message');

      const subject = encodeURIComponent(`Reservation Inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `Check-in: ${checkin}\n` +
        `Check-out: ${checkout}\n` +
        `Room Type: ${room}\n` +
        `Guests: ${guests}\n\n` +
        `Message:\n${message}\n`
      );

      const mailtoLink = `mailto:sukro.reservations@gmail.com?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;

      const status = document.getElementById('formStatus');
      if (status) {
        status.textContent = 'Opening your email client...';
        status.classList.remove('hidden');
        status.classList.add('text-sukro-olive');
      }
    });
  }
});
