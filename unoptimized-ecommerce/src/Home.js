import { useContext, useState } from 'react';
import { AppContext } from './AppContext';
import { Link } from 'react-router-dom';
import { getDisplayPrice, sortProducts } from './utils/productSorting';

function ProductCard({ product, onAddToCart, imageVersion }) {
  const hasDiscount = Number(product.discountPercentage) > 0;
  const basePrice = Number(product.price) || 0;
  const discountedPrice = hasDiscount ? getDisplayPrice(product) : null;

  return (
    <article className="bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <img
        src={`${product.image}?v=${imageVersion}`}
        alt={product.title}
        className="h-52 w-full object-contain p-4 bg-slate-50"
      />
      <div className="px-4 pb-4 flex flex-col grow">
        <h3 className="text-lg font-semibold text-slate-500 truncate">{product.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">{product.description}</p>
        {hasDiscount ? (
          <div className="mt-3 mb-4">
            <p className="text-lg font-medium text-slate-500 line-through">${basePrice.toFixed(2)}</p>
            <p className="text-xl font-bold text-red-500">${discountedPrice.toFixed(2)}</p>
            <p className="text-xs font-semibold tracking-wide text-red-500">
              {product.discountPercentage}% OFF
            </p>
          </div>
        ) : (
          <p className="text-xl font-bold text-slate-500 mt-3 mb-4">${basePrice.toFixed(2)}</p>
        )}

        <div className="mt-auto flex gap-2">
          <Link
            to={`/product/${product.id}`}
            className="flex-1 px-3 py-2 text-xs font-medium bg-white text-slate-300 text-center"
          >
            View
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 px-3 py-2 text-xs font-medium bg-indigo-300 text-white"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const { appState, setSearchQuery, addToCart } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');
  const imageVersion = Date.now();

  const categories = [
    { label: 'All', value: 'All' },
    { label: "Men's Clothing", value: "men's clothing" },
    { label: "Women's Clothing", value: "women's clothing" },
    { label: 'Jewelery', value: 'jewelery' },
    { label: 'Electronics', value: 'electronics' }
  ];

  const searchFiltered = appState.products.filter((product) =>
    product.title.toLowerCase().includes(appState.searchQuery.toLowerCase())
  );

  const filteredProducts =
    selectedCategory === 'All'
      ? searchFiltered
      : searchFiltered.filter(
          (product) => product.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  const sortedProducts = sortProducts(filteredProducts, sortOption);

  return (
    <section className="bg-slate-100 min-h-screen text-slate-950">
      <div
        className="h-[320px] bg-cover bg-center relative border-b border-slate-300"
        style={{
          backgroundImage: "url('/shop/images/banner.jpg')"
        }}
      >
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10 text-white">
          <h1 className="text-4xl md:text-5xl font-semibold mb-3 drop-shadow">
            New Season Arrivals
          </h1>
          <p className="text-base md:text-lg text-slate-100 max-w-2xl">
            Discover new products for your everyday shopping.
          </p>
        </div>
      </div>
      <div className="px-6 md:px-8 py-8">
        <h2 className="text-4xl text-center font-semibold text-slate-950 mb-8">
          Latest Products
        </h2>

        <div className="bg-white border border-slate-300 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={appState.searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                className="border border-slate-400 bg-white text-slate-950 placeholder:text-slate-500 rounded px-3 py-2 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />


              <div className="flex flex-wrap gap-2">
              {categories.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  className={`px-3 py-1.5 border rounded text-sm font-medium transition-colors ${
                    selectedCategory === value
                      ? 'border-indigo-700 bg-indigo-700 text-white'
                      : 'border-slate-400 bg-white text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            </div>
            <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                className="border border-slate-400 bg-white text-slate-950 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                aria-label="Sort products"
              >
                <option value="default">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Alphabetical (A–Z)</option>
              </select>
          </div>
        </div>
        {sortedProducts.length === 0 ? (
          <div className="rounded-xl border border-slate-300 bg-white p-8 text-center text-slate-700 shadow-sm">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                imageVersion={imageVersion}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Home;
