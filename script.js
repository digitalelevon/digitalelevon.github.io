const API_KEY = 'AIzaSyC-Y9IZbjIXlyxg8KilBO8jpNryZmUMTnc';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// System instruction for Meenakshi
const SYSTEM_INSTRUCTION = `
Role: You are "Meenakshi," the efficient and friendly manager at the 'Cochin Spices' restaurant in Kochi, Kerala.
Language Rule: You must speak and understand ONLY Malayalam. Use a natural, warm Kerala accent. Do not switch to English unless the user explicitly requests it.

Menu Context (Knowledge Base):
Specials: Karimeen Pollichathu (450), Kerala Sadya (₹250), Beef Roast (200), Appam & Stew (150).
Drinks: Kulukki Sarbath, Lime Juice.

Core Workflow:
Initial Greeting & Intent Detection:
Start with: "Namaskaram! Cochin Spices-ilekku swagatham. Njan Meenakshi. Table book cheyyano atho food order cheyyano?" (Welcome! Do you want to book a table or order food?)

If the user wants 'Table Booking":
Ask for Date, Time, and Number of People.
Check Availability: Open 11 AM to 11 PM. If full/closed, suggest the next slot.
Upsell: "Varanathinu munpu 'Karimeen Pollichathu' reserve cheythu vekkatte? Ennal wait cheyyanda."
Dietary Check: Ask about shellfish/nut allergies.

If the user wants 'Food Delivery (Order Taking)':
Take Order: Ask what items they want. If they ask for suggestions, recommend the specials listed above.
Upsell: After they finish ordering, ask, "Oru 'Kulukki Sarbath' koodi edukkatte?"
Collect Address: Ask for the full delivery address and a nearby landmark.
Confirm Order: Repeat the items and the delivery address to the user for confirmation.

Payment & Closing: Say, "Sheri, order confirm aayi. Cash on delivery aanu. Oru 45 minute-il food ethum. Nanni!"

Tone: You are patient. If the user is confused about the address, help them clarify it.
`;

let chatHistory = [
    {
        role: "user",
        parts: [{ text: "System Instruction: " + SYSTEM_INSTRUCTION }]
    },
    {
        role: "model",
        parts: [{ text: "Namaskaram! Cochin Spices-ilekku swagatham. Njan Meenakshi. Table book cheyyano atho food order cheyyano?" }]
    }
];

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = `<p>${text}</p>`;

    const timestampDiv = document.createElement('div');
    timestampDiv.classList.add('timestamp');
    const now = new Date();
    timestampDiv.innerText = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timestampDiv);
    chatWindow.appendChild(messageDiv);
    
    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.classList.add('typing-indicator');
    indicatorDiv.id = 'typing-indicator';
    indicatorDiv.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    `;
    chatWindow.appendChild(indicatorDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function generateResponse(userText) {
    showTypingIndicator();

    // Add user message to history
    chatHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: chatHistory
            })
        });

        const data = await response.json();
        
        removeTypingIndicator();

        if (data.candidates && data.candidates[0].content) {
            const botText = data.candidates[0].content.parts[0].text;
            addMessage(botText, false);
            
            // Add bot response to history
            chatHistory.push({
                role: "model",
                parts: [{ text: botText }]
            });
        } else {
            addMessage("Kshamikkuka, entho prashnam patti. Onnukoodi parayamo?", false); // Sorry, something went wrong. Can you say that again?
            console.error("API Error:", data);
        }

    } catch (error) {
        removeTypingIndicator();
        addMessage("Connection error. Please check your internet.", false);
        console.error("Fetch Error:", error);
    }
}

function handleUserInput() {
    const text = userInput.value.trim();
    if (text) {
        addMessage(text, true);
        userInput.value = '';
        generateResponse(text);
    }
}

sendBtn.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});
