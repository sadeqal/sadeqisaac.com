// Load the Google API client
gapi.load('client', initClient);

let isInitialized = false;

function initClient() {
    gapi.client.init({
        clientId: '502740477978-aerq6md1hn6qh4kkqeup280sukctl91p.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        discoveryDocs: ['https://analyticsreporting.googleapis.com/$discovery/rest?version=v4'],
        cookiepolicy: 'single_host_origin'
    }).then(function () {
        // Authorize (this will prompt user consent)
        return gapi.auth2.getAuthInstance().signIn();
    }).then(function () {
        console.log('API client initialized and signed in');
        isInitialized = true;
        updateAnalytics(); // Call updateAnalytics only after successful init
    }, function(error) {
        console.error('Error initializing API client:', error);
    });
}

function updateAnalytics() {
    if (!isInitialized) {
        console.log('API not yet initialized, skipping update');
        return;
    }

    // Real-time active users (using total users as a proxy for real-time)
    gapi.client.analyticsreporting.reports.batchGet({
        'reportRequests': [{
            'viewId': 'ga:11185285686',
            'dateRanges': [{'startDate': 'today', 'endDate': 'today'}],
            'metrics': [{'expression': 'ga:users'}]
        }]
    }).then(function(response) {
        const activeUsers = response.result && response.result.reports && response.result.reports[0].data.rows ?
            response.result.reports[0].data.rows[0].metrics[0].values[0] : 0;
        document.getElementById('current-viewers').textContent = activeUsers || 'N/A';
    }).catch(function(error) {
        console.error('Error fetching real-time data:', error);
        document.getElementById('current-viewers').textContent = 'N/A';
    });

    // Last 30 days users
    gapi.client.analyticsreporting.reports.batchGet({
        'reportRequests': [{
            'viewId': 'ga:11185285686',
            'dateRanges': [{'startDate': '30daysAgo', 'endDate': 'today'}],
            'metrics': [{'expression': 'ga:users'}]
        }]
    }).then(function(response) {
        const users = response.result && response.result.reports && response.result.reports[0].data.rows ?
            response.result.reports[0].data.rows[0].metrics[0].values[0] : 0;
        document.getElementById('last-month').textContent = users || 'N/A';
    }).catch(function(error) {
        console.error('Error fetching last month data:', error);
        document.getElementById('last-month').textContent = 'N/A';
    });

    // Total users since tracking began
    gapi.client.analyticsreporting.reports.batchGet({
        'reportRequests': [{
            'viewId': 'ga:11185285686',
            'dateRanges': [{'startDate': '2005-01-01', 'endDate': 'today'}],
            'metrics': [{'expression': 'ga:users'}]
        }]
    }).then(function(response) {
        const totalUsers = response.result && response.result.reports && response.result.reports[0].data.rows ?
            response.result.reports[0].data.rows[0].metrics[0].values[0] : 0;
        document.getElementById('total-visits').textContent = totalUsers || 'N/A';
    }).catch(function(error) {
        console.error('Error fetching total visits:', error);
        document.getElementById('total-visits').textContent = 'N/A';
    });
}

// Start updating only after initialization
function startAnalyticsUpdates() {
    if (isInitialized) {
        updateAnalytics();
        setInterval(updateAnalytics, 30000);
    } else {
        setTimeout(startAnalyticsUpdates, 1000); // Check again after 1 second
    }
}

// Trigger the initialization check
startAnalyticsUpdates();