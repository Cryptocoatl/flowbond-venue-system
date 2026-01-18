// FlowBond × DANZ Venue System - QR Code Generation Script
// Run with: npx ts-node infrastructure/scripts/generate-qr.ts

import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QRGenerationOptions {
  baseUrl: string;
  outputDir: string;
  format: 'png' | 'svg';
  size: number;
  venueSlug?: string;
}

const defaultOptions: QRGenerationOptions = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://flowbond.io',
  outputDir: './generated-qr-codes',
  format: 'png',
  size: 300,
};

async function generateQRCodesForVenue(options: QRGenerationOptions = defaultOptions) {
  console.log('📱 FlowBond QR Code Generator\n');

  // Ensure output directory exists
  const outputPath = path.resolve(options.outputDir);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`📁 Created output directory: ${outputPath}\n`);
  }

  // Fetch QR points with related data
  const whereClause = options.venueSlug
    ? { zone: { venue: { slug: options.venueSlug } } }
    : {};

  const qrPoints = await prisma.qRPoint.findMany({
    where: whereClause,
    include: {
      zone: {
        include: {
          venue: true,
        },
      },
      sponsor: true,
    },
  });

  if (qrPoints.length === 0) {
    console.log('⚠️  No QR points found. Run the seed script first.');
    return;
  }

  console.log(`🔍 Found ${qrPoints.length} QR points to generate\n`);

  // Group by venue for organized output
  const byVenue = qrPoints.reduce((acc, qr) => {
    const venueName = qr.zone.venue.name;
    if (!acc[venueName]) {
      acc[venueName] = [];
    }
    acc[venueName].push(qr);
    return acc;
  }, {} as Record<string, typeof qrPoints>);

  // Generate QR codes
  for (const [venueName, venueQRPoints] of Object.entries(byVenue)) {
    console.log(`🏛️  ${venueName}:`);

    // Create venue subdirectory
    const venueDir = path.join(outputPath, venueName.toLowerCase().replace(/\s+/g, '-'));
    if (!fs.existsSync(venueDir)) {
      fs.mkdirSync(venueDir, { recursive: true });
    }

    for (const qr of venueQRPoints) {
      const scanUrl = `${options.baseUrl}/scan/${qr.code}`;
      const fileName = `${qr.zone.name.toLowerCase().replace(/\s+/g, '-')}-${qr.sponsor?.name.toLowerCase().replace(/\s+/g, '-') || 'general'}.${options.format}`;
      const filePath = path.join(venueDir, fileName);

      try {
        if (options.format === 'svg') {
          const svg = await QRCode.toString(scanUrl, {
            type: 'svg',
            width: options.size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          fs.writeFileSync(filePath, svg);
        } else {
          await QRCode.toFile(filePath, scanUrl, {
            type: 'png',
            width: options.size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        }

        console.log(`   ✅ ${qr.zone.name} - ${qr.sponsor?.name || 'General'}`);
        console.log(`      Code: ${qr.code}`);
        console.log(`      URL: ${scanUrl}`);
        console.log(`      File: ${filePath}\n`);
      } catch (error) {
        console.error(`   ❌ Failed to generate QR for ${qr.label}: ${error}`);
      }
    }
  }

  // Generate manifest file
  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    totalCodes: qrPoints.length,
    venues: Object.entries(byVenue).map(([name, codes]) => ({
      name,
      codeCount: codes.length,
      codes: codes.map((qr) => ({
        code: qr.code,
        zone: qr.zone.name,
        sponsor: qr.sponsor?.name || null,
        label: qr.label,
        scanUrl: `${options.baseUrl}/scan/${qr.code}`,
      })),
    })),
  };

  const manifestPath = path.join(outputPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📋 Manifest saved to: ${manifestPath}`);

  // Generate printable HTML sheet
  const htmlContent = generatePrintableHTML(manifest, options);
  const htmlPath = path.join(outputPath, 'print-sheet.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`🖨️  Print sheet saved to: ${htmlPath}`);

  console.log('\n✨ QR code generation complete!');
}

function generatePrintableHTML(
  manifest: any,
  options: QRGenerationOptions
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowBond QR Codes - Print Sheet</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
      color: white;
      border-radius: 12px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
    }
    .venue-section {
      margin-bottom: 40px;
    }
    .venue-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #6366f1;
    }
    .qr-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }
    .qr-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    .qr-card img {
      width: 150px;
      height: 150px;
      margin-bottom: 12px;
    }
    .qr-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .qr-zone {
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }
    .qr-sponsor {
      font-size: 12px;
      color: #6366f1;
      margin-top: 4px;
    }
    .qr-code-text {
      font-family: monospace;
      font-size: 10px;
      color: #999;
      margin-top: 8px;
      padding: 4px 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .qr-card {
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FlowBond × DANZ</h1>
    <p>QR Code Print Sheet • Generated ${new Date().toLocaleDateString()}</p>
  </div>

  ${manifest.venues
    .map(
      (venue: any) => `
    <div class="venue-section">
      <h2 class="venue-title">${venue.name}</h2>
      <div class="qr-grid">
        ${venue.codes
          .map(
            (code: any) => `
          <div class="qr-card">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(code.scanUrl)}" alt="QR Code">
            <div class="qr-zone">${code.zone}</div>
            ${code.sponsor ? `<div class="qr-sponsor">${code.sponsor}</div>` : ''}
            <div class="qr-code-text">${code.code}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
    )
    .join('')}
</body>
</html>`;
}

// CLI argument parsing
const args = process.argv.slice(2);
const options: QRGenerationOptions = { ...defaultOptions };

args.forEach((arg, index) => {
  if (arg === '--url' && args[index + 1]) {
    options.baseUrl = args[index + 1];
  }
  if (arg === '--output' && args[index + 1]) {
    options.outputDir = args[index + 1];
  }
  if (arg === '--format' && args[index + 1]) {
    options.format = args[index + 1] as 'png' | 'svg';
  }
  if (arg === '--size' && args[index + 1]) {
    options.size = parseInt(args[index + 1], 10);
  }
  if (arg === '--venue' && args[index + 1]) {
    options.venueSlug = args[index + 1];
  }
  if (arg === '--help') {
    console.log(`
FlowBond QR Code Generator

Usage: npx ts-node generate-qr.ts [options]

Options:
  --url <url>       Base URL for QR codes (default: https://flowbond.io)
  --output <dir>    Output directory (default: ./generated-qr-codes)
  --format <fmt>    Output format: png or svg (default: png)
  --size <pixels>   QR code size in pixels (default: 300)
  --venue <slug>    Generate only for specific venue slug
  --help            Show this help message
    `);
    process.exit(0);
  }
});

generateQRCodesForVenue(options)
  .catch((e) => {
    console.error('❌ Generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
