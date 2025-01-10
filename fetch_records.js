/**
 * Example Node.js script to scrape paginated data using:
 * 1. A POST form submission
 * 2. Simple regex-based parsing
 *
 * Replace placeholders (URL, cookie, etc.) with actual values.
 */

const fetch = require('node-fetch');
const fs = require('fs');

// Placeholder constants - update these for your needs
const TARGET_URL = 'https://example.com/someEndpoint';  // The URL accepting POST data
const PLACEHOLDER_COOKIE = 'YOUR_COOKIE_HERE';          // Cookie from your authenticated session
const TOTAL_RECORDS = 100;                              // Total records to fetch (if known)
const RECORDS_PER_PAGE = 50;                            // Records returned per page
const SORT_COLUMN = 'LastName';                         // Example field for sorting
const SORT_ORDER = 'ASC';                               // Example sort order

/**
 * Fetch one page of data by posting form fields.
 * @param {number} startRow - Index of the first record on the current page.
 * @returns {Promise<string>} Raw HTML response.
 */
async function fetchPage(startRow) {
  // Prepare form data
  const formData = new URLSearchParams();
  formData.append('SortCol', SORT_COLUMN);
  formData.append('SortOrder', SORT_ORDER);
  formData.append('StartRow', startRow);

  // Make the POST request
  const response = await fetch(TARGET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': PLACEHOLDER_COOKIE, // Cookie for auth session
      'User-Agent': 'Mozilla/5.0 (compatible; NodeFetchBot/1.0)'
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.text();
}

/**
 * Extracts relevant data from each HTML table row.
 * @param {string} html - The raw HTML string.
 * @returns {Array<object>} Array of record objects.
 */
function extractData(html) {
  // Simple regex to match table rows & cells
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/g;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
  
  const rows = html.match(rowRegex) || [];
  const data = [];

  for (const row of rows) {
    const cells = [...row.matchAll(cellRegex)].map(match => match[1].trim());
    if (cells.length >= 4) {
      data.push({
        column1: cells[0],
        column2: cells[1],
        column3: cells[2],
        column4: cells[3]
      });
    }
  }
  return data;
}

/**
 * Iterates through all pages using known total records and page size.
 * Logs results and saves them to `member_records.txt`.
 */
async function getAllRecords() {
  const totalPages = Math.ceil(TOTAL_RECORDS / RECORDS_PER_PAGE);
  const allData = [];

  for (let page = 1; page <= totalPages; page++) {
    const startRow = (page - 1) * RECORDS_PER_PAGE + 1;
    console.log(`Fetching page ${page} of ${totalPages}`);

    try {
      // Get HTML for the current page
      const pageContent = await fetchPage(startRow);
      // Extract relevant fields from this page
      const pageData = extractData(pageContent);

      // Log each record
      pageData.forEach(record => {
        console.log(`${record.column1}, ${record.column2}, ${record.column3}, ${record.column4}`);
      });

      // Add this page’s records to the big array
      allData.push(...pageData);

      // Save progress to a file each time (or only at the end—your choice)
      const output = allData.map(record =>
        `${record.column1}, ${record.column2}, ${record.column3}, ${record.column4}`
      ).join('\n');
      fs.writeFileSync('member_records.txt', output);

      // Throttle requests slightly to avoid server overload or detection
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
    }
  }

  console.log(`\nDone! Saved ${allData.length} records to member_records.txt`);
}

// Optional: auto-install dependencies if no 'node_modules' folder is found
if (!fs.existsSync('node_modules')) {
  console.log('Installing required packages...');
  require('child_process').execSync('npm init -y && npm install node-fetch@2', { stdio: 'inherit' });
}

// Run main function
getAllRecords().catch(console.error);
