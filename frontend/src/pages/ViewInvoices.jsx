import { useEffect, useState } from 'react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure this is imported

const ViewInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`);
         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
         }
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInvoices(sortedData);
      } catch (error) {
        console.error('Error fetching invoices:', error);
         // Optionally set an error state to display a message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Helper function for formatting AED currency for display in the table
  const formatAED = (amount) => {
    const number = parseFloat(amount);
    if (isNaN(number)) {
      return 'AED 0.00'; // Handle non-numeric input gracefully
    }
    // Use en-AE locale for UAE Dirham formatting
    return `AED ${number.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function (for PDF generation - RESTORED TO ORIGINAL FROM FIRST TURN)
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


  // PDF Download Function (RESTORED TO ORIGINAL FROM FIRST TURN - DO NOT MODIFY)
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
      // Original Qty calculation based on index + 1
      const qty = String(index + 1).padStart(2, '0');
      // Original rate and amount usage
       const unitPrice = item.rate?.toFixed(2) || '0.00';
       const vat = (item.amount * 0.05).toFixed(2); // Original VAT calculation based on item.amount
       const total = (item.amount + parseFloat(vat)).toFixed(2); // Original Total calculation

      const desc = [
        item.itemName && `Diamond ${item.itemName}`,
        item.ct && `Diamond: ${item.ct} CT`,
        item.clarity && `Clarity: ${item.clarity}`,
        item.color && `Color: ${item.color}`,
        item.material && `Material: ${item.material}`,
        item.type && `${item.type} - ${item.weight} GM`,
      ].filter(Boolean).join('\n\n');


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

    // Original totals row structure in autoTable body
    tableBody.push([
      { content: '', colSpan: 4 },
      { content: 'Grand Total', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
      { content: formatCurrency(grandTotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Sl.No', 'Description', 'Qty', 'Unit Price', 'VAT 5%', 'Total']],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', halign: 'center', valign: 'middle' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 'auto' }, // Original 'auto' width
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 25 },
      },
      margin: { left: leftMargin, right: rightMargin },
       // Original didDrawCell logic
      didDrawCell: (data) => {
        doc.setLineWidth(0.1);
        doc.setDrawColor(180, 180, 180);
        if (data.column.index < data.table.columns.length - 1) {
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
        if (data.section === 'head') {
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
         // This condition targets the row *before* the last one (assuming the last one is Grand Total)
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

    // Original Amount in Words display
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
     // Original Y position calculation
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


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen"> {/* Use min-h-screen */}
        <div className="text-center text-xl font-semibold text-indigo-700">
           Loading invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800">
        All Invoices
      </h2> */}

      {invoices.length > 0 ? (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200"> {/* overflow-x-auto kept as fallback */}
          <table className="min-w-full bg-white border-collapse table-auto"> {/* table-auto lets columns size based on content */}
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-16 min-w-[4rem]">Inv No</th> {/* Abbreviated header, min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-20 min-w-[5rem]">Date</th> {/* Min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-32 min-w-[8rem]">Customer</th> {/* Abbreviated, min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-24 min-w-[6rem]">Phone</th> {/* Min-width */}
                <th className="py-3 px-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-12 min-w-[3rem]">Sl.No</th> {/* Narrow min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-24 min-w-[6rem]">Item Type</th> {/* Min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-32 min-w-[8rem]">Item Name</th> {/* Min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-20 min-w-[5rem]">Clarity</th> {/* Min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-16 min-w-[4rem]">CT</th> {/* Narrower min-width */}
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-16 min-w-[4rem]">Color</th> {/* Narrower min-width */}
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-20 min-w-[5rem]">Weight (g)</th> {/* Right align, min-width */}
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-24 min-w-[6rem]">Rate</th> {/* Right align, min-width */}
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-24 min-w-[6rem]">Amount</th> {/* Right align, min-width */}
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-24 min-w-[6rem]">Subtotal</th> {/* Right align, min-width */}
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-20 min-w-[5rem]">VAT (5%)</th> {/* Right align, min-width */}
                <th className="py-3 px-2 text-right text-xs font-medium text-green-700 uppercase tracking-wider border-b border-gray-200 font-bold w-24 min-w-[6rem]">Grand Total</th> {/* Right align, min-width */}
                <th className="py-3 px-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 w-24 min-w-[6rem]">Actions</th> {/* Min-width */}
              </tr>
            </thead>
            <tbody>
              {invoices.flatMap((invoice) =>
                invoice.items.map((item, index) => (
                  <tr
                    key={`${invoice._id}-${item._id || index}`} // Use unique ID if available, fallback to index
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    {/* Invoice level details (show only on the first item row) */}
                    {index === 0 ? (
                      <>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>{invoice.invoiceNumber}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>{invoice.customer.name}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>{invoice.customer.phone}</td>
                      </>
                    ) : (
                        // Render empty cells for subsequent rows within the same invoice
                        <>
                            <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                            <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                            <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                            <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                        </>
                    )}

                    {/* Item level details */}
                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-center">{index + 1}</td> {/* Serial number */}
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.type}
                    </td>
                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.itemName || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.clarity || '-'}
                    </td>
                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.ct || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.color || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right">
                      {item.weight ? item.weight.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right">
                      {formatAED(item.rate)} {/* Formatted & Right-aligned */}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right">
                      {formatAED(item.amount)} {/* Formatted & Right-aligned */}
                    </td>

                    {/* Total level details (show only on the first item row) */}
                    {index === 0 ? (
                      <>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right font-semibold" rowSpan={invoice.items.length}>
                          {formatAED(invoice.subtotal)} {/* Formatted & Right-aligned */}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right font-semibold" rowSpan={invoice.items.length}>
                          {formatAED(invoice.gstAmount)} {/* Formatted & Right-aligned */}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-green-700 border-r border-gray-200 text-right font-bold" rowSpan={invoice.items.length}>
                          {formatAED(invoice.grandTotal)} {/* Formatted & Right-aligned, green, bold */}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 text-center" rowSpan={invoice.items.length}>
                          <button
                            onClick={() => downloadInvoicePDF(invoice)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded-md text-xs transition duration-150 ease-in-out" {/* Smaller button */}
                          >
                            Download
                          </button>
                        </td>
                      </>
                    ) : (
                         // Render empty cells for subsequent rows within the same invoice
                        <>
                             <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                             <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                             <td className="px-2 py-2 border-r border-gray-200"></td> {/* Placeholder */}
                             <td className="px-2 py-2"></td> {/* Placeholder */}
                        </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center mt-10 text-gray-500 text-lg">
          No invoices found.
        </div>
      )}
    </div>
  );
};

export default ViewInvoices;