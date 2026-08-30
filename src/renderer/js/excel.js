function parseExcelDatabase(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("File tidak ditemukan."));
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        const cleanedData = rawRows.map((row) => {
          const norm = {};
          
          Object.keys(row).forEach((key) => {
            const cleanKey = key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            norm[cleanKey] = String(row[key]).trim();
          });

          return {
            id: norm['nip'] || norm['nik'] || norm['nisn'] || norm['nis'] || norm['id'] || norm['npp'] || '',
            nama: norm['nama'] || norm['namalengkap'] || norm['namapegawai'] || '',
            divisi: norm['divisi'] || norm['unit'] || norm['jabatan'] || norm['kelas'] || '',
            tempatLahir: norm['tempatlahir'] || norm['tmplahir'] || '',
            tglLahir: norm['tanggallahir'] || norm['tgllahir'] || '',
            noVa: norm['nova'] || norm['va'] || '',
            photo: null
          };
        });

        resolve(cleanedData);
      } catch (err) {
        reject(new Error("Gagal membaca struktur file Excel: " + err.message));
      }
    };

    reader.onerror = function (err) {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const excelInput = document.getElementById('excelInput');
  if (excelInput) {
    excelInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const data = await parseExcelDatabase(file);
        if (typeof window.onDatabaseLoaded === 'function') {
          window.onDatabaseLoaded(data);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }
});
