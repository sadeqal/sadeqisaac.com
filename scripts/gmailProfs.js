let recipients = [];

function addRecipient() {
    const nameInput = document.getElementById("profName");
    const emailInput = document.getElementById("profEmail");
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
        alert("Please enter both name and email.");
        return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    recipients.push({ name, email });
    nameInput.value = "";
    emailInput.value = "";
    updateRecipientList();
}

function updateRecipientList() {
    const container = document.getElementById("profList");
    container.innerHTML = ""; // Clear previous results

    recipients.forEach((recipient, index) => {
        const div = document.createElement("div");
        div.classList.add("professor");
        div.innerHTML = `
            <h3>${recipient.name}</h3>
            <p><b>Email:</b> <a href="mailto:${recipient.email}">${recipient.email}</a></p>
            <button class="btn-preview" onclick="previewEmail('${recipient.name}', '${recipient.email}')">👀 Preview Email</button>
            <button class="btn-remove" onclick="removeRecipient(${index})">Remove</button>
        `;
        container.appendChild(div);
    });
}

function removeRecipient(index) {
    recipients.splice(index, 1);
    updateRecipientList();
}

function previewEmail(name, email) {
    const modal = document.getElementById("emailPreviewModal");
    const previewText = document.getElementById("emailPreviewText");

    previewText.innerHTML = `
        <b>Subject:</b> Postdoctoral Position Inquiry <br><br>
        <p style='font-family: Georgia; font-size: 12pt; color: black;'>
        Dear Dr. ${name.split(" ").slice(-1)}, <br><br>

        I hope this email finds you well.<br><br>

        My name is Sadeq, and I hold a PhD in Aerospace/Flight Robotics from the Technical University of Madrid. 
        I have over eight years of experience in robotics and nonlinear control, acquired through both academic research and professional practice.<br><br>

        Throughout my academic journey—from my bachelor's to master's and PhD degrees—I focused extensively on control systems, flight dynamics, and the design of nonlinear control algorithms, including adaptive and robust approaches. 
        Professionally, over the past six years, I have been working on modifying industrial autopilot (Micropilot, UAV Navigation, Pixhawk, etc.) control loops and designing ground control system software. 
        My doctoral thesis involved implementing thrust vector control on flap vanes in a hexa-ducted fan UAV to stabilize its attitude (<a href="https://scholar.google.com/citations?user=FClYx9AAAAAJ&hl=en" style="color: #0000EE; text-decoration: underline;">Google Scholar</a>).<br><br>

        Given our shared interests, I am keen to explore the possibility of a postdoctoral research stay in your lab. 
        Please find my CV attached for your review, and I would greatly appreciate any insights or advice you might have regarding potential opportunities.<br><br>

        Sincerely,<br>
        Sadeq
        </p>
    `;

    modal.style.display = "block";
}

function closePreview() {
    document.getElementById("emailPreviewModal").style.display = "none";
}

async function sendEmails() {
    if (recipients.length === 0) {
        alert("Please add at least one recipient.");
        return;
    }

    if (confirm("Are you sure you want to send emails to all recipients?")) {
        try {
            const response = await fetch("http://127.0.0.1:5000/send_emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ recipients })
            });
            const result = await response.json();
            console.log("Send emails response:", result);
            alert(result.message);
        } catch (error) {
            console.error("Error sending emails:", error);
            alert("Failed to send emails. Check if Flask is running.");
        }
    }
}