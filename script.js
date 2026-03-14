const infoBtn = document.getElementById('infoBtn');
const infoTooltip = document.getElementById('infoTooltip');

infoBtn.addEventListener('click', () => {
  infoTooltip.classList.toggle('visible');
});

document.addEventListener('click', e => {
  if (!infoBtn.contains(e.target) && !infoTooltip.contains(e.target)) {
    infoTooltip.classList.remove('visible');
  }
});

const form = document.getElementById('partitionForm');
const errorMsg = document.getElementById('errorMsg');
const resultDiv = document.getElementById('result');
const resultBody = document.getElementById('resultBody');

const MAX_RAM_GB = 256;
const EFI_SIZE_GB = 0.5;
const MIN_DISK_GB = 10;
const MIN_HOME_GB = 5;

function calculateSwap(ramSize, diskSize, hibernate) {
  let swapSize;

  if (hibernate) {
    swapSize = Math.ceil(ramSize * 1.5);
  } else if (ramSize <= 4) {
    swapSize = ramSize * 2;
  } else if (ramSize <= 16) {
    swapSize = Math.min(ramSize, 8);
  } else {
    swapSize = 8;
  }

  const maxSwap = Math.floor(diskSize * 0.2);
  if (!hibernate && swapSize > maxSwap) {
    swapSize = maxSwap;
  }

  return swapSize;
}

function calculateRoot(diskSize) {
  if (diskSize < 64) return 12;
  if (diskSize < 256) return 25;
  if (diskSize < 1024) return 50;
  return 80;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  errorMsg.textContent = '';
  resultDiv.style.display = 'none';
  resultBody.innerHTML = '';

  const diskSize = parseInt(form.diskSize.value);
  if (isNaN(diskSize) || diskSize < MIN_DISK_GB) {
    errorMsg.textContent = `Ingresa un tamaño de disco válido (mínimo ${MIN_DISK_GB} GB).`;
    return;
  }

  let ramSize = parseInt(form.ramSize.value);
  if (isNaN(ramSize) || ramSize < 1) {
    ramSize = 4;
  }
  if (ramSize > MAX_RAM_GB) {
    errorMsg.textContent = `La cantidad de RAM no puede superar ${MAX_RAM_GB} GB.`;
    return;
  }

  const hibernate = document.getElementById('hibernate').checked;
  const swapSize = calculateSwap(ramSize, diskSize, hibernate);
  const rootSize = calculateRoot(diskSize);
  const homeSize = diskSize - EFI_SIZE_GB - swapSize - rootSize;

  if (homeSize < MIN_HOME_GB) {
    errorMsg.textContent = 'Espacio insuficiente para /home después de asignar EFI, swap y raíz.';
    return;
  }

  const partitions = [
    { name: '/boot/efi', size: EFI_SIZE_GB, fs: 'FAT32', color: '#ff9800' },
    { name: 'swap', size: swapSize, fs: 'swap', color: '#f44336' },
    { name: '/', size: rootSize, fs: 'ext4', color: '#2196f3' },
    { name: '/home', size: homeSize, fs: 'ext4', color: '#78909c' },
  ];

  const diskBar = document.getElementById('diskBar');
  const diskLegend = document.getElementById('diskLegend');
  diskBar.innerHTML = '';
  diskLegend.innerHTML = '';

  partitions.forEach(p => {
    const pct = (p.size / diskSize) * 100;
    const sizeLabel = p.size < 1 ? `${p.size * 1024} MB` : `${p.size} GB`;

    const segment = document.createElement('div');
    segment.className = 'disk-bar-segment';
    segment.style.width = `${pct}%`;
    segment.style.backgroundColor = p.color;
    segment.textContent = pct > 8 ? p.name : '';
    segment.title = `${p.name} — ${sizeLabel} (${pct.toFixed(1)}%)`;
    diskBar.appendChild(segment);

    const legendItem = document.createElement('div');
    legendItem.className = 'disk-legend-item';
    legendItem.innerHTML = `<span class="disk-legend-color" style="background:${p.color}"></span>${p.name} ${sizeLabel}`;
    diskLegend.appendChild(legendItem);

    const row = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = p.name;
    tdName.setAttribute('data-label', 'Partición');
    row.appendChild(tdName);

    const tdSize = document.createElement('td');
    tdSize.textContent = sizeLabel;
    tdSize.setAttribute('data-label', 'Tamaño');
    row.appendChild(tdSize);

    const tdFs = document.createElement('td');
    tdFs.textContent = p.fs;
    tdFs.setAttribute('data-label', 'Sistema');
    row.appendChild(tdFs);

    resultBody.appendChild(row);
  });

  resultDiv.style.display = 'block';
});
