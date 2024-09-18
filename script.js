console.log('Script file loaded');

let saaData = [];
let pincodeData = [];

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

    if (!pinCode) {
        alert('Please enter a pin code.');
        return;
    }

    // Find the district and state for the entered pin code
    const pincodeInfo = pincodeData.find(item => item['Pin Code'] === pinCode);
    console.log('Pincode info:', pincodeInfo);

    if (pincodeInfo) {
        const district = pincodeInfo['District'];
        const state = pincodeInfo['State'];
        console.log('District:', district, 'State:', state);

        // Find SAAs in the same district and state
        const matchingSAAs = saaData.filter(item => {
            if (!item || typeof item !== 'object') return false;
            const itemDistrict = item['District'];
            const itemState = item['State'];
            return itemDistrict && itemState &&
                   itemDistrict.toLowerCase() === district.toLowerCase() &&
                   itemState.toLowerCase() === state.toLowerCase();
        });
        console.log('Matching SAAs found:', matchingSAAs.length);
        if (matchingSAAs.length > 0) {
            displayResults(matchingSAAs);
        } else {
            console.log('No exact matches, searching in same state');
            const sameStateSAAs = saaData.filter(item => {
                if (!item || typeof item !== 'object') return false;
                const itemState = item['State'];
                return itemState && itemState.toLowerCase() === state.toLowerCase();
            });
            console.log('Same state SAAs found:', sameStateSAAs.length);
            if (sameStateSAAs.length > 0) {
                displayResults(sameStateSAAs);
            } else {
                console.log('No SAAs in state, displaying all SAAs');
                document.getElementById('results').innerHTML = '<p>No SAAs found in your state. Here are all available SAAs:</p>';
                displayResults(saaData);
            }
        }
    } else {
        console.log('Invalid pin code or no information available');
        document.getElementById('results').innerHTML = '<p>Invalid Pin Code or no information available for this pin code.</p>';
    }
}

function displayResults(saas) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Results div not found');
        return;
    }

    let html = '<h2>Nearest SAAs:</h2>';
    if (saas.length === 0) {
        html += '<p>No SAAs found.</p>';
    } else {
        saas.forEach(saa => {
            html += `
                <div class="result-item">
                    <h3>${saa['District'] || 'N/A'}, ${saa['State'] || 'N/A'}</h3>
                    <p><strong>Contact Person:</strong> ${saa['Contact Person'] || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${saa['Phone No.'] || 'N/A'}</p>
                    <p><strong>Email:</strong> ${saa['Email'] || 'N/A'}</p>
                    <p><strong>Address:</strong> ${saa['Address'] || 'N/A'}</p>
                </div>
            `;
        });
    }
    resultsDiv.innerHTML = html;
    console.log('Results displayed on page');
}
