import { useContext, useState } from 'react';
import { AppContext } from './AppContext';
import { sortProducts } from './utils/productSorting';

const calculateDiscountedPrice = (price, discountPercentage) => {
  const basePrice = Number(price) || 0;
  const percentage = Number(discountPercentage) || 0;

  if (percentage <= 0) {
    return basePrice;
  }

  return Number(
    Math.max(0.01, Math.min(basePrice - 0.01, basePrice - basePrice * (percentage / 100))).toFixed(2)
  );
};

function Sales() {
  const { appState, addToCart } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const imageVersion = Date.now();

  const discountedProducts = appState.products
    .filter((product) => product.discountPercentage)
    .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));

  const filteredProducts = discountedProducts.filter((product) => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      product.title?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  });

  const sortedSaleProducts = sortProducts(filteredProducts, sortOption);

  return (
    <section className="p-8">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-3xl font-semibold text-slate-800 mb-4">Sales</h2>
        <p className="text-sm text-slate-700 mb-6">
          Discounted products: {filteredProducts.length}
        </p>

        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search discounted items..."
            className="w-full border border-slate-300 rounded px-3 py-2"
          />

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            className="border border-slate-400 bg-white text-slate-950 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            aria-label="Sort sale products"
          >
            <option value="default">Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Alphabetical (A–Z)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSaleProducts.map((product) => {
            const discountedPrice = calculateDiscountedPrice(product.price, product.discountPercentage);

            return (
              <article key={product.id} className="border border-slate-100 rounded-lg p-4 bg-white shadow-sm">
                <img
                  src={`${product.image}?v=${imageVersion}`}
                  alt={product.title}
                  className="h-40 w-full object-contain mb-3 bg-slate-50 rounded"
                />
                <h3 className="font-semibold text-slate-200 text-sm mb-1">{product.title}</h3>
                <p className="text-xs text-slate-200 mb-2">{product.category}</p>
                <p className="text-lg font-medium text-slate-200 line-through">
                  ${Number(product.price || 0).toFixed(2)}
                </p>
                <p className="text-base font-semibold text-rose-200 mb-1">
                  ${discountedPrice.toFixed(2)}
                </p>
                <p className="text-xs text-rose-100 mb-3">
                  Discount: {product.discountPercentage}% OFF
                </p>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-indigo-700 text-white py-2 rounded text-sm hover:bg-indigo-800 transition-colors"
                >
                  Add Discount Item To Cart
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Sales;
