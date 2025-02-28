function searchProfessors() {
    console.log("Fetching professors...");

    fetch("http://127.0.0.1:5000/get_professors") // Make sure Flask is running!
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(profs => {
            console.log("Professors data received:", profs);

            let container = document.getElementById("profList");
            container.innerHTML = ""; // Clear previous results

            profs.forEach(prof => {
                let div = document.createElement("div");
                div.classList.add("professor");
                div.innerHTML = `
                    <h3>${prof.name}</h3>
                    <p><b>University:</b> ${prof.university}</p>
                    <p><b>Research:</b> ${prof.research}</p>
                    <button onclick="approveEmail('${prof.email}')">Approve</button>
                `;
                container.appendChild(div);
            });
        })
        .catch(error => {
            console.error("Error fetching professors:", error);
            alert("Failed to fetch professors. Check if the server is running!");
        });
}
