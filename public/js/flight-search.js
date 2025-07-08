const FLIGHT_API_URL = 'https://aviationstack.com/';
const API_KEY = '4dbb82dca06c18757ac231018527aacb'; //
const flightSearchForm = document.getElementById('flight-search-form');
const searchLoader = document.getElementById('search-loader');
const flightResults = document.getElementById('flight-results');
const airports = [
    { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
    { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
    { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
    { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
    { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan' },
    { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
    { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
];
if (flightSearchForm) {
    flightSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchFlights();
    });
}
function searchFlights() {
    // Show loader
    if (searchLoader) searchLoader.style.display = 'block';
    if (flightResults) flightResults.innerHTML = '';

    // Get form values
    const fromCity = document.getElementById('from').value;
    const toCity = document.getElementById('to').value;
    const departureDate = document.getElementById('departure-date').value;
    const returnDate = document.getElementById('return-date').value;
    const passengers = document.getElementById('passengers').value;
    const travelClass = document.getElementById('class').value;

    // Convert city names to airport codes (in a real app, this would be more sophisticated)
    const fromAirport = getAirportCode(fromCity);
    const toAirport = getAirportCode(toCity);

    // Store search details in sessionStorage for booking
    const searchDetails = {
        fromCity,
        toCity,
        fromAirport,
        toAirport,
        departureDate,
        returnDate,
        passengers,
        travelClass
    };
    sessionStorage.setItem('flightSearch', JSON.stringify(searchDetails));

    // Make API request (in a real application)
    // fetchFlights(fromAirport, toAirport, departureDate, returnDate, passengers, travelClass);

    // For demonstration purposes, we'll generate mock flights after a delay
    setTimeout(() => {
        generateMockFlights(searchDetails);
        if (searchLoader) searchLoader.style.display = 'none';
    }, 1500);
}

// Update flight display with seat availability
function displayFlightsWithAvailability(querySnapshot) {
    const flightResults = document.getElementById('flight-results');
    flightResults.innerHTML = '';

    querySnapshot.forEach(doc => {
        const flight = doc.data();
        const availableSeats = flight.totalSeats - flight.bookedSeats;
        
        const flightCard = document.createElement('div');
        flightCard.className = 'flight-card';
        flightCard.innerHTML = `
            <div class="flight-info">
                <h3>${flight.airline} ${flight.flightNumber}</h3>
                <div class="flight-details">
                    <div>
                        <span>${flight.departureTime}</span>
                        <span>${flight.departure}</span>
                    </div>
                    <div>
                        <span>${flight.duration}</span>
                        <span>Direct</span>
                    </div>
                    <div>
                        <span>${flight.arrivalTime}</span>
                        <span>${flight.arrival}</span>
                    </div>
                </div>
            </div>
            <div class="flight-price">
                <div class="price">$${flight.price}</div>
                <div class="seat-availability">
                    Seats Available: ${availableSeats}
                </div>
                <button class="btn-book" 
                        onclick="bookFlight('${doc.id}', ${availableSeats})">
                    Book Now
                </button>
            </div>
        `;
        
        flightResults.appendChild(flightCard);
    });
}

function fetchFlights(fromAirport, toAirport, departureDate, returnDate, passengers, travelClass) {
    const params = new URLSearchParams({
        api_key: API_KEY,
        dep_iata: fromAirport,
        arr_iata: toAirport,
        dep_time_min: `${departureDate}T00:00:00`,
        dep_time_max: `${departureDate}T23:59:59`
    });

    fetch(`${FLIGHT_API_URL}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayFlights(data.response, {
                fromAirport,
                toAirport,
                departureDate,
                returnDate,
                passengers,
                travelClass
            });
            if (searchLoader) searchLoader.style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching flights:', error);
            if (flightResults) {
                flightResults.innerHTML = `
                    <div class="alert alert-error">
                        Error fetching flights. Please try again later.
                    </div>
                `;
            }
            if (searchLoader) searchLoader.style.display = 'none';
        });
}
function displayFlights(flights, searchDetails) {
    if (!flightResults) return;

    if (flights.length === 0) {
        flightResults.innerHTML = `
            <div class="alert alert-error">
                No flights found for the selected criteria. Please try different dates or destinations.
            </div>
        `;
        return;
    }

    let resultsHTML = '';
    flights.forEach((flight, index) => {
        const departureTime = new Date(flight.dep_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const arrivalTime = new Date(flight.arr_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = calculateDuration(flight.dep_time, flight.arr_time);
        const price = generatePrice(searchDetails.travelClass, flight.distance || 1000);

        resultsHTML += `
            <div class="flight-card" data-flight-id="${flight.flight_iata || index}">
                <div class="flight-info">
                    <h3>${flight.airline_iata || 'SkyWay'} ${flight.flight_number || '123'}</h3>
                    <div class="flight-details">
                        <div>
                            <span>${departureTime}</span>
                            <span>${searchDetails.fromAirport}</span>
                        </div>
                        <div>
                            <span>${duration}</span>
                            <span>Direct</span>
                        </div>
                        <div>
                            <span>${arrivalTime}</span>
                            <span>${searchDetails.toAirport}</span>
                        </div>
                    </div>
                </div>
                <div class="flight-price">
                    <div class="price">$${price}</div>
                    <button class="btn-book" onclick="bookFlight('${flight.flight_iata || index}', ${price})">Book Now</button>
                </div>
            </div>
        `;
    });

    flightResults.innerHTML = resultsHTML;
}

// Generate mock flights for demonstration
function generateMockFlights(searchDetails) {
    if (!flightResults) return;

    const mockFlights = [];
    const airlines = ['SkyWay', 'Delta', 'United', 'American', 'Emirates', 'Lufthansa'];
    const flightNumbers = ['SW123', 'DL456', 'UA789', 'AA234', 'EK567', 'LH890'];
    const departureTimes = ['08:30', '10:45', '12:15', '14:30', '16:45', '19:20'];
    const durations = ['2h 15m', '2h 45m', '3h 10m', '3h 45m', '4h 05m', '4h 30m'];
    const arrivalTimes = ['10:45', '13:30', '15:25', '18:15', '20:50', '23:50'];
    
    // Generate 3-6 mock flights
    const numFlights = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < numFlights; i++) {
        const airlineIndex = Math.floor(Math.random() * airlines.length);
        const price = generatePrice(searchDetails.travelClass, 
            Math.floor(Math.random() * 2000) + 500);
        
        mockFlights.push({
            id: `flight-${i}`,
            airline: airlines[airlineIndex],
            flightNumber: flightNumbers[airlineIndex],
            departureTime: departureTimes[i % departureTimes.length],
            duration: durations[i % durations.length],
            arrivalTime: arrivalTimes[i % arrivalTimes.length],
            price: price
        });
    }

    let resultsHTML = '';
    mockFlights.forEach((flight) => {
        resultsHTML += `
            <div class="flight-card" data-flight-id="${flight.id}">
                <div class="flight-info">
                    <h3>${flight.airline} ${flight.flightNumber}</h3>
                    <div class="flight-details">
                        <div>
                            <span>${flight.departureTime}</span>
                            <span>${searchDetails.fromAirport}</span>
                        </div>
                        <div>
                            <span>${flight.duration}</span>
                            <span>Direct</span>
                        </div>
                        <div>
                            <span>${flight.arrivalTime}</span>
                            <span>${searchDetails.toAirport}</span>
                        </div>
                    </div>
                </div>
                <div class="flight-price">
                    <div class="price">$${flight.price}</div>
                    <button class="btn-book" onclick="bookFlight('${flight.id}', ${flight.price})">Book Now</button>
                </div>
            </div>
        `;
    });

    flightResults.innerHTML = resultsHTML;
    
    // Store mock flights in session storage for booking
    sessionStorage.setItem('mockFlights', JSON.stringify(mockFlights));
}

// Get airport code from city name
function getAirportCode(cityName) {
    const airport = airports.find(airport => 
        airport.city.toLowerCase() === cityName.toLowerCase() || 
        airport.code.toLowerCase() === cityName.toLowerCase()
    );
    
    return airport ? airport.code : cityName.substring(0, 3).toUpperCase();
}

// Calculate flight duration
function calculateDuration(departureTime, arrivalTime) {
    const depTime = new Date(departureTime);
    const arrTime = new Date(arrivalTime);
    const durationMs = arrTime - depTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

// Generate price based on class and distance
function generatePrice(travelClass, distance) {
    let basePrice = distance * 0.1;
    
    switch (travelClass) {
        case 'business':
            basePrice *= 2.5;
            break;
        case 'first':
            basePrice *= 4;
            break;
        default: // economy
            break;
    }
    
    // Add some randomness
    basePrice += Math.floor(Math.random() * 50);
    
    return Math.floor(basePrice);
}

// Book a flight - redirect to booking page or login if not authenticated
function bookFlight(flightId, price) {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is logged in, proceed to booking
            const flightSearch = JSON.parse(sessionStorage.getItem('flightSearch'));
            const mockFlights = JSON.parse(sessionStorage.getItem('mockFlights'));
            
            const selectedFlight = mockFlights.find(flight => flight.id === flightId);
            
            if (selectedFlight) {
                const bookingDetails = {
                    flightSearch,
                    selectedFlight,
                    price
                };
                
                sessionStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
                window.location.href = 'booking.html';
            }
        } else {
            // User is not logged in, redirect to login page
            sessionStorage.setItem('redirectAfterLogin', 'index.html');
            alert('Please log in to book a flight');
            window.location.href = 'login.html';
        }
    });
}