function searchProfessors() {
    console.log("Fetching professors...");

    fetch("https://242b-85-56-133-213.ngrok-free.app/get_professors") // Ensure Flask is running!
        .then(response => {
            console.log("Response status:", response.status);
            return response.json();
        })
        .then(profs => {
            console.log("Professors received:", profs);

            let container = document.getElementById("profList");
            container.innerHTML = ""; // Clear previous results

            profs.forEach(prof => {
                let div = document.createElement("div");
                div.classList.add("professor");
                div.innerHTML = `
                    <h3>${prof.name}</h3>
                    <p><b>University:</b> ${prof.university}</p>
                    <p><b>Email:</b> ${prof.email !== "Email not found" ? `<a href="mailto:${prof.email}">${prof.email}</a>` : "Not available"}</p>
                    <p><b>Profile:</b> <a href="${prof.link}" target="_blank">View Profile</a></p>
                    
                    <button class="btn-preview" onclick="previewEmail('${prof.name}', '${prof.email}')">Preview Email</button>
                    <button class="btn-approve" onclick="approveEmail('${prof.email}')">Approve</button>
                `;
                container.appendChild(div);
            });
        })
        .catch(error => {
            console.error("Error fetching professors:", error);
            alert("Failed to fetch professors. Check if Flask is running.");
        });
}

function previewEmail(name, email) {
    let modal = document.getElementById("emailPreviewModal");
    let previewText = document.getElementById("emailPreviewText");

    previewText.innerHTML = `
        <b>Subject:</b> Postdoctoral Position <br><br>
        Dear Dr. ${name.split(" ").slice(-1)}, <br><br>

        I hope this email finds you well.<br><br>

        My name is Sadeq, and I hold a PhD in Aerospace/Flight Robotics from the Technical University of Madrid. 
        I have over eight years of experience in robotics and nonlinear control, acquired through both academic research and professional practice.<br><br>

        Throughout my academic journey—from my bachelor's to master's and PhD degrees—I focused extensively on control systems, flight dynamics, and the design of nonlinear control algorithms, including adaptive and robust approaches. 
        Professionally, over the past six years, I have been working on modifying industrial autopilot (Micropilot, UAV Navigation, Pixhawk, etc.) control loops and designing ground control system software. 
        My doctoral thesis involved implementing thrust vector control on flap vanes in a hexa-ducted fan UAV to stabilize its attitude.<br><br>

        Given our shared interests, I am keen to explore the possibility of a postdoctoral research stay in your lab. 
        Please find my CV attached for your review, and I would greatly appreciate any insights or advice you might have regarding potential opportunities.<br><br>

        Sincerely,<br>
        Sadeq
    `;

    modal.style.display = "block";
}

function closePreview() {
    document.getElementById("emailPreviewModal").style.display = "none";
}

function approveEmail(email) {
    fetch("https://242b-85-56-133-213.ngrok-free.app/approve_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
    })    
    .then(response => response.json())
    .then(data => alert("✅ Email approved successfully!"))
    .catch(error => console.error("Error:", error));
}
