document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const userNameInput = document.getElementById('userName');
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsMenuButton = document.getElementById('settings-menu-button');
    const settingsMenuDropdown = document.getElementById('settings-menu-dropdown');
    const currentModeText = document.getElementById('current-mode-text');

    const API_KEY = 'AIzaSyA7CTtEcl64urUk3BaUF3VWx6xsgFc1wsI';
    const MODEL_NAME = 'gemini-2.0-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    let currentMode = 'pacar-tsundere';
    let conversationHistory = [];
    
    const baseResponses = {
        alya: [
            "Aku di sini buat bantu kamu!",
            "Gimana kabarmu hari ini?",
            "Siap bantuin apapun yang kamu mau!"
        ]
    };

    const systemInstructions = {
        "pacar-tsundere": "Kamu adalah pacar tsundere yang manis dan perhatian, tapi gengsi menunjukkan rasa sayang.",
        "asisten-pribadi": "Kamu adalah asisten pribadi yang profesional, responsif, dan membantu dalam berbagai tugas.",
        "teman-ngobrol": "Kamu adalah teman ngobrol yang santai dan asik, seperti sahabat dekat."
    };

    const icons = {
        sun: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.02 12.02c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zM18.01 5.99c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
        moon: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="20px" viewBox="0 0 24 24" width="20px"><g><rect fill="none" height="24" width="24"/></g><g><path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c0.83,0,1.62-0.12,2.37-0.34c-0.43-0.7-0.68-1.52-0.68-2.4c0-2.48,2.02-4.5,4.5-4.5 c0.88,0,1.7-0.25,2.4-0.68C21.12,13.62,22,12.83,22,12C22,7.03,17.97,3,12,3z"/></g></svg>`
    };

    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    
    const sendMessage = async (retryCount = 3) => {
        const userMessageText = (retryCount === 3) ? userInput.value.trim() : conversationHistory[conversationHistory.length - 1].text;
        if (userMessageText === '') return;

        if (retryCount === 3) {
            appendMessage(userMessageText, 'user');
            userInput.value = '';
            adjustInputHeight();
            showTypingIndicator();
        }

        try {
            const userName = userNameInput.value.trim();
            const systemPrompt = `${systemInstructions[currentMode]} ${userName ? `Nama user adalah ${userName}.` : ''}`;
            const contents = conversationHistory.slice(-20).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Maaf, aku tidak bisa merespons saat ini.";
            appendMessage(modelResponse, 'alya');

        } catch (error) {
            console.error("Error fetching syn's response:", error);
            if (retryCount > 0) {
                setTimeout(() => sendMessage(retryCount - 1), 1000);
            } else {
                appendMessage("Terjadi kesalahan saat memproses permintaan.", 'alya', true);
            }
        }
    };

    const appendMessage = (text, sender, isError = false, noAnimate = false) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message', `${sender}-message`);
        if (noAnimate) messageWrapper.classList.add('no-animate');

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        if (isError) bubble.style.color = 'red';
        bubble.innerHTML = text;

        messageWrapper.appendChild(bubble);
        chatBox.appendChild(messageWrapper);
        chatBox.scrollTop = chatBox.scrollHeight;

        conversationHistory.push({ text, sender });
    };

    const adjustInputHeight = () => {
        userInput.style.height = 'auto';
        userInput.style.height = `${userInput.scrollHeight}px`;
    };

    const showTypingIndicator = () => {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'alya-message', 'no-animate');

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerHTML = '<em>Mengetik...</em>';

        typingIndicator.appendChild(bubble);
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const handleSend = (e) => {
        e.preventDefault();
        sendMessage();
        userInput.focus();
    };

    sendBtn.addEventListener('click', handleSend);
    themeToggleButton.addEventListener('click', () => {
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    userNameInput.addEventListener('input', saveSession);
    
    settingsMenuButton.addEventListener('click', () => {
        settingsMenu.classList.toggle('active');
    });

    window.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target)) {
            settingsMenu.classList.remove('active');
        }
    });
});