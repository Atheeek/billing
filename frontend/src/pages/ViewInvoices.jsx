import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`);
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInvoices(sortedData);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const formatIndianCurrency = (amount, showSymbol = true) => {
    const options = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  
    const formatted = new Intl.NumberFormat('en-IN', options).format(amount);
    return showSymbol ? `₹${formatted}` : formatted;
  };

  // Assuming you have a way to convert amount to words, otherwise use static text for now
  // import { amountToWords } from './your-amount-to-words-converter';
  
  
  // Assuming you might eventually use a library for amount to words:
  // import { amountToWords } from './your-amount-to-words-converter';
  
  /**
   * Generates and downloads a PDF invoice based on the provided invoice data.
   * The layout aims to replicate the provided image, with Grand Total under VAT.
   * @param {object} invoice - The invoice data object.
   * @param {string} invoice.invoiceNumber - Invoice number.
   * @param {string|Date} invoice.date - Invoice date.
   * @param {object} invoice.customer - Customer details.
   * @param {string} invoice.customer.name - Customer name.
   * @param {string} invoice.customer.phone - Customer phone.
   * @param {Array<object>} invoice.items - Array of invoice items (expects at least one).
   * @param {string} invoice.items[0].type - Item type/name.
   * @param {string} [invoice.items[0].diamondSize] - Diamond size (optional).
   * @param {string} [invoice.items[0].clarity] - Diamond clarity (optional).
   * @param {string} [invoice.items[0].color] - Diamond color (optional).
   * @param {string} [invoice.items[0].material] - Item material description (optional).
   * @param {number} invoice.items[0].rate - Unit price of the item (before VAT).
   * @param {number} invoice.grandTotal - The final total amount including VAT.
   */
  function getAmountInWords(num) {
    // 1. Input Validation
    if (typeof num !== "number" || isNaN(num)) {
      return "Invalid Amount";
    }
  
    // Handle Zero specifically
    if (num === 0) {
      return "Zero Dirhams Only";
    }
  
    // Use absolute value for conversion logic
    const absNum = Math.abs(num);
  
    // 2. Define Word Arrays
    const units = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
      'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
    // 3. Helper function to convert numbers 0-999 to words
    // Avoids adding "and" within the hundreds place for cleaner main logic
    function convertChunkToWords(n) {
      if (n < 0 || n >= 1000) return ''; // Invalid chunk input
      if (n === 0) return ''; // Don't represent zero within chunks unless it's the only value
  
      let words = '';
      // Handle Hundreds
      if (n >= 100) {
        words += units[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n > 0) words += ' '; // Add space only if tens/units follow
      }
  
      // Handle Tens and Units (0-99)
      if (n > 0) {
        if (n < 20) {
          words += units[n]; // Numbers 1-19
        } else {
          words += tens[Math.floor(n / 10)]; // Tens (Twenty, Thirty, etc.)
          if (n % 10 > 0) {
            words += ' ' + units[n % 10]; // Units (1-9)
          }
        }
      }
      return words;
    }
  
    // 4. Separate Integer (Dirhams) and Fractional (Fils) parts *BEFORE* modifying the number
    const integerPart = Math.floor(absNum);
    // Round fils carefully to handle potential floating point inaccuracies (e.g., 0.99999... * 100 becomes 100, not 99)
    // Multiply first, then round. Handle cases like 1.995 which should be 2 Dirhams 0 Fils.
    const filsPart = Math.round((absNum - integerPart) * 100);
  
    // Recalculate integerPart if rounding Fils resulted in 100 (carry-over)
    let adjustedIntegerPart = integerPart;
    let adjustedFilsPart = filsPart;
    if (filsPart === 100) {
        adjustedIntegerPart += 1;
        adjustedFilsPart = 0;
    }
  
  
    // 5. Convert Integer Part (Dirhams) to Words using Indian Numbering System
    let dirhamWordsArray = [];
    let remainingAmount = adjustedIntegerPart;
  
    if (remainingAmount > 0) {
      const crore = Math.floor(remainingAmount / 10000000);
      remainingAmount %= 10000000;
      if (crore > 0) {
        dirhamWordsArray.push(convertChunkToWords(crore) + ' Crore');
      }
  
      const lakh = Math.floor(remainingAmount / 100000);
      remainingAmount %= 100000;
      if (lakh > 0) {
        dirhamWordsArray.push(convertChunkToWords(lakh) + ' Lakh');
      }
  
      const thousand = Math.floor(remainingAmount / 1000);
      remainingAmount %= 1000;
      if (thousand > 0) {
        dirhamWordsArray.push(convertChunkToWords(thousand) + ' Thousand');
      }
  
      // Handle the remaining part (0-999)
      if (remainingAmount > 0) {
        dirhamWordsArray.push(convertChunkToWords(remainingAmount));
      }
    }
  
    // Join Dirham words and add the currency name if applicable
    let dirhamWordsString = dirhamWordsArray.join(' ');
    if (adjustedIntegerPart > 0) {
        dirhamWordsString += (dirhamWordsString ? ' ' : '') + 'Dirhams'; // Add space if words exist
    }
  
  
    // 6. Convert Fils Part to Words
    let filsWordsString = '';
    if (adjustedFilsPart > 0) {
      filsWordsString = convertChunkToWords(adjustedFilsPart) + ' Fils';
    }
  
    // 7. Combine Dirhams and Fils parts
    let finalWords = '';
    if (dirhamWordsString) {
        finalWords += dirhamWordsString;
    }
  
    if (filsWordsString) {
        if (finalWords) { // Add 'and' only if Dirhams exist
            finalWords += ' and ';
        }
        finalWords += filsWordsString;
    }
  
     // If after all calculations, the result is empty (e.g., input was 0 but missed initial check), return zero
     if (!finalWords && adjustedIntegerPart === 0 && adjustedFilsPart === 0) {
         return "Zero Dirhams Only";
     }
  
    // Add "Only" suffix
    return finalWords.trim() + ' Only';
  }
  


  const downloadInvoicePDF = async (invoice) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = 14;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const rightAlignX = pageWidth - rightMargin;
  
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error("Failed to load image:", src, err);
          resolve(null);
        };
      });
    };
  
    let logo = null;
    let watermark = null;
    try {
      logo = await loadImage('/logo.png');
      watermark = await loadImage('/watermark1.png');
    } catch (error) {
      console.error("Error loading images:", error);
    }
  
    if (logo) {
      doc.addImage(logo, 'PNG', leftMargin, 12, 30, 30);
    }
  
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 153, 0);
    doc.setFontSize(12);
    doc.text('SKY DIAMOND DREAMS TRADING L.L.C', 55, 15);
  
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: +971 50 457 6948', 55, 20);
    doc.text('Email: info@skydiamonddreams.com', 55, 25);
    doc.text('B-3 Office No. 201, Al Muteena', 55, 30);
    doc.text('Al Muteena – B3, Dubai U.A.E', 55, 35);
  
    doc.setDrawColor(169, 140, 61);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, 40, rightAlignX, 40);
  
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`TRN: 104783462500003`, leftMargin, 48);
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INVOICE', pageWidth / 2, 48, { align: 'center' });
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`No: ${invoice?.invoiceNumber || 'N/A'}`, rightAlignX, 48, { align: 'right' });
  
    const formattedDate = invoice?.date
      ? new Date(invoice.date).toLocaleDateString('en-GB').replace(/\//g, '.')
      : 'N/A';
    doc.text(`Date: ${formattedDate}`, rightAlignX, 55, { align: 'right' });
  
    const billToY = 62;
    doc.setFont('helvetica', 'bold');
    doc.text(`Bill to:`, leftMargin, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice?.customer?.name ?? 'N/A'}`, leftMargin + 16, billToY);
  
    doc.setFont('helvetica', 'bold');
    doc.text(`Mobile No:`, leftMargin, billToY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice?.customer?.phone ?? 'N/A'}`, leftMargin + 22, billToY + 6);
  
    if (watermark) {
      const watermarkWidth = 120;
      const watermarkHeight = 120;
      const watermarkX = (pageWidth - watermarkWidth) / 2;
      const watermarkY = (pageHeight - watermarkHeight) / 2 + 10;
      doc.addImage(watermark, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight, '', 'FAST');
    }
  
    const formatCurrency = (num) => {
      const number = parseFloat(num);
      return typeof number === 'number' && !isNaN(number)
        ? number.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
    };
  
    const tableStartY = 75;
    const approxRowHeight = 8;
    const maxTableRows = Math.floor((pageHeight * 0.75 - tableStartY) / approxRowHeight);
  
    const tableBody = invoice.items.map((item, index) => {
      const qty = item.weight?.toFixed(2) || '0.00';
      const unitPrice = item.rate?.toFixed(2) || '0.00';
      const vat = (item.amount * 0.05).toFixed(2);
      const total = (item.amount + parseFloat(vat)).toFixed(2);
  
      const desc = [
        `${item.type}${item.itemName ? ` – ${item.itemName}` : ''}`,
        item.diamondSize && `Diamond: ${item.diamondSize} CT`,
        item.clarity && `Clarity: ${item.clarity}`,
        item.color && `Color: ${item.color}`,
        item.material && `Material: ${item.material}`
      ].filter(Boolean).join('\n');
      
  
      return [
        (index + 1).toString(),
        desc || 'No Description',
        qty,
        unitPrice,
        vat,
        total
      ];
    });
  
    const grandTotal = parseFloat(invoice?.grandTotal || 0);
    const blankRowsNeeded = Math.max(0, maxTableRows - tableBody.length - 1);
    for (let i = 0; i < blankRowsNeeded; i++) tableBody.push(['', '', '', '', '', '']);
  
    tableBody.push([
      { content: '', colSpan: 4 },
      { content: 'Grand Total', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
      { content: formatCurrency(grandTotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ]);
  
    autoTable(doc, {
      startY: tableStartY,
      head: [['Sl.No.', 'Description', 'Qty', 'Unit Price', 'VAT 5%', 'Total']],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', halign: 'center', valign: 'middle' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 25 },
      },
      margin: { left: leftMargin, right: rightMargin },
      didDrawCell: (data) => {
        doc.setLineWidth(0.1);
        doc.setDrawColor(180, 180, 180);
        if (data.column.index < data.table.columns.length - 1) {
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
        if (data.section === 'head') {
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
        if (data.section === 'body' && data.row.index === data.table.body.length - 2) {
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
        if (data.column.index === 0) doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
        if (data.column.index === data.table.columns.length - 1)
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        if (data.section === 'head' && data.row.index === 0)
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        if (data.section === 'body' && data.row.index === data.table.body.length - 1)
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    });
  
    const finalTableY = doc.lastAutoTable.finalY;
    const amountInWords = getAmountInWords(grandTotal);
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(`AED ${grandTotal.toLocaleString('en-AE')} / ${amountInWords}`, leftMargin + 2, finalTableY + 8);
  
    const bottomLineY = pageHeight - 20;
    doc.setDrawColor(169, 140, 61);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, bottomLineY, rightAlignX, bottomLineY);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Authorised Signature / Stamp', rightAlignX, bottomLineY + 5, { align: 'right' });
  
    try {
      const safeInvoiceNumber = String(invoice?.invoiceNumber || 'NoNumber').replace(/[^a-z0-9_.-]/gi, '_');
      doc.save(`Invoice_${safeInvoiceNumber}.pdf`);
    } catch (e) {
      console.error("Error saving PDF:", e);
      alert("Could not save the PDF. Please check the console for errors.");
    }
  };
  
// Example of how you might call this function (replace with your actual button click handler)
/*
const myInvoiceData = {
  invoiceNumber: 'INV12345',
  date: '2025-04-29', // Use ISO format or Date object
  customer: {
    name: 'Test Customer',
    phone: '+971 55 555 5555'
  },
  items: [
    {
      type: 'Diamond Ring',
      diamondSize: 1.5,
      clarity: 'VVS1',
      color: 'G',
      material: '18k White Gold',
      rate: 3400 // Example rate
    }
    // Add more items if needed
  ],
  grandTotal: 3570 // Example: 3400 + 5% VAT (170)
};

// Assuming you have a button with id="downloadBtn"
// const downloadButton = document.getElementById('downloadBtn');
// if (downloadButton) {
//   downloadButton.addEventListener('click', () => {
//      downloadInvoicePDF(myInvoiceData).catch(err => {
//         console.error("Failed to generate PDF:", err);
//         alert("An error occurred while generating the PDF.");
//      });
//   });
// }

  /*
  const exampleInvoice = {
    invoiceNumber: '106',
    date: '2025-03-13', // Can be string or Date object
    customer: {
      name: 'Keith',
      phone: '+971 56 436 4356'
    },
    items: [
      {
        type: 'Diamond Ring',
        diamondSize: '0.30',
        clarity: 'VVS 2',
        color: 'D',
        material: 'WhiteGold 18k - 2.51 GM',
        rate: 3238.09 // Unit price before VAT
      }
    ],
    grandTotal: 3400.00 // Final total including VAT
  };
  
  // To use, uncomment the line below (e.g., in a button click handler)
  // downloadInvoicePDF(exampleInvoice);
  */
  
  // --- Helper function (Example - replace with a proper library if needed) ---
  // Basic number to words conversion - very limited!
  // function amountToWords(num) {
  //   if (num === 3400) return 'Three Thousand and Four Hundred Dirhams Only';
  //   // Add more cases or use a library like 'num-words'
  //   return 'Amount in words not implemented yet';
  // }
  
  
  // --- Example Usage (Make sure invoice object structure matches) ---
  /*
  const exampleInvoice = {
    invoiceNumber: '106',
    date: '2025-03-13T00:00:00.000Z', // Use ISO format or Date object
    customer: {
      name: 'Keith',
      phone: '+971 56 436 4356'
    },
    items: [
      {
        type: 'Diamond Ring',
        diamondSize: '0.30',
        clarity: 'VVS 2',
        color: 'D',
        material: 'WhiteGold 18k - 2.51 GM',
        rate: 3238.09 // Unit price before VAT
      }
    ],
    grandTotal: 3400.00 // Final total including VAT
  };
  
  // Call the function (usually within an event handler like a button click)
  // downloadInvoicePDF(exampleInvoice);
  */
  
  
  
  
  
  

  if (loading) {
    return <div className="text-center mt-20 text-lg font-semibold">Loading invoices...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-10">
      {/* <h2 className="text-4xl font-extrabold mb-10 text-center text-indigo-700">All Invoices</h2> */}
  
      {invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-xl rounded-xl border">
            <thead className="bg-indigo-100 text-indigo-700 text-sm text-center">
              <tr>
                <th className="py-3 px-4 border">Invoice No</th>
                <th className="py-3 px-4 border">Date</th>
                <th className="py-3 px-4 border">Customer Name</th>
                <th className="py-3 px-4 border">Phone</th>
                <th className="py-3 px-4 border">Item Type</th>
                <th className="py-3 px-4 border">Item Name</th>
                <th className="py-3 px-4 border">Clarity</th>
                <th className="py-3 px-4 border">CT</th>
                <th className="py-3 px-4 border">Color</th>
                <th className="py-3 px-4 border">Weight (g)</th>
                <th className="py-3 px-4 border">Rate </th>
                <th className="py-3 px-4 border">Amount </th>
                <th className="py-3 px-4 border">Subtotal</th>
                <th className="py-3 px-4 border">VAT (5%)</th>
                <th className="py-3 px-4 border font-bold text-green-700">Grand Total</th>
                <th className="py-3 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.flatMap((invoice) =>
                invoice.items.map((item, index) => (
                  <tr key={`${invoice.invoiceNumber}-${index}`} className="text-center text-sm">
                    <td className="border px-3 py-2">{invoice.invoiceNumber}</td>
                    <td className="border px-3 py-2">{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                    <td className="border px-3 py-2">{invoice.customer.name}</td>
                    <td className="border px-3 py-2">{invoice.customer.phone}</td>
                    <td className="border px-3 py-2">{item.type}</td>
                    <td className="border px-3 py-2">{item.itemName}</td>
                    <td className="border px-3 py-2">{item.clarity}</td>
                    <td className="border px-3 py-2">{item.ct}</td>
                    <td className="border px-3 py-2">{item.weight.toFixed(2)}</td>
                    <td className="border px-3 py-2">AED {item.rate}</td>
                    <td className="border px-3 py-2">AED {item.amount}</td>

                    {index === 0 ? (
                      <>
                        <td className="border px-3 py-2" rowSpan={invoice.items.length}>
                         AED {invoice.subtotal}
                        </td>
                        <td className="border px-3 py-2" rowSpan={invoice.items.length}>
                         AED {invoice.gstAmount}
                        </td>
                        <td className="border px-3 py-2 font-bold text-green-700" rowSpan={invoice.items.length}>
                         AED {invoice.grandTotal}
                        </td>
                        <td className="border px-3 py-2" rowSpan={invoice.items.length}>
                          <button
                            onClick={() => downloadInvoicePDF(invoice)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm"
                          >
                            Download
                          </button>
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center mt-10 text-gray-500 text-lg">No invoices found.</div>
      )}
    </div>
  );
  
};

export default ViewInvoices;
