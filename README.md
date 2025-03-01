# sadeqisaac.com
A professional webpage for my career and a live CV for a modern business.


# 📧 Mailing Professors Web App

This project is designed to help students **find and email professors** related to aerospace control and robotics research. The system automates the process by:

✅ Searching for professors using **Google Custom Search API**  
✅ Extracting relevant emails from university webpages  
✅ Allowing manual approval before sending emails  
✅ Sending emails via **Gmail API** with a **predefined email template**  

---

## 🚀 How to Set Up and Run This Project
To run this project successfully, follow these steps carefully.

---

## 1️⃣ Google API Setup
Since this project uses **Google Custom Search API** and **Gmail API**, you must configure them in your own Google Cloud account.

### **1.1 Create a Google Cloud Project**
1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Click on **"Select a project"** → **"New Project"**
3. Give it a name (e.g., `MailingProfs`) and click **"Create"**.

---

### **1.2 Enable Google Custom Search API**
This API allows searching university websites.

1. In **Google Cloud Console**, go to **APIs & Services** → **Library**.
2. Search for **Custom Search API**, select it, and click **"Enable"**.
3. Now, go to **APIs & Services** → **Credentials**.
4. Click **"Create Credentials"** → **API Key** → Copy this key.
5. Go to **Custom Search Engine** → [Google CSE](https://cse.google.com/cse/).
6. Click **"New Search Engine"**, enter `.edu` as a search domain, and create it.
7. Copy the **Search Engine ID** and keep it for later.

---

### **1.3 Enable Gmail API**
This API allows sending emails.

1. In **Google Cloud Console**, go to **APIs & Services** → **Library**.
2. Search for **Gmail API**, select it, and click **"Enable"**.
3. Go to **Credentials** and click **"Create Credentials"** → **OAuth Client ID**.
4. Select **"Web Application"**, enter a name, and add:
   - **Authorized Redirect URIs**: `http://localhost`
5. Click **"Create"** → **Download JSON file** (name it `gmailProfsCredentials.json`).
6. Go to **OAuth Consent Screen** and configure it with:
   - **User Type**: External
   - **Scopes**: `https://www.googleapis.com/auth/gmail.send`
   - **Test Users**: Add your Gmail account.

---

## 💻 2️⃣ Setting Up the Project Locally
### **2.1 Clone the Repository**
```sh
git clone https://github.com/sadeqal/sadeqisaac.com.git
cd sadeqisaac.com
```

### **2.2 Install Python Dependencies**
Ensure Python 3.7+ is installed, then run:
```sh
pip install flask flask-cors requests google-auth google-auth-oauthlib google-auth-httplib2 googleapiclient
```

### **2.3 Add API Keys**
Edit `scripts/mailProfs.py` and insert your API credentials:
```python
API_KEY = "YOUR_GOOGLE_CSE_API_KEY"
SEARCH_ENGINE_ID = "YOUR_GOOGLE_SEARCH_ENGINE_ID"
```
Save your Google API JSON files inside the `scripts/` folder:
```
- gmailProfsCredentials.json
- mailProfsCredentials.json
```

---

## 🚀 3️⃣ Running the Flask Server
Start the backend server:
```sh
python scripts/mailProfs.py
```
If successful, you should see:
```csharp
 * Running on http://127.0.0.1:5000
```

---

## 🌍 4️⃣ Running the Webpage
1. Open `sadeqisaac.com/html/mailProfs.html` in a browser.
2. Click **"Find Professors"**.
3. Review the list and approve emails before sending.
4. Click **"Send Emails"** to contact professors.

---

## 📡 5️⃣ Accessing Flask from Other Devices
If you want to access the Flask API from your phone or tablet, use `ngrok`:
```sh
ngrok http 5000
```
It will generate a URL like:
```perl
Forwarding: https://1234abcd.ngrok-free.app -> http://localhost:5000
```
Now, update `mailProfs.js` to use the new `ngrok` URL:
```js
fetch("https://1234abcd.ngrok-free.app/get_professors")
```

---

## 🛠 Troubleshooting
| Issue | Solution |
|--------|----------|
| Flask not running? | Run `python scripts/mailProfs.py` |
| Emails not being sent? | Check `token.json` authentication |
| Google API errors? | Ensure credentials are correct in Google Cloud |
| Cannot access from phone? | Use `ngrok` and update URLs in JavaScript |

---

## 📜 License
This project is open-source and free to use. Contributions are welcome!

