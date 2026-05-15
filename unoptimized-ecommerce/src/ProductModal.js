function ProductModal({ product, onClose }) {
  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full">
        <img src={product.image} alt="" className="w-full h-64 object-contain mb-4" />
        <h3 className="text-2xl font-semibold text-slate-800 mb-2">{product.title}</h3>
        <p className="text-slate-600 mb-2">{product.description}</p>
        <p className="text-lg text-slate-900 font-bold mb-4">${product.price}</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded"></button>
      </div>
    </div>
  );
}

export default ProductModal;
