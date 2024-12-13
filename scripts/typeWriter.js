// Typing effect and interaction
function typeSentence(targetId, sentence, speed, callback) {
    let i = 0;

    function type() {
        if (i < sentence.length) {
            document.getElementById(targetId).innerHTML += sentence.charAt(i);
            i++;
            setTimeout(type, speed); // Adjust speed dynamically
        } else if (callback) {
            setTimeout(callback, 500); // Optional callback after typing
        }
    }

    type();
}

// Function to display the entered name
function showName(inputId, responseId) {
    const name = document.getElementById(inputId).value;
    const response = document.getElementById(responseId);

    if (name) {
        response.innerHTML = `Ahh, I knew your name was ${name}!`;
    } else {
        response.innerHTML = "Hmm, I guess I'll call you 'Mystery Guest'.";
    }
}

// Function to handle Enter key press
function handleKeyPress(event, inputId, responseId) {
    if (event.key === "Enter") {
        showName(inputId, responseId);
    }
}