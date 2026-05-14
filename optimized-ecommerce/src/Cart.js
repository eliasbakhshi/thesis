import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './AppContext';

function Cart() {
  const { appState, updateCartItemQuantity } = useContext(AppContext);
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

  const cartItemsWithQuantity = Object.values(
    appState.shoppingCart.reduce((accumulator, item) => {
      const itemId = String(item.id);

      if (!accumulator[itemId]) {
        accumulator[itemId] = {
          ...item,
          quantity: 1
        };
      } else {
        accumulator[itemId].quantity += 1;
      }

      return accumulator;
    }, {})
  );

  const totalAmount = appState.shoppingCart
    .reduce((sum, item) => sum + getEffectiveItemPrice(item), 0)
    .toFixed(2);

  return (
    <section className="p-8">
      <h2 className="text-3xl font-semibold text-slate-900 mb-6">Cart</h2>

      {appState.shoppingCart.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6">Your cart is empty.</div>
      ) : (
        <div className="space-y-3">
          {cartItemsWithQuantity.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <img src={item.image} alt={item.title} className="h-16 w-16 object-contain" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">Qty: {item.quantity}</p>
                {Number(item.discountPercentage) > 0 ? (
                  <div className="mt-1">
                    <p className="text-sm text-slate-900 font-semibold">
                      <span className="line-through mr-2">${Number(item.price) || 0}</span>
                      <span className="text-red-700">${getEffectiveItemPrice(item)}</span>
                      <span className="ml-2 text-red-700">({item.discountPercentage}% OFF)</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">${item.price}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor={`qty-${item.id}`} className="text-xs font-medium text-slate-700">
                  Qty
                </label>
                <select
                  id={`qty-${item.id}`}
                  value={Math.min(item.quantity, 20)}
                  onChange={(event) => updateCartItemQuantity(item.id, Number(event.target.value))}
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-900"
                >
                  {Array.from({ length: 21 }, (_, value) => (
                    <option key={value} value={value}>
                      {value === 0 ? '0 (Remove)' : value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6 bg-white border border-slate-200 rounded-lg p-4 text-right text-xl font-bold text-slate-800 ">
        <span className='text-left'>Total: ${total}</span>
        {totalAmount > 0 ? (
          <button
            onClick={() => navigate('/checkout')}
            className="px-4 py-2 text-sm bg-slate-900 text-white rounded"
          >
            Checkout
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default Cart;
