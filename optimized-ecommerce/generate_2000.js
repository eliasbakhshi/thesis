const fs = require('fs');
const path = require('path');
let sharp = null;

try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

const dataPath = path.join(__dirname, 'src', 'data.json');
const productsDir = path.join(__dirname, 'public', 'images', 'products');

function generateMassiveDataset() {
  if (!fs.existsSync(dataPath)) {
    console.error('Error: Cannot find src/data.json!');
    return;
  }

  const rawData = fs.readFileSync(dataPath);
  const data = JSON.parse(rawData);
  const originalProducts = data.products;

  if (!originalProducts || originalProducts.length === 0) {
    console.error('Error: No products found to use as templates.');
    return;
  }

  const templates = originalProducts.slice(0, 20);
  const categories = ["Men's Clothing", "Women's Clothing", "Jewelery", "Electronics"];
  const massiveProducts = [];
  const totalProducts = 2000;

  console.log('Generating 2000 products. This will just take a second...');

  for (let i = 1; i <= totalProducts; i++) {
    const template = templates[(i - 1) % templates.length];
    const cleanTitle = template.title.replace(/\d+$/, '').trim();

    const isInFirstRange = i >= 1 && i <= 200;
    const isInSecondRange = i >= 201 && i <= 2000;
    const hasDiscount = isInSecondRange || (isInFirstRange && Math.random() < 0.5);
    const discountPercentage = hasDiscount ? Math.floor(Math.random() * 80) + 1 : null;

    const nextProduct = {
      id: i,
      title: `${cleanTitle} ${i}`,
      description: template.description,
      price: template.price,
      category: categories[(i - 1) % categories.length],
      image: `/images/products/product-${i}.jpg`,
      comments: []
    };

    if (discountPercentage) {
      nextProduct.discountPercentage = discountPercentage;
    }

    massiveProducts.push(nextProduct);
  }

  data.products = massiveProducts;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done. data.json now has 2000 products.');
}

async function generateThumbnails() {
  if (!sharp) {
    console.error('Error: sharp is not installed. Install it first, then run this script with thumbs mode.');
    process.exit(1);
  }

  if (!fs.existsSync(productsDir)) {
    console.error('Error: products image folder not found.');
    process.exit(1);
  }

  const entries = fs.readdirSync(productsDir);
  const sourceFiles = entries.filter((name) => {
    const lower = name.toLowerCase();
    return (
      (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) &&
      !lower.includes('-thumb.')
    );
  });

  for (const fileName of sourceFiles) {
    const inputPath = path.join(productsDir, fileName);
    const baseName = fileName.replace(/\.[^/.]+$/, '');

    const thumbJpg = path.join(productsDir, `${baseName}-thumb.jpg`);
    const thumbWebp = path.join(productsDir, `${baseName}-thumb.webp`);
    const thumbAvif = path.join(productsDir, `${baseName}-thumb.avif`);

    const pipeline = sharp(inputPath).resize(350, 210, {
      fit: 'cover',
      position: 'centre'
    });

    await pipeline.clone().jpeg({ quality: 82 }).toFile(thumbJpg);
    await pipeline.clone().webp({ quality: 80 }).toFile(thumbWebp);
    await pipeline.clone().avif({ quality: 50 }).toFile(thumbAvif);
  }

  console.log(`Thumbnails generated for ${sourceFiles.length} source images.`);
}

async function resizeBannerToWidth1500() {
  if (!sharp) {
    console.error('Error: sharp is not installed.');
    process.exit(1);
  }

  const inputPath = path.join(__dirname, 'public', 'images', 'banner.jpg');
  const outputPath = path.join(__dirname, 'public', 'images', 'banner-1500.jpg');

  if (!fs.existsSync(inputPath)) {
    console.error('Error: banner image not found at public/images/banner.jpg');
    process.exit(1);
  }

  await sharp(inputPath)
    .resize({
      width: 1500,
      withoutEnlargement: true
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  console.log('Banner resized to width 1500:', outputPath);
}

const mode = process.argv[2];

if (mode === 'thumbs') {
  generateThumbnails().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (mode === 'banner-1500') {
  resizeBannerToWidth1500().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  generateMassiveDataset();
}
