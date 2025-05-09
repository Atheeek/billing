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
    // Also update amount if ct changes and it's part of your calculation logic (assuming rate might be per ct for some items)
    // For simplicity, current calculation only uses weight and rate. Adjust if needed.

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
        setSuccessMessage(`Error: ${data.message || 'Failed to create invoice.'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('Error creating invoice. Please check the console.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto"> {/* Adjusted max-width for a slightly wider layout on large screens */}
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-yellow-800">Create New Invoice</h2>

          {successMessage && (
            <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${successMessage.startsWith('Error:') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information Section */}
            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-semibold text-gray-700 px-2">Customer Details</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <input name="name" placeholder="Customer Name" value={customer.name} onChange={handleCustomerChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
                <input name="phone" type="tel" placeholder="Phone Number" value={customer.phone} onChange={handleCustomerChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
                <input name="address" placeholder="Address" value={customer.address} onChange={handleCustomerChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
              </div>
            </fieldset>

            {/* Items Section */}
            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-semibold text-gray-700 px-2">Items</legend>
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md shadow-sm relative">
                    <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end"> {/* Responsive grid for item fields */}
                      {/* Row 1 */}
                      <select value={item.type} onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 col-span-1 sm:col-span-2 md:col-span-1" required>
                        <option value="" disabled>Select Type</option>
                        <option value="Yellow Gold 18K">Yellow Gold 18K</option>
                        <option value="White Gold 18K">White Gold 18K</option>
                        <option value="Rose Gold 18K">Rose Gold 18K</option>
                        <option value="Platinum">Platinum</option> {/* Corrected duplicate Rose Gold to Platinum */}
                      </select>
                      <input placeholder="Item Name" value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 col-span-1 sm:col-span-2 md:col-span-2" required />

                      {/* Row 2 - Grouping weight, rate, clarity, ct, color */}
                       <input type="number" step="any" placeholder="Weight (g)" value={item.weight}
                        onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
                      <input type="number" step="any" placeholder="Rate" value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
                      <input type="text" placeholder="Clarity" value={item.clarity}
                        onChange={(e) => handleItemChange(index, 'clarity', e.target.value.toUpperCase())}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                      <input type="number" step="any" placeholder="Carat (ct)" value={item.ct}
                        onChange={(e) => handleItemChange(index, 'ct', e.target.value)}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                      <input type="text" placeholder="Color" value={item.color}
                        onChange={(e) => handleItemChange(index, 'color', e.target.value.toUpperCase())}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />

                      {/* Amount (Read-only) */}
                      <div className="col-span-1 sm:col-span-2 md:col-span-1"> {/* Allow it to span if needed, or align it */}
                        <label htmlFor={`amount-${index}`} className="block text-sm font-medium text-gray-700">Amount</label>
                        <input id={`amount-${index}`} value={`AED ${item.amount}`} readOnly className="border border-gray-300 p-3 rounded-lg bg-gray-100 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addNewItem}
                className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Item
              </button>
            </fieldset>

            {/* Totals Section */}
            <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Summary</h3>
                <div className="space-y-2 text-md sm:text-lg">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold text-gray-800">AED {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">VAT ({GST_RATE}%):</span>
                        <span className="font-semibold text-gray-800">AED {gstAmount.toFixed(2)}</span>
                    </div>
                    <hr className="my-2 border-gray-300"/>
                    <div className="flex justify-between text-xl sm:text-2xl">
                        <span className="font-bold text-yellow-700">Grand Total:</span>
                        <span className="font-bold text-yellow-700">AED {grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>


            {/* Actions */}
            <div className="mt-8 pt-5 border-t border-gray-200">
              <div className="flex justify-end"> {/* Changed from text-center to flex justify-end for a common pattern */}
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                  Create Invoice
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;