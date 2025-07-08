// Payment functionality

// Elements for payment page
const paymentSummary = document.getElementById('payment-summary');
const cardForm = document.getElementById('card-form');
const paymentOptions = document.querySelectorAll('.payment-option');
const cardDetailsSection = document.getElementById('card-details');
const paymentButton = document.getElementById('btn-payment');

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    requireAuth()
        .then(user => {
            // User is authenticated, check for booking details
            const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));
            
            if (!bookingDetails) {
                // No booking details found, redirect to home
                window.location.href = 'index.html';
                return;
            }
            
            // Display payment summary
            displayPaymentSummary(bookingDetails);
            
            // Set up payment options
            setupPaymentOptions();
            
            // Set up payment button
            if (paymentButton) {
                paymentButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    processPayment(bookingDetails, user);
                });
            }
        })
        .catch(error => {
            console.error('Auth error:', error);
        });
});

// Display payment summary
function displayPaymentSummary(bookingDetails) {
    if (!paymentSummary) return;
    
    const { flightSearch, selectedFlight, passengers, totalPrice } = bookingDetails;
    
    paymentSummary.innerHTML = `
        <h3>Booking Summary</h3>
        <div class="booking-info">
            <div class="booking-detail">
                <span class="detail-label">Flight:</span>
                <span class="detail-value">${selectedFlight.airline} ${selectedFlight.flightNumber}</span>
            </div>
            <div class="booking-detail">
                <span class="detail-label">From:</span>
                <span class="detail-value">${flightSearch.fromCity} (${flightSearch.fromAirport})</span>
            </div>
            <div class="booking-detail">
                <span class="detail-label">To:</span>
                <span class="detail-value">${flightSearch.toCity} (${flightSearch.toAirport})</span>
            </div>
            <div class="booking-detail">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(flightSearch.departureDate)}</span>
            </div>
            <div class="booking-detail">
                <span class="detail-label">Class:</span>
                <span class="detail-value">${capitalizeFirstLetter(flightSearch.travelClass)}</span>
            </div>
            <div class="booking-detail">
                <span class="detail-label">Passengers:</span>
                <span class="detail-value">${passengers.length}</span>
            </div>
            <div class="booking-detail total-price">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">$${totalPrice}</span>
            </div>
        </div>
    `;
}

// Set up payment options
function setupPaymentOptions() {
    if (!paymentOptions.length) return;
    
    // Set credit card as default payment method
    document.querySelector('.payment-option').classList.add('selected');
    
    // Add click event listener to payment options
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Show/hide card details based on selected payment method
            const paymentMethod = this.getAttribute('data-method');
            if (paymentMethod === 'card') {
                cardDetailsSection.style.display = 'block';
            } else {
                cardDetailsSection.style.display = 'none';
            }
        });
    });
}

// Process payment
function processPayment(bookingDetails, user) {
    // Get selected payment method
    const selectedPaymentMethod = document.querySelector('.payment-option.selected');
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    const paymentMethod = selectedPaymentMethod.getAttribute('data-method');
    
    // Validate form if credit card is selected
    if (paymentMethod === 'card' && !validateCardForm()) {
        alert('Please fill in all required card details');
        return;
    }
    
    // Show loader
    const paymentLoader = document.getElementById('payment-loader');
    if (paymentLoader) paymentLoader.style.display = 'block';
    if (paymentButton) paymentButton.disabled = true;
    
    // In a real application, we would process the payment with a payment gateway
    // For demonstration, we'll simulate payment processing
    setTimeout(() => {
        // Create booking in Firestore
        createBooking(bookingDetails, user, paymentMethod)
            .then(bookingId => {
                // Hide loader
                if (paymentLoader) paymentLoader.style.display = 'none';
                if (paymentButton) paymentButton.disabled = false;
                
                // Show success message
                showPaymentSuccess(bookingId);
            })
            .catch(error => {
                console.error('Error creating booking:', error);
                
                // Hide loader
                if (paymentLoader) paymentLoader.style.display = 'none';
                if (paymentButton) paymentButton.disabled = false;
                
                // Show error message
                alert('Payment failed. Please try again.');
            });
    }, 2000);
}

// Create booking in Firestore
async function createBooking(bookingDetails, user, paymentMethod) {
    const bookingData = {
        userId: user.uid,
        flightId: bookingDetails.flightId,
        passengers: bookingDetails.passengers.length,
        seatsBooked: bookingDetails.passengers.length,
        flightDetails: {
            airline: bookingDetails.selectedFlight.airline,
            flightNumber: bookingDetails.selectedFlight.flightNumber,
            departure: {
                airport: bookingDetails.flightSearch.fromAirport,
                city: bookingDetails.flightSearch.fromCity,
                date: bookingDetails.flightSearch.departureDate,
                time: bookingDetails.selectedFlight.departureTime
            },
            arrival: {
                airport: bookingDetails.flightSearch.toAirport,
                city: bookingDetails.flightSearch.toCity,
                time: bookingDetails.selectedFlight.arrivalTime
            },
            duration: bookingDetails.selectedFlight.duration,
            class: bookingDetails.flightSearch.travelClass
        },
        passengers: bookingDetails.passengers,
        contactDetails: {
            email: bookingDetails.contactEmail,
            phone: bookingDetails.contactPhone
        },
        payment: {
            amount: bookingDetails.totalPrice,
            currency: 'USD',
            method: paymentMethod,
            status: 'completed',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        },
        status: 'confirmed',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add booking to Firestore
    return db.collection('bookings').add(bookingData)
        .then(docRef => {
            const bookingId = docRef.id;
            console.log('Booking created with ID:', bookingId);
            
            // Store booking in localStorage for dashboard display
            // This helps with Firebase permission issues
            try {
                localStorage.setItem('recentBooking', JSON.stringify({
                    bookingId: bookingId,
                    booking: bookingData
                }));
            } catch (error) {
                console.warn('Failed to save booking to localStorage:', error);
            }
            
            return bookingId;
        });
    //await db.collection('bookings').add(bookingData);
}

// Show payment success message
function showPaymentSuccess(bookingId) {
    const paymentContainer = document.querySelector('.payment-container');
    if (!paymentContainer) return;
    
    // Add animation class to container before changing content
    paymentContainer.classList.add('success-animation');
    
    paymentContainer.innerHTML = `
        <div class="payment-success">
            <div class="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#34a853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2>Payment Successful!</h2>
            <p class="success-message">Your booking has been confirmed and is ready for your trip!</p>
            <div class="booking-info">
                <p>Booking Reference: <strong>${bookingId}</strong></p>
                <p>A confirmation email has been sent to your email address.</p>
                <p>Save your booking reference for future reference.</p>
            </div>
            <div class="success-actions">
                <a href="dashboard.html" class="btn-primary">View My Bookings</a>
                <a href="index.html" class="btn-secondary">Return to Home</a>
            </div>
        </div>
    `;
    
    // Clear booking details from session storage
    sessionStorage.removeItem('bookingDetails');
    sessionStorage.removeItem('flightSearch');
    sessionStorage.removeItem('mockFlights');
}

// Validate card form
function validateCardForm() {
    if (!cardForm) return true;
    
    // Check all required fields have some value (any value is acceptable)
    const requiredFields = cardForm.querySelectorAll('[required]');
    for (const field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            return false;
        }
    }
    
    // Only validate that card number has 16 digits
    const cardNumber = document.getElementById('card-number');
    if (cardNumber) {
        const digitsOnly = cardNumber.value.replace(/\D/g, ''); // Remove all non-digits
        if (digitsOnly.length !== 16) {
            alert('Please enter a 16-digit card number (any numbers are accepted)');
            cardNumber.focus();
            return false;
        }
    }
    
    // No other validations for testing purposes
    return true;
}

// Format date to display in a readable format
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
