# Dog Spa Hotel - SPA & Chatbot

This project is a modern, single-page application for a luxury "Dog Spa Hotel." It features a premium, mobile-first design and an advanced on-site chatbot that runs entirely in the browser with no external AI APIs.

This project is built to run **without any `npm` dependencies or build steps**, adhering to a "single-folder" architecture.

**URL**: https://harshil8136.github.io/Hotel-para-mascotas-Madagascar/

## How to Run This Project

You do not need to install `npm` or any packages.

### Option 1: VS Code (Recommended)
1.  Open the project folder in Visual Studio Code.
2.  Install the **"Live Server"** extension by Ritwick Dey.
3.  Right-click on `index.html` and select **"Open with Live Server"**.

### Option 2: Browser
1.  Drag the `index.html` file from your file explorer directly into your Google Chrome or Firefox browser window.
    *Note: Some features like the PWA service worker may work more reliably with a local server (Option 1).*

## How the Chatbot Works

The chatbot is 100% client-side and uses no external AI APIs, as specified in the PRD. Its intelligence comes from a three-part system:

1.  **Retriever (Fuse.js):** When you type a question, it uses fuzzy search (Fuse.js) to find the best match in the `seed.json` knowledge base for either English or Spanish.
2.  **Intent Classifier (Rule-based):** It uses simple keyword rules (e.g., "book", "reserve", "cita") to understand your *intent*, such as `book_service` or `ask_hours`.
3.  **Dialog Manager (FSM):** This is a Finite State Machine that manages the conversation flow. If you have a "booking" intent, it activates a "slot-filling" mode, asking you for the `service`, `petName`, `date`, `time`, etc., one by one until the booking is complete.

## Data, Privacy, and Admin

This application respects user privacy and runs entirely locally.

* **Storage:** All data (bookings, chat logs) is stored *only* in your browser's **IndexedDB**. No data is sent to a cloud server (except for the optional admin panel in this demo).
* **Privacy:** The app will ask for explicit consent before saving any personal information to the local database, as required by the PRD.
* **Data Export:** You can export or delete your data at any time.

### Admin Screen

There is a simple, hidden admin screen for staff to view all bookings and contact requests stored in the *local* database.

* **How to Access:** Add `#admin` to the end of the URL (e.g., `http://127.0.0.1:5500/index.html#admin`).
* **Password:** The default password is `123`.

From the admin panel, you can export all bookings as a CSV file.

## 10 Example Dialogues (Test Cases)

The bot is designed to handle the following conversations:

1.  **Hours:**
    * **User:** "What are your hours?"
    * **Bot:** (Returns opening hours.)
2.  **Large Breeds:**
    * **User:** "Do you offer grooming for large breeds?"
    * **Bot:** (Returns info on the 'Full Grooming' service.)
3.  **Booking from Chat:**
    * **User:** "How long is a full spa treatment?"
    * **Bot:** "The Premium Spa Treatment takes 3 hours."
    * **User:** "I want to book that."
    * **Bot:** "Great! Let's get you booked. What's your pet's name?"
    * *(...continues slot-filling...)*
4.  **Boarding Duration (Entity Extraction):**
    * **User:** "Can I board my dog for 3 nights?"
    * **Bot:** "Yes, we can! What date would you like to book for?"
5.  **Medication Policy:**
    * **User:** "Will you administer medication?"
    * **Bot:** (Returns policy on medication.)
6.  **Cancellation:**
    * **User:** "I need to cancel."
    * **Bot:** (Returns cancellation policy and provides contact info.)
7.  **Call Request (Handoff):**
    * **User:** "I want someone to call me."
    * **Bot:** "Sure, I can have someone call you. What's the best phone number?"
    * **User:** "555-123-4567"
    * **Bot:** "Got it: (555) 123-4567. When would be a good time to call?"
    * **User:** "Tomorrow afternoon"
    * **Bot:** "Okay! I've requested a callback for you... A staff member will reach out soon."
8.  **Allergies/Sensitivity (PRD 16.8):**
    * **User:** "My dog is sensitive to perfumes."
    * **Bot:** (Returns the policy on using unscented, hypoallergenic products.)
9.  **Aggressive Dog (PRD 16.9):**
    * **User:** "My dog gets aggressive."
    * **Bot:** (Returns policy on private sessions and separate care areas.)
10. **Spanish Toggle:**
    * *(User clicks 'ES' button)*
    * **User:** "¿Cuál es su horario?"

    * **Bot:** "Abrimos de Lunes a Sábado de 8:00 AM a 6:00 PM..."
