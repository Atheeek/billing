import { useState } from 'react';

const CreateInvoice = () => {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [items, setItems] = useState([{ type: '', itemName: '', weight: '', rate: '', clarity: '', ct: '', color: '', amount: 0 }]);
  const [successMessage, setSuccessMessage] = useState('');
  const GST_RATE = 5;

  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'weight' || field === 'rate') {
      const weight = parseFloat(newItems[index].weight) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = (weight * rate).toFixed(2);
    }

    setItems(newItems);
  };

  const addNewItem = () => {
    setItems([...items, { type: '', itemName: '', weight: '', rate: '', clarity: '', ct: '', color: '', amount: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const calculateGST = (subtotal) => (subtotal * GST_RATE) / 100;
  const calculateTotal = (subtotal, gst) => subtotal + gst;

  const subtotal = calculateSubtotal();
  const gstAmount = calculateGST(subtotal);
  const grandTotal = calculateTotal(subtotal, gstAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invoiceData = {
      customer,
      items: items.map(item => ({
        type: item.type,
        itemName: item.itemName,
        weight: parseFloat(item.weight) || 0,
        rate: parseFloat(item.rate) || 0,
        clarity: item.clarity,
        ct: parseFloat(item.ct) || 0,
        color: item.color,
        amount: parseFloat(item.amount) || 0
      })),
      subtotal,
      gstAmount,
      grandTotal,
      date: new Date().toISOString()
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`Invoice created successfully!`);
        setCustomer({ name: '', phone: '', address: '' });
        setItems([{ type: '', itemName: '', weight: '', rate: '', clarity: '', ct: '', color: '', amount: 0 }]);
      } else {
        setSuccessMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('Error creating invoice.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-4xl font-bold text-center mb-8 text-yellow-800">Create New Invoice</h2>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-semibold">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input name="name" placeholder="Customer Name" value={customer.name} onChange={handleCustomerChange}
              className="border border-gray-300 p-3 rounded-lg" required />
            <input name="phone" placeholder="Phone Number" value={customer.phone} onChange={handleCustomerChange}
              className="border border-gray-300 p-3 rounded-lg" required />
            <input name="address" placeholder="Address" value={customer.address} onChange={handleCustomerChange}
              className="border border-gray-300 p-3 rounded-lg" />
          </div>

          <hr className="border-t-2 border-gray-200" />

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
              <select value={item.type} onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                className="border p-3 rounded-lg" required>
                <option value="" disabled>Select Type</option>
                <option value="Yellow Gold 18K">Yellow Gold 18K</option>
                <option value="White Gold 18K">White Gold 18K</option>
                <option value="Rose Gold 18K">Rose Gold 18K</option>
              </select>
              <input placeholder="Item Name" value={item.itemName}
                onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                className="border p-3 rounded-lg" required />
              <input type="number" step="0.01" placeholder="Weight (g)" value={item.weight}
                onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                className="border p-3 rounded-lg" required />
              <input type="text" placeholder="Clarity" value={item.clarity}
                onChange={(e) => handleItemChange(index, 'clarity', e.target.value.toUpperCase())}
                className="border p-3 rounded-lg" required />
              <input type="number" step="0.01" placeholder="Carrot (CT)" value={item.ct}
                onChange={(e) => handleItemChange(index, 'ct', e.target.value)}
                className="border p-3 rounded-lg" required />
              <input type="text" placeholder="Color" value={item.color}
                onChange={(e) => handleItemChange(index, 'color', e.target.value.toUpperCase())}
                className="border p-3 rounded-lg" required />
              <input type="number" step="0.01" placeholder="Rate" value={item.rate}
                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                className="border p-3 rounded-lg" required />
              <input value={item.amount} readOnly className="border p-3 rounded-lg bg-gray-100" />
              <button type="button" onClick={() => removeItem(index)} className="text-red-600">Remove</button>
            </div>
          ))}

          <button type="button" onClick={addNewItem}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold">
            + Add Item
          </button>

          <div className="text-right space-y-2 text-lg mt-6">
            <div>Subtotal: AED {subtotal.toFixed(2)}</div>
            <div>VAT ({GST_RATE}%): AED {gstAmount.toFixed(2)}</div>
            <div className="font-bold text-2xl text-yellow-700">Grand Total: AED {grandTotal.toFixed(2)}</div>
          </div>

          <div className="text-center">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-lg text-lg font-bold">
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
