/**
 * The contact email ships spelled out ("name [at] domain [dot] me") so simple
 * scrapers reading the HTML don't pick it up; for visitors it becomes a normal
 * clickable address once the page runs.
 */
export function initContact() {
  document.querySelectorAll<HTMLElement>('[data-email-user][data-email-domain]').forEach((el) => {
    const address = `${el.dataset.emailUser}@${el.dataset.emailDomain}`;
    const link = document.createElement('a');
    link.className = el.className;
    link.href = `mailto:${address}`;
    link.textContent = address;
    el.replaceWith(link);
  });
}
