function typeSentence(targetId, sentence, speed, callback) {
    const container = document.getElementById("messageContainer");
    const target = document.createElement("div"); // Create a new div for each message
    container.appendChild(target); // Append the new div
    target.innerHTML = ""; // Clear previous content if any
    let i = 0;

    function type() {
        if (i < sentence.length) {
            // Handle HTML characters properly
            target.innerHTML = sentence.substring(0, i + 1); // Add up to the current character
            i++;
            setTimeout(type, speed);
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

    // Typing effect for job response
    typeSentence("animatedTextId", response, 50, () => {
        // After job response, type introduction texts
        const introductionText = `
        I have recently been awarded a PhD in Aerospace/Flight Robotics from the Technical University of Madrid.<br>
        I have a lot of experience in the field of Nonlinear Control, gained through both my academic studies and professional work.<br>  
        Throughout my academic journey—from my bachelor's to master's and PhD degrees—I focused extensively on control systems, flight dynamics, and the design of nonlinear control algorithms, including adaptive and robust approaches.<br>
        Professionally, over the past six years, I have been working on modifying industrial autopilot (Micropilot, UAV Navigation, Pixhawk, etc.) control loops and designing ground control system software.<br>
        My doctoral thesis involved implementing thrust vector control on flap vanes in a hexa-ducted fan UAV to stabilize its attitude.<br>
        `;
        typeSentence("animatedTextId", introductionText, 50, null);
    });
}

// Main conversation function
async function startConversation() {
    const animatedTextId = "animatedText";
    const responseId = "response";
    const jobRequest = document.getElementById("jobRequest");
    const jobInput = document.getElementById("jobInput");
    const jobSubmitBtn = document.getElementById("jobSubmitBtn");

    typeSentence(animatedTextId, "Hey stranger, seems you are not here by accident...", 50, async function () {
        const doubleEyes = document.querySelector(".double-eyes");
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
                // Hide the double eyes
                doubleEyes.style.display = "none";
                nameRequest.style.display = "none";
                const location = await fetchUserLocation();
                const country = location.country || "Mystery Land";
                const language = country === "Spain" ? "Spanish" : "English"; // Simplified for the example

                typeSentence(
                    animatedTextId,
                    `Ahh, I knew your name was ${name}, and seems you live in ${country}.<br>So you wish I could talk in ${language}!`,
                    50,
                    function () {
                        typeSentence(
                            animatedTextId,
                            "Let me introduce myself,<br>My name is Sadeq.<br>I am an Aerospace Engineer—consider me a self-empowered UI developer, not a professional one.<br>But I believe love for something makes you create novelties.",
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
    });
}

// Start the conversation on page load
document.addEventListener("DOMContentLoaded", function () {
    startConversation();
});
