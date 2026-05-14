export function getDisplayPrice(product) {
  const basePrice = Number(product.price) || 0;
  const discount = Number(product.discountPercentage) || 0;

  if (discount <= 0) {
    return basePrice;
  }

  return Number(
    Math.max(
      0.01,
      Math.min(basePrice - 0.01, basePrice - basePrice * (discount / 100))
    ).toFixed(2)
  );
}

export function sortProducts(products, sortOption) {
  const items = [...products];

  switch (sortOption) {
    case 'price-asc':
      return items.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
    case 'price-desc':
      return items.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
    case 'title-asc':
      return items.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return items;
  }
}