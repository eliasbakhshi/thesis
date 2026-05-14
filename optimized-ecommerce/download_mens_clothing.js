const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data.json');
const dir = path.join(__dirname, 'public', 'images', 'products');
const MIN_PRODUCT_ID = 1;
const MAX_PRODUCT_ID = 4000;

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Delay to prevent getting blocked by the image server
const delay = ms => new Promise(res => setTimeout(res, ms));

// Map the exact JSON categories to valid LoremFlickr search keywords
const categoryMap = {
  "Men's Clothing": "mens,clothing",
  "Women's Clothing": "womens,clothing",
  "Jewelery": "jewelry",
  "Electronics": "electronics,gadgets"
};

async function syncImagesWithDatabase() {
  if (!fs.existsSync(dataPath)) {
    console.error('Error: Cannot find src/data.json! Make sure it exists.');
    return;
  }

  const rawData = fs.readFileSync(dataPath);
  const data = JSON.parse(rawData);
  const products = Array.isArray(data.products)
    ? data.products.filter((product) => {
        const id = Number(product.id);
        return id >= MIN_PRODUCT_ID && id <= MAX_PRODUCT_ID;
      })
    : [];

  console.log(`Found ${products.length} products in data.json for ID range ${MIN_PRODUCT_ID}-${MAX_PRODUCT_ID}.`);
  console.log('Downloading related 1200x1200 images to public/images/products. Leave the terminal open.');

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const categoryName = product.category;

    // Fallback to 'object' if a category doesn't match our map
    const searchTags = categoryMap[categoryName] || "object";

    // Use the actual product ID for the lock to ensure consistent images across re-runs
    const url = `https://loremflickr.com/1200/1200/${searchTags}?lock=${product.id}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(path.join(dir, `product-${product.id}.jpg`), Buffer.from(buffer));

      console.log(`[ID: ${product.id} | ${categoryName}] Image secured.`);

      // Delay to avoid rate limiting
      await delay(250);

    } catch (error) {
      console.error(`Failed on product ID ${product.id} [${categoryName}]:`, error.message);
    }
  }

  console.log('Done. Product images for IDs 1-4000 are in public/images/products.');
}

syncImagesWithDatabase();
