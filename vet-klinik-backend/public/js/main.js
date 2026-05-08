/**
 * main.js — Sayfa yönlendirme ve başlangıç
 */

const PAGE_TITLES = {
  dashboard:   'Genel <span>Bakış</span>',
  randevular:  'Randevu <span>Takvimi</span>',
  petler:      'Pet <span>Listesi</span>',
  musteriler:  'Müşteri <span>Kayıtları</span>',
  veterinerler:'Veteriner <span>Ekibi</span>',
  muayeneler:  'Muayene <span>Geçmişi</span>',
  ilaclar:     'İlaç <span>Stok</span>',
};

async function goToPage(page) {
  destroyAllCharts();

  document.querySelectorAll('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.page === page)
  );

  document.getElementById('page-title').innerHTML = PAGE_TITLES[page] || page;
  const el = document.getElementById('page-content');

  switch (page) {
    case 'dashboard':    await renderDashboard(el);    break;
    case 'petler':       await renderPetler(el);       break;
    case 'ilaclar':      await renderIlaclar(el);      break;
    case 'musteriler':   await renderMusteriler(el);   break;
    case 'veterinerler': await renderVeterinerler(el); break;
    case 'muayeneler':   await renderMuayeneler(el);   break;
    case 'randevular':   await renderRandevular(el);   break;
    case 'raporlar':     await renderRaporlar(el); break;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  document.querySelectorAll('.nav-item[data-page]').forEach(item =>
    item.addEventListener('click', () => goToPage(item.dataset.page))
  );

  goToPage('dashboard');
});
