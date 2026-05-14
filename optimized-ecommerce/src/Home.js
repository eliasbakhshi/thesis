import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from './AppContext';
import ProductCard from './components/ProductCard';

function Home() {
  const {
    appState,
    setSearchQuery,
    addToCart,
    loadMoreProducts,
    resetAndFetchProducts
  } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');
  const [localSearchQuery, setLocalSearchQuery] = useState(appState.searchQuery || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(appState.searchQuery || '');
  const sentinelRef = useRef(null);
  const didInitFiltersRef = useRef(false);

  const categories = [
    { label: 'All', value: 'All' },
    { label: "Men's Clothing", value: "men's clothing" },
    { label: "Women's Clothing", value: "women's clothing" },
    { label: 'Jewelery', value: 'jewelery' },
    { label: 'Electronics', value: 'electronics' }
  ];

  useEffect(() => {
    if (!didInitFiltersRef.current) {
      didInitFiltersRef.current = true;
      return;
    }

    resetAndFetchProducts({
      q: debouncedSearchQuery,
      category: selectedCategory,
      sort: sortOption
    });
  }, [debouncedSearchQuery, selectedCategory, sortOption, resetAndFetchProducts]);

  useEffect(() => {
    if (!sentinelRef.current) {
      return;
    }

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry?.isIntersecting) {
          return;
        }

        if (appState.productsLoading || !appState.productsHasMore) {
          return;
        }

        loadMoreProducts({
          q: debouncedSearchQuery,
          category: selectedCategory,
          sort: sortOption
        });
      },
      {
        root: null,
        rootMargin: '80px 0px',
        threshold: 0
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [
    appState.productsLoading,
    appState.productsHasMore,
    debouncedSearchQuery,
    selectedCategory,
    sortOption,
    loadMoreProducts
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(localSearchQuery);
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [localSearchQuery, setSearchQuery]);

  const showInitialLoading = appState.productsLoading && appState.products.length === 0;
  const showNextPageLoading = appState.productsLoading && appState.products.length > 0;
  const showError = !appState.productsLoading && !!appState.productsError && appState.products.length === 0;
  const showNoMore = !appState.productsLoading && appState.products.length > 0 && !appState.productsHasMore;

  return (
    <section className="bg-white min-h-screen text-slate-950">
      <div
        className="h-[320px] relative border-b border-slate-300 overflow-hidden"
        style={{
          backgroundImage: "url('/ecommerce/images/banner-1500.jpg')"
        }}
      >
        <img
          src="/ecommerce/images/banner-1500.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          width={1500}
          height={422}
          fetchPriority="high"
          loading="eager"
          decoding="async"
        />
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
                type="search"
                value={localSearchQuery}
                onChange={(event) => setLocalSearchQuery(event.target.value)}
                placeholder="Type to search products..."
                className="w-full sm:w-[300px] mt-2 sm:mt-0 mr-0 sm:mr-4 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="relative min-w-[220px]">
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                className="w-full appearance-none border border-slate-300 bg-white text-slate-900 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                aria-label="Sort products"
              >
                <option value="default">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Alphabetical (A–Z)</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                ▼
              </span>
            </div>
          </div>
        </div>
        {showInitialLoading ? (
          <div className="rounded-xl border border-slate-300 bg-white p-8 text-center text-slate-700 shadow-sm">
            Loading...
          </div>
        ) : showError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-8 text-center text-red-700 shadow-sm">
            {appState.productsError}
          </div>
        ) : (
           <>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
               {appState.products.map((product) => (
                 <ProductCard
                   key={product.id}
                   product={product}
                   onAddToCart={addToCart}
                 />
               ))}
             </div>
             <div ref={sentinelRef} className="h-10" />
             {showNextPageLoading && (
               <div className="flex justify-center py-4">
                 <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-blue-600 animate-spin" />
               </div>
             )}
             {showNoMore && (
               <p className="text-center text-sm text-slate-500 py-4">
                 No more products.
               </p>
             )}
           </>
         )}
      </div>
    </section>
  );
}

export default Home;
