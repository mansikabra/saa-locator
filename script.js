console.log('Script file loaded');

let saaData = [];
let pincodeData = [];
let globalSAAs = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');

    // Initialize the search button
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', findSAA);
        console.log('Search button initialized');
    } else {
        console.error('Search button not found');
    }

    // Check if pincode input exists
    const pincodeInput = document.getElementById('pincode');
    if (pincodeInput) {
        console.log('Pincode input found');
    } else {
        console.error('Pincode input not found');
    }

    // Load CSV data
    loadCSVData();
});

function loadCSVData() {
    Papa.parse('data/saa_data.csv', {
        download: true,
        header: true,
        complete: function(results) {
            console.log('SAA Data parsing complete');
            console.log('Number of rows:', results.data.length);
            console.log('Fields:', results.meta.fields);
            saaData = results.data;
            checkDataLoaded();
        },
        error: function(error) {
            console.error('Error parsing SAA data:', error);
        }
    });

    Papa.parse('data/pincode_data.csv', {
        download: true,
        header: true,
        complete: function(results) {
            console.log('Pin Code Data parsing complete');
            console.log('Number of rows:', results.data.length);
            console.log('Fields:', results.meta.fields);
            pincodeData = results.data;
            checkDataLoaded();
        },
        error: function(error) {
            console.error('Error parsing Pin Code data:', error);
        }
    });
}

function checkDataLoaded() {
    console.log('Checking data loaded status:');
    console.log('SAA Data length:', saaData.length);
    console.log('Pin Code Data length:', pincodeData.length);
    
    const searchButton = document.getElementById('search-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (saaData.length > 0 && pincodeData.length > 0) {
        if (searchButton) {
            searchButton.disabled = false;
            console.log('Search button enabled');
        } else {
            console.error('Search button not found');
        }
        
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
            console.log('Loading indicator hidden');
        } else {
            console.error('Loading indicator not found');
        }
        
        console.log('All data loaded successfully');
    } else {
        console.log('Data not fully loaded yet');
    }
}

function findSAA() {
    console.log('findSAA function called');
    
    const pincodeInput = document.getElementById('pincode');
    if (!pincodeInput) {
        console.error('Pincode input element not found');
        alert('Error: Pincode input not found on the page.');
        return;
    }
    
    const pinCode = pincodeInput.value.trim();
    console.log('Entered pin code:', pinCode);

    // Check for valid PIN code format
    if (!/^\d{6}$/.test(pinCode)) {
        alert('Invalid PIN code. Please enter a 6-digit numeric PIN code.');
        return;
    }

    // Find the district and state for the entered pin code
    const pincodeInfo = pincodeData.find(item => item['Pin Code'] === pinCode);
    console.log('Pincode info:', pincodeInfo);

    if (pincodeInfo) {
        // Existing logic for found pincode
        const district = pincodeInfo['District'];
        const state = pincodeInfo['State'];
        console.log('District:', district, 'State:', state);
        findMatchingSAAs(district, state);
    } else {
        // Fallback: Check for the first three digits
        const prefix = pinCode.slice(0, 3);
        const matchingPincodes = pincodeData.filter(item => item['Pin Code'].startsWith(prefix));
        
        if (matchingPincodes.length > 0) {
            const district = matchingPincodes[0]['District'];
            const state = matchingPincodes[0]['State'];
            console.log('Fallback District:', district, 'State:', state);
            findMatchingSAAs(district, state);
        } else {
            // No matching pincode found
            document.getElementById('results').innerHTML = '<p>Invalid PIN code or no information available for this PIN code.</p>';
        }
    }
}

function findMatchingSAAs(district, state) {
    console.log('Finding matching SAAs for:', district, state);
    
    // Check if district and state are defined
    if (!district || !state) {
        console.log('District or state is undefined');
        document.getElementById('results').innerHTML = '<p>No SAAs found for the provided district and state.</p>';
        return;
    }

    const matchingSAAs = saaData.filter(item => {
        return item['District'] && item['State'] &&
               item['District'].toLowerCase() === district.toLowerCase() &&
               item['State'].toLowerCase() === state.toLowerCase();
    });

    if (matchingSAAs.length > 0) {
        displayResults(matchingSAAs);
    } else {
        // If no exact matches, search in the same state
        const sameStateSAAs = saaData.filter(item => 
            item['State'] && item['State'].toLowerCase() === state.toLowerCase()
        );
        if (sameStateSAAs.length > 0) {
            displayResults(sameStateSAAs);
        } else {
            document.getElementById('results').innerHTML = '<p>No SAAs found in your state.</p>';
        }
    }
}

function displayResults(saas) {
    globalSAAs = saas; // Store the SAAs globally

    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Results div not found');
        return;
    }

    let html = '<h2>Nearest SAAs:</h2>';
    if (saas.length === 0) {
        html += '<p>No SAAs found.</p>';
    } else {
        saas.forEach((saa, index) => {
            html += `
                <div class="result-item">
                    <h3>${saa['District'] || 'N/A'}, ${saa['State'] || 'N/A'}</h3>
                    <p><strong>Contact Person:</strong> ${saa['Contact Person'] || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${saa['Phone No.'] || 'N/A'}</p>
                    <p><strong>Email:</strong> ${saa['Email'] || 'N/A'}</p>
                    <p><strong>Address:</strong> ${saa['Address'] || 'N/A'}</p>
                    <div class="map-container" id="map-${index}"></div>
                    <a href="#" class="directions-btn" onclick="openDirections(${index}); return false;">Get Directions</a>
                </div>
            `;
        });
    }
    resultsDiv.innerHTML = html;

    // Initialize maps after HTML is inserted
    saas.forEach((saa, index) => {
        const mapElement = document.getElementById(`map-${index}`);
        if (!mapElement) {
            console.error(`Map element not found for index ${index}`);
            return;
        }

        const map = L.map(mapElement).setView([20.5937, 78.9629], 5); // Default to center of India
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Geocode the address
        const address = `${saa['Address'] || ''}, ${saa['District'] || ''}, ${saa['State'] || ''}`;
        geocodeAddress(address, map, saa);
    });

    console.log('Results displayed on page');
}

function openDirections(index) {
    const saa = globalSAAs[index];
    let destination;

    if (saa['Verified Address']) {
        destination = saa['Verified Address'];
    } else if (saa['Address'] && saa['District'] && saa['State']) {
        destination = `${saa['Address']}, ${saa['District']}, ${saa['State']}`;
    } else if (saa.lat && saa.lon) {
        destination = `${saa.lat},${saa.lon}`;
    } else {
        destination = `${saa['Address'] || ''}, ${saa['District'] || ''}, ${saa['State'] || ''}`;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
}

function geocodeAddress(address, map, saa) {
    console.log('Geocoding address:', address);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                console.log('Geocoding successful:', lat, lon);
                map.setView([lat, lon], 13);
                L.marker([lat, lon]).addTo(map)
                    .bindPopup(address)
                    .openPopup();
                
                // Store more detailed information
                saa.lat = lat;
                saa.lon = lon;
                saa.displayName = data[0].display_name;
            } else {
                console.log('Geocoding failed for address:', address);
                // Fallback: Try geocoding with just district and state
                const fallbackAddress = `${saa['District'] || ''}, ${saa['State'] || ''}`;
                geocodeFallback(fallbackAddress, map, saa);
            }
        })
        .catch(error => {
            console.error('Error during geocoding:', error);
            // Fallback: Try geocoding with just district and state
            const fallbackAddress = `${saa['District'] || ''}, ${saa['State'] || ''}`;
            geocodeFallback(fallbackAddress, map, saa);
        });
}

function geocodeFallback(address, map, saa) {
    console.log('Attempting fallback geocoding for:', address);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                console.log('Fallback geocoding successful:', lat, lon);
                map.setView([lat, lon], 10);
                L.marker([lat, lon]).addTo(map)
                    .bindPopup(address)
                    .openPopup();
                
                // Store more detailed information
                saa.lat = lat;
                saa.lon = lon;
                saa.displayName = data[0].display_name;
            } else {
                console.log('Fallback geocoding failed for address:', address);
                // If all else fails, show the entire state
                geocodeState(saa['State'], map);
            }
        })
        .catch(error => console.error('Error during fallback geocoding:', error));
}

function geocodeState(state, map) {
    console.log('Attempting to geocode state:', state);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(state)}, India`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                console.log('State geocoding successful:', lat, lon);
                map.setView([lat, lon], 7);
                L.marker([lat, lon]).addTo(map)
                    .bindPopup(state)
                    .openPopup();
            } else {
                console.log('Failed to geocode state:', state);
            }
        })
        .catch(error => console.error('Error during state geocoding:', error));
}

function initializeMaps(saas) {
    if (typeof L !== 'undefined') {
        saas.forEach((saa, index) => {
            const map = L.map(`map-${index}`).setView([20.5937, 78.9629], 5); // Center of India
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        });
    } else {
        console.error('Leaflet library not loaded');
    }
}

function preprocessAddress(saa) {
    // Add manual corrections for known problematic addresses
    if (saa['District'] === 'Nanded' && saa['State'] === 'MAHARASHTRA') {
        saa['Address'] = 'Chikala Tanda, Maharashtra 431806';
    }
    // Add more corrections as needed
    return saa;
}

// Use this function when processing your data
saaData = saaData.map(preprocessAddress);
