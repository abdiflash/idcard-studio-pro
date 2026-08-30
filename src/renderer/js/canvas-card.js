const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
let currentBg = new Image();

function setTemplateImage(src) {
  currentBg = new Image();
  currentBg.onload = () => {
    if (typeof activeIndex !== 'undefined' && database[activeIndex]) {
      drawCard(database[activeIndex]);
    } else {
      drawCard();
    }
  };
  currentBg.src = src;
}

function drawCard(data = {}) {
  ctx.clearRect(0, 0, 673, 1063);

  // 1. Draw Background Template
  if (currentBg.src && currentBg.complete && currentBg.naturalWidth > 0) {
    ctx.drawImage(currentBg, 0, 0, 673, 1063);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 673, 1063);
  }

  // 2. Draw Foto dengan Circle Masking
  if (data.photo) {
    const photoImg = new Image();
    photoImg.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(336.5, 380, 140, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(photoImg, 336.5 - 140, 380 - 140, 280, 280);
      ctx.restore();

      drawTextAndBarcode(data);
    };
    photoImg.src = data.photo;
  } else {
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(336.5, 380, 140, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawTextAndBarcode(data);
  }
}

function drawTextAndBarcode(data) {
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText((data.nama || 'NAMA LENGKAP').toUpperCase(), 336.5, 600);

  ctx.fillStyle = '#475569';
  ctx.font = '22px sans-serif';
  ctx.fillText(`ID / NIP: ${data.id || '12345678'}`, 336.5, 640);
  ctx.fillText(`DIVISI: ${data.divisi ? data.divisi.toUpperCase() : 'STAFF'}`, 336.5, 675);

  // Generate Barcode CODE128
  const barcodeBuffer = document.getElementById('barcodeBuffer');
  try {
    JsBarcode(barcodeBuffer, data.id || '12345678', { format: 'CODE128', width: 3, height: 80, displayValue: false });
    ctx.drawImage(barcodeBuffer, (673 - 400) / 2, 850, 400, 90);
  } catch {}

  // Watermark jika mode gratis
  if (!isLicensed) {
    ctx.save();
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.translate(336.5, 531.5);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText('UNLICENSED VERSION', 0, 0);
    ctx.fillText('BELI LISENSI RESMI', 0, 50);
    ctx.restore();
  }
}
