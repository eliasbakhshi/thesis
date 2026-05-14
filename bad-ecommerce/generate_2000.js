const fs = require('fs');
const path = require('path');

// Target your existing data.json inside the src folder
const dataPath = path.join(__dirname, 'src', 'data.json');

function generateMassiveDataset() {
  if (!fs.existsSync(dataPath)) {
    console.error('Error: Cannot find src/data.json!');
    return;
  }

  // Read the current file
  const rawData = fs.readFileSync(dataPath);
  const data = JSON.parse(rawData);
  const originalProducts = data.products;

  if (!originalProducts || originalProducts.length === 0) {
    console.error('Error: No products found to use as templates.');
    return;
  }

  // Grab the first 20 items to use as our base templates
  const templates = originalProducts.slice(0, 20);

  // The exact 4 categories from your UI
  const categories = ["Men's Clothing", "Women's Clothing", "Jewelery", "Electronics"];
  const massiveProducts = [];
  const totalProducts = 2000;

  console.log('Generating 2000 products. This will just take a second...');

  for (let i = 1; i <= totalProducts; i++) {
    const template = templates[(i - 1) % templates.length];

    // Clean up the old title by removing the trailing number so we can append the new ID cleanly
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
      // Cycle through the 4 categories evenly
      category: categories[(i - 1) % categories.length],
      // Map directly to your downloaded local images
      image: `/images/products/product-${i}.jpg`,
      comments: []
    };

    if (discountPercentage) {
      nextProduct.discountPercentage = discountPercentage;
    }

    massiveProducts.push(nextProduct);
  }

  // Inject the new massive array back into the object, keeping the 'users' array safe
  data.products = massiveProducts;

  // Overwrite the file
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done. Your data.json is fully loaded with 2000 products, some random discounts in IDs 1-200, and all discounts in IDs 201-2000.');
}

generateMassiveDataset();
