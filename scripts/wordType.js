const sentence = "Hey stranger, seems you are not here by accident...";
let i = 0;

// Function for real-time typing effect
function typeSentence() {
    if (i < sentence.length) {
        document.getElementById("animatedText").innerHTML += sentence.charAt(i);
        i++;
        setTimeout(typeSentence, 50); // Adjust speed here
    } else {
        // After typing the sentence, show the name input
        setTimeout(() => {
            document.getElementById("nameRequest").style.display = "block";
            document.getElementById("nameInput").style.display = "inline-block";
            document.getElementById("submitBtn").style.display = "inline-block";
            document.getElementById("nameInput").style.animation = "showInput 0.5s ease-in-out forwards";
            document.getElementById("submitBtn").style.animation = "showInput 0.5s ease-in-out forwards";
        }, 500); // Delay before showing input field
    }
}

// Call typeSentence when the page loads
document.addEventListener('DOMContentLoaded', function() {
    typeSentence();
});

// Function to handle Enter key press
function handleKeyPress(event) {
    if (event.key === "Enter") {
        showName();
    }
}

// Function to display the entered name
function showName() {
    const name = document.getElementById("nameInput").value;
    const response = document.getElementById("response");

    if (name) {
        response.innerHTML = `Ahh, I knew your name was ${name}!`;
    } else {
        response.innerHTML = "Hmm, I guess I'll call you 'Mystery Guest'.";
    }
}       