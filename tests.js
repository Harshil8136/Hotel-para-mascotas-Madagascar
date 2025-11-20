(function() {
  'use strict';

  // Wait for the DOM and all scripts (app.js) to be ready
  window.addEventListener('load', () => {
    
    // This global is exposed by app.js when in a test environment
    const ChatbotLogic = window.ChatbotLogic;
    if (!ChatbotLogic) {
      renderResult('Fatal Error', false, 'Could not find window.ChatbotLogic. Did app.js load and export its test harness?');
      return;
    }

    const { getDB, addBooking, addContactRequest, getAllBookings, getContactRequests, DialogueManager, detectIntent, searchKnowledge, getServiceById } = ChatbotLogic;
    const resultsList = document.getElementById('test-results');
    resultsList.innerHTML = ''; // Clear "loading" message

    // --- Test Runner ---

    const testSuite = [];
    let testsPassed = 0;
    let testsFailed = 0;

    function renderResult(title, success, details = '') {
      const li = document.createElement('li');
      li.className = 'border rounded-lg p-4 shadow-sm';
      li.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-lg font-medium">${title}</span>
          <span class="${success ? 'pass' : 'fail'}">${success ? 'PASS' : 'FAIL'}</span>
        </div>
        ${details ? `<pre>${details.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>` : ''}
      `;
      resultsList.appendChild(li);
      success ? testsPassed++ : testsFailed++;
    }

    // Helper to simulate a full conversation
    async function runTest(title, steps) {
      let context = { dialogueState: 'idle', filledSlots: {}, lang: 'en' };
      const dm = new DialogueManager(context);
      let lastResponse = '';
      let details = '';

      try {
        for (const step of steps) {
          if (step.user) {
            const intentResult = detectIntent(step.user, dm.context);
            const dmResponse = dm.determineNextAction(step.user, intentResult.intent);
            
            let responseContent = dmResponse.response;
            if (responseContent === null) {
              const kbResult = searchKnowledge(step.user, 'en');
              responseContent = kbResult ? kbResult.answer : 'Fallback';
            }
            
            lastResponse = responseContent;
            details += `User: ${step.user}\nBot: ${responseContent}\n`;
            
            if (step.assertResponse) {
              if (!responseContent.toLowerCase().includes(step.assertResponse.toLowerCase())) {
                throw new Error(`Assertion failed! Expected response to include: "${step.assertResponse}". Got: "${responseContent}"`);
              }
            }
            if (dmResponse.action === 'save_booking') {
               await addBooking({ ...dm.context.filledSlots, status: 'test-booking' });
            }
            if (dmResponse.action === 'save_contact_request') {
               await addContactRequest({ ...dm.context.filledSlots, details: 'test-request' });
            }
          }
          if (step.checkDB) {
            const checkResult = await step.checkDB();
            if (!checkResult.success) {
              throw new Error(`DB Check failed: ${checkResult.message}`);
            }
            details += `DB Check: ${checkResult.message}\n`;
          }
        }
        renderResult(title, true, details);
      } catch (error) {
        renderResult(title, false, `${details}\n--- ERROR ---\n${error.message}`);
      }
    }
    
    // --- Define and Run Tests (from PRD 16) ---
    
    async function runAllTests() {
      // Clear DB before tests
      const db = await getDB();
      await db.clear('bookings');
      await db.clear('contact_requests');
      
      // 1. Hours
      await runTest('Test 1: Hours', [
        { user: 'What are your hours?', assertResponse: "8:00 AM to 6:00 PM" }
      ]);
      
      // 2. Grooming large breeds
      await runTest('Test 2: Grooming Large Breeds', [
        { user: 'Do you offer grooming for large breeds?', assertResponse: "full grooming service" }
      ]);
      
      // 3. Spa duration & booking
      await runTest('Test 3: Spa Duration & Booking', [
        { user: 'How long is a full spa treatment?', assertResponse: '3 hours' },
        { user: 'I want to book the spa for my dog.', assertResponse: "What's your pet's name?" },
        { user: 'Fido', assertResponse: "What date would you like" },
        { user: 'Tomorrow', assertResponse: "What time works best" },
        { user: '9am', assertResponse: "What's your full name?" },
        { user: 'John Doe', assertResponse: "best phone number" },
        { user: '555-555-5555', assertResponse: "save this information" },
        { user: 'Yes', assertResponse: "Please confirm the details" },
        { user: 'Yes, confirm', assertResponse: "booking is all set" },
        { 
          checkDB: async () => {
            const bookings = await getAllBookings();
            const success = bookings.length === 1 && bookings[0].petName === 'Fido' && bookings[0].status === 'test-booking';
            return { success, message: success ? 'Booking saved to DB.' : 'Booking not found in DB.' };
          }
        }
      ]);
      
      // 4. Boarding for 3 nights
      await runTest('Test 4: Boarding for 3 nights', [
        { user: 'Can I board my dog for 3 nights?', assertResponse: "What's your pet's name?" }
        // Note: The simple FSM assumes "book" intent and continues. A more advanced NLU would parse "3 nights".
      ]);
      
      // 5. Medication
      await runTest('Test 5: Medication', [
        { user: 'Will you administer medication?', assertResponse: "oral medications" }
      ]);

      // 6. Cancel/reschedule
      await runTest('Test 6: Cancel/Reschedule', [
        { user: 'I need to cancel', assertResponse: "24 hours before" }
      ]);
      
      // 7. Call request
      await runTest('Test 7: Call Request', [
        { user: 'I want someone to call me', assertResponse: 'best phone number?' },
        { user: '555-867-5309', assertResponse: 'good time to call?' },
        { user: 'Tonight', assertResponse: "requested a callback" },
        { 
          checkDB: async () => {
            const reqs = await getContactRequests();
            const success = reqs.length === 1 && reqs[0].phone === '5558675309' && reqs[0].preferred_time === 'Tonight';
            return { success, message: success ? 'Contact request saved to DB.' : 'Contact request not found in DB.' };
          }
        }
      ]);
      
      // 8. Allergies / perfume
      await runTest('Test 8: Allergies / Perfume', [
        { user: 'My dog is sensitive to perfumes', assertResponse: "hypoallergenic" } 
        // This test will fail unless "hypoallergenic" is in the answer for "sensitive". Let's check seed.json...
        // ... The `seed.json` has no entry for this. This test will fail, *as it should*.
      ]);

      // 9. Aggressive dog
      await runTest('Test 9: Aggressive Dog', [
        { user: 'My dog gets aggressive around others', assertResponse: "private sessions" }
      ]);
      
      // 10. Mail appointment
      await runTest('Test 10: Mail Appointment', [
        { user: 'Book appointment and mail it to me', assertResponse: "What's your pet's name?" } 
        // This tests that the booking flow starts and the FSM will later ask for an email.
      ]);
      
      // --- Render Summary ---
      const summary = document.createElement('li');
      const total = testsPassed + testsFailed;
      const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(0) : 0;
      summary.className = 'border-t-2 pt-4 mt-8';
      summary.innerHTML = `
        <h2 class="text-2xl font-bold">Test Summary</h2>
        <p class="text-lg ${testsFailed > 0 ? 'fail' : 'pass'}">
          ${testsPassed} / ${total} Tests Passed (${passRate}%)
        </p>
      `;
      resultsList.prepend(summary);

    }

    runAllTests();

  });
})();