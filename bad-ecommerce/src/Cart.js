import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './AppContext';

function Cart() {
  const { appState, removeFromCart } = useContext(AppContext);
  const navigate = useNavigate();

  const getEffectiveItemPrice = (item) => {
    const basePrice = Number(item?.price) || 0;
    const discountPercentage = Number(item?.discountPercentage) || 0;

    if (discountPercentage <= 0) {
      return basePrice;
    }

    return Number(
      Math.max(0.01, Math.min(basePrice - 0.01, basePrice - basePrice * (discountPercentage / 100))).toFixed(2)
    );
  };

  const total = appState.shoppingCart
    .reduce((sum, item) => sum + getEffectiveItemPrice(item), 0)
    .toFixed(2);

  return (
    <section className="p-8">
      <h2 className="text-3xl font-semibold text-slate-300 mb-6">Cart</h2>

      {appState.shoppingCart.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6">Your cart is empty.</div>
      ) : (
        <div className="space-y-3">
          {appState.shoppingCart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <img src={item.image} alt={item.title} className="h-16 w-16 object-contain" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                {Number(item.discountPercentage) > 0 ? (
                  <div>
                    <p className="text-sm text-slate-900 line-through font-semibold">${Number(item.price) || 0}</p>
                    <p className="text-xs text-red-700 font-semibold">${getEffectiveItemPrice(item)}</p>
                    <p className="text-xs text-red-700">{item.discountPercentage}% OFF</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">${item.price}</p>
                )}
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6 bg-white border border-slate-200 rounded-lg p-4 text-right text-xl font-bold text-slate-800 ">
        <span className='text-left'>Total: ${total}</span>
        <button
          onClick={() => navigate('/checkout')}
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded"
        >
          Checkout
        </button>
      </div>
    </section>
  );
}

export default Cart;
