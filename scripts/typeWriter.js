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
            setTimeout(callback, 300); // Optional callback after typing
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
    } else if (lowerJob.includes("artist") || lowerJob.includes("designer")) {
        response = "Creativity flows in your veins! The world needs more beautiful and inspiring work.";
    } else if (lowerJob.includes("nurse")) {
        response = "Compassion and dedication—nursing is such a noble profession!";
    } else if (lowerJob.includes("scientist") || lowerJob.includes("researcher")) {
        response = "Exploring the frontiers of knowledge? That's incredible!";
    } else if (lowerJob.includes("lawyer")) {
        response = "Upholding justice and protecting rights—what a critical role!";
    } else if (lowerJob.includes("chef") || lowerJob.includes("cook")) {
        response = "Creating delicious experiences? You're a master of flavors!";
    } else if (lowerJob.includes("pilot")) {
        response = "Flying high above the clouds? You're living the dream!";
    } else if (lowerJob.includes("entrepreneur") || lowerJob.includes("business")) {
        response = "Building dreams and shaping the future—entrepreneurship is thrilling!";
    } else if (lowerJob.includes("musician") || lowerJob.includes("singer")) {
        response = "Bringing melodies to life? Music has the power to move hearts!";
    } else if (lowerJob.includes("athlete") || lowerJob.includes("sports")) {
        response = "Pushing physical boundaries and inspiring others? Impressive!";
    } else if (lowerJob.includes("writer") || lowerJob.includes("author")) {
        response = "Weaving words into stories or ideas? That's magical!";
    } else if (lowerJob.includes("mechanic")) {
        response = "Fixing things and keeping the world moving—what a practical skill!";
    } else if (lowerJob.includes("firefighter")) {
        response = "Courageously saving lives and protecting communities? You're a hero!";
    } else if (lowerJob.includes("police") || lowerJob.includes("officer")) {
        response = "Serving and protecting—what an important responsibility!";
    } else if (lowerJob.includes("photographer")) {
        response = "Capturing moments that tell stories? That's an amazing art form!";
    } else {
        response = "Whatever you do, I'm sure it's amazing! Keep rocking it!";
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
        // Use setTimeout to ensure proper callback chaining
        setTimeout(() => typeSentence("animatedTextId", introductionText, 50, null), 500);
    });
}

// Main conversation function
async function startConversation() {
    const animatedTextId = "animatedText";
    const responseId = "response";
    const jobRequest = document.getElementById("jobRequest");
    const jobInput = document.getElementById("jobInput");
    const jobSubmitBtn = document.getElementById("jobSubmitBtn");

    typeSentence(animatedTextId, "Hey friend, seems you are not here by accident...", 50, async function () {
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
                // Language mapping based on country
                const languageMap = {
                    "Spain": "Spanish",
                    "Mexico": "Spanish",
                    "Argentina": "Spanish",
                    "Colombia": "Spanish",
                    "France": "French",
                    "Belgium": "French",
                    "Canada": "French", // Québec region
                    "Germany": "German",
                    "Austria": "German",
                    "Switzerland": "German", // German-speaking regions
                    "Italy": "Italian",
                    "Brazil": "Portuguese",
                    "Portugal": "Portuguese",
                    "Russia": "Russian",
                    "Poland": "Polish",
                    "Japan": "Japanese",
                    "China": "Chinese",
                    "India": "Hindi", // One of many languages, simplified
                    "United States": "English",
                    "United Kingdom": "English",
                    "Australia": "English",
                    "Ireland": "English",
                    "South Africa": "English", // One of many languages
                    "Netherlands": "Dutch",
                    "Sweden": "Swedish",
                    "Norway": "Norwegian",
                    "Denmark": "Danish",
                    "default": "Galactic" // Fallback for unknown countries
                };

                // Determine language based on country, with a fun fallback
                const language = languageMap[country] || languageMap["default"];

                typeSentence(
                    animatedTextId,
                    `Ahh, I knew your name was ${name}, and seems you live in ${country}.<br>So you wish I could talk in ${language}! But no, bro :)`,
                    50,
                    function () {
                        typeSentence(
                            animatedTextId,
                            `Allow me to introduce myself.<br>
                            My name is Sadeq, and I am an Aerospace/Robotics Engineer with a passion for exploration and innovation.<br>
                            While I may not be a professional UI developer, I consider myself a self-taught enthusiast who thrives on creativity and learning.<br>
                            I firmly believe that passion and dedication have the power to inspire and bring novelties to life.`,
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