import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppContext } from './AppContext';
import { formatErrorLine } from './errorLine';

function ProductDetails() {
  const { productId } = useParams();
  const { appState, addToCart, addProductComment } = useContext(AppContext);

  const product = appState.products.find((entry) => Number(entry.id) === Number(productId));

  const hasDiscount = Number(product?.discountPercentage) > 0;
  const basePrice = Number(product?.price) || 0;
  const discountedPrice = hasDiscount
    ? Number(
        Math.max(0.01, Math.min(basePrice - 0.01, basePrice - basePrice * (product.discountPercentage / 100))).toFixed(2)
      )
    : null;

  const isLoggedIn = appState.userAuthStatus.isAuthenticated;
  const loggedInEmail = appState.userAuthStatus.userEmail || '';
  const loggedInUser = isLoggedIn
    ? appState.users.find((user) => user.email.toLowerCase() === loggedInEmail.toLowerCase())
    : null;

  const loggedInName = loggedInUser?.name || loggedInEmail.split('@')[0] || 'User';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');

  if (!product) {
    return (
      <section className="p-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-300 mb-2">Product not found</h2>
          <Link className="text-sm text-slate-300 underline" to="/">Go back to products</Link>
        </div>
      </section>
    );
  }

  const comments = Array.isArray(product.comments) ? product.comments : [];

  const resetForm = () => {
    setMessage('');
    setStatusText('');

    if (!isLoggedIn) {
      setName('');
      setEmail('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedMessage) {
      setStatusText('Message is required.');
      return;
    }

    if (!isLoggedIn && (!trimmedName || !trimmedEmail)) {
      setStatusText('Name and email are required for guests.');
      return;
    }

    try {
      await addProductComment({
        productId: product.id,
        message: trimmedMessage,
        name: isLoggedIn ? '' : trimmedName,
        email: isLoggedIn ? '' : trimmedEmail,
        loggedInName: isLoggedIn ? loggedInName : '',
        loggedInEmail: isLoggedIn ? loggedInEmail : ''
      });

      resetForm();
      setStatusText('Comment posted successfully.');
    } catch (error) {
      setStatusText(formatErrorLine(error));
    }
  };

  return (
    <section className="p-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <img src={product.image} alt={product.title} className="w-full h-[380px] object-contain" />
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-slate-300 mb-2">{product.title}</h2>
            <p className="text-sm text-slate-300 mb-4">Category: {product.category}</p>
            <p className="text-slate-300 mb-4">{product.description}</p>

            {hasDiscount ? (
              <div className="mb-5">
                <p className="text-2xl font-bold text-slate-300 line-through">${basePrice}</p>
                <p className="text-lg font-semibold text-red-300">${discountedPrice}</p>
                <p className="text-sm text-red-300">{product.discountPercentage}% OFF</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-slate-300 mb-5">${basePrice}</p>
            )}

            <button
              onClick={() => addToCart(product)}
              className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white rounded"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-2xl font-semibold text-slate-300 mb-4">Comments & Reviews</h3>

        {comments.length === 0 ? (
          <p className="text-sm text-slate-300 mb-6">No comments yet for this product.</p>
        ) : (
          <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto">
            {comments
              .slice()
              .reverse()
              .map((comment) => (
                <article key={comment.id} className="border border-slate-200 rounded p-3 bg-slate-50">
                  <div className="flex justify-between gap-3 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-slate-300">{comment.name}</p>
                    <p className="text-xs text-slate-300">{comment.email}</p>
                  </div>
                  <p className="text-sm text-slate-300">{comment.message}</p>
                </article>
              ))}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          {isLoggedIn ? (
            <div className="border border-slate-200 rounded px-3 py-2 bg-slate-50">
              <p className="text-xs text-slate-300">Logged in as: {loggedInName}</p>
              <p className="text-xs text-slate-300">Email: {loggedInEmail}</p>
            </div>
          ) : (
            <>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Name"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Email"
              />
            </>
          )}

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 min-h-[140px]"
            placeholder="Write your comment or review"
          />

          <button type="submit" className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white rounded">
            Post Comment
          </button>

          {statusText && <p className="text-xs text-slate-300">{statusText}</p>}
        </form>
      </div>
    </section>
  );
}

export default ProductDetails;
