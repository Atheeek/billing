import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Ensure VITE_API_URL is correctly set in your .env file
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInvoices(sortedData);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        // Optionally, set an error state here to display to the user
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const formatAED = (amount, showSymbol = true) => {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      return showSymbol ? 'AED 0.00' : '0.00';
    }
    const formatted = num.toLocaleString('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return showSymbol ? `AED ${formatted}` : formatted;
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
      if (finalWords) { // Add 'and' only if Dirhams exist
        finalWords += ' and ';
      }
      finalWords += filsWordsString;
    }
    if (!finalWords && adjustedIntegerPart === 0 && adjustedFilsPart === 0) { // Ensure 0 is handled if missed
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
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const rightAlignX = pageWidth - rightMargin;

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Attempt to fix potential CORS issues if images are hosted
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error("Failed to load image for PDF:", src, err);
          resolve(null); // Resolve with null so PDF generation can continue
        };
      });
    };

    let logo = null;
    let watermark = null;
    // Ensure these paths are correct, typically relative to the public folder
    logo = await loadImage('/logo.png');
    watermark = await loadImage('/watermark1.png');

    // Header Section
    if (logo) {
      doc.addImage(logo, 'PNG', leftMargin, 12, 30, 30); // Adjust size/position as needed
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 153, 0); // Sky Diamond Dreams color
    doc.setFontSize(12);
    doc.text('SKY DIAMOND DREAMS TRADING L.L.C', 55, 15);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: +971 50 457 6948', 55, 20);
    doc.text('Email: info@skydiamonddreams.com', 55, 25);
    doc.text('B-3 Office No. 201, Al Muteena', 55, 30);
    doc.text('Al Muteena – B3, Dubai U.A.E', 55, 35);

    doc.setDrawColor(169, 140, 61); // Line color
    doc.setLineWidth(0.5);
    doc.line(leftMargin, 40, rightAlignX, 40); // Horizontal line

    // Invoice Details Section
    doc.setTextColor(0, 0, 0);
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

    // Customer Details
    const billToY = 62;
    doc.setFont('helvetica', 'bold');
    doc.text(`Bill to:`, leftMargin, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice?.customer?.name ?? 'N/A', leftMargin + 16, billToY); // Indent value

    doc.setFont('helvetica', 'bold');
    doc.text(`Mobile No:`, leftMargin, billToY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice?.customer?.phone ?? 'N/A', leftMargin + 22, billToY + 6);

    // Watermark (centered)
    if (watermark) {
      const watermarkWidth = 120; // Adjust as needed
      const watermarkHeight = 120; // Adjust as needed
      const watermarkX = (pageWidth - watermarkWidth) / 2;
      const watermarkY = (pageHeight - watermarkHeight) / 2 + 10; // Adjust Y offset
      doc.saveGraphicsState(); // Save current settings
      doc.setGState(new doc.GState({ opacity: 0.15 })); // Set opacity for watermark
      doc.addImage(watermark, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight, '', 'FAST');
      doc.restoreGraphicsState(); // Restore original settings
    }

    // Helper to format currency for PDF cells
    const formatCurrencyForPDF = (numStr) => {
      const number = parseFloat(numStr);
      return !isNaN(number) ? number.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    };

    // Table Data
    const tableStartY = 75; // Start Y position for the table
    const tableBody = invoice.items.map((item, index) => {
      const itemAmount = parseFloat(item.amount) || 0;
      // Assuming item.amount is pre-VAT and invoice.gstAmount is the total VAT for the invoice.
      // For line item VAT, we'd calculate it based on item.amount if not already provided per item.
      // Let's assume gstAmount on invoice is the total, and for display, we calculate per item.
      const vatOnItem = itemAmount * 0.05; // 5% VAT on item amount
      const totalWithVatForItem = itemAmount + vatOnItem;

      const descriptionLines = [
        item.itemName ? `Diamond ${item.itemName}` : (item.type || "Item Description"),
        item.ct && `Diamond: ${item.ct} CT`,
        item.clarity && `Clarity: ${item.clarity}`,
        item.color && `Color: ${item.color}`,
        item.material && `Material: ${item.material}`, // Assuming 'material' might exist
        item.type && item.weight && `${item.type} - ${parseFloat(item.weight || 0).toFixed(2)} GM`,
      ].filter(Boolean).join('\n'); // Use single \n for tighter packing in PDF cells

      return [
        (index + 1).toString(), // Sl.No
        descriptionLines || 'N/A', // Description
        '1', // Qty (assuming 1 per line item, adjust if item has its own quantity)
        formatCurrencyForPDF(item.rate), // Unit Price
        formatCurrencyForPDF(vatOnItem), // VAT 5%
        formatCurrencyForPDF(totalWithVatForItem) // Total
      ];
    });
    
    // Add Subtotal, VAT, and Grand Total rows
    const subtotal = parseFloat(invoice?.subtotal || 0);
    const totalVAT = parseFloat(invoice?.gstAmount || 0);
    const grandTotal = parseFloat(invoice?.grandTotal || 0);

    tableBody.push([
        { content: 'Subtotal', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: '' }, // Empty for VAT column header under item VAT
        { content: formatCurrencyForPDF(subtotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ]);
    tableBody.push([
        { content: 'Total VAT (5%)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: '' },
        { content: formatCurrencyForPDF(totalVAT), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ]);
    tableBody.push([
        { content: 'Grand Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
        { content: '' },
        { content: formatCurrencyForPDF(grandTotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }
    ]);


    autoTable(doc, {
      startY: tableStartY,
      head: [['Sl.No', 'Description', 'Qty', 'Unit Price', 'VAT 5%', 'Total']],
      body: tableBody,
      theme: 'plain', // Use 'plain' and draw custom lines or 'grid'
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'top', lineWidth: 0.1, lineColor: [180,180,180] },
      headStyles: { fillColor: [230, 230, 230], textColor: [40,40,40], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 8.5, lineWidth: 0.1, lineColor: [180,180,180] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, // Sl.No
        1: { cellWidth: 'auto' },             // Description
        2: { halign: 'center', cellWidth: 10 },// Qty
        3: { halign: 'right', cellWidth: 25 }, // Unit Price
        4: { halign: 'right', cellWidth: 22 }, // VAT
        5: { halign: 'right', cellWidth: 28 }, // Total
      },
      margin: { left: leftMargin, right: rightMargin },
      didDrawCell: (data) => { // Custom borders for a 'grid' like appearance with 'plain' theme
        doc.setLineWidth(0.1);
        doc.setDrawColor(180, 180, 180);
        // Draw bottom line for all cells
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        // Draw right line for all cells
        doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        // Draw left line for the first column cells
        if (data.column.index === 0) {
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
        }
        // Draw top line for header cells
        if (data.section === 'head') {
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        }
      }
    });

    // Footer Section
    const finalY = (doc).lastAutoTable.finalY || tableStartY + 20; // Fallback if no table
    const amountInWordsText = getAmountInWords(grandTotal);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0,0,0);
    const amountLine = `AED ${formatCurrencyForPDF(grandTotal)} / ${amountInWordsText}`;
    const splitAmountLine = doc.splitTextToSize(amountLine, contentWidth - 2); // -2 for a small margin
    doc.text(splitAmountLine, leftMargin + 2, finalY + 8);

    const signatureLineY = Math.max(finalY + 15 + (splitAmountLine.length * 5), pageHeight - 30); // Ensure space
    doc.setDrawColor(169, 140, 61);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, signatureLineY, rightAlignX, signatureLineY);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150); // Lighter text for placeholder
    doc.text('Authorised Signature / Stamp', rightAlignX, signatureLineY + 5, { align: 'right' });

    // Save PDF
    try {
      const safeInvoiceNumber = String(invoice?.invoiceNumber || 'Invoice').replace(/[^a-z0-9_.-]/gi, '_');
      doc.save(`Invoice_${safeInvoiceNumber}.pdf`);
    } catch (e) {
      console.error("Error saving PDF:", e);
      // Consider user-friendly error display here
      alert("Could not save the PDF. Please check the console for errors.");
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 4rem)'}}> {/* Adjust 4rem based on actual nav height */}
        <div className="text-lg font-semibold text-gray-700">Loading invoices...</div>
      </div>
    );
  }

  return (
    // Adjust overall container height based on your app's header/navbar height
    // e.g., if navbar is 64px (4rem), then height is calc(100vh - 4rem)
    <div className="container mx-auto px-0 sm:px-0 py-0 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 flex-shrink-0">
        All Invoices
      </h1> */}

      {invoices.length > 0 ? (
        <div className="flex-grow shadow-lg  border border-gray-200 rounded-lg">
          {/* This div handles both horizontal and vertical scrolling for the table */}
          {/* Adjust maxHeight: 10rem is an estimate for title, page padding, etc. */}
          <div className="overflow-auto bg-white" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
            <table className="min-w-full"> {/* Removed bg-white from here, parent div has it */}
              <thead className="bg-gray-600 text-white text-xs sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2 text-left font-semibold whitespace-nowrap">Inv No</th>
                  <th className="py-2 px-2 text-left font-semibold whitespace-nowrap">Date</th>
                  <th className="py-2 px-2 text-left font-semibold">Customer</th>
                  <th className="py-2 px-2 text-left font-semibold whitespace-nowrap hidden md:table-cell">Phone</th>
                  <th className="py-2 px-2 text-left font-semibold hidden lg:table-cell">Item Type</th>
                  <th className="py-2 px-2 text-left font-semibold">Item Name</th>
                  <th className="py-2 px-2 text-left font-semibold hidden lg:table-cell">Clarity</th>
                  <th className="py-2 px-2 text-right font-semibold whitespace-nowrap hidden lg:table-cell">CT</th>
                  <th className="py-2 px-2 text-left font-semibold hidden lg:table-cell">Color</th>
                  <th className="py-2 px-2 text-right font-semibold whitespace-nowrap hidden md:table-cell">Weight(g)</th>
                  <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">Rate</th>
                  <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">Amount</th>
                  <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">Subtotal</th>
                  <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">VAT(5%)</th>
                  <th className="py-2 px-2 text-right font-bold whitespace-nowrap">Grand Total</th>
                  <th className="py-2 px-2 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {invoices.flatMap((invoice) =>
                  invoice.items.map((item, index) => (
                    <tr key={`${invoice.invoiceNumber}-${index}-${item.itemName}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-stone-100`}>
                      <td className="px-2 py-1 whitespace-nowrap text-left">{invoice.invoiceNumber}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-left">{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-2 py-1 text-left">{invoice.customer.name}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-left hidden md:table-cell">{invoice.customer.phone}</td>
                      <td className="px-2 py-1 text-left hidden lg:table-cell">{item.type}</td>
                      <td className="px-2 py-1 text-left">{item.itemName}</td>
                      <td className="px-2 py-1 text-left hidden lg:table-cell">{item.clarity || '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right hidden lg:table-cell">{item.ct ? parseFloat(item.ct).toFixed(2) : '-'}</td>
                      <td className="px-2 py-1 text-left hidden lg:table-cell">{item.color || '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right hidden md:table-cell">{item.weight ? parseFloat(item.weight).toFixed(2) : '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{formatAED(item.rate)}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{formatAED(item.amount)}</td>

                      {index === 0 && (
                        <>
                          <td className="px-2 py-1 whitespace-nowrap text-right align-top" rowSpan={invoice.items.length}>
                            {formatAED(invoice.subtotal)}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-right align-top" rowSpan={invoice.items.length}>
                            {formatAED(invoice.gstAmount)}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-right font-bold align-top" rowSpan={invoice.items.length}>
                            {formatAED(invoice.grandTotal)}
                          </td>
                          <td className="px-2 py-1 text-center align-top" rowSpan={invoice.items.length}>
                            <button
                              onClick={() => downloadInvoicePDF(invoice)}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-1 px-2 rounded text-xs shadow-sm transition duration-150 ease-in-out"
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
        <div className="text-center mt-16 flex-grow flex flex-col justify-center items-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-base font-medium text-gray-700">No invoices found.</h3>
          <p className="mt-1 text-xs text-gray-500">Get started by creating a new invoice.</p>
        </div>
      )}
    </div>
  );
};

export default ViewInvoices;