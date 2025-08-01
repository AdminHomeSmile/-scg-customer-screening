// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Thailand Address Autocomplete
    initializeThailandAddressAutocomplete();
    
    // Set up event listeners for all forms
    setupEventListeners();
    
    // For demo purposes, set a random booth ID
    document.getElementById('boothId').textContent = 'SCG-' + Math.floor(1000 + Math.random() * 9000);
});

// Initialize Thailand Address Autocomplete
function initializeThailandAddressAutocomplete() {
    if ($.Thailand) {
        $.Thailand({
            database: 'https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/database/db.json',
            $district: $('#subdistrict'),
            $amphoe: $('#district'),
            $province: $('#province'),
            $zipcode: $('#postalCode'),
            onDataFill: function(data) {
                console.log('Address data filled:', data);
            }
        });
    } else {
        console.warn('Thailand address autocomplete library not loaded.');
        // Fallback to manual entry
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Service selection buttons
    document.getElementById('newRoofBtn').addEventListener('click', function() {
        showScreen('newRoofForm');
    });
    
    document.getElementById('renovationBtn').addEventListener('click', function() {
        showScreen('renovationForm');
    });
    
    document.getElementById('metalRoofBtn').addEventListener('click', function() {
        showScreen('metalRoofForm');
    });
    
    // Back button on contact form
    document.getElementById('contactBackBtn').addEventListener('click', function() {
        const previousForm = sessionStorage.getItem('previousForm') || 'serviceSelection';
        showScreen(previousForm);
    });
    
    // Form submission handler
    document.getElementById('contactFormData').addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
    
    // "Other" field toggles
    setupOtherFieldToggling();
}

// Setup handlers for "Other" field toggles
function setupOtherFieldToggling() {
    // New Roof - Construction Plan
    document.getElementById('planOther').addEventListener('change', function() {
        toggleOtherField('planOther', 'otherPlan');
    });
    
    // Renovation - House Type
    document.getElementById('houseTypeOther').addEventListener('change', function() {
        toggleOtherField('houseTypeOther', 'otherHouseType');
    });
    
    // Renovation - Roof Problems
    document.getElementById('problemOther').addEventListener('change', function() {
        toggleOtherField('problemOther', 'otherProblem');
    });
    
    // Metal Roof - House Type
    document.getElementById('metalHouseTypeOther').addEventListener('change', function() {
        toggleOtherField('metalHouseTypeOther', 'metalOtherHouseType');
    });
    
    // Metal Roof - Roof Problems
    document.getElementById('metalProblemOther').addEventListener('change', function() {
        toggleOtherField('metalProblemOther', 'metalOtherProblem');
    });
    
    // Customer Type
    document.getElementById('customerType4').addEventListener('change', function() {
        toggleOtherField('customerType4', 'otherCustomerType');
    });
}

// Toggle visibility of "Other" input fields
function toggleOtherField(triggerElementId, targetElementId) {
    const triggerElement = document.getElementById(triggerElementId);
    const targetElement = document.getElementById(targetElementId);
    
    if (triggerElement.checked) {
        targetElement.classList.remove('hidden');
        targetElement.required = true;
    } else {
        targetElement.classList.add('hidden');
        targetElement.required = false;
    }
}

// Show a specific screen and hide others
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    document.getElementById(screenId).classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show the contact form and store the previous form ID
function showContactForm(formId) {
    // Save the service form data to be combined later
    sessionStorage.setItem('serviceFormData', JSON.stringify(collectFormData(formId)));
    sessionStorage.setItem('previousForm', formId);
    
    // Show the contact form
    showScreen('contactForm');
}

// Collect form data as an object
function collectFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};
    
    // Special handling for checkboxes (multiple values)
    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
    const checkboxNames = new Set();
    checkboxes.forEach(checkbox => {
        checkboxNames.add(checkbox.name);
    });
    
    // For each checkbox name, collect all checked values
    checkboxNames.forEach(name => {
        const values = [];
        form.querySelectorAll(`input[name="${name}"]:checked`).forEach(checkbox => {
            values.push(checkbox.value);
        });
        data[name] = values.join(', ');
    });
    
    // Process other form fields
    for (const [key, value] of formData.entries()) {
        // Skip checkboxes as they've been handled separately
        if (!checkboxNames.has(key)) {
            data[key] = value;
        }
    }
    
    // Add timestamp
    data['timestamp'] = new Date().toISOString();
    
    return data;
}

// Submit the complete form
function submitForm() {
    // Show loading overlay
    document.getElementById('loadingOverlay').classList.add('active');
    
    // Collect service form data from session storage
    const serviceData = JSON.parse(sessionStorage.getItem('serviceFormData') || '{}');
    
    // Collect contact form data
    const contactData = collectFormData('contactFormData');
    
    // Combine the data
    const completeData = { ...serviceData, ...contactData };
    
    // Send the data to Google Apps Script
    fetch('https://script.google.com/macros/s/AKfycbzFxwXUunanVErUn6BvYD6Sot7hpCPo1AatutY7oLTVWS4jAAnKsAdGAcGX7Kesu7v9yQ/exec', {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(completeData)
    })
    .then(response => {
        // Since mode is no-cors, we can't access the response
        // Wait for a reasonable time then assume success
        setTimeout(() => {
            // Hide loading overlay
            document.getElementById('loadingOverlay').classList.remove('active');
            
            // Show success screen
            showScreen('successScreen');
            
            // Clear session storage
            sessionStorage.removeItem('serviceFormData');
            sessionStorage.removeItem('previousForm');
        }, 2000);
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        
        // Hide loading overlay
        document.getElementById('loadingOverlay').classList.remove('active');
        
        // Show error message
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
    });
}

// Reset the application to initial state
function resetApp() {
    // Clear all form inputs
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.reset();
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    // Show the service selection screen
    showScreen('serviceSelection');
}