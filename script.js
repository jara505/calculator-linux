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

function calculateSwap(ramSize, diskSize) {
  let swapSize;
  if (ramSize <= 4) {
    swapSize = ramSize * 2;
  } else if (ramSize <= 16) {
    swapSize = Math.min(ramSize, 8);
  } else {
    swapSize = 8;
  }

  const maxSwap = Math.floor(diskSize * 0.2);
  if (swapSize > maxSwap) {
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

  const swapSize = calculateSwap(ramSize, diskSize);
  const rootSize = calculateRoot(diskSize);
  const homeSize = diskSize - EFI_SIZE_GB - swapSize - rootSize;

  if (homeSize < MIN_HOME_GB) {
    errorMsg.textContent = 'Espacio insuficiente para /home después de asignar EFI, swap y raíz.';
    return;
  }

  const partitions = [
    { name: '/boot/efi', size: EFI_SIZE_GB, fs: 'FAT32' },
    { name: 'swap', size: swapSize, fs: 'swap' },
    { name: '/', size: rootSize, fs: 'ext4' },
    { name: '/home', size: homeSize, fs: 'ext4' },
  ];

  partitions.forEach(p => {
    const row = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = p.name;
    row.appendChild(tdName);

    const tdSize = document.createElement('td');
    tdSize.textContent = p.size < 1 ? `${p.size * 1024} MB` : `${p.size} GB`;
    row.appendChild(tdSize);

    const tdFs = document.createElement('td');
    tdFs.textContent = p.fs;
    row.appendChild(tdFs);

    resultBody.appendChild(row);
  });

  resultDiv.style.display = 'block';
});
