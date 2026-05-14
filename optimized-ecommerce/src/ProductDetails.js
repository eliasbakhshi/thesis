import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppContext } from './AppContext';

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
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    message: ''
  });

  const validateName = (value) => {
    if (!(value || '').trim()) {
      return 'Name is required.';
    }
    return '';
  };

  const validateEmail = (value) => {
    const normalized = (value || '').trim().toLowerCase();
    if (!normalized) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validateMessage = (value) => {
    if (!(value || '').trim()) {
      return 'Message is required.';
    }
    return '';
  };

  const getFriendlyErrorMessage = (error) => {
    const statusCode = Number(error?.statusCode) || 0;
    const backendMessage = typeof error?.userMessage === 'string' ? error.userMessage.trim() : '';

    if (statusCode === 0) {
      return '0: Unable to reach the server. Please try again.';
    }
    if (backendMessage) {
      return `${statusCode}: ${backendMessage}`;
    }
    if (statusCode === 400) {
      return '400: Please enter valid comment details.';
    }
    if (statusCode === 404) {
      return '404: Product not found.';
    }
    return `${statusCode}: Failed to post comment. Please try again.`;
  };

  const handleAddToCart = () => {
    addToCart(product);
  };

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
    setSubmitted(false);
    setErrors({
      name: '',
      email: '',
      message: ''
    });

    if (!isLoggedIn) {
      setName('');
      setEmail('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = {
      name: isLoggedIn ? '' : validateName(name),
      email: isLoggedIn ? '' : validateEmail(email),
      message: validateMessage(message)
    };

    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email || nextErrors.message) {
      toast.error('400: Please fix the highlighted fields.');
      return;
    }

    try {
      await addProductComment({
        productId: product.id,
        message: message.trim(),
        name: isLoggedIn ? '' : name.trim(),
        email: isLoggedIn ? '' : email.trim().toLowerCase(),
        loggedInName: isLoggedIn ? loggedInName : '',
        loggedInEmail: isLoggedIn ? loggedInEmail : ''
      });

      resetForm();
      setSubmitted(false);
      toast.success('201: Comment posted successfully.');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  return (
    <section className="p-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <img src={product.image} alt={product.title} className="w-full aspect-square object-contain" />
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-slate-900 mb-2">{product.title}</h2>
            <p className="text-sm text-slate-700 mb-2">Category: {product.category}</p>
            <p className="text-sm font-semibold text-slate-900 mb-1">Description</p>
            <p className="text-slate-800 mb-4 leading-relaxed">{product.description}</p>

            {hasDiscount ? (
              <div className="mb-5 flex items-baseline gap-3 flex-wrap">
                <p className="text-2xl font-bold text-slate-500 line-through">${basePrice}</p>
                <p className="text-2xl font-bold text-red-700">${discountedPrice}</p>
                <p className="text-sm font-semibold text-red-700">{product.discountPercentage}% OFF</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-slate-900 mb-5">${basePrice}</p>
            )}

            <button
              onClick={handleAddToCart}
              className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white rounded"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-2xl font-semibold text-slate-900 mb-4">Comments & Reviews</h3>

        {comments.length === 0 ? (
          <p className="text-sm text-slate-700 mb-6">No comments yet for this product.</p>
        ) : (
          <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto">
            {comments
              .slice()
              .reverse()
              .map((comment) => (
                <article key={comment.id} className="border border-slate-200 rounded p-3 bg-slate-50">
                  <div className="flex justify-between gap-3 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-slate-900">{comment.name}</p>
                    <p className="text-xs text-slate-700">{comment.email}</p>
                  </div>
                  <p className="text-sm text-slate-800">{comment.message}</p>
                </article>
              ))}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          {isLoggedIn ? (
            <div className="border border-slate-200 rounded px-4 py-3 bg-slate-50">
              <p className="text-sm font-medium text-slate-700">Logged in as: {loggedInName}</p>
              <p className="text-sm text-slate-700">Email: {loggedInEmail}</p>
            </div>
          ) : (
            <>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900 placeholder:text-base placeholder:text-slate-500"
                placeholder="Name"
              />
              {submitted && errors.name ? (
                <p className="text-left text-xs text-red-700">{errors.name}</p>
              ) : null}
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900 placeholder:text-base placeholder:text-slate-500"
                placeholder="Email"
              />
              {submitted && errors.email ? (
                <p className="text-left text-xs text-red-700">{errors.email}</p>
              ) : null}
            </>
          )}

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 min-h-[140px] text-[17px] text-slate-900 placeholder:text-base placeholder:text-slate-500"
            placeholder="Write your comment or review"
          />
          {submitted && errors.message ? (
            <p className="text-left text-xs text-red-700">{errors.message}</p>
          ) : null}

          <button type="submit" className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white rounded">
            Post Comment
          </button>
        </form>
      </div>
    </section>
  );
}

export default ProductDetails;
