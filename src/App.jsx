import React, { useState, useMemo, useEffect } from "react";

// Southern Spoon - Mobile-first App.jsx with order persistence and duplicate-check
// Place your logo files into public/ as /logo-primary.png and /logo-fallback.png
const PRIMARY_LOGO = '/logo-primary.png';
const FALLBACK_LOGO = '/logo-fallback.png';

const MENU_ITEMS = [
  { id: "pappu", name: "Tomato Pappu/Dal (200g)", price: 50 },
  { id: "fry", name: "Aloo Fry (250g)", price: 60 }
];

export default function SouthernSpoonApp(){
  const [items, setItems] = useState(MENU_ITEMS.map(i => ({ ...i, qty: 0 })));
  const [meal, setMeal] = useState("Lunch");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const LUNCH_CUTOFF_HOUR = 12;
  const DINNER_CUTOFF_HOUR = 19;
  const SURCHARGE = 50;

  useEffect(() => {
    // inject mobile-friendly font + small styles
    if(!document.getElementById('ss-googlefont')){
      const link = document.createElement('link');
      link.id = 'ss-googlefont';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }
    if(!document.getElementById('ss-inline-style')){
      const style = document.createElement('style');
      style.id = 'ss-inline-style';
      style.innerHTML = `
        body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background: #fff7e6; }
        .ss-card { background: #fff; border-radius: 10px; box-shadow: 0 6px 18px rgba(15,23,42,0.06); }
        .ss-sticky { position: sticky; bottom: 0; z-index: 60; }
        .ss-touch { min-height:44px; min-width:50px; }
        .ss-anim { transition: transform 140ms cubic-bezier(.2,.8,.2,1), box-shadow 140ms cubic-bezier(.2,.8,.2,1); }
        .ss-anim:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(15,23,42,0.12); }
        .ss-anim:active { transform: translateY(0) scale(0.98); box-shadow: 0 4px 8px rgba(15,23,42,0.08); }
        @keyframes ss-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
        .ss-pulse { animation: ss-pulse 1600ms ease-in-out infinite; }
        .ss-ripple-target { position: relative; overflow: hidden; }
        .ss-ripple { position: absolute; border-radius: 50%; transform: scale(0); opacity: 0.25; background: rgba(255,255,255,0.6); animation: ss-ripple-effect 600ms ease-out; }
        @keyframes ss-ripple-effect { to { transform: scale(4); opacity: 0; } }
        .ss-banner { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 80; }
      `;
      document.head.appendChild(style);
    }

    // ripple helper
    function handlePointerDown(e){
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ss-ripple';
      const size = Math.max(rect.width, rect.height) * 1.2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      el.appendChild(ripple);
      setTimeout(()=> ripple.remove(), 600);
    }

    const rippleTargets = document.querySelectorAll('[data-ripple]');
    rippleTargets.forEach(t => t.addEventListener('pointerdown', handlePointerDown));
    return () => rippleTargets.forEach(t => t.removeEventListener('pointerdown', handlePointerDown));
  }, []);

  // localStorage helpers
  function saveOrderToStorage(order){
    try{ localStorage.setItem(`ss_order_${order.phone}`, JSON.stringify(order)); }catch(e){ console.warn('Could not save order to localStorage', e); }
  }
  function getOrderFromStorage(phoneNumber){
    try{ const raw = localStorage.getItem(`ss_order_${phoneNumber}`); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }

  function changeQty(id, delta){
    setItems(prev => prev.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it));
  }

  const subtotal = useMemo(()=> items.reduce((s,it)=> s + it.price * it.qty, 0), [items]);

  function getNowInLocal(){ return new Date(); }
  function needsSurcharge(selectedMeal){
    const now = getNowInLocal();
    const hour = now.getHours();
    if(selectedMeal === 'Lunch') return hour >= LUNCH_CUTOFF_HOUR;
    if(selectedMeal === 'Dinner') return hour >= DINNER_CUTOFF_HOUR;
    return false;
  }

  const surchargeApplies = needsSurcharge(meal);
  const deliveryCharge = surchargeApplies ? SURCHARGE : 0;
  const tax = Math.round((subtotal + deliveryCharge) * 0.05);
  const total = subtotal + deliveryCharge + tax;

  // finalizer: commit the order (force = true to overwrite)
  function finalizeOrder(order, force=false){
    const prev = getOrderFromStorage(order.phone);
    if(prev && !force){
      setExistingOrder(prev);
      setDuplicateWarning(true);
      return false;
    }
    saveOrderToStorage(order);
    setOrderPlaced(order);
    setSuccessMsg(`Order placed — ${order.id}`);
    // clear form qtys
    setItems(MENU_ITEMS.map(i=>({ ...i, qty: 0 })));
    // auto clear message after 5s
    setTimeout(()=> setSuccessMsg(''), 5000);
    setDuplicateWarning(false);
    setExistingOrder(null);
    return true;
  }

  function placeOrder(e){
    e.preventDefault();
    if(subtotal <= 0){ alert('Please add at least one item.'); return; }
    if(!name || !phone || !address){ alert('Please fill name, phone and address.'); return; }

    const now = getNowInLocal();
    const itemsOrdered = items.filter(i=>i.qty>0).map(i=>({ id:i.id, name:i.name, qty:i.qty, price:i.price }));
    const order = { id:`SS-${now.getTime()}`, name, phone, address, meal, items: itemsOrdered, subtotal, deliveryCharge, tax, total, note, placedAt: now.toString() };

    // finalize (will warn if duplicate exists)
    finalizeOrder(order, false);
  }

  // helper to override previous order and save new one
  function placeOrderOverride(){
    if(!name || !phone || !address){ alert('Please fill name, phone and address.'); return; }
    const now = getNowInLocal();
    const itemsOrdered = items.filter(i=>i.qty>0).map(i=>({ id:i.id, name:i.name, qty:i.qty, price:i.price }));
    const order = { id:`SS-${now.getTime()}`, name, phone, address, meal, items: itemsOrdered, subtotal, deliveryCharge, tax, total, note, placedAt: now.toString() };
    finalizeOrder(order, true);
  }

  // helper to load existing order when entering phone
  function onPhoneBlur(){
    if(!phone) return;
    const prev = getOrderFromStorage(phone);
    setExistingOrder(prev);
  }

  return (
    <div className="min-h-screen text-gray-900">
      {/* success banner */}
      {successMsg && (
        <div className="ss-banner">
          <div className="px-4 py-2 ss-card">{successMsg}</div>
        </div>
      )}

      <div className="max-w-xl mx-auto p-4">

        {/* Header */}
        <header className="flex items-center gap-3 py-3 px-2">
          <img src={PRIMARY_LOGO} onError={(e)=>{ e.target.onerror=null; e.target.src=FALLBACK_LOGO; }} alt="Southern Spoon" className="w-16 h-16 rounded-md object-contain shadow" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Southern Spoon</h1>
              <div className="text-xs text-gray-600">{orderPlaced ? 'Order Placed' : 'Taste of the South'}</div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Order for <span className="font-semibold">today</span> only • No pre-orders</p>
          </div>
        </header>

        {/* Meal Selector */}
        <div className="mt-3 mb-2 px-2">
          <label className="text-sm font-medium">Meal</label>
          <div className="flex items-center gap-3 mt-2">
            <select value={meal} onChange={e=>setMeal(e.target.value)} className="flex-1 border rounded px-3 py-2">
              <option>Lunch</option>
              <option>Dinner</option>
            </select>
            <div className="text-xs text-gray-600">Cutoff: Lunch 12:00 • Dinner 19:00</div>
          </div>
        </div>

        {/* Menu list */}
        <section className="space-y-3 px-1 mt-2">
          {items.map(item => (
            <article key={item.id} className="ss-card p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-gray-600 mt-1">₹{item.price}</div>
              </div>

              <div className="flex items-center gap-2">
                <button data-ripple onClick={()=>changeQty(item.id, -1)} aria-label={`decrease ${item.name}`} className="ss-touch px-3 py-2 rounded bg-gray-100 text-gray-700 ss-anim">-</button>
                <div className="text-lg w-10 text-center">{item.qty}</div>
                <button data-ripple onClick={()=>changeQty(item.id, 1)} aria-label={`increase ${item.name}`} className="ss-touch px-3 py-2 rounded bg-green-600 text-white ss-anim">+</button>
              </div>
            </article>
          ))}
        </section>

        {/* Summary block */}
        <div className="mt-4 px-1">
          <div className="p-3 ss-card border">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-sm"><span>Delivery Charge</span><span>₹{deliveryCharge}</span></div>
            <div className="flex justify-between text-sm"><span>Tax (5%)</span><span>₹{tax}</span></div>
            <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>₹{total}</span></div>
            <p className="text-xs text-gray-600 mt-2">Orders are for <strong>today</strong> only. No pre-orders.</p>
          </div>
        </div>

        {/* Checkout form */}
        <form onSubmit={placeOrder} className="mt-4 space-y-3 px-1">
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Name" />
          <input value={phone} onChange={e=>setPhone(e.target.value)} onBlur={onPhoneBlur} className="w-full border rounded px-3 py-2" placeholder="Phone" />
          <textarea value={address} onChange={e=>setAddress(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} placeholder="Flat / Block / Landmark" />
          <input value={note} onChange={e=>setNote(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Note (optional)" />

          {/* duplicate warning UI */}
          {duplicateWarning && existingOrder && (
            <div className="p-3 ss-card border">
              <div className="font-semibold text-sm text-red-600">You have already placed an order with this phone number.</div>
              <div className="text-xs text-gray-700 mt-2">Previous order:</div>
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded">{JSON.stringify(existingOrder, null, 2)}</pre>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={()=>placeOrderOverride()} className="flex-1 bg-green-600 text-white py-2 rounded ss-anim" data-ripple>Place New Order (override)</button>
                <button type="button" onClick={()=>{ setDuplicateWarning(false); setExistingOrder(null); }} className="flex-1 border py-2 rounded ss-anim">Cancel</button>
              </div>
            </div>
          )}

          <button data-ripple type="submit" className={`w-full bg-green-600 text-white py-3 rounded font-semibold ss-anim ${total>0 ? 'ss-pulse' : ''}`}>Place Order for Today</button>
        </form>

        {/* show previous order summary if phone matches but not currently warning */}
        {existingOrder && !duplicateWarning && (
          <div className="mt-4 p-3 ss-card border">
            <div className="font-semibold">Recent order found for this phone</div>
            <div className="text-xs text-gray-700 mt-1">Order ID: <strong>{existingOrder.id}</strong></div>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">{JSON.stringify(existingOrder, null, 2)}</pre>
          </div>
        )}

        {/* success confirmation */}
        {orderPlaced && (
          <div className="mt-4 p-3 ss-card border">
            <div className="font-semibold">Order Confirmed</div>
            <div className="text-sm text-gray-700 mt-1">Thank you {orderPlaced.name}. Order id: <strong>{orderPlaced.id}</strong></div>
          </div>
        )}

      </div>

      {/* Sticky bottom bar for quick checkout on mobile */}
      <div className="ss-sticky sm:hidden">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex items-center justify-between ss-card p-3">
            <div>
              <div className="text-sm">Total</div>
              <div className="font-semibold text-lg">₹{total}</div>
            </div>
            <div className="w-2/5">
              <button data-ripple onClick={(e)=>{ e.preventDefault(); document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full bg-orange-500 text-white py-3 rounded font-semibold ss-anim ${total>0 ? 'ss-pulse' : ''}`}>Checkout</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
