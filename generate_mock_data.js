import * as XLSX from 'xlsx';
import fs from 'fs';

const generateMockData = () => {
  const data = [];
  const products = ['Smartphone X', 'Laptop Pro', 'Wireless Earbuds', 'Smartwatch Series 5', '4K Monitor', 'Gaming Mouse'];
  const basePrices = {
    'Smartphone X': 899,
    'Laptop Pro': 1299,
    'Wireless Earbuds': 149,
    'Smartwatch Series 5': 299,
    '4K Monitor': 399,
    'Gaming Mouse': 59
  };

  const startDate = new Date(2023, 0, 1);
  const endDate = new Date(2023, 11, 31);

  // Generate 200 random sales records
  for (let i = 0; i < 200; i++) {
    const pInfo = products[Math.floor(Math.random() * products.length)];
    const price = basePrices[pInfo];
    const qty = Math.floor(Math.random() * 5) + 1; // 1 to 5 items
    
    // Random date between Jan 1 and Dec 31
    const tTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const date = new Date(tTime);
    // Format YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      Date: dateStr,
      Product: pInfo,
      Price: price,
      Quantity: qty,
      'Total Revenue': price * qty,
      Region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)]
    });
  }

  // Sort by date
  data.sort((a, b) => new Date(a.Date) - new Date(b.Date));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales Data");

  XLSX.writeFile(wb, "mock_sales_data.xlsx");
  console.log("mock_sales_data.xlsx generated successfully.");
};

generateMockData();
