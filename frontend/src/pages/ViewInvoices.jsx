import { useEffect, useState } from 'react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure this is imported if you use it

const ViewInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Use the VITE_API_URL environment variable
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Sort by createdAt descending
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
  }, []); // Empty dependency array means this runs once on mount

  // Helper function for formatting AED currency for display in the table
  const formatAED = (amount) => {
    const number = parseFloat(amount);
    if (isNaN(number)) {
      return 'AED 0.00'; // Handle non-numeric input gracefully
    }
    // Use en-AE locale for UAE Dirham formatting
    return `AED ${number.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

   // Helper function (for PDF generation - KEPT AS IS)
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


    // 5. Convert Integer Part (Dirhams) to Words using Indian Numbering System (Assuming Indian standard for Crore/Lakh based on implementation)
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
    // Ensure "Dirhams" is added only if there are Dirhams
    if (adjustedIntegerPart > 0 || (adjustedIntegerPart === 0 && adjustedFilsPart > 0)) { // Add Dirhams even if only Fils are present, but not for zero
        dirhamWordsString += (dirhamWordsString ? ' ' : '') + 'Dirhams'; // Add space if words exist
    }


    // 6. Convert Fils Part to Words
    let filsWordsString = '';
    if (adjustedFilsPart > 0) {
      filsWordsString = convertChunkToWords(adjustedFilsPart) + ' Fils';
    }

    // 7. Combine Dirhams and Fils parts
    let finalWords = '';
    if (dirhamWordsString && adjustedIntegerPart > 0) { // Add Dirhams words only if integer part is > 0
        finalWords += dirhamWordsString;
    } else if (adjustedIntegerPart === 0 && adjustedFilsPart === 0) {
         return "Zero Dirhams Only"; // Explicitly handle zero case again after potential carry-over
    }


    if (filsWordsString) {
        if (finalWords) { // Add 'and' only if Dirhams words exist
            finalWords += ' and ';
        }
        finalWords += filsWordsString;
    }

    // If after all calculations, the result is empty (e.g., input was 0 but missed initial check), return zero
    if (!finalWords) { // This might happen if adjustedIntegerPart was 0 initially and filsPart was 0 after rounding
        return "Zero Dirhams Only";
    }


    // Add "Only" suffix
    return finalWords.trim() + ' Only';
  }


  // PDF Download Function (KEPT AS IS, MINOR REFACTORING FOR CLARITY/CONSISTENCY IF NEEDED BUT LOGIC PRESERVED)
  const downloadInvoicePDF = async (invoice) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = 14;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const rightAlignX = pageWidth - rightMargin;

    // Helper to load images
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error("Failed to load image:", src, err);
          resolve(null); // Resolve with null on error so PDF generation doesn't stop
        };
      });
    };

    let logo = null;
    let watermark = null;
    try {
      // Assuming these paths are correct relative to your public folder
      logo = await loadImage('/logo.png');
      watermark = await loadImage('/watermark1.png');
    } catch (error) {
      console.error("Error loading images for PDF:", error);
    }

    // Header Section
    let currentY = 12;
    if (logo) {
      doc.addImage(logo, 'PNG', leftMargin, currentY, 30, 30);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 153, 0); // Adjusted color based on common branding styles
    doc.setFontSize(12);
    doc.text('SKY DIAMOND DREAMS TRADING L.L.C', 55, currentY + 3); // Adjust Y position relative to logo top

    doc.setFontSize(10);
    doc.setTextColor(0); // Black text
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: +971 50 457 6948', 55, currentY + 8);
    doc.text('Email: info@skydiamonddreams.com', 55, currentY + 13);
    doc.text('B-3 Office No. 201, Al Muteena', 55, currentY + 18);
    doc.text('Al Muteena – B3, Dubai U.A.E', 55, currentY + 23);

    // Horizontal line below header
    doc.setDrawColor(169, 140, 61); // Adjusted color
    doc.setLineWidth(0.5);
    doc.line(leftMargin, currentY + 28, rightAlignX, currentY + 28);

    currentY = currentY + 35; // Move Y below the line

    // TRN and Invoice Details
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`TRN: 104783462500003`, leftMargin, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INVOICE', pageWidth / 2, currentY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`No: ${invoice?.invoiceNumber || 'N/A'}`, rightAlignX, currentY, { align: 'right' });

    const formattedDate = invoice?.date
      ? new Date(invoice.date).toLocaleDateString('en-GB').replace(/\//g, '.')
      : 'N/A';
    doc.text(`Date: ${formattedDate}`, rightAlignX, currentY + 7, { align: 'right' });

    currentY += 15; // Move Y below invoice details

    // Bill To Section
    doc.setFont('helvetica', 'bold');
    doc.text(`Bill to:`, leftMargin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice?.customer?.name ?? 'N/A'}`, leftMargin + 16, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Mobile No:`, leftMargin, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice?.customer?.phone ?? 'N/A'}`, leftMargin + 22, currentY + 6);

    currentY += 15; // Move Y below Bill To

    // Watermark (positioned mid-page)
    if (watermark) {
      const watermarkWidth = 120;
      const watermarkHeight = 120; // Assuming aspect ratio is roughly 1:1
      const watermarkX = (pageWidth - watermarkWidth) / 2;
      const watermarkY = (pageHeight - watermarkHeight) / 2 + 10; // Adjusted slightly up
      doc.addImage(watermark, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight, '', 'FAST');
    }

    // Currency format helper for PDF (local to this function)
    const formatCurrency = (num) => {
      const number = parseFloat(num);
      return typeof number === 'number' && !isNaN(number)
        ? number.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
    };

    // Table Section
    const tableStartY = currentY; // Start table below previous content
    const approxRowHeight = 8;
    const maxTableRows = Math.floor((pageHeight - 50 - tableStartY) / approxRowHeight); // Leave space at bottom

    const tableBody = invoice.items.map((item, index) => {
       // Use item properties directly for description
      const desc = [
        item.type && `${item.type}`, // Start with item type
        item.itemName && `${item.itemName}`, // Add item name
        item.ct && `CT: ${item.ct}`,
        item.clarity && `Clarity: ${item.clarity}`,
        item.color && `Color: ${item.color}`,
        item.material && `Material: ${item.material}`,
        // Assuming weight is always present for certain types, otherwise make conditional
        // if (item.type !== 'Diamond') item.weight && `Weight: ${item.weight} GM`,
        item.weight && `Weight: ${item.weight} GM`, // Assuming weight is relevant for all item types displayed this way
      ].filter(Boolean).join(', '); // Join with comma and space

       // Calculate item total *before* adding to body for VAT calculation in table structure
       // Assume item.amount is the amount *before* VAT based on table body mapping below
       const itemAmountBeforeVAT = parseFloat(item.amount || 0);
       const vatAmountPerItem = (itemAmountBeforeVAT * 0.05);
       const totalPerItemIncludingVAT = itemAmountBeforeVAT + vatAmountPerItem;


       return [
        (index + 1).toString(), // Sl.No
        desc || 'No Description', // Description
        '1', // Assuming Qty is always 1 per line item entry as per description style
        formatCurrency(item.rate || 0), // Unit Price (Assuming item.rate is pre-VAT unit price)
        formatCurrency(vatAmountPerItem), // VAT 5% (Calculated based on item.amount)
        formatCurrency(totalPerItemIncludingVAT) // Total (Amount + VAT per item)
      ];
    });

     // Calculate totals for display in the summary row
    const subtotal = invoice?.subtotal || 0; // Assuming subtotal is provided in invoice object
    const vatAmount = invoice?.gstAmount || 0; // Assuming gstAmount is provided in invoice object
    const grandTotal = invoice?.grandTotal || 0; // Assuming grandTotal is provided in invoice object

    // Add blank rows if needed to ensure consistent table height (optional, can be removed)
    // This part can sometimes push content to the next page unnecessarily if maxTableRows is miscalculated.
    // Let's simplify and remove blank rows for now for more reliable layout.
    // If consistent height is strictly needed, recalculate maxTableRows based on available space.
    // const blankRowsNeeded = Math.max(0, maxTableRows - tableBody.length - 1); // -1 for the totals row
    // for (let i = 0; i < blankRowsNeeded; i++) tableBody.push(['', '', '', '', '', '']);


    // Add Totals Row(s) - Adjusted to match structure
    // The original code placed Grand Total *under* VAT, let's replicate that arrangement
    const totalsRow = [
         { content: 'Subtotal', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
         { content: formatCurrency(subtotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ];
    const vatRow = [
        { content: 'VAT 5%', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: formatCurrency(vatAmount), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ];
     const grandTotalRow = [
        { content: 'Grand Total', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: formatCurrency(grandTotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } }
    ];


    // Add empty cells to align totals columns to the rightmost side
    // Assuming 6 columns in total: Sl.No, Description, Qty, Unit Price, VAT 5%, Total
    // Subtotal, VAT, Grand Total should appear under the rightmost columns.
    // They take 2 columns total (Label + Value)
    const emptyCellsForTotals = Array(6 - 2).fill(''); // 4 empty cells
    const finalBody = [
        ...tableBody,
        [...emptyCellsForTotals, ...totalsRow],
        [...emptyCellsForTotals, ...vatRow],
        [...emptyCellsForTotals, ...grandTotalRow]
    ];


    autoTable(doc, {
      startY: tableStartY,
      head: [['Sl.No', 'Description', 'Qty', 'Unit Price', 'VAT 5%', 'Total']],
      body: finalBody, // Use the modified body with totals
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, valign: 'top' },
      headStyles: {
          fillColor: [240, 240, 240],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          textColor: [0,0,0] // Ensure header text is black
        },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // Sl.No
        1: { cellWidth: 60 }, // Description - increased width slightly
        2: { halign: 'center', cellWidth: 14 }, // Qty
        3: { halign: 'right', cellWidth: 22 }, // Unit Price
        4: { halign: 'right', cellWidth: 22 }, // VAT 5%
        5: { halign: 'right', cellWidth: 25 }, // Total
         // Styles for the totals rows - applied based on column index relative to the row
         // Need to ensure these apply only to the last 3 rows
      },
      didParseCell: (data) => {
          // Apply specific styles to the totals rows
          const totalRows = finalBody.length;
          const currentRow = data.row.index;
          if (currentRow >= totalRows - 3) { // Last 3 rows are totals
               if (data.column.index === 6 - 2) { // The label column (e.g., 'Grand Total')
                  data.cell.styles.halign = 'right';
                  data.cell.styles.fontStyle = 'bold';
                  data.cell.styles.fontSize = 9;
               } else if (data.column.index === 6 - 1) { // The value column (e.g., 'AED 3,400.00')
                   data.cell.styles.halign = 'right';
                   data.cell.styles.fontStyle = 'bold'; // Make value bold too
                   data.cell.styles.fontSize = 9;
                   // Apply green color to Grand Total value only
                   if (currentRow === totalRows - 1) { // Last row is Grand Total
                       data.cell.styles.textColor = [27, 107, 45]; // Darker green
                   }
               }
          }
      },
      didDrawCell: (data) => {
          // Custom borders
          doc.setLineWidth(0.1);
          doc.setDrawColor(180, 180, 180); // Light grey border color

          const totalRows = finalBody.length;
          const currentRow = data.row.index;
          const isTotalsRow = currentRow >= totalRows - 3;
          const isGrandTotalRow = currentRow === totalRows - 1;
          const isLastTotalRow = currentRow === totalRows -1;


          if (data.section === 'head') {
               // Top border for the head
               if (data.row.index === 0) doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
               // Bottom border for the head
               doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          } else if (data.section === 'body') {
              // Vertical borders between columns for body
              doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
              if (data.column.index === data.table.columns.length - 1) {
                 doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
              }

              // Bottom border for each body row EXCEPT the totals rows
              if (!isTotalsRow) {
                   doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
              } else {
                 // Draw specific borders for totals rows
                 if (data.column.index >= 6 - 2) { // Only draw borders for the totals columns themselves
                     doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height); // Left border for totals cells
                     doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height); // Right border for totals cells
                     // Draw bottom border for all totals rows (Subtotal, VAT, Grand Total)
                     doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                 }
                  if (currentRow === totalRows - 3 && data.column.index >= 6 - 2) { // Top border for the first totals row (Subtotal)
                      doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                  }

              }
          }
      },
      margin: { left: leftMargin, right: rightMargin },
    });

    const finalTableY = doc.lastAutoTable.finalY;
    const amountInWords = getAmountInWords(grandTotal);

    // Amount in Words Section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
    // Ensure the Y position is just below the table, and use a small margin
    doc.text(`Amount in words: ${amountInWords}`, leftMargin, finalTableY + 8);

    // Footer Section (Signature Line)
    const bottomLineY = pageHeight - 20; // Position from bottom
    doc.setDrawColor(169, 140, 61); // Adjusted color
    doc.setLineWidth(0.5);
    doc.line(leftMargin, bottomLineY, rightAlignX, bottomLineY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150); // Grey text
    doc.text('Authorised Signature / Stamp', rightAlignX, bottomLineY + 5, { align: 'right' });


    // Save the PDF
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
      <div className="flex justify-center items-center h-screen"> {/* Center in viewport */}
        <div className="text-center text-xl font-semibold text-indigo-700">
           Loading invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10"> {/* Improved padding */}
      <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800"> {/* Larger, bolder title */}
        All Invoices
      </h2>

      {invoices.length > 0 ? (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200"> {/* Added shadow and border */}
          <table className="min-w-full bg-white border-collapse"> {/* Use border-collapse */}
            <thead className="bg-gray-100"> {/* Lighter header background */}
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Invoice No</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Customer Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Phone</th>
                 {/* Changed 'Qty' to 'Sl.No' to match PDF and likely intent */}
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Sl.No</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Item Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Item Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Clarity</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">CT</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Color</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Weight (g)</th> {/* Right align weight */}
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Rate</th> {/* Right align currency */}
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Amount</th> {/* Right align currency */}
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Subtotal</th> {/* Right align currency */}
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">VAT (5%)</th> {/* Right align currency */}
                <th className="py-3 px-4 text-right text-xs font-medium text-green-700 uppercase tracking-wider border-b border-gray-200 font-bold">Grand Total</th> {/* Right align currency, bolder */}
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.flatMap((invoice) =>
                invoice.items.map((item, index) => (
                  <tr
                    key={`${invoice._id}-${item._id}`} // Use actual unique IDs if available, otherwise composite
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} // Alternating row colors
                  >
                    {/* Invoice level details (show only on the first item row) */}
                    {index === 0 ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>
                          {new Date(invoice.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>
                          {invoice.customer.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200" rowSpan={invoice.items.length}>
                          {invoice.customer.phone}
                        </td>
                      </>
                    ) : (
                        // Render empty cells for subsequent rows within the same invoice
                        <>
                            <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for Invoice No */}
                            <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for Date */}
                            <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for Customer Name */}
                            <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for Phone */}
                        </>
                    )}


                    {/* Item level details */}
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-center">
                        {index + 1} {/* Serial number */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.type}
                    </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.itemName || '-'} {/* Display Item Name, show '-' if null */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.clarity || '-'} {/* Display Clarity, show '-' if null */}
                    </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.ct || '-'} {/* Display CT, show '-' if null */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                      {item.color || '-'} {/* Display Color, show '-' if null */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right">
                      {item.weight ? item.weight.toFixed(2) : '0.00'} {/* Display Weight, formatted */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right">
                      {formatAED(item.rate)} {/* Formatted & Right-aligned */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right">
                      {formatAED(item.amount)} {/* Formatted & Right-aligned */}
                    </td>

                    {/* Total level details (show only on the first item row) */}
                    {index === 0 ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right font-semibold" rowSpan={invoice.items.length}>
                          {formatAED(invoice.subtotal)} {/* Formatted & Right-aligned */}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 text-right font-semibold" rowSpan={invoice.items.length}>
                          {formatAED(invoice.gstAmount)} {/* Formatted & Right-aligned */}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 border-r border-gray-200 text-right font-bold" rowSpan={invoice.items.length}>
                          {formatAED(invoice.grandTotal)} {/* Formatted & Right-aligned, green, bold */}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-center" rowSpan={invoice.items.length}>
                          <button
                            onClick={() => downloadInvoicePDF(invoice)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm transition duration-150 ease-in-out" // Added hover and transition
                          >
                            Download
                          </button>
                        </td>
                      </>
                    ) : (
                         // Render empty cells for subsequent rows within the same invoice
                        <>
                             <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for Subtotal */}
                             <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for VAT */}
                             <td className="px-4 py-3 border-r border-gray-200"></td> {/* Placeholder for Grand Total */}
                             <td className="px-4 py-3"></td> {/* Placeholder for Actions */}
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