
// Example of a POST request using Fetch API
async function sendPostRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success:', result);
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example usage
const url = '/api/endpoint'; // Replace with your API endpoint
const data = {
    key1: 'value1',
    key2: 'value2'
};

sendPostRequest(url, data);