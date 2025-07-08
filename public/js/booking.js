// Booking functionality

// Elements for booking form
const passengerForm = document.getElementById('passenger-form');
const flightSummary = document.getElementById('flight-summary');
const bookingButton = document.getElementById('btn-booking');

// Initialize booking page
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
            
            // Display flight summary
            displayFlightSummary(bookingDetails);
            
            // Set up passenger form
            setupPassengerForm(bookingDetails.flightSearch.passengers);
            
            // Set up booking button
            if (bookingButton) {
                bookingButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    processBooking(bookingDetails);
                });
            }
        })
        .catch(error => {
            console.error('Auth error:', error);
        });
});

// Display flight summary
function displayFlightSummary(bookingDetails) {
    if (!flightSummary) return;
    
    const { flightSearch, selectedFlight, price } = bookingDetails;
    
    flightSummary.innerHTML = `
        <h3>Flight Summary</h3>
        <div class="flight-info">
            <div class="flight-detail">
                <span class="detail-label">Flight:</span>
                <span class="detail-value">${selectedFlight.airline} ${selectedFlight.flightNumber}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">From:</span>
                <span class="detail-value">${flightSearch.fromCity} (${flightSearch.fromAirport})</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">To:</span>
                <span class="detail-value">${flightSearch.toCity} (${flightSearch.toAirport})</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(flightSearch.departureDate)}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Departure:</span>
                <span class="detail-value">${selectedFlight.departureTime}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Arrival:</span>
                <span class="detail-value">${selectedFlight.arrivalTime}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${selectedFlight.duration}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Class:</span>
                <span class="detail-value">${capitalizeFirstLetter(flightSearch.travelClass)}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Passengers:</span>
                <span class="detail-value">${flightSearch.passengers}</span>
            </div>
            <div class="flight-detail">
                <span class="detail-label">Price per passenger:</span>
                <span class="detail-value">$${price}</span>
            </div>
            <div class="flight-detail total-price">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">$${price * flightSearch.passengers}</span>
            </div>
        </div>
    `;
}

// Set up passenger form based on number of passengers
function setupPassengerForm(numPassengers) {
    if (!passengerForm) return;
    
    let formHTML = '';
    
    for (let i = 1; i <= numPassengers; i++) {
        formHTML += `
            <div class="passenger">
                <h4>Passenger ${i}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="passenger${i}-first-name">First Name</label>
                        <input type="text" id="passenger${i}-first-name" name="passenger${i}-first-name" required>
                    </div>
                    <div class="form-group">
                        <label for="passenger${i}-last-name">Last Name</label>
                        <input type="text" id="passenger${i}-last-name" name="passenger${i}-last-name" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="passenger${i}-dob">Date of Birth</label>
                        <input type="date" id="passenger${i}-dob" name="passenger${i}-dob" required>
                    </div>
                    <div class="form-group">
                        <label for="passenger${i}-nationality">Nationality</label>
                        <input type="text" id="passenger${i}-nationality" name="passenger${i}-nationality" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="passenger${i}-passport">Passport Number</label>
                        <input type="text" id="passenger${i}-passport" name="passenger${i}-passport" required>
                    </div>
                    <div class="form-group">
                        <label for="passenger${i}-passport-expiry">Passport Expiry</label>
                        <input type="date" id="passenger${i}-passport-expiry" name="passenger${i}-passport-expiry" required>
                    </div>
                </div>
            </div>
        `;
    }
    
    formHTML += `
        <div class="form-group">
            <label for="contact-email">Contact Email</label>
            <input type="email" id="contact-email" name="contact-email" required>
        </div>
        <div class="form-group">
            <label for="contact-phone">Contact Phone</label>
            <input type="tel" id="contact-phone" name="contact-phone" required>
        </div>
    `;
    
    passengerForm.innerHTML = formHTML;
    
    // Set email to user's email if available
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
        const emailInput = document.getElementById('contact-email');
        if (emailInput) emailInput.value = user.email;
    }
}

// Process booking and redirect to payment

// Add this function to handle seat reservation
async function reserveSeats(flightId, seatsNeeded) {
    const flightRef = db.collection('flights').doc(flightId);
    
    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(flightRef);
        const flightData = doc.data();
        
        if (!doc.exists) throw "Flight does not exist";
        if (flightData.bookedSeats + seatsNeeded > flightData.totalSeats) {
            throw "Not enough seats available";
        }
        
        transaction.update(flightRef, {
            bookedSeats: firebase.firestore.FieldValue.increment(seatsNeeded)
        });
        
        return true;
    });
}

// Modify the processBooking function
async function processBooking(bookingDetails) {
    try {
        // Reserve seats before proceeding
        await reserveSeats(bookingDetails.flightId, bookingDetails.passengers.length);
        
        // Proceed with payment and booking creation
        const bookingRef = await db.collection('bookings').add({
            ...bookingDetails,
            status: "confirmed",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return bookingRef.id;
        
    } catch (error) {
        console.error("Booking failed:", error);
        alert(`Booking failed: ${error}`);
        throw error;
    }
}


/*function processBooking(bookingDetails) {
    // Validate form
    if (!validatePassengerForm()) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get passenger details
    const passengers = [];
    const numPassengers = bookingDetails.flightSearch.passengers;
    
    for (let i = 1; i <= numPassengers; i++) {
        passengers.push({
            firstName: document.getElementById(`passenger${i}-first-name`).value,
            lastName: document.getElementById(`passenger${i}-last-name`).value,
            dateOfBirth: document.getElementById(`passenger${i}-dob`).value,
            nationality: document.getElementById(`passenger${i}-nationality`).value,
            passportNumber: document.getElementById(`passenger${i}-passport`).value,
            passportExpiry: document.getElementById(`passenger${i}-passport-expiry`).value
        });
    }
    
    const contactEmail = document.getElementById('contact-email').value;
    const contactPhone = document.getElementById('contact-phone').value;
    
    // Add passenger details to booking
    const updatedBookingDetails = {
        ...bookingDetails,
        passengers,
        contactEmail,
        contactPhone,
        totalPrice: bookingDetails.price * numPassengers
    };
    
    // Store updated booking details
    sessionStorage.setItem('bookingDetails', JSON.stringify(updatedBookingDetails));
    
    // Redirect to payment page
    window.location.href = 'payment.html';
}*/

// Validate the passenger form
function validatePassengerForm() {
    const form = document.getElementById('passenger-form');
    
    // Check all required fields
    const requiredFields = form.querySelectorAll('[required]');
    for (const field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            return false;
        }
    }
    
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
