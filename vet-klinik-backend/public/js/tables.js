/* tables.js — Senin gerçek şemanla uyumlu */

function durumPill(d) {
  const m={'Bekliyor':'<span class="pill pill-orange">⏳ Bekliyor</span>','Tamamlandi':'<span class="pill pill-green">✓ Tamamlandı</span>','Iptal':'<span class="pill pill-red">✕ İptal</span>'};
  return m[d]||`<span class="pill">${d||'Bekliyor'}</span>`;
}
function stokPill(s,e){return s<=e?`<span class="pill pill-red">⚠ Kritik (${s})</span>`:`<span class="pill pill-green">✓ Yeterli (${s})</span>`;}
function turEmoji(t){return {Köpek:'🐕',Kedi:'🐱',Kuş:'🐦',Kemirgen:'🐹'}[t]||'🐾';}
function turRenk(t){return {Köpek:'#D6EAF8',Kedi:'#EAD9F5',Kuş:'#D1F0E4',Kemirgen:'#FDECD5'}[t]||'#eee';}
function tarih(t){if(!t)return '-';try{return new Date(t).toLocaleDateString('tr-TR',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return t;}}
function saatDakika(t){if(!t)return '-';try{return new Date(t).toLocaleString('tr-TR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return t;}}

function modalAc(baslik,icerik,onKaydet){
  document.getElementById('modal-overlay')?.remove();
  const el=document.createElement('div'); el.id='modal-overlay';
  el.innerHTML=`<div class="modal-box"><div class="modal-header"><div class="modal-title">${baslik}</div><button class="modal-close" onclick="document.getElementById('modal-overlay').remove()">✕</button></div><div class="modal-body">${icerik}</div><div class="modal-footer"><button class="btn btn-ghost" onclick="document.getElementById('modal-overlay').remove()">İptal</button><button class="btn btn-primary" id="modal-kaydet-btn">Kaydet</button></div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.getElementById('modal-kaydet-btn').addEventListener('click',onKaydet);
}
function bildirim(mesaj,tip='basari'){
  document.getElementById('bildirim')?.remove();
  const el=document.createElement('div'); el.id='bildirim'; el.className='bildirim '+tip; el.textContent=mesaj;
  document.body.appendChild(el); setTimeout(()=>el.remove(),3000);
}

/* ── DASHBOARD ─────────────────────────────────────── */
async function renderDashboard(el) {
  el.innerHTML='<div class="loading">⏳ Yükleniyor...</div>';
  const [ozet,randevular,muayeneler,ilaclar] = await Promise.all([getOzet(),getRandevular(),getMuayeneler(),getIlaclar()]);

  // Tür dağılımı için Chart verisi hazırla
  const turLabels  = ozet?.turDagilim?.map(t=>t.Tur)||['Kedi','Köpek'];
  const turVeriler = ozet?.turDagilim?.map(t=>t.sayi)||[0,0];
  const renkler    = ['#7B5EA7','#3D7A6F','#E8855A','#5BA4CF','#AAAAAA'];

  el.innerHTML=`
    ${(ozet?.kritikIlac>0)?`<div class="alert-banner">⚠️<div><strong>${ozet.kritikIlac} ilaç</strong> kritik stok seviyesinde!</div></div>`:''}
    <div class="cards-grid">
      <div class="stat-card c1"><span class="stat-icon">🐾</span><div class="stat-label">Toplam Pet</div><div class="stat-value">${ozet?.petSayisi??0}</div><div class="stat-sub">Kayıtlı hayvan</div></div>
      <div class="stat-card c2"><span class="stat-icon">📅</span><div class="stat-label">Bekleyen Randevu</div><div class="stat-value">${ozet?.bekleyenRandevu??0}</div><div class="stat-sub">Onay bekliyor</div></div>
      <div class="stat-card c3"><span class="stat-icon">💊</span><div class="stat-label">İlaç Çeşidi</div><div class="stat-value">${ozet?.ilacSayisi??0}</div><div class="stat-sub">${ozet?.kritikIlac??0} kritik</div></div>
      <div class="stat-card c4"><span class="stat-icon">👥</span><div class="stat-label">Müşteri</div><div class="stat-value">${ozet?.musteriSayisi??0}</div><div class="stat-sub">Kayıtlı sahip</div></div>
    </div>
    <div class="charts-row">
      <div class="chart-card"><div class="chart-header"><div class="chart-title">Hayvan Türü Dağılımı</div><span class="chart-badge">Gerçek Veri</span></div><div class="chart-wrap"><canvas id="chartTur"></canvas></div></div>
      <div class="chart-card"><div class="chart-header"><div class="chart-title">Stok Durumu</div><span class="chart-badge">Güncel</span></div><div class="chart-wrap"><canvas id="chartStokD"></canvas></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 300px;gap:16px">
      <div class="table-card">
        <div class="table-head"><div class="table-title">Son Muayeneler</div></div>
        <table><thead><tr><th>Pet</th><th>Teşhis</th><th>Veteriner</th><th>Tarih</th><th>Ücret</th></tr></thead>
        <tbody>${muayeneler.length===0?'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Henüz muayene kaydı yok</td></tr>':muayeneler.slice(0,5).map(m=>`<tr>
          <td><div class="pet-cell"><div class="pet-avatar" style="background:#EAD9F5">🐾</div><div><div class="pet-name">${m.PetAdi}</div><div class="pet-breed">${m.MusteriAdi||''}</div></div></div></td>
          <td>${m.Teshis||'-'}</td><td>${m.VeterinerAdi}</td><td>${tarih(m.MuayeneTarihi)}</td>
          <td style="font-weight:600">₺${m.MuayeneUcreti||0}</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="chart-card">
        <div class="chart-header" style="margin-bottom:12px"><div class="chart-title">Son Randevular</div></div>
        ${randevular.length===0?'<div style="color:var(--muted);font-size:.85rem">Randevu yok</div>':randevular.slice(0,5).map(r=>`<div class="randevu-item">
          <div class="randevu-time">${r.RandevuTarihi?new Date(r.RandevuTarihi).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}):'-'}</div>
          <div class="randevu-dot" style="background:${r.Durum==='Bekliyor'?'#E8855A':'#3D7A6F'}"></div>
          <div><div class="randevu-pet">${r.PetAdi}</div><div class="randevu-vet">${r.VeterinerAdi}</div></div>
        </div>`).join('')}
      </div>
    </div>`;

  // Gerçek tür dağılımı grafiği
  const turCtx = document.getElementById('chartTur');
  if(turCtx && turLabels.length>0) {
    activeCharts.tur = new Chart(turCtx,{type:'doughnut',data:{labels:turLabels,datasets:[{data:turVeriler,backgroundColor:renkler.slice(0,turLabels.length),borderWidth:0,hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{boxWidth:12,padding:14,font:{family:'DM Sans',size:12}}}}}});
  }
  createStokChart('chartStokD',ilaclar);
}

/* ── PETLER ─────────────────────────────────────────── */
async function renderPetler(el) {
  el.innerHTML='<div class="loading">⏳ Yükleniyor...</div>';
  let petler=await getPetler(); let filtered=[...petler];

  function rows(){
    document.getElementById('pet-tbody').innerHTML=filtered.length===0
      ?'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Kayıt bulunamadı</td></tr>'
      :filtered.map(p=>`<tr>
        <td style="color:var(--muted);font-weight:600">#${p.PetID}</td>
        <td><div class="pet-cell"><div class="pet-avatar" style="background:${turRenk(p.Tur)}">${turEmoji(p.Tur)}</div><div><div class="pet-name">${p.Ad}</div><div class="pet-breed">${p.Cins||''}</div></div></div></td>
        <td>${p.Sahip||'-'}</td>
        <td><span class="pill pill-blue">${p.Tur}</span></td>
        <td>${p.Kilo!=null?p.Kilo+' kg':'-'}</td>
        <td><button class="action-btn" onclick="petSilOnay(${p.PetID},'${p.Ad}')">🗑 Sil</button></td>
      </tr>`).join('');
    document.getElementById('pet-count').textContent=filtered.length+' kayıt';
  }

  el.innerHTML=`
    <div class="table-card">
      <div class="table-head">
        <div class="table-title">Pet Kayıtları</div>
        <div class="table-controls">
          <div class="search-box">🔍<input id="pet-search" placeholder="Pet adı veya sahip ara…"/></div>
          <button class="btn btn-primary" id="btn-yeni-pet">+ Yeni Pet</button>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>ID</th><th>Pet / Cins</th><th>Sahip</th><th>Tür</th><th>Kilo</th><th>İşlem</th>
        </tr></thead>
        <tbody id="pet-tbody"></tbody>
      </table>
      <div class="table-footer"><span id="pet-count"></span></div>
    </div>`;
  rows();

  document.getElementById('pet-search').addEventListener('input',function(){
    filtered=petler.filter(p=>p.Ad.toLowerCase().includes(this.value.toLowerCase())||(p.Sahip||'').toLowerCase().includes(this.value.toLowerCase()));
    rows();
  });

  document.getElementById('btn-yeni-pet').addEventListener('click',()=>{
    modalAc('🐾 Yeni Pet Ekle',`
      <div class="form-group"><label>Sahip ID * <small style="color:var(--muted)">(Müşteriler sayfasından bak)</small></label><input id="f-mid" type="number" placeholder="1"/></div>
      <div class="form-group"><label>Pet Adı *</label><input id="f-ad" placeholder="Pamuk"/></div>
      <div class="form-row">
        <div class="form-group"><label>Tür *</label><select id="f-tur"><option>Kedi</option><option>Köpek</option><option>Kuş</option><option>Kemirgen</option></select></div>
        <div class="form-group"><label>Cins</label><input id="f-cins" placeholder="Ankara Kedisi"/></div>
      </div>
      <div class="form-group"><label>Kilo (kg)</label><input id="f-kilo" type="number" step="0.1" placeholder="4.5"/></div>`,
    async()=>{
      const body={
        MusteriID:parseInt(document.getElementById('f-mid').value),
        Ad:document.getElementById('f-ad').value,
        Tur:document.getElementById('f-tur').value,
        Cins:document.getElementById('f-cins').value||null,
        Kilo:parseFloat(document.getElementById('f-kilo').value)||null
      };
      if(!body.MusteriID||!body.Ad){bildirim('Sahip ID ve Pet Adı zorunlu!','hata');return;}
      const r=await petEkle(body);
      if(r?.hata){bildirim('Hata: '+r.hata,'hata');return;}
      document.getElementById('modal-overlay').remove();
      bildirim('✅ Pet eklendi!');
      petler=await getPetler(); filtered=[...petler]; rows();
    });
  });

  window.petSilOnay = async (id, ad) => {
    if (!confirm(`"${ad}" silinsin mi?`)) return;
    const r = await fetch('http://localhost:3000/api/petler/'+id, {method:'DELETE'}).then(r=>r.json());
    if (r?.hata) { bildirim('Hata: '+r.hata,'hata'); return; }
    bildirim('🗑 Pet silindi.');
    petler=await getPetler(); filtered=[...petler]; rows();
  };
}
/* ── MÜŞTERİLER ────────────────────────────────────── */
async function renderMusteriler(el) {
  el.innerHTML='<div class="loading">⏳ Yükleniyor...</div>';
  let musteriler=await getMusteriler();

  function rows(){
    document.getElementById('mus-tbody').innerHTML=musteriler.length===0?'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Kayıt yok</td></tr>':musteriler.map(m=>`<tr>
      <td style="color:var(--muted)">${m.MusteriID}</td>
      <td style="font-weight:500">${m.Ad} ${m.Soyad}</td>
      <td>${m.Telefon}</td>
      <td style="color:var(--muted)">${m.Email||'-'}</td>
      <td><span class="pill pill-blue">${m.PetSayisi||0} pet</span></td>
      <td>${tarih(m.KayitTarihi)}</td>
      <td><button class="action-btn" onclick="musteriSilOnay(${m.MusteriID},'${m.Ad}')">🗑 Sil</button></td>
    </tr>`).join('');
  }

  el.innerHTML=`<div class="table-card">
    <div class="table-head"><div class="table-title">Müşteri Listesi</div>
    <div class="table-controls"><div class="search-box">🔍<input id="mus-search" placeholder="Ad ara…"/></div>
    <button class="btn btn-primary" id="btn-yeni-mus">+ Yeni Müşteri</button></div></div>
    <table><thead><tr><th>#</th><th>Ad Soyad</th><th>Telefon</th><th>E-Posta</th><th>Pet</th><th>Kayıt Tarihi</th><th>İşlem</th></tr></thead>
    <tbody id="mus-tbody"></tbody></table>
    <div class="table-footer"><span>${musteriler.length} kayıt</span></div></div>`;
  rows();

  document.getElementById('mus-search').addEventListener('input',function(){
    const q=this.value.toLowerCase();
    document.querySelectorAll('#mus-tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none');
  });

  document.getElementById('btn-yeni-mus').addEventListener('click',()=>{
    modalAc('👤 Yeni Müşteri Ekle',`
      <div class="form-row"><div class="form-group"><label>Ad *</label><input id="f-mad" placeholder="Ahmet"/></div>
      <div class="form-group"><label>Soyad *</label><input id="f-msoy" placeholder="Yılmaz"/></div></div>
      <div class="form-group"><label>Telefon *</label><input id="f-mtel" placeholder="05321234567"/></div>
      <div class="form-group"><label>E-Posta</label><input id="f-memail" type="email" placeholder="ahmet@mail.com"/></div>
      <div class="form-group"><label>Adres</label><input id="f-madres" placeholder="İstanbul/Kadıköy"/></div>`,
    async()=>{
      const body={Ad:document.getElementById('f-mad').value,Soyad:document.getElementById('f-msoy').value,Telefon:document.getElementById('f-mtel').value,Email:document.getElementById('f-memail').value||null,Adres:document.getElementById('f-madres').value||null};
      if(!body.Ad||!body.Soyad||!body.Telefon){bildirim('Ad, Soyad ve Telefon zorunlu!','hata');return;}
      const r=await musteriEkle(body);
      if(r?.hata){bildirim('Hata: '+r.hata,'hata');return;}
      document.getElementById('modal-overlay').remove(); bildirim('✅ Müşteri eklendi!');
      musteriler=await getMusteriler(); rows();
    });
  });
window.musteriSilOnay = async (id, ad) => {
  if (!confirm(`"${ad}" silinsin mi? Petleri de silinir!`)) return;
  try {
    const res = await fetch('http://localhost:3000/api/musteriler/' + id, { method: 'DELETE' });
    const r = await res.json();
    if (r.hata) { bildirim('Hata: ' + r.hata, 'hata'); return; }
    bildirim('🗑 Müşteri silindi.');
    musteriler = await getMusteriler(); rows();
  } catch(e) { bildirim('Sunucu hatası!', 'hata'); }
};
}

/* ── İLAÇLAR ────────────────────────────────────────── */
async function renderIlaclar(el) {
  el.innerHTML='<div class="loading">⏳ Yükleniyor...</div>';
  let ilaclar=await getIlaclar();

  function rows(){
    document.getElementById('ilac-tbody').innerHTML=ilaclar.length===0?'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Kayıt yok</td></tr>':ilaclar.map(i=>`<tr class="${i.StokMiktari<=i.MinimumStokEsigi?'row-warning':''}">
      <td style="font-weight:500">${i.IlacAdi}</td>
      <td>₺${Number(i.BirimFiyat).toFixed(2)}</td>
      <td style="font-weight:600">${i.StokMiktari}</td>
      <td>${i.MinimumStokEsigi}</td>
      <td>${stokPill(i.StokMiktari,i.MinimumStokEsigi)}</td>
      <td>
  <button class="action-btn" onclick="stokEkleModal(${i.IlacID},'${i.IlacAdi}')">📦 Ekle</button>
  
  <button class="action-btn" onclick="stokCikarModal(${i.IlacID},'${i.IlacAdi}',${i.StokMiktari})">➖ Çıkar</button>
</td>

    </tr>`).join('');
  }

  const kritik=ilaclar.filter(i=>i.StokMiktari<=i.MinimumStokEsigi).length;
  el.innerHTML=`
    ${kritik>0?`<div class="alert-banner">💊<div><strong>${kritik} ilaç</strong> minimum eşiğin altında!</div></div>`:''}
    <div class="table-card">
      <div class="table-head"><div class="table-title">İlaç Stok</div>
      <div class="table-controls"><button class="btn btn-primary" id="btn-yeni-ilac">+ İlaç Ekle</button></div></div>
      <table><thead><tr><th>İlaç Adı</th><th>Fiyat</th><th>Stok</th><th>Min. Eşik</th><th>Durum</th><th>İşlem</th></tr></thead>
      <tbody id="ilac-tbody"></tbody></table>
      <div class="table-footer"><span>${ilaclar.length} kayıt</span></div>
    </div>
    <div class="chart-card" style="margin-top:16px">
      <div class="chart-header"><div class="chart-title">Stok Seviyeleri</div></div>
      <div class="chart-wrap" style="height:200px"><canvas id="chartStok"></canvas></div>
    </div>`;
  rows(); createStokChart('chartStok',ilaclar);

  document.getElementById('btn-yeni-ilac').addEventListener('click',()=>{
    modalAc('💊 Yeni İlaç Ekle',`
      <div class="form-group"><label>İlaç Adı *</label><input id="f-iad" placeholder="Vitamin-C"/></div>
      <div class="form-row">
        <div class="form-group"><label>Birim Fiyat (₺) *</label><input id="f-fiy" type="number" step="0.01" placeholder="50.00"/></div>
        <div class="form-group"><label>Başlangıç Stoğu *</label><input id="f-stk" type="number" placeholder="100"/></div>
      </div>
      <div class="form-group"><label>Min. Stok Eşiği</label><input id="f-esik" type="number" placeholder="10"/></div>`,
    async()=>{
      const body={IlacAdi:document.getElementById('f-iad').value,BirimFiyat:parseFloat(document.getElementById('f-fiy').value),StokMiktari:parseInt(document.getElementById('f-stk').value),MinimumStokEsigi:parseInt(document.getElementById('f-esik').value)||10};
      if(!body.IlacAdi||!body.BirimFiyat||isNaN(body.StokMiktari)){bildirim('Zorunlu alanları doldur!','hata');return;}
      const r=await ilacEkle(body);
      if(r?.hata){bildirim('Hata: '+r.hata,'hata');return;}
      document.getElementById('modal-overlay').remove(); bildirim('✅ İlaç eklendi!');
      ilaclar=await getIlaclar(); rows();
    });
  });

  window.stokEkleModal=(id,ad)=>{
    modalAc(`📦 Stok Ekle — ${ad}`,`<div class="form-group"><label>Eklenecek Miktar *</label><input id="f-stk-ekle" type="number" placeholder="50" min="1"/></div>`,
    async()=>{
      const miktar=parseInt(document.getElementById('f-stk-ekle').value);
      if(!miktar||miktar<1){bildirim('Geçerli miktar gir!','hata');return;}
      const r=await stokGuncelle(id,miktar);
      if(r?.hata){bildirim('Hata: '+r.hata,'hata');return;}
      document.getElementById('modal-overlay').remove(); bildirim('✅ Stok güncellendi!');
      ilaclar=await getIlaclar(); rows();
    });
  };

  window.stokCikarModal = (id, ad, mevcutStok) => {
  modalAc(`➖ Stok Çıkar — ${ad}`, `
    <div class="alert-banner" style="margin-bottom:0">
      <div>Mevcut stok: <strong>${mevcutStok} adet</strong></div>
    </div>
    <div class="form-group" style="margin-top:14px">
      <label>Çıkarılacak Miktar *</label>
      <input id="f-stk-cikar" type="number" placeholder="10" min="1" max="${mevcutStok}"/>
    </div>`,
  async () => {
    const miktar = parseInt(document.getElementById('f-stk-cikar').value);
    if (!miktar || miktar < 1) { bildirim('Geçerli miktar gir!', 'hata'); return; }
    if (miktar > mevcutStok) { bildirim(`En fazla ${mevcutStok} çıkarabilirsin!`, 'hata'); return; }
    const r = await stokCikar(id, miktar);
    if (r?.hata) { bildirim('Hata: ' + r.hata, 'hata'); return; }
    document.getElementById('modal-overlay').remove();
    bildirim('✅ Stok düşüldü!');
    ilaclar = await getIlaclar(); rows();
  });
};
}

/* ── RANDEVULAR ─────────────────────────────────────── */
async function renderRandevular(el) {
  el.innerHTML='<div class="loading">⏳ Yükleniyor...</div>';
  let randevular = await getRandevular();

  function rows() {
    document.getElementById('ran-tbody').innerHTML = randevular.length === 0
      ? '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Randevu yok</td></tr>'
      : randevular.map(r => `<tr>
          <td style="font-weight:600;color:var(--accent)">${saatDakika(r.RandevuTarihi)}</td>
          <td style="font-weight:500">${r.PetAdi}</td>
          <td style="color:var(--muted)">${r.SahipAdi || '-'}</td>
          <td>${r.VeterinerAdi}</td>
          <td>${durumPill(r.Durum)}</td>
          <td>
            ${r.Durum === 'Bekliyor'
              ? `<button class="action-btn" onclick="durumDegistir(${r.RandevuID},'Tamamlandi')">✅ Tamamlandı</button>
                 <button class="action-btn" onclick="durumDegistir(${r.RandevuID},'Iptal')">❌ İptal</button>`
              : `<span style="color:var(--muted);font-size:.8rem">${r.Durum}</span>`}
          </td>
        </tr>`).join('');
  }

  el.innerHTML = `
    <div class="table-card">
      <div class="table-head">
        <div class="table-title">Randevular</div>
        <div class="table-controls">
          <button class="btn btn-primary" id="btn-yeni-ran">+ Randevu Ekle</button>
        </div>
      </div>
      <table><thead><tr>
        <th>Tarih / Saat</th><th>Pet</th><th>Sahip</th>
        <th>Veteriner</th><th>Durum</th><th>İşlem</th>
      </tr></thead>
      <tbody id="ran-tbody"></tbody></table>
      <div class="table-footer"><span>${randevular.length} randevu</span></div>
    </div>`;
  rows();

  document.getElementById('btn-yeni-ran').addEventListener('click', () => {
    modalAc('📅 Yeni Randevu Ekle', `
      <div class="form-row">
        <div class="form-group"><label>Pet ID *</label><input id="f-rpet" type="number" placeholder="1"/></div>
        <div class="form-group"><label>Veteriner ID *</label><input id="f-rvet" type="number" placeholder="1"/></div>
      </div>
      <div class="form-group"><label>Tarih ve Saat *</label><input id="f-rtarih" type="datetime-local"/></div>`,
    async () => {
      const body = {
        PetID:       parseInt(document.getElementById('f-rpet').value),
        VeterinerID: parseInt(document.getElementById('f-rvet').value),
        RandevuTarihi: document.getElementById('f-rtarih').value
      };
      if (!body.PetID || !body.VeterinerID || !body.RandevuTarihi) {
        bildirim('Tüm alanları doldur!', 'hata'); return;
      }
      const r = await randevuEkle(body);
      if (r?.hata) { bildirim('Hata: ' + r.hata, 'hata'); return; }
      document.getElementById('modal-overlay').remove();
      bildirim('✅ Randevu eklendi!');
      randevular = await getRandevular(); rows();
    });
  });

  window.durumDegistir = async (id, yeniDurum) => {
    const r = await apiPut('/randevular/' + id + '/durum', { Durum: yeniDurum });
    if (r?.hata) { bildirim('Hata: ' + r.hata, 'hata'); return; }
    bildirim(yeniDurum === 'Tamamlandi' ? '✅ Tamamlandı!' : '❌ İptal edildi!');
    randevular = await getRandevular(); rows();
  };
}

/* ── VETERİNERLER ───────────────────────────────────── */
async function renderVeterinerler(el) {
  el.innerHTML='<div class="loading">⏳ Yükleniyor...</div>';
  const data=await getVeterinerler();
  el.innerHTML=`<div class="table-card">
    <div class="table-head"><div class="table-title">Veteriner Ekibi</div></div>
    <table><thead><tr><th>#</th><th>Ad Soyad</th><th>Uzmanlık</th><th>Telefon</th><th>Randevu</th></tr></thead>
    <tbody>${data.length===0?'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Kayıt yok</td></tr>':data.map(v=>`<tr>
      <td style="color:var(--muted)">${v.VeterinerID}</td>
      <td style="font-weight:500">Dr. ${v.Ad} ${v.Soyad}</td>
      <td><span class="pill pill-purple">${v.Uzmanlik||'-'}</span></td>
      <td>${v.Telefon||'-'}</td>
      <td style="font-weight:600">${v.ToplamRandevu||0}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

/* ── MUAYENELER ─────────────────────────────────────── */
async function renderMuayeneler(el) {
  el.innerHTML = '<div class="loading">⏳ Yükleniyor...</div>';
  let data = await getMuayeneler();

  function rows() {
    document.getElementById('mua-tbody').innerHTML = data.length === 0
      ? '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">Henüz muayene kaydı yok</td></tr>'
      : data.map(m => `<tr>
          <td style="font-weight:500">${m.PetAdi}</td>
          <td style="color:var(--muted)">${m.MusteriAdi || '-'}</td>
          <td>${m.Teshis || '-'}</td>
          <td>${m.VeterinerAdi}</td>
          <td style="color:var(--muted)">${tarih(m.MuayeneTarihi)}</td>
          <td style="font-weight:600;color:var(--accent)">₺${m.MuayeneUcreti || 0}</td>
          <td><button class="action-btn" onclick="muayeneSilOnay(${m.MuayeneID})">🗑 Sil</button></td>
        </tr>`).join('');
  }

  el.innerHTML = `
    <div class="table-card">
      <div class="table-head">
        <div class="table-title">Muayene Geçmişi</div>
        <div class="table-controls">
          <button class="btn btn-primary" id="btn-yeni-mua">+ Muayene Ekle</button>
        </div>
      </div>
      <table><thead><tr>
        <th>Pet</th><th>Sahip</th><th>Teşhis</th>
        <th>Veteriner</th><th>Tarih</th><th>Ücret</th><th>İşlem</th>
      </tr></thead>
      <tbody id="mua-tbody"></tbody></table>
      <div class="table-footer"><span>${data.length} kayıt</span></div>
    </div>`;
  rows();

  document.getElementById('btn-yeni-mua').addEventListener('click', () => {
    modalAc('📋 Yeni Muayene Ekle', `
      <div class="form-row">
        <div class="form-group">
          <label>Pet ID * <small style="color:var(--muted)">(Petler sayfasından bak)</small></label>
          <input id="f-mpet" type="number" placeholder="1"/>
        </div>
        <div class="form-group">
          <label>Veteriner ID * <small style="color:var(--muted)">(Veterinerler sayfasından bak)</small></label>
          <input id="f-mvet" type="number" placeholder="1"/>
        </div>
      </div>
      <div class="form-group"><label>Teşhis</label>
        <input id="f-mteshis" placeholder="Kulak İltihabı"/>
      </div>
      <div class="form-group"><label>Muayene Ücreti (₺)</label>
        <input id="f-mucret" type="number" step="0.01" placeholder="350"/>
      </div>`,
    async () => {
      const body = {
        PetID:         parseInt(document.getElementById('f-mpet').value),
        VeterinerID:   parseInt(document.getElementById('f-mvet').value),
        Teshis:        document.getElementById('f-mteshis').value || null,
        MuayeneUcreti: parseFloat(document.getElementById('f-mucret').value) || 0,
      };
      if (!body.PetID || !body.VeterinerID) {
        bildirim('Pet ID ve Veteriner ID zorunlu!', 'hata'); return;
      }
      const r = await muayeneEkle(body);
      if (r?.hata) { bildirim('Hata: ' + r.hata, 'hata'); return; }
      document.getElementById('modal-overlay').remove();
      bildirim('✅ Muayene eklendi!');
      data = await getMuayeneler(); rows();
    });
  });

  window.muayeneSilOnay = async (id) => {
    if (!confirm('Bu muayene silinsin mi?')) return;
    const r = await apiDelete('/muayeneler/' + id);
    if (r?.hata) { bildirim('Hata: ' + r.hata, 'hata'); return; }
    bildirim('🗑 Muayene silindi.');
    data = await getMuayeneler(); rows();
  };
}
/* ── RAPORLAR SAYFASI ───────────────────────────── */
async function renderRaporlar(el) {
  el.innerHTML = '<div class="loading">⏳ Raporlar yükleniyor...</div>';

  const [vetPerf, kritikStok, musteriPet, muayeneTam, enPahali] = await Promise.all([
    apiFetch('/rapor/veteriner-performans'),
    apiFetch('/rapor/kritik-stok'),
    apiFetch('/rapor/musteri-pet'),
    apiFetch('/rapor/muayene-tam'),
    apiFetch('/rapor/en-pahali'),
  ]);

  el.innerHTML = `

    <!-- RAPOR 1 -->
    <div class="table-card" style="margin-bottom:16px">
      <div class="table-head">
        <div class="table-title">📊 Rapor 1 — Veteriner Performansı</div>
        <span class="chart-badge">GROUP BY + SUM + AVG</span>
      </div>
      <table><thead><tr><th>Veteriner</th><th>Uzmanlık</th><th>Muayene</th><th>Toplam Gelir</th><th>Ort. Ücret</th></tr></thead>
      <tbody>${(vetPerf||[]).map(r=>`<tr>
        <td style="font-weight:500">${r.VeterinerAdi}</td>
        <td><span class="pill pill-purple">${r.Uzmanlik||'-'}</span></td>
        <td style="font-weight:600">${r.ToplamMuayene}</td>
        <td style="font-weight:600;color:var(--accent)">₺${Number(r.ToplamGelir).toFixed(2)}</td>
        <td>₺${Number(r.OrtalamaUcret).toFixed(2)}</td>
      </tr>`).join('')}</tbody></table>
    </div>

    <!-- RAPOR 2 -->
    <div class="table-card" style="margin-bottom:16px">
      <div class="table-head">
        <div class="table-title">⚠️ Rapor 2 — Kritik Stok</div>
        <span class="chart-badge">WHERE + ORDER BY</span>
      </div>
      <table><thead><tr><th>İlaç Adı</th><th>Mevcut Stok</th><th>Min. Eşik</th><th>Eksik Adet</th></tr></thead>
      <tbody>${(kritikStok||[]).length===0?'<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted)">✅ Kritik stok yok</td></tr>':(kritikStok||[]).map(r=>`<tr class="row-warning">
        <td style="font-weight:500">${r.IlacAdi}</td>
        <td style="font-weight:600;color:var(--danger)">${r.StokMiktari}</td>
        <td>${r.MinimumStokEsigi}</td>
        <td><span class="pill pill-red">-${r.EksikAdet} adet</span></td>
      </tr>`).join('')}</tbody></table>
    </div>

    <!-- RAPOR 3 -->
    <div class="table-card" style="margin-bottom:16px">
      <div class="table-head">
        <div class="table-title">👥 Rapor 3 — Müşteri Pet Sayısı</div>
        <span class="chart-badge">GROUP BY + COUNT + LEFT JOIN</span>
      </div>
      <table><thead><tr><th>Müşteri</th><th>Telefon</th><th>Pet Sayısı</th></tr></thead>
      <tbody>${(musteriPet||[]).map(r=>`<tr>
        <td style="font-weight:500">${r.MusteriAdi}</td>
        <td>${r.Telefon}</td>
        <td><span class="pill pill-blue">${r.PetSayisi} pet</span></td>
      </tr>`).join('')}</tbody></table>
    </div>

    <!-- RAPOR 4 -->
    <div class="table-card" style="margin-bottom:16px">
      <div class="table-head">
        <div class="table-title">📋 Rapor 4 — Tam Muayene Raporu</div>
        <span class="chart-badge">4 Tablo JOIN</span>
      </div>
      <table><thead><tr><th>Müşteri</th><th>Pet</th><th>Tür</th><th>Veteriner</th><th>Uzmanlık</th><th>Teşhis</th><th>Ücret</th><th>Tarih</th></tr></thead>
      <tbody>${(muayeneTam||[]).length===0?'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Muayene kaydı yok</td></tr>':(muayeneTam||[]).map(r=>`<tr>
        <td style="font-weight:500">${r.MusteriAdi}</td>
        <td>${r.PetAdi}</td>
        <td><span class="pill pill-blue">${r.Tur}</span></td>
        <td>${r.VeterinerAdi}</td>
        <td><span class="pill pill-purple">${r.Uzmanlik||'-'}</span></td>
        <td>${r.Teshis||'-'}</td>
        <td style="font-weight:600">₺${r.MuayeneUcreti||0}</td>
        <td style="color:var(--muted)">${tarih(r.MuayeneTarihi)}</td>
      </tr>`).join('')}</tbody></table>
    </div>

    <!-- RAPOR 5 -->
    <div class="table-card">
      <div class="table-head">
        <div class="table-title">🏆 Rapor 5 — En Pahalı Muayene</div>
        <span class="chart-badge">SUBQUERY (Alt Sorgu)</span>
      </div>
      <table><thead><tr><th>Veteriner</th><th>Pet</th><th>Teşhis</th><th>Ücret</th></tr></thead>
      <tbody>${(enPahali||[]).map(r=>`<tr>
        <td style="font-weight:500">${r.VeterinerAdi}</td>
        <td>${r.PetAdi}</td>
        <td>${r.Teshis||'-'}</td>
        <td style="font-weight:600;color:var(--accent);font-size:1.1rem">₺${r.MuayeneUcreti}</td>
      </tr>`).join('')}</tbody></table>
    </div>
  `;
}