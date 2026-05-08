const activeCharts = {};

function destroyAllCharts() {
  Object.values(activeCharts).forEach(c => c.destroy());
  Object.keys(activeCharts).forEach(k => delete activeCharts[k]);
}

function createTurChart(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  activeCharts.tur = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Kedi','Köpek','Kuş','Kemirgen','Diğer'],
      datasets: [{ data:[52,43,15,9,5], backgroundColor:['#7B5EA7','#3D7A6F','#E8855A','#5BA4CF','#AAAAAA'], borderWidth:0, hoverOffset:8 }]
    },
    options: { responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{ legend:{ position:'right', labels:{ boxWidth:12, padding:14, font:{family:'DM Sans',size:12} } } } }
  });
}

function createRandevuChart(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  activeCharts.randevu = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],
      datasets: [{ label:'Randevu', data:[45,52,48,61,0,0,0,0,0,0,0,0], backgroundColor:(c)=>c.dataIndex<4?'#3D7A6F':'#E2DDD5', borderRadius:6, borderSkipped:false }]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:'#F0EDE8'}} } }
  });
}

function createStokChart(canvasId, ilaclar) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (activeCharts.stok) { activeCharts.stok.destroy(); }
  activeCharts.stok = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ilaclar.map(i => i.IlacAdi),
      datasets: [
        { label:'Mevcut Stok', data:ilaclar.map(i=>i.StokMiktari), backgroundColor:ilaclar.map(i=>i.StokMiktari<=i.MinimumStokEsigi?'#D94F4F':'#3D7A6F'), borderRadius:6 },
        { label:'Min. Eşik',   data:ilaclar.map(i=>i.MinimumStokEsigi), backgroundColor:'rgba(0,0,0,.09)', borderRadius:6 }
      ]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{font:{family:'DM Sans'}}}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:'#F0EDE8'}} } }
  });
}