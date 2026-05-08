const express   = require('express');
const cors      = require('cors');
const sql       = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());


const config = {
  user: 'sa', password: 'Marmara.2026', server: 'localhost',
  database: 'VetKlinikDB',
  options: { instanceName: 'SQLEXPRESS', encrypt: false, trustServerCertificate: true }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(p => { console.log('✅ MSSQL bağlandı!'); return p; })
  .catch(e => { console.error('❌', e.message); process.exit(1); });

/*  MÜŞTERİLER  */
app.get('/api/musteriler', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT m.MusteriID, m.Ad, m.Soyad, m.Telefon, m.Email, m.Adres, m.KayitTarihi,
             COUNT(p.PetID) AS PetSayisi
      FROM Musteriler m LEFT JOIN Petler p ON m.MusteriID = p.MusteriID
      GROUP BY m.MusteriID,m.Ad,m.Soyad,m.Telefon,m.Email,m.Adres,m.KayitTarihi
      ORDER BY m.MusteriID DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.post('/api/musteriler', async (req, res) => {
  try {
    const {Ad,Soyad,Telefon,Email,Adres} = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Ad',      sql.NVarChar(50),  Ad)
      .input('Soyad',   sql.NVarChar(50),  Soyad)
      .input('Telefon', sql.NVarChar(15),  Telefon)
      .input('Email',   sql.NVarChar(100), Email||null)
      .input('Adres',   sql.NVarChar(255), Adres||null)
      .query('INSERT INTO Musteriler(Ad,Soyad,Telefon,Email,Adres) VALUES(@Ad,@Soyad,@Telefon,@Email,@Adres)');
    res.json({mesaj:'Müşteri eklendi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.delete('/api/musteriler/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM Musteriler WHERE MusteriID=@id');
    res.json({mesaj:'Müşteri silindi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});

/*  PETLER  */
app.get('/api/petler', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT p.PetID, p.Ad, p.Tur, p.Cins, p.Kilo,
             m.Ad+' '+m.Soyad AS Sahip, m.MusteriID
      FROM Petler p JOIN Musteriler m ON p.MusteriID=m.MusteriID
      ORDER BY p.PetID DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.post('/api/petler', async (req, res) => {
  try {
    const {MusteriID,Ad,Tur,Cins,Kilo} = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('MusteriID', sql.Int,         MusteriID)
      .input('Ad',        sql.NVarChar(50), Ad)
      .input('Tur',       sql.NVarChar(30), Tur)
      .input('Cins',      sql.NVarChar(50), Cins||null)
      .input('Kilo',      sql.Decimal(5,2), Kilo||null)
      .query('INSERT INTO Petler(MusteriID,Ad,Tur,Cins,Kilo) VALUES(@MusteriID,@Ad,@Tur,@Cins,@Kilo)');
    res.json({mesaj:'Pet eklendi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.delete('/api/petler/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id);
    // 1. Önce bu pete bağlı muayeneleri sil
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Muayeneler WHERE PetID=@id');
    // 2. Sonra randevuları sil
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Randevular WHERE PetID=@id');
    // 3. En son peti sil
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Petler WHERE PetID=@id');
    res.json({mesaj:'Pet ve bağlı kayıtlar silindi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});
/*  VETERİNERLER  */
app.get('/api/veterinerler', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT v.VeterinerID, v.Ad, v.Soyad, v.Uzmanlik,
             ISNULL(v.Telefon,'-') AS Telefon,
             COUNT(r.RandevuID) AS ToplamRandevu
      FROM Veterinerler v LEFT JOIN Randevular r ON v.VeterinerID=r.VeterinerID
      GROUP BY v.VeterinerID,v.Ad,v.Soyad,v.Uzmanlik,v.Telefon
      ORDER BY ToplamRandevu DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

/*  İLAÇLAR  */
app.get('/api/ilaclar', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query('SELECT * FROM Ilaclar ORDER BY StokMiktari ASC');
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.post('/api/ilaclar', async (req, res) => {
  try {
    const {IlacAdi,BirimFiyat,StokMiktari,MinimumStokEsigi} = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('IlacAdi',          sql.NVarChar(100), IlacAdi)
      .input('BirimFiyat',       sql.Decimal(10,2), BirimFiyat)
      .input('StokMiktari',      sql.Int,           StokMiktari)
      .input('MinimumStokEsigi', sql.Int,           MinimumStokEsigi||10)
      .query('INSERT INTO Ilaclar(IlacAdi,BirimFiyat,StokMiktari,MinimumStokEsigi) VALUES(@IlacAdi,@BirimFiyat,@StokMiktari,@MinimumStokEsigi)');
    res.json({mesaj:'İlaç eklendi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.put('/api/ilaclar/:id/stok', async (req, res) => {
  try {
    const {EklenenMiktar} = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id',     sql.Int, parseInt(req.params.id))
      .input('miktar', sql.Int, EklenenMiktar)
      .query('UPDATE Ilaclar SET StokMiktari=StokMiktari+@miktar WHERE IlacID=@id');
    res.json({mesaj:'Stok güncellendi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});

/*  RANDEVULAR  */
app.get('/api/randevular', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT r.RandevuID, r.RandevuTarihi, r.Durum,
             p.Ad AS PetAdi,
             v.Ad+' '+v.Soyad AS VeterinerAdi,
             m.Ad+' '+m.Soyad AS SahipAdi
      FROM Randevular r
      JOIN Petler       p ON r.PetID       = p.PetID
      JOIN Veterinerler v ON r.VeterinerID = v.VeterinerID
      JOIN Musteriler   m ON p.MusteriID   = m.MusteriID
      ORDER BY r.RandevuTarihi DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

app.post('/api/randevular', async (req, res) => {
  try {
    const {PetID,VeterinerID,RandevuTarihi} = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('PetID',         sql.Int,      PetID)
      .input('VeterinerID',   sql.Int,      VeterinerID)
      .input('RandevuTarihi', sql.DateTime, new Date(RandevuTarihi))
      .query('INSERT INTO Randevular(PetID,VeterinerID,RandevuTarihi) VALUES(@PetID,@VeterinerID,@RandevuTarihi)');
    res.json({mesaj:'Randevu eklendi.'});
  } catch(e) { res.status(500).json({hata:e.message}); }
});

/*  MUAYENELER  */
app.get('/api/muayeneler', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT mu.MuayeneID, mu.Teshis, mu.MuayeneUcreti, mu.MuayeneTarihi,
             p.Ad AS PetAdi,
             v.Ad+' '+v.Soyad AS VeterinerAdi,
             m.Ad+' '+m.Soyad AS MusteriAdi
      FROM Muayeneler mu
      JOIN Petler       p ON mu.PetID       = p.PetID
      JOIN Veterinerler v ON mu.VeterinerID = v.VeterinerID
      JOIN Musteriler   m ON p.MusteriID    = m.MusteriID
      ORDER BY mu.MuayeneTarihi DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

/*  Dashboard   */
app.get('/api/ozet', async (req, res) => {
  try {
    const pool = await poolPromise;
    const petSayisi    = await pool.request().query('SELECT COUNT(*) AS sayi FROM Petler');
    const musteriSayisi= await pool.request().query('SELECT COUNT(*) AS sayi FROM Musteriler');
    const randevuSayisi= await pool.request().query("SELECT COUNT(*) AS sayi FROM Randevular WHERE Durum='Bekliyor'");
    const ilacSayisi   = await pool.request().query('SELECT COUNT(*) AS sayi FROM Ilaclar');
    const kritikSayisi = await pool.request().query('SELECT COUNT(*) AS sayi FROM Ilaclar WHERE StokMiktari<MinimumStokEsigi');
    const turDagilim   = await pool.request().query('SELECT Tur, COUNT(*) AS sayi FROM Petler GROUP BY Tur');
    res.json({
      petSayisi:     petSayisi.recordset[0].sayi,
      musteriSayisi: musteriSayisi.recordset[0].sayi,
      bekleyenRandevu: randevuSayisi.recordset[0].sayi,
      ilacSayisi:    ilacSayisi.recordset[0].sayi,
      kritikIlac:    kritikSayisi.recordset[0].sayi,
      turDagilim:    turDagilim.recordset
    });
  } catch(e) { res.status(500).json({hata:e.message}); }
});
/*  RAPORLAR  */

// Rapor 1: Veteriner performansı
app.get('/api/rapor/veteriner-performans', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT v.Ad+' '+v.Soyad AS VeterinerAdi, v.Uzmanlik,
             COUNT(mu.MuayeneID) AS ToplamMuayene,
             ISNULL(SUM(mu.MuayeneUcreti),0) AS ToplamGelir,
             ISNULL(AVG(mu.MuayeneUcreti),0) AS OrtalamaUcret
      FROM Veterinerler v
      LEFT JOIN Muayeneler mu ON v.VeterinerID = mu.VeterinerID
      GROUP BY v.VeterinerID, v.Ad, v.Soyad, v.Uzmanlik
      ORDER BY ToplamGelir DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

// Rapor 2: Kritik stok
app.get('/api/rapor/kritik-stok', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT IlacAdi, StokMiktari, MinimumStokEsigi,
             (MinimumStokEsigi - StokMiktari) AS EksikAdet
      FROM Ilaclar
      WHERE StokMiktari < MinimumStokEsigi
      ORDER BY EksikAdet DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

// Rapor 3: Müşteri pet sayısı
app.get('/api/rapor/musteri-pet', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT m.Ad+' '+m.Soyad AS MusteriAdi, m.Telefon,
             COUNT(p.PetID) AS PetSayisi
      FROM Musteriler m
      LEFT JOIN Petler p ON m.MusteriID = p.MusteriID
      GROUP BY m.MusteriID, m.Ad, m.Soyad, m.Telefon
      ORDER BY PetSayisi DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

// Rapor 4: Tam muayene raporu
app.get('/api/rapor/muayene-tam', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT mu.MuayeneID,
             m.Ad+' '+m.Soyad AS MusteriAdi,
             p.Ad AS PetAdi, p.Tur,
             v.Ad+' '+v.Soyad AS VeterinerAdi, v.Uzmanlik,
             mu.Teshis, mu.MuayeneUcreti, mu.MuayeneTarihi
      FROM Muayeneler mu
      JOIN Petler p       ON mu.PetID       = p.PetID
      JOIN Musteriler m   ON p.MusteriID    = m.MusteriID
      JOIN Veterinerler v ON mu.VeterinerID = v.VeterinerID
      ORDER BY mu.MuayeneTarihi DESC`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

// Rapor 5: En pahalı muayene (SUBQUERY)
app.get('/api/rapor/en-pahali', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT v.Ad+' '+v.Soyad AS VeterinerAdi,
             p.Ad AS PetAdi, mu.Teshis, mu.MuayeneUcreti
      FROM Muayeneler mu
      JOIN Veterinerler v ON mu.VeterinerID = v.VeterinerID
      JOIN Petler p       ON mu.PetID       = p.PetID
      WHERE mu.MuayeneUcreti = (SELECT MAX(MuayeneUcreti) FROM Muayeneler)`);
    res.json(r.recordset);
  } catch(e) { res.status(500).json({hata:e.message}); }
});

// Muayene ekle
app.post('/api/muayeneler', async (req, res) => {
  try {
    const { PetID, VeterinerID, Teshis, MuayeneUcreti } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('PetID',         sql.Int,          PetID)
      .input('VeterinerID',   sql.Int,          VeterinerID)
      .input('Teshis',        sql.NVarChar(250), Teshis || null)
      .input('MuayeneUcreti', sql.Decimal(10,2), MuayeneUcreti || 0)
      .query(`INSERT INTO Muayeneler (PetID, VeterinerID, Teshis, MuayeneUcreti)
              VALUES (@PetID, @VeterinerID, @Teshis, @MuayeneUcreti)`);
    res.json({ mesaj: 'Muayene eklendi.' });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

// Stok çıkar
app.put('/api/ilaclar/:id/stokcikar', async (req, res) => {
  try {
    const { CikartilacakMiktar } = req.body;
    const pool = await poolPromise;

    // Önce yeterli stok var mı kontrol et
    const kontrol = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT StokMiktari FROM Ilaclar WHERE IlacID = @id');

    const mevcutStok = kontrol.recordset[0]?.StokMiktari;
    if (mevcutStok < CikartilacakMiktar) {
      return res.status(400).json({ hata: `Yetersiz stok! Mevcut: ${mevcutStok}` });
    }

    await pool.request()
      .input('id',     sql.Int, parseInt(req.params.id))
      .input('miktar', sql.Int, CikartilacakMiktar)
      .query('UPDATE Ilaclar SET StokMiktari = StokMiktari - @miktar WHERE IlacID = @id');

    res.json({ mesaj: 'Stok düşüldü.' });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});
 app.put('/api/randevular/:id/durum', async (req, res) => {
  try {
    const { Durum } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id',    sql.Int,          parseInt(req.params.id))
      .input('Durum', sql.NVarChar(20), Durum)
      .query('UPDATE Randevular SET Durum=@Durum WHERE RandevuID=@id');
    res.json({ mesaj: 'Durum güncellendi.' });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

app.delete('/api/muayeneler/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM Muayeneler WHERE MuayeneID=@id');
    res.json({ mesaj: 'Muayene silindi.' });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});
// Randevu durum güncelle
app.put('/api/randevular/:id/durum', async (req, res) => {
  try {
    const { Durum } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id',    sql.Int,          parseInt(req.params.id))
      .input('Durum', sql.NVarChar(20), Durum)
      .query('UPDATE Randevular SET Durum=@Durum WHERE RandevuID=@id');
    res.json({ mesaj: 'Durum güncellendi.' });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

// Muayene sil
app.delete('/api/muayeneler/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM Muayeneler WHERE MuayeneID=@id');
    res.json({ mesaj: 'Muayene silindi.' });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});
app.listen(3000, () => console.log('🚀 http://localhost:3000'));