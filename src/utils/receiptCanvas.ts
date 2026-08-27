/**
 * Helper to generate canvas representations of degraded receipts,
 * restored DSDNet outputs, pixel-wise authenticity heatmaps, and blended overlays.
 */

export interface ReceiptRenderConfig {
  merchantName: string;
  receiptNumber: string;
  date: string;
  taxId: string;
  taxAmount: string;
  totalAmount: string;
  subtotal: string;
  items: { description: string; qty: number; unitPrice: string; total: string }[];
  degradation: 'thermal_fading' | 'uneven_lighting' | 'creased_tear' | 'oil_stain' | 'heavy_blur';
  severity: 'mild' | 'moderate' | 'severe';
  abstainFieldKeys?: string[];
}

export function drawReceiptToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: 'original' | 'restored' | 'heatmap' | 'overlay',
  config: ReceiptRenderConfig,
  heatmapOpacity: number = 0.65
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (type === 'heatmap') {
    renderHeatmapOnly(ctx, width, height, config);
    return;
  }

  // 1. Draw Paper Base
  if (type === 'original') {
    // Thermal paper texture with age/yellowing/grain
    const paperGrad = ctx.createLinearGradient(0, 0, width, height);
    if (config.degradation === 'thermal_fading') {
      paperGrad.addColorStop(0, '#f9f8f5');
      paperGrad.addColorStop(0.5, '#f4f2ea');
      paperGrad.addColorStop(1, '#ece8dc');
    } else if (config.degradation === 'uneven_lighting') {
      paperGrad.addColorStop(0, '#ffffff');
      paperGrad.addColorStop(0.4, '#f5f3ec');
      paperGrad.addColorStop(1, '#c5beb0'); // dark shadow at bottom right
    } else if (config.degradation === 'oil_stain') {
      paperGrad.addColorStop(0, '#f8f6f0');
      paperGrad.addColorStop(1, '#f1ede0');
    } else {
      paperGrad.addColorStop(0, '#faf9f6');
      paperGrad.addColorStop(1, '#f2efe9');
    }
    ctx.fillStyle = paperGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle paper fibers/noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
  } else {
    // Restored & Overlay background: crisp clean uniform white/neutral document paper
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, width, height);
    
    // Light border guide
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);
  }

  // 2. Draw Receipt Content (Text, Lines, Table)
  ctx.save();
  drawReceiptTextLayout(ctx, width, height, type, config);
  ctx.restore();

  // 3. Apply Degradation Artifacts for 'original'
  if (type === 'original') {
    applyDegradationEffects(ctx, width, height, config);
  }

  // 4. For 'overlay', draw the heatmap on top with alpha
  if (type === 'overlay') {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      renderHeatmapOnly(offCtx, width, height, config);
      ctx.save();
      ctx.globalAlpha = heatmapOpacity;
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(offscreen, 0, 0);
      ctx.restore();
    }
  }
}

function drawReceiptTextLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: 'original' | 'restored' | 'overlay',
  config: ReceiptRenderConfig
) {
  const isOriginal = type === 'original';
  const inkColor = isOriginal ? '#2c2d30' : '#111827';
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let currentY = 24;

  // Header: Merchant Name
  ctx.fillStyle = inkColor;
  ctx.font = isOriginal ? 'bold 15px "Courier New", monospace' : 'bold 16px "IBM Plex Mono", "Courier New", monospace';
  ctx.fillText(config.merchantName.toUpperCase(), width / 2, currentY);
  currentY += 20;

  ctx.font = '10px "Courier New", monospace';
  ctx.fillText('NO. 45, JALAN SULTAN ISMAIL', width / 2, currentY);
  currentY += 14;
  ctx.fillText('50250 KUALA LUMPUR, MALAYSIA', width / 2, currentY);
  currentY += 14;
  ctx.fillText(`TAX / SST ID: ${config.taxId}`, width / 2, currentY);
  currentY += 18;

  // Dashed separator
  drawDashedLine(ctx, 16, currentY, width - 16);
  currentY += 12;

  // Metadata: Date & Receipt No
  ctx.textAlign = 'left';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(`RCPT NO: ${config.receiptNumber}`, 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`DATE: ${config.date}`, width - 16, currentY);
  currentY += 16;
  ctx.textAlign = 'left';
  ctx.fillText('POS CASHIER: 04 (AMIRUL)', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('TIME: 13:42:09', width - 16, currentY);
  currentY += 16;

  // Dashed separator
  drawDashedLine(ctx, 16, currentY, width - 16);
  currentY += 14;

  // Items table header
  ctx.textAlign = 'left';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.fillText('QTY  DESCRIPTION', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('TOTAL (RM)', width - 16, currentY);
  currentY += 14;

  // Items rows
  ctx.font = '11px "Courier New", monospace';
  for (const item of config.items) {
    ctx.textAlign = 'left';
    ctx.fillText(`${item.qty}x  ${item.description.slice(0, 18)}`, 16, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(item.total, width - 16, currentY);
    currentY += 16;
  }

  currentY += 6;
  drawDashedLine(ctx, 16, currentY, width - 16);
  currentY += 12;

  // Financial summary
  ctx.textAlign = 'left';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('SUBTOTAL:', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(config.subtotal, width - 16, currentY);
  currentY += 16;

  ctx.textAlign = 'left';
  ctx.fillText('SST (6%):', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(config.taxAmount, width - 16, currentY);
  currentY += 18;

  // Grand total in bold
  ctx.font = isOriginal ? 'bold 14px "Courier New", monospace' : 'bold 15px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL (RM):', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(config.totalAmount, width - 16, currentY);
  currentY += 22;

  drawDashedLine(ctx, 16, currentY, width - 16);
  currentY += 14;

  // Payment details
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PAYMENT METHOD:', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('DUITNOW QR', width - 16, currentY);
  currentY += 14;
  ctx.textAlign = 'left';
  ctx.fillText('APPROVAL CODE:', 16, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('TRX-9482109', width - 16, currentY);
  currentY += 20;

  // Barcode / QR placeholder
  ctx.fillStyle = inkColor;
  const barcodeY = currentY;
  const barcodeW = width - 48;
  for (let x = 24; x < 24 + barcodeW; x += Math.floor(Math.random() * 4 + 2)) {
    ctx.fillRect(x, barcodeY, Math.random() > 0.4 ? 2 : 1, 24);
  }
  currentY += 32;

  // Footer note
  ctx.textAlign = 'center';
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText('THANK YOU FOR YOUR VISIT!', width / 2, currentY);
  currentY += 12;
  ctx.fillText('* ACADEMIC RESEARCH SAMPLE DATA *', width / 2, currentY);
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function applyDegradationEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ReceiptRenderConfig
) {
  const { degradation, severity } = config;
  const sevMult = severity === 'severe' ? 1.0 : severity === 'moderate' ? 0.65 : 0.35;

  if (degradation === 'thermal_fading') {
    // Thermal paper fading: bottom lines and right edge fade out to faint grey / white
    const fadeGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
    fadeGrad.addColorStop(0, 'rgba(244, 242, 234, 0)');
    fadeGrad.addColorStop(0.5, `rgba(244, 242, 234, ${0.4 * sevMult})`);
    fadeGrad.addColorStop(0.85, `rgba(244, 242, 234, ${0.85 * sevMult})`);
    fadeGrad.addColorStop(1, `rgba(244, 242, 234, ${0.95 * sevMult})`);

    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 0, width, height);

    // Diagonal sun/heat fade patch
    const radialFade = ctx.createRadialGradient(
      width * 0.7,
      height * 0.75,
      20,
      width * 0.7,
      height * 0.75,
      width * 0.5
    );
    radialFade.addColorStop(0, `rgba(244, 242, 234, ${0.9 * sevMult})`);
    radialFade.addColorStop(1, 'rgba(244, 242, 234, 0)');
    ctx.fillStyle = radialFade;
    ctx.fillRect(0, 0, width, height);
  } else if (degradation === 'uneven_lighting') {
    // Harsh shadow cast across one half
    const shadowGrad = ctx.createLinearGradient(0, 0, width, height);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.7, `rgba(30, 25, 20, ${0.45 * sevMult})`);
    shadowGrad.addColorStop(1, `rgba(15, 10, 5, ${0.75 * sevMult})`);

    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (degradation === 'oil_stain') {
    // Translucent dark-yellow grease stains
    ctx.save();
    ctx.fillStyle = `rgba(180, 140, 60, ${0.45 * sevMult})`;
    ctx.beginPath();
    ctx.ellipse(width * 0.65, height * 0.35, 55, 38, Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(width * 0.35, height * 0.72, 48, 65, -Math.PI / 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  } else if (degradation === 'creased_tear') {
    // Crease lines across receipt
    ctx.save();
    ctx.strokeStyle = `rgba(80, 70, 60, ${0.6 * sevMult})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.42);
    ctx.lineTo(width * 0.45, height * 0.44);
    ctx.lineTo(width, height * 0.41);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * sevMult})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.42 + 2);
    ctx.lineTo(width * 0.45, height * 0.44 + 2);
    ctx.lineTo(width, height * 0.41 + 2);
    ctx.stroke();
    ctx.restore();
  } else if (degradation === 'heavy_blur') {
    // Slight blur simulation
    ctx.fillStyle = `rgba(250, 248, 245, ${0.35 * sevMult})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function renderHeatmapOnly(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ReceiptRenderConfig
) {
  // Background low trace canvas
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#064e3b'); // Dark emerald (high support default for header)
  bgGrad.addColorStop(0.5, '#047857'); // Medium emerald
  bgGrad.addColorStop(1, '#065f46');

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // If thermal fading, lower half drops to amber (uncertain) and crimson (low support)
  if (config.degradation === 'thermal_fading') {
    const fadeMap = ctx.createLinearGradient(0, height * 0.45, 0, height);
    fadeMap.addColorStop(0, 'rgba(6, 78, 59, 0)');
    fadeMap.addColorStop(0.3, 'rgba(217, 119, 6, 0.75)'); // Amber / Uncertain
    fadeMap.addColorStop(0.7, 'rgba(220, 38, 38, 0.9)'); // Crimson / Low support
    fadeMap.addColorStop(1, 'rgba(153, 27, 27, 0.95)');

    ctx.fillStyle = fadeMap;
    ctx.fillRect(0, 0, width, height);
  } else if (config.degradation === 'oil_stain') {
    // Red / Amber circular patches over stain regions
    ctx.save();
    const g1 = ctx.createRadialGradient(width * 0.65, height * 0.35, 10, width * 0.65, height * 0.35, 60);
    g1.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
    g1.addColorStop(0.6, 'rgba(217, 119, 6, 0.8)');
    g1.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(width * 0.35, height * 0.72, 10, width * 0.35, height * 0.72, 70);
    g2.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
    g2.addColorStop(0.7, 'rgba(217, 119, 6, 0.8)');
    g2.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (config.degradation === 'uneven_lighting') {
    const shadowMap = ctx.createLinearGradient(0, 0, width, height);
    shadowMap.addColorStop(0, 'rgba(6, 78, 59, 0)');
    shadowMap.addColorStop(0.5, 'rgba(217, 119, 6, 0.6)');
    shadowMap.addColorStop(0.85, 'rgba(220, 38, 38, 0.9)');
    ctx.fillStyle = shadowMap;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw text footprint trace support highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  // Add pixelated grid noise texture to emphasize pixel-wise heatmap nature
  for (let y = 10; y < height; y += 8) {
    for (let x = 10; x < width; x += 8) {
      if (Math.random() > 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
        ctx.fillRect(x, y, 6, 6);
      }
    }
  }
}

/**
 * Generate data URLs for all 4 panels of a receipt
 */
export function generateReceiptImages(config: ReceiptRenderConfig, width = 340, height = 520) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Original
  drawReceiptToCanvas(ctx, width, height, 'original', config);
  const originalImageUrl = canvas.toDataURL('image/png');

  // 2. Restored
  drawReceiptToCanvas(ctx, width, height, 'restored', config);
  const restoredImageUrl = canvas.toDataURL('image/png');

  // 3. Heatmap
  drawReceiptToCanvas(ctx, width, height, 'heatmap', config);
  const heatmapImageUrl = canvas.toDataURL('image/png');

  // 4. Overlay
  drawReceiptToCanvas(ctx, width, height, 'overlay', config, 0.6);
  const overlayImageUrl = canvas.toDataURL('image/png');

  return {
    originalImageUrl,
    restoredImageUrl,
    heatmapImageUrl,
    overlayImageUrl,
    width,
    height
  };
}
