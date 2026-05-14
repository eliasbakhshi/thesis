import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDisplayPrice } from '../utils/productSorting';

const splitImageSetByFormat = (imageSet = '') => {
  const urls = String(imageSet)
    .split(',')
    .map((chunk) => chunk.trim().split(/\s+/)[0])
    .filter(Boolean);

  return {
    avif: urls.find((url) => url.toLowerCase().endsWith('.avif')) || '',
    webp: urls.find((url) => url.toLowerCase().endsWith('.webp')) || '',
    jpg: urls.find((url) => /\.(jpe?g|png)$/i.test(url)) || ''
  };
};

const deriveThumbFormatsFromThumbnail = (thumbnail = '') => {
  if (!thumbnail) {
    return { avif: '', webp: '', jpg: '' };
  }

  const base = thumbnail.replace(/\.[^/.]+$/, '');
  return {
    avif: `${base}.avif`,
    webp: `${base}.webp`,
    jpg: thumbnail
  };
};

const getCardImageSources = (product) => {
  const fromImageSet = splitImageSetByFormat(product?.imageSet || '');
  const fromThumbnail = deriveThumbFormatsFromThumbnail(product?.thumbnail || '');

  return {
    avif: fromImageSet.avif || fromThumbnail.avif,
    webp: fromImageSet.webp || fromThumbnail.webp,
    jpg: fromImageSet.jpg || fromThumbnail.jpg || product?.thumbnail || product?.image || '',
    original: product?.image || ''
  };
};

const ProductCard = memo(function ProductCard({ product, onAddToCart }) {
  const hasDiscount = Number(product.discountPercentage) > 0;
  const basePrice = Number(product.price) || 0;
  const discountedPrice = hasDiscount ? getDisplayPrice(product) : null;

  const [useOriginalImage, setUseOriginalImage] = useState(false);
  const sources = useMemo(() => getCardImageSources(product), [product]);

  const imageSrc = useOriginalImage
    ? (sources.original || sources.jpg)
    : (sources.jpg || sources.original);

  const handleImageError = () => {
    if (!useOriginalImage && sources.original) {
      setUseOriginalImage(true);
    }
  };

  return (
    <article className="bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow">
      <div className="h-52 w-full bg-slate-50">
        <picture>
          {!useOriginalImage && sources.avif ? (
            <source srcSet={sources.avif} type="image/avif" />
          ) : null}
          {!useOriginalImage && sources.webp ? (
            <source srcSet={sources.webp} type="image/webp" />
          ) : null}
          <img
            src={imageSrc}
            alt={product.title}
            className="h-52 w-full object-cover"
            width={350}
            height={210}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </picture>
      </div>

      <div className="px-4 pb-4 flex flex-col grow">
        <h3 className="mt-4 text-lg font-semibold text-slate-900 truncate">{product.title}</h3>

        {hasDiscount ? (
          <div className="mt-3 mb-4">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-medium text-slate-700 line-through">
                ${basePrice.toFixed(2)}
              </p>
              <p className="text-xl font-bold text-red-600">
                ${discountedPrice.toFixed(2)}
              </p>
            </div>
            <p className="text-sm font-semibold tracking-wide text-red-600">
              {product.discountPercentage}% OFF
            </p>
          </div>
        ) : (
          <p className="text-xl font-bold text-slate-900 mt-3 mb-4">${basePrice.toFixed(2)}</p>
        )}

        <div className="mt-auto flex gap-1">
          <Link
            to={`/product/${product.id}`}
            className="flex-1 px-2 py-1.5 text-sm font-medium bg-slate-700 text-white text-center rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            View
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 px-2 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;
