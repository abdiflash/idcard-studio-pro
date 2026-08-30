const { ipcRenderer } = require('electron');

let database = [];
let activeIndex = -1;
let currentHWID = '';
let isLicensed = false;

window.addEventListener('DOMContentLoaded', async () => {
  currentHWID = await ipcRenderer.invoke('license:getHWID');
  document.getElementById('hwidDisplay').innerText = `HWID: ${currentHWID}`;

  checkCameraConnection();
  setInterval(checkCameraConnection, 5000);

  const savedKey = localStorage.getItem('app_license_key');
  if (savedKey) {
    validateLicense(savedKey);
  }

  // Handle Input Background Template
  document.getElementById('templateInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setTemplateImage(evt.target.result);
      reader.readAsDataURL(file);
    }
  });

  drawCard();
});

window.onDatabaseLoaded = function(parsedData) {
  database = parsedData;
  filterDataList();
  if (database.length > 0) {
    selectMember(0);
  }
};

function filterDataList() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const container = document.getElementById('dataList');
  container.innerHTML = '';

  const filtered = database.filter(item => 
    item.nama.toLowerCase().includes(query) || 
    item.id.toString().toLowerCase().includes(query) ||
    item.divisi.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div class="list-group-item bg-dark text-muted text-center py-3">Tidak ada data cocok.</div>';
    return;
  }

  filtered.forEach((item) => {
    const realIndex = database.indexOf(item);
    const el = document.createElement('button');
    el.className = `list-group-item list-group-item-action bg-dark text-light border-secondary d-flex justify-content-between align-items-center py-2 ${realIndex === activeIndex ? 'active' : ''}`;
    el.onclick = () => selectMember(realIndex);
    
    const photoBadge = item.photo 
      ? '<span class="badge bg-success">Foto Ready</span>' 
      : '<span class="badge bg-secondary">No Photo</span>';

    el.innerHTML = `
      <div>
        <strong class="text-info">${item.id || '-'}</strong> - ${item.nama || 'Tanpa Nama'}
        <br><small class="text-muted">${item.divisi || '-'}</small>
      </div>
      ${photoBadge}
    `;
    container.appendChild(el);
  });
}

function selectMember(index) {
  activeIndex = index;
  filterDataList();
  const current = database[activeIndex];
  if (current) {
    document.getElementById('activeMemberInfo').innerHTML = `<i class="fa-solid fa-user-check me-1 text-success"></i> ${current.nama} (ID: ${current.id})`;
    drawCard(current);
  }
}

async function checkCameraConnection() {
  const connected = await ipcRenderer.invoke('camera:check');
  const statusEl = document.getElementById('camStatus');
  if (connected) {
    statusEl.className = 'alert alert-success py-1 small mb-2';
    statusEl.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i>digiCamControl Terhubung';
  } else {
    statusEl.className = 'alert alert-danger py-1 small mb-2';
    statusEl.innerHTML = '<i class="fa-solid fa-circle-xmark me-1"></i>digiCamControl Terputus (Port 5513)';
  }
}

async function updateCamSetting(param, value) {
  try {
    await ipcRenderer.invoke('camera:set', param, value);
  } catch (err) {
    alert(err.message);
  }
}

async function triggerDSLR() {
  if (activeIndex < 0 || !database[activeIndex]) {
    alert("Pilih anggota dari daftar terlebih dahulu!");
    return;
  }
  try {
    await ipcRenderer.invoke('camera:capture');
  } catch (err) {
    alert("Gagal memicu jepretan kamera hardware: " + err.message);
  }
}

function handleManualPhoto(e) {
  const file = e.target.files[0];
  if (!file || activeIndex < 0 || !database[activeIndex]) {
    alert("Pilih anggota dari daftar terlebih dahulu!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    database[activeIndex].photo = evt.target.result;
    filterDataList();
    drawCard(database[activeIndex]);
  };
  reader.readAsDataURL(file);
}

function openLicenseModal() {
  const modal = new bootstrap.Modal(document.getElementById('licenseModal'));
  modal.show();
}

async function submitLicenseKey() {
  const inputKey = document.getElementById('licenseKeyInput').value.trim();
  const isValid = await validateLicense(inputKey);
  if (isValid) {
    alert("Lisensi Berhasil Diaktifkan!");
    const modalEl = document.getElementById('licenseModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  } else {
    alert("Kode Lisensi Tidak Valid untuk HWID Mesin Ini!");
  }
}

async function validateLicense(key) {
  const valid = await ipcRenderer.invoke('license:verify', key, currentHWID);
  const badge = document.getElementById('licenseBadge');
  isLicensed = valid;

  if (valid) {
    localStorage.setItem('app_license_key', key);
    badge.className = "badge bg-success text-white";
    badge.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>PRO Active`;
  } else {
    badge.className = "badge bg-warning text-dark";
    badge.innerHTML = `<i class="fa-solid fa-lock me-1"></i>Free Mode`;
  }

  if (database[activeIndex]) {
    drawCard(database[activeIndex]);
  } else {
    drawCard();
  }

  return valid;
}

function downloadSingle() {
  const activeData = database[activeIndex];
  const filename = activeData ? `IDCARD_${activeData.id}_${activeData.nama}.png` : 'IDCARD.png';
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function downloadBatchZip() {
  const readyItems = database.filter(d => d.photo !== null);
  if (readyItems.length === 0) {
    alert("Belum ada data anggota yang memiliki foto!");
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder("IDCARD_BATCH");

  for (let item of readyItems) {
    drawCard(item);
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    folder.file(`IDCARD_${item.id}_${item.nama}.png`, base64Data, { base64: true });
  }

  if (database[activeIndex]) drawCard(database[activeIndex]);

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "ID_Card_Batch_Export.zip");
}
