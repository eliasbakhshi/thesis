import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from './AppContext';
import ProductCard from './components/ProductCard';


function Sales() {
  const { appState, addToCart, resetAndFetchSales, loadMoreSales } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState(appState.salesQuery || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(appState.salesQuery || '');
  const [sortOption, setSortOption] = useState('default');
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const autoLoadLockedRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    resetAndFetchSales({
      q: debouncedSearchQuery,
      sort: sortOption
    });
  }, [debouncedSearchQuery, sortOption, resetAndFetchSales]);

  useEffect(() => {
    if (!appState.salesLoading) {
      autoLoadLockedRef.current = false;
    }
  }, [appState.salesLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return undefined;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        if (!appState.salesHasMore || appState.salesLoading) {
          return;
        }
        if (autoLoadLockedRef.current) {
          return;
        }

        autoLoadLockedRef.current = true;
        loadMoreSales({
          q: debouncedSearchQuery,
          sort: sortOption
        });
      },
      {
        rootMargin: '200px 0px'
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [appState.salesHasMore, appState.salesLoading, debouncedSearchQuery, loadMoreSales, sortOption]);

  const showInitialLoading = appState.salesLoading && appState.salesProducts.length === 0;
  const showNextPageLoading = appState.salesLoading && appState.salesProducts.length > 0;
  const showError = !appState.salesLoading && !!appState.salesError;
  const showEmpty = !appState.salesLoading && !appState.salesError && appState.salesProducts.length === 0;
  const showNoMore = !appState.salesLoading && appState.salesProducts.length > 0 && !appState.salesHasMore;
  const skeletonCards = Array.from({ length: 6 });

  return (
    <section className="p-8">
      <>
        <h2 className="text-3xl font-semibold text-slate-900 mb-4 text-center">Sales</h2>
        <p className="text-sm text-slate-700 mb-6 text-center">
          Discounted products: {appState.salesTotal || appState.salesProducts.length}
        </p>

        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <label htmlFor="sales-search" className="sr-only">
            Search discounted items
          </label>
          <input
            id="sales-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search discounted items..."
            className="w-full border border-slate-300 rounded px-4 py-3 text-base text-slate-900 placeholder:text-slate-500"
          />

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            className="border border-slate-400 bg-white text-slate-950 rounded px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600"
            aria-label="Sort sale products"
          >
            <option value="default">Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Alphabetical (A–Z)</option>
          </select>
        </div>

        {showInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skeletonCards.map((_, index) => (
              <div
                key={`sales-skeleton-${index}`}
                className="border border-slate-100 rounded-lg p-4 bg-white shadow-sm animate-pulse"
              >
                <div className="h-40 w-full bg-slate-100 rounded mb-3" />
                <div className="h-3 w-3/4 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-100 rounded mb-3" />
                <div className="h-4 w-1/2 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-2/3 bg-slate-100 rounded mb-3" />
                <div className="h-9 w-full bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : showError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {appState.salesError}
          </div>
        ) : showEmpty ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
            No discounted products match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {appState.salesProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
        {showNextPageLoading && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-indigo-600 animate-spin" />
          </div>
        )}
        {showNoMore ? (
          <p className="text-center text-xs text-slate-500 py-4">
            No more sale products.
          </p>
        ) : appState.salesHasMore && !appState.salesLoading ? (
          <div className="flex justify-center py-4">
            <button
              onClick={() => loadMoreSales({ q: debouncedSearchQuery, sort: sortOption })}
              className="px-4 py-2 text-sm font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Load more
            </button>
          </div>
        ) : null}
        <div ref={sentinelRef} className="h-px" />
      </>
    </section>
  );
}

export default Sales;
