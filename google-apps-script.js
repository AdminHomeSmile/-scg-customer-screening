/**
 * SCG Customer Screening Data Handler
 * This script processes incoming form submissions from the SCG Customer Screening web app,
 * saves data to Google Sheets, and sends email notifications based on predefined rules.
 * 
 * Google Drive ID: 1w0fspK-wFDCY5X3pAiXYVVgCTIS2APek
 * Google Sheet ID: 1ewzpxe7hOfgwP3400QPj8Y0SG91dgGFnUpitgGH7sn4
 * Sheet Name: Lead
 */

// Set up global constants
const SPREADSHEET_ID = '1ewzpxe7hOfgwP3400QPj8Y0SG91dgGFnUpitgGH7sn4';
const SHEET_NAME = 'Lead';

/**
 * Handle POST requests from the web application
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Save data to Google Sheets
    saveToSheet(data);
    
    // Send email notifications based on service type and location
    sendEmailNotifications(data);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error processing request: ' + error.toString());
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing the deployment)
 */
function doGet() {
  return ContentService
    .createTextOutput('SCG Customer Screening Data Handler is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Save the form data to Google Sheets
 */
function saveToSheet(data) {
  // Open the spreadsheet and get the Lead sheet
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // If this is the first entry, add headers
  if (sheet.getLastRow() === 0) {
    const headers = getHeadersFromData(data);
    sheet.appendRow(headers);
  }
  
  // Get current headers to ensure data alignment
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Create a row of data aligned with headers
  const rowData = headers.map(header => data[header] || '');
  
  // Append the data row
  sheet.appendRow(rowData);
  
  Logger.log('Data saved to Google Sheets successfully');
}

/**
 * Extract headers from the data object
 */
function getHeadersFromData(data) {
  return Object.keys(data);
}

/**
 * Send email notifications based on service type and location
 */
function sendEmailNotifications(data) {
  const serviceType = data.serviceType;
  const district = data.district || '';
  const province = data.province || '';
  
  // Prepare email subject and body
  const subject = `SCG Lead Notification: ${serviceType} - ${data.fullName}`;
  const body = createEmailBody(data);
  
  // Define recipient lists
  let recipients = [];
  let ccRecipients = [];
  
  // Service-specific email routing
  if (serviceType === 'New Roof Installation') {
    // For New Roof Installation
    recipients.push('worapote@scg.com');
    
  } else if (serviceType === 'Roof Renovation') {
    // For Roof Renovation, route by district/province
    
    // Add default recipients for Roof Renovation
    ccRecipients.push('maytawek@scg.com');
    
    // Check district for specific recipient routing
    if (isInWanchalimArea(district, province)) {
      recipients.push('WANCHALH@SCG.COM');
    } else if (isInTadaArea(district, province)) {
      recipients.push('TADTISAN@SCG.COM');
    } else if (isInPrayadArea(district, province)) {
      recipients.push('PRAYADKE@SCG.COM');
    }
    
  } else if (serviceType === 'SCG Metal Roof Replacement') {
    // For SCG Metal Roof Replacement
    recipients = ['narinint@scg.com', 'kridsana@scg.com', 'nipontun@scg.com'];
    ccRecipients = ['thansaeu@scg.com'];
  }
  
  // Send the email if there are recipients
  if (recipients.length > 0) {
    sendEmail(recipients, ccRecipients, subject, body);
    Logger.log('Email notification sent to: ' + recipients.join(', '));
  } else {
    Logger.log('No recipients determined for email notification');
  }
}

/**
 * Create email body from the form data
 */
function createEmailBody(data) {
  let body = '<h2>SCG Customer Lead Information</h2>';
  body += '<table style="border-collapse: collapse; width: 100%;">';
  
  // Add service information section
  body += '<tr><th colspan="2" style="background-color: #0066b3; color: white; padding: 10px; text-align: left;">Service Information</th></tr>';
  body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 30%;">Service Type</td><td style="border: 1px solid #ddd; padding: 8px;">${data.serviceType || ''}</td></tr>`;
  
  // Add specific service details based on service type
  if (data.serviceType === 'New Roof Installation') {
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">House Area</td><td style="border: 1px solid #ddd; padding: 8px;">${data.houseArea || ''} ตร.ม.</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Package</td><td style="border: 1px solid #ddd; padding: 8px;">${data.package || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Construction Status</td><td style="border: 1px solid #ddd; padding: 8px;">${data.constructionStatus || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Construction Plan</td><td style="border: 1px solid #ddd; padding: 8px;">${data.constructionPlan === 'อื่นๆ' ? data.otherPlan : data.constructionPlan || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Budget</td><td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(data.budget) || ''}</td></tr>`;
  } else if (data.serviceType === 'Roof Renovation') {
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">House Type</td><td style="border: 1px solid #ddd; padding: 8px;">${data.houseType === 'อื่นๆ' ? data.otherHouseType : data.houseType || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Roof Problems</td><td style="border: 1px solid #ddd; padding: 8px;">${data.roofProblems || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Service Interest</td><td style="border: 1px solid #ddd; padding: 8px;">${data.serviceInterest || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Roof Area</td><td style="border: 1px solid #ddd; padding: 8px;">${data.roofArea || ''} ตร.ม.</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Renovation Budget</td><td style="border: 1px solid #ddd; padding: 8px;">${data.renovationBudget || ''} บาท</td></tr>`;
  } else if (data.serviceType === 'SCG Metal Roof Replacement') {
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">House Type</td><td style="border: 1px solid #ddd; padding: 8px;">${data.houseType === 'อื่นๆ' ? data.otherHouseType : data.houseType || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Roof Problems</td><td style="border: 1px solid #ddd; padding: 8px;">${data.roofProblems || ''}</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Roof Area</td><td style="border: 1px solid #ddd; padding: 8px;">${data.roofArea || ''} ตร.ม.</td></tr>`;
    body += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Replacement Budget</td><td style="border: 1px solid #ddd; padding: 8px;"