const API_BASE = 'http://localhost:3000/api';

async function apiFetch(endpoint, options={}) {
  try {
    const res = await fetch(API_BASE+endpoint, options);
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  } catch(e) {
    console.warn('API hatası:', endpoint, e.message);
    return null;
  }
}
async function apiPost(endpoint, body) {
  return apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}
async function apiDelete(endpoint) {
  return apiFetch(endpoint,{method:'DELETE'});
}
async function apiPut(endpoint, body) {
  return apiFetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}

// ── Gerçek API çağrıları ──────────────────────────────
async function getOzet()        { return await apiFetch('/ozet'); }
async function getPetler()      { return await apiFetch('/petler') || []; }
async function getMusteriler()  { return await apiFetch('/musteriler') || []; }
async function getIlaclar()     { return await apiFetch('/ilaclar') || []; }
async function getRandevular()  { return await apiFetch('/randevular') || []; }
async function getVeterinerler(){ return await apiFetch('/veterinerler') || []; }
async function getMuayeneler()  { return await apiFetch('/muayeneler') || []; }

async function petEkle(body)           { return await apiPost('/petler', body); }
async function petSil(id)              { return await apiDelete('/petler/'+id); }
async function musteriEkle(body)       { return await apiPost('/musteriler', body); }
async function musteriSil(id)          { return await apiDelete('/musteriler/'+id); }
async function ilacEkle(body)          { return await apiPost('/ilaclar', body); }
async function stokGuncelle(id,miktar) { return await apiPut('/ilaclar/'+id+'/stok',{EklenenMiktar:miktar}); }
async function randevuEkle(body)       { return await apiPost('/randevular', body); }
async function muayeneEkle(body) { 
  return await apiPost('/muayeneler', body); 
}

async function stokCikar(id, miktar) { 
  return await apiPut('/ilaclar/' + id + '/stokcikar', { CikartilacakMiktar: miktar }); 
}