// Typing effect for any text
function typeSentence(targetId, sentence, speed, callback) {
    let i = 0;
    const target = document.getElementById(targetId);
    target.innerHTML = ""; // Clear previous content if any

    function type() {
        if (i < sentence.length) {
            target.innerHTML += sentence.charAt(i);
            i++;
            setTimeout(type, speed); // Adjust speed dynamically
        } else if (callback) {
            setTimeout(callback, 500); // Optional callback after typing
        }
    }

    type();
}

// Handle Enter key press for input fields
function handleKeyPress(event, inputId, callback) {
    if (event.key === "Enter") {
        const input = document.getElementById(inputId).value.trim();
        if (input) {
            callback(input);
        }
    }
}

// Fetch user location based on IP
async function fetchUserLocation() {
    try {
        const response = await fetch("http://ip-api.com/json");
        const data = await response.json();
        return { country: data.country, region: data.region };
    } catch (error) {
        console.error("Failed to fetch location:", error);
        return { country: "Mystery Land", region: "" };
    }
}

// Generate an AI-like response to the job input
function generateJobResponse(job) {
    const lowerJob = job.toLowerCase();
    let response = "Aww, you are a crack Bro!";

    if (lowerJob.includes("engineer")) {
        response = "Wow, engineering is such a creative and challenging field! Hats off to you!";
    } else if (lowerJob.includes("teacher")) {
        response = "Teachers are the real heroes—shaping the minds of tomorrow!";
    } else if (lowerJob.includes("developer") || lowerJob.includes("programmer")) {
        response = "Ah, a fellow creator of worlds through code. Amazing!";
    } else if (lowerJob.includes("student")) {
        response = "A student, huh? Keep learning, the world is full of exciting things to discover!";
    } else if (lowerJob.includes("doctor")) {
        response = "Saving lives and making the world a healthier place? You're awesome!";
    }
    return response;
}

// Main conversation function
async function startConversation() {
    const animatedTextId = "animatedText";
    const responseId = "response";
    const jobRequest = document.getElementById("jobRequest");
    const jobInput = document.getElementById("jobInput");
    const jobSubmitBtn = document.getElementById("jobSubmitBtn");

    typeSentence(animatedTextId, "Hey stranger, seems you are not here by accident...", 50, async function () {
        const nameRequest = document.getElementById("nameRequest");
        const nameInput = document.getElementById("nameInput");
        const submitBtn = document.getElementById("submitBtn");

        // Show name input and button
        nameRequest.style.display = "block";
        nameInput.style.display = "inline-block";
        submitBtn.style.display = "inline-block";

        // Attach event listeners for name submission
        submitBtn.addEventListener("click", async function () {
            const name = nameInput.value.trim();
            if (name) {
                nameRequest.style.display = "none";
                const location = await fetchUserLocation();
                const country = location.country || "Mystery Land";
                const language = country === "Spain" ? "Spanish" : "English"; // Simplified for the example

                typeSentence(
                    animatedTextId,
                    `Ahh, I knew your name was ${name}, and you live in ${country}. So you wish I could talk in ${language}!`,
                    50,
                    function () {
                        typeSentence(
                            animatedTextId,
                            "Let me introduce myself: My name is Sadeq. I am an Aerospace Engineer—consider me a self-empowered UI developer, not a professional one. But I believe love for something makes you create better than being an expert.",
                            50,
                            function () {
                                // Show job input and button
                                jobRequest.style.display = "block";
                                jobInput.style.display = "inline-block";
                                jobSubmitBtn.style.display = "inline-block";

                                // Attach event listeners for job submission
                                jobSubmitBtn.addEventListener("click", function () {
                                    const job = jobInput.value.trim();
                                    if (job) {
                                        jobRequest.style.display = "none";
                                        const jobResponse = generateJobResponse(job);
                                        typeSentence(responseId, jobResponse, 50);
                                    }
                                });

                                jobInput.addEventListener("keypress", function (event) {
                                    handleKeyPress(event, "jobInput", function (job) {
                                        jobRequest.style.display = "none";
                                        const jobResponse = generateJobResponse(job);
                                        typeSentence(responseId, jobResponse, 50);
                                    });
                                });
                            }
                        );
                    }
                );
            }
        });

        nameInput.addEventListener("keypress", function (event) {
            handleKeyPress(event, "nameInput", async function (name) {
                nameRequest.style.display = "none";
                const location = await fetchUserLocation();
                const country = location.country || "Mystery Land";
                const language = country === "Spain" ? "Spanish" : "English"; // Simplified for the example

                typeSentence(
                    animatedTextId,
                    `Ahh, I knew your name was ${name}, and you live in ${country}. So you wish I could talk in ${language}!`,
                    50,
                    function () {
                        typeSentence(
                            animatedTextId,
                            "Let me introduce myself: My name is Sadeq. I am an Aerospace Engineer—consider me a self-empowered UI developer, not a professional one. But I believe love for something makes you create better than being an expert.",
                            50
                        );
                    }
                );
            });
        });
    });
}

// Start the conversation on page load
document.addEventListener("DOMContentLoaded", function () {
    startConversation();
});
