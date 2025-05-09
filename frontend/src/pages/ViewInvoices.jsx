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

  // Formats numbers to AED currency style
  const formatAED = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      // console.warn(`Invalid amount for formatting: ${amount}`);
      return 'AED 0.00'; // Default or error display
    }
    return `AED ${num.toLocaleString('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Indian currency formatter (from original code, not used in this table)
  const formatIndianCurrency = (amount, showSymbol = true) => {
    const options = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    const formatted = new Intl.NumberFormat('en-IN', options).format(amount);
    return showSymbol ? `₹${formatted}` : formatted;
  };


  function getAmountInWords(num) {
    if (typeof num !== "number" || isNaN(num)) {
      return "Invalid Amount";
    }
    if (num === 0) {
      return "Zero Dirhams Only";
    }
    const absNum = Math.abs(num);
    const units = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
      'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertChunkToWords(n) {
      if (n < 0 || n >= 1000) return '';
      if (n === 0) return '';
      let words = '';
      if (n >= 100) {
        words += units[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n > 0) words += ' ';
      }
      if (n > 0) {
        if (n < 20) {
          words += units[n];
        } else {
          words += tens[Math.floor(n / 10)];
          if (n % 10 > 0) {
            words += ' ' + units[n % 10];
          }
        }
      }
      return words;
    }

    const integerPart = Math.floor(absNum);
    const filsPart = Math.round((absNum - integerPart) * 100);
    let adjustedIntegerPart = integerPart;
    let adjustedFilsPart = filsPart;
    if (filsPart === 100) {
      adjustedIntegerPart += 1;
      adjustedFilsPart = 0;
    }

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
      if (remainingAmount > 0) {
        dirhamWordsArray.push(convertChunkToWords(remainingAmount));
      }
    }

    let dirhamWordsString = dirhamWordsArray.join(' ');
    if (adjustedIntegerPart > 0) {
      dirhamWordsString += (dirhamWordsString ? ' ' : '') + 'Dirhams';
    }

    let filsWordsString = '';
    if (adjustedFilsPart > 0) {
      filsWordsString = convertChunkToWords(adjustedFilsPart) + ' Fils';
    }

    let finalWords = '';
    if (dirhamWordsString) {
      finalWords += dirhamWordsString;
    }
    if (filsWordsString) {
      if (finalWords) {
        finalWords += ' and ';
      }
      finalWords += filsWordsString;
    }
    if (!finalWords && adjustedIntegerPart === 0 && adjustedFilsPart === 0) {
      return "Zero Dirhams Only";
    }
    return finalWords.trim() + ' Only';
  }


  const downloadInvoicePDF = async (invoice) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = 14;
    // const contentWidth = pageWidth - leftMargin - rightMargin; // Not used
    const rightAlignX = pageWidth - rightMargin;

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error("Failed to load image:", src, err);
          resolve(null); // Resolve with null if image fails to load
        };
      });
    };

    let logo = null;
    let watermark = null;
    try {
      logo = await loadImage('/logo.png'); // Ensure this path is correct relative to your public folder
      watermark = await loadImage('/watermark1.png'); // Ensure this path is correct
    } catch (error) {
      console.error("Error loading images during PDF generation:", error);
    }

    if (logo) {
      doc.addImage(logo, 'PNG', leftMargin, 12, 30, 30);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 153, 0); // Consider a more accessible color if this is too light
    doc.setFontSize(12);
    doc.text('SKY DIAMOND DREAMS TRADING L.L.C', 55, 15);

    doc.setFontSize(10);
    doc.setTextColor(0); // Black
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
      ? new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
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
      const watermarkY = (pageHeight - watermarkHeight) / 2 + 10; // Adjusted Y for better centering
      doc.addImage(watermark, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight, '', 'FAST');
    }

    const formatCurrencyForPDF = (num) => {
      const number = parseFloat(num);
      return typeof number === 'number' && !isNaN(number)
        ? number.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
    };

    const tableStartY = 75;
    // const approxRowHeight = 8; // Not directly used for maxTableRows logic here
    // const maxTableRows = Math.floor((pageHeight * 0.75 - tableStartY) / approxRowHeight); // Simplified blank row logic

    const tableBody = invoice.items.map((item, index) => {
      const qty = String(index + 1).padStart(2, '0');
      const unitPrice = formatCurrencyForPDF(item.rate);
      const itemAmount = parseFloat(item.amount) || 0;
      const vatOnItem = (itemAmount * 0.05); // Assuming item.amount is pre-VAT
      const totalWithVat = itemAmount + vatOnItem;

      const desc = [
        item.itemName ? `Diamond ${item.itemName}` : (item.type || "Item"), // Ensure some description
        item.ct && `Diamond: ${item.ct} CT`,
        item.clarity && `Clarity: ${item.clarity}`,
        item.color && `Color: ${item.color}`,
        item.material && `Material: ${item.material}`, // This was from comments, ensure it's in item object
        item.type && item.weight && `${item.type} - ${item.weight} GM`,
      ].filter(Boolean).join('\n'); // Single \n for tighter packing

      return [
        (index + 1).toString(),
        desc || 'No Description',
        qty, // Qty is usually 1 per line item of this type
        unitPrice,
        formatCurrencyForPDF(vatOnItem),
        formatCurrencyForPDF(totalWithVat)
      ];
    });

    // Calculate Subtotal, Total VAT, and verify Grand Total from items if needed for PDF accuracy
    // For now, using totals from invoice object
    const subtotalFromInvoice = parseFloat(invoice?.subtotal || 0);
    const vatFromInvoice = parseFloat(invoice?.gstAmount || 0);
    const grandTotalFromInvoice = parseFloat(invoice?.grandTotal || 0);


    // Simpler blank rows: just ensure the total appears after items
    // const blankRowsNeeded = Math.max(0, maxTableRows - tableBody.length - 1);
    // for (let i = 0; i < blankRowsNeeded; i++) tableBody.push(['', '', '', '', '', '']);

    // Add Subtotal Row
    tableBody.push([
        { content: 'Subtotal', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: '', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }, // Empty cell for VAT column
        { content: formatCurrencyForPDF(subtotalFromInvoice), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ]);
    // Add VAT Row
    tableBody.push([
        { content: 'Total VAT (5%)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: '', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }, // Empty cell for VAT column
        { content: formatCurrencyForPDF(vatFromInvoice), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ]);
    // Add Grand Total Row
    tableBody.push([
      { content: 'Grand Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }, // Made grand total font slightly larger
      { content: '', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
      { content: formatCurrencyForPDF(grandTotalFromInvoice), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }
    ]);


    autoTable(doc, {
      startY: tableStartY,
      head: [['Sl.No', 'Description', 'Qty', 'Unit Price (AED)', 'VAT 5% (AED)', 'Total (AED)']],
      body: tableBody,
      theme: 'plain', // 'grid' or 'striped' could also be options
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'top', lineWidth: 0.1, lineColor: [180,180,180] }, // Base line width and color
      headStyles: { fillColor: [230, 230, 230], textColor: [50,50,50], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 8.5 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, // Sl.No
        1: { cellWidth: 'auto' },              // Description
        2: { halign: 'center', cellWidth: 10 }, // Qty
        3: { halign: 'right', cellWidth: 25 },  // Unit Price
        4: { halign: 'right', cellWidth: 25 },  // VAT
        5: { halign: 'right', cellWidth: 28 },  // Total
      },
      margin: { left: leftMargin, right: rightMargin },
      didDrawCell: (data) => { // Custom drawing for borders if theme: 'plain'
        doc.setLineWidth(0.1);
        doc.setDrawColor(180, 180, 180); // Light grey for borders
        // Vertical lines
        if (data.column.index < data.table.columns.length) { // Draw for all columns including last
             doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
        // Horizontal lines
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        // Left border for the first cell
        if (data.column.index === 0) {
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
        }
        // Top border for header
        if (data.section === 'head' && data.row.index === 0) {
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        }
      }
    });

    const finalTableY = (doc).lastAutoTable.finalY;
    const amountInWords = getAmountInWords(grandTotalFromInvoice);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
    const amountText = `AED ${formatCurrencyForPDF(grandTotalFromInvoice)} / ${amountInWords}`;
    // Split text if too long using doc.splitTextToSize
    const contentWidth = pageWidth - 2 * margin;
    const splitAmountText = doc.splitTextToSize(amountText, contentWidth - 2); // contentWidth needs to be defined or use pageWidth - margins
    doc.text(splitAmountText, leftMargin + 2, finalTableY + 8);


    const bottomSignatureY = Math.max(finalTableY + 25, pageHeight - 30); // Ensure space for signature
    doc.setDrawColor(169, 140, 61);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, bottomSignatureY, rightAlignX, bottomSignatureY); // Line for signature
    doc.setFontSize(8);
    doc.setTextColor(100); // Grey text
    doc.text('Authorised Signature / Stamp', rightAlignX, bottomSignatureY + 5, { align: 'right' });

    try {
      const safeInvoiceNumber = String(invoice?.invoiceNumber || 'Invoice').replace(/[^a-z0-9_.-]/gi, '_');
      doc.save(`Invoice_${safeInvoiceNumber}.pdf`);
    } catch (e) {
      console.error("Error saving PDF:", e);
      alert("Could not save the PDF. Please check the console for errors.");
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="text-lg font-semibold text-gray-700">Loading invoices...</div>
    </div>;
  }

  return (
    <div className="container mx-auto px-0 sm:px-0 py-0">
      {/* <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">All Invoices</h1> */}

      {invoices.length > 0 ? (
        <div className="shadow-lg overflow-hidden border-b border-gray-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-700 text-white text-sm">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Invoice No</th>
                  <th className="py-3 px-4 text-left font-semibold">Date</th>
                  <th className="py-3 px-4 text-left font-semibold">Customer Name</th>
                  <th className="py-3 px-4 text-left font-semibold hidden md:table-cell">Phone</th>
                  <th className="py-3 px-4 text-left font-semibold hidden lg:table-cell">Item Type</th>
                  <th className="py-3 px-4 text-left font-semibold">Item Name</th>
                  <th className="py-3 px-4 text-left font-semibold hidden lg:table-cell">Clarity</th>
                  <th className="py-3 px-4 text-right font-semibold hidden lg:table-cell">CT</th>
                  <th className="py-3 px-4 text-left font-semibold hidden lg:table-cell">Color</th>
                  <th className="py-3 px-4 text-right font-semibold hidden md:table-cell">Weight (g)</th>
                  <th className="py-3 px-4 text-right font-semibold">Rate</th>
                  <th className="py-3 px-4 text-right font-semibold">Amount</th>
                  <th className="py-3 px-4 text-right font-semibold">Subtotal</th>
                  <th className="py-3 px-4 text-right font-semibold">VAT (5%)</th>
                  <th className="py-3 px-4 text-right font-bold">Grand Total</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.flatMap((invoice) =>
                  invoice.items.map((item, index) => (
                    <tr key={`${invoice.invoiceNumber}-${index}`} className={`text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                      <td className="px-4 py-3 whitespace-nowrap text-left">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-left">{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-left">{invoice.customer.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-left hidden md:table-cell">{invoice.customer.phone}</td>
                      <td className="px-4 py-3 text-left hidden lg:table-cell">{item.type}</td>
                      <td className="px-4 py-3 text-left">{item.itemName}</td>
                      <td className="px-4 py-3 text-left hidden lg:table-cell">{item.clarity}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right hidden lg:table-cell">{item.ct ? parseFloat(item.ct).toFixed(2) : '-'}</td>
                      <td className="px-4 py-3 text-left hidden lg:table-cell">{item.color}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right hidden md:table-cell">{item.weight ? parseFloat(item.weight).toFixed(2) : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">{formatAED(item.rate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">{formatAED(item.amount)}</td>

                      {index === 0 && ( // Show totals and actions only for the first item of an invoice
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-right align-top" rowSpan={invoice.items.length}>
                            {formatAED(invoice.subtotal)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right align-top" rowSpan={invoice.items.length}>
                            {formatAED(invoice.gstAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-bold align-top" rowSpan={invoice.items.length}>
                            {formatAED(invoice.grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-center align-top" rowSpan={invoice.items.length}>
                            <button
                              onClick={() => downloadInvoicePDF(invoice)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out"
                              title="Download Invoice"
                            >
                              Download
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center mt-16">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-700">No invoices found.</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
        </div>
      )}
    </div>
  );
};

export default ViewInvoices;