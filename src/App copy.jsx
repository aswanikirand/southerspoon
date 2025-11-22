import React, { useState, useMemo, useEffect } from "react";

// Southern Spoon - Updated App.jsx (responsive + mobile fixes + background color)
// Logo file path: put your logo image into public/ as /logo-primary.png and fallback /logo-fallback.png
const PRIMARY_LOGO = '/southernspoon.png';
const FALLBACK_LOGO = '/southernspoon.png';

const MENU_ITEMS = [
  { id: "pappu", name: "Tomato Pappu/Dal (200g)", price: 50 },
  { id: "fry", name: "Aloo Fry (250g)", price: 60 }
];

export default function SouthernSpoonApp() {
  const [items, setItems] = useState(MENU_ITEMS.map(i => ({ ...i, qty: 0 })));
  const [meal, setMeal] = useState("Lunch");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);

  // Delivery surcharge rules
  const LUNCH_CUTOFF_HOUR = 12; // 12:00 (noon)
  const DINNER_CUTOFF_HOUR = 19; // 19:00 (7pm)
  const SURCHARGE = 50;

  useEffect(() => {
    // ensure mobile viewport friendly background if JS needs to set it
    document.body.style.backgroundColor = '#fff7e6'; // brand light yellow
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  function changeQty(id, delta) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it));
  }

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);

  function getNowInLocal() {
    // Use user's local time (browser time). The app is intended for India (Asia/Kolkata)
    return new Date();
  }

  function needsSurcharge(selectedMeal) {
    const now = getNowInLocal();
    const hour = now.getHours();
    if (selectedMeal === "Lunch") {
      return hour >= LUNCH_CUTOFF_HOUR; // if hour >= 12 then surcharge applies
    }
    if (selectedMeal === "Dinner") {
      return hour >= DINNER_CUTOFF_HOUR; // if hour >= 19 then surcharge applies
    }
    return false;
  }

  const surchargeApplies = needsSurcharge(meal);
  const deliveryCharge = surchargeApplies ? SURCHARGE : 0;
  const tax = Math.round((subtotal + deliveryCharge) * 0.05); // small GST estimate (5%)
  const total = subtotal + deliveryCharge + tax;

  function placeOrder(e) {
    e.preventDefault();
    // Validation: at least one item
    if (subtotal <= 0) {
      alert("Please add at least one item to your order.");
      return;
    }
    if (!name || !phone || !address) {
      alert("Please fill name, phone and delivery address.");
      return;
    }

    const now = getNowInLocal();
    const itemsOrdered = items.filter(i => i.qty > 0).map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }));

    const order = {
      id: `SS-${now.getTime()}`,
      name,
      phone,
      address,
      meal,
      items: itemsOrdered,
      subtotal,
      deliveryCharge,
      tax,
      total,
      note,
      placedAt: now.toString(),
      noteForKitchen: `SurchargeApplied:${surchargeApplies}`
    };

    setOrderPlaced(order);
    setItems(MENU_ITEMS.map(i => ({ ...i, qty: 0 })));
  }

  return (
    <div className="min-h-screen text-gray-900 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">

          {/* Header - responsive stack on small screens */}
          <header className="flex flex-col sm:flex-row items-center gap-3 p-4 sm:p-6"
                  style={{ background: 'linear-gradient(90deg,#f6d365,#fda085)' }}>
            <img
              src={PRIMARY_LOGO}
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_LOGO; }}
              alt="Southern Spoon"
              className="w-20 h-20 sm:w-28 sm:h-28 object-contain rounded-md shadow-sm"
            />

            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">Southern Spoon</h1>
              <p className="text-sm uppercase tracking-wider">Taste of the South</p>
              <p className="text-xs text-gray-700 mt-1">Order for <span className="font-semibold">today</span> only — no pre-orders.</p>
            </div>
          </header>

          {/* Main */}
          <main className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left: Menu + summary */}
            <section className="md:col-span-2">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Meal:</label>
                  <select value={meal} onChange={e => setMeal(e.target.value)} className="border rounded px-2 py-1">
                    <option>Lunch</option>
                    <option>Dinner</option>
                  </select>
                  <span className="ml-3 text-xs text-gray-600">Cutoff: Lunch by 12:00, Dinner by 19:00</span>
                </div>

                <div className="text-sm text-right">
                  <div>Delivery surcharge: <span className="font-semibold">₹{SURCHARGE}</span> after cutoff</div>
                  <div className="text-xs text-gray-600">Current surcharge: <span className="font-bold">{surchargeApplies ? 'Applied' : 'Not applied'}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => (
                  <div key={item.id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">₹{item.price}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        className="px-3 py-2 bg-gray-200 rounded text-lg touch-manipulation"
                        aria-label={`decrease ${item.name}`}>
                        -
                      </button>

                      <div className="w-10 text-center text-lg">{item.qty}</div>

                      <button
                        onClick={() => changeQty(item.id, 1)}
                        className="px-2 py-1 text-green-600 font-bold text-xl"
                        aria-label={`increase ${item.name}`}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border rounded text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between"><span>Delivery Charge</span><span>₹{deliveryCharge}</span></div>
                <div className="flex justify-between"><span>Estimated Tax (5%)</span><span>₹{tax}</span></div>
                <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>₹{total}</span></div>
                <p className="text-xs text-gray-600 mt-2">Note: Orders are accepted for <strong>today only</strong>. No pre-orders or future dates.</p>
              </div>

            </section>

            {/* Right: Checkout form */}
            <aside className="md:col-span-1 border rounded p-3">
              <form onSubmit={placeOrder} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Mobile number" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Delivery Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded px-2 py-1" rows={3} placeholder="Flat / Block / Landmark" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Note (optional)</label>
                  <input value={note} onChange={e => setNote(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="E.g. No onion, leave at gate" />
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-semibold">Place Order for Today</button>
                </div>

                <div className="text-xs text-gray-600">
                  <p><strong>Important:</strong> To avoid extra delivery charge for Lunch order, place order by <strong>12:00 PM</strong>. For Dinner, place order by <strong>7:00 PM</strong>. Orders placed after these times will incur an automatic ₹50 surcharge added to delivery charge.</p>
                </div>
              </form>

              {orderPlaced && (
                <div className="mt-4 bg-green-50 border-green-200 p-3 rounded">
                  <h3 className="font-semibold">Order Placed</h3>
                  <p className="text-sm">Thank you {orderPlaced.name}. Your order id is <strong>{orderPlaced.id}</strong>.</p>
                  <pre className="text-xs mt-2 bg-white p-2 rounded text-gray-700">{JSON.stringify(orderPlaced, null, 2)}</pre>
                </div>
              )}
            </aside>

          </main>

          <footer className="p-4 text-center text-xs text-gray-600">Southern Spoon • Taste of the South • Orders accepted for today only • Powered by Pandhu</footer>
        </div>
      </div>
    </div>
  );
}
