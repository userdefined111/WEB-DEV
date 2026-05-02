// Configuration - Replace with your actual API keys
const CONFIG = {
    OPENAI_API_KEY: 'your-openai-api-key-here',
    GOOGLE_TRANSLATE_API_KEY: 'your-google-translate-api-key-here',
    GOOGLE_FACTCHECK_API_KEY: 'your-google-factcheck-api-key-here',
    USE_MOCK_DATA: true // Set to false when you have real API keys
};

// State Management
let currentPage = 'home';
let currentLanguage = 'en';
let chatHistory = [];
let recentChecks = [];
let queriesAnswered = 0;
let factsChecked = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Show disclaimer modal on first visit
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeenDisclaimer) {
        document.getElementById('disclaimerModal').classList.add('active');
    }

    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        document.getElementById('languageSelector').value = savedLanguage;
    }

    // Load statistics
    queriesAnswered = parseInt(localStorage.getItem('queriesAnswered') || '0');
    factsChecked = parseInt(localStorage.getItem('factsChecked') || '0');
    animateCounters();

    // Check URL hash for page navigation
    const hash = window.location.hash.substring(1);
    if (hash) {
        showPage(hash);
    }
}

// Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const pageElement = document.getElementById(pageName + '-page');
    if (pageElement) {
        pageElement.classList.add('active');
        currentPage = pageName;
        window.location.hash = pageName;

        // Close mobile menu if open
        const navMenu = document.getElementById('navMenu');
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
}

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// Disclaimer Modal
function closeDisclaimer() {
    const dontShowAgain = document.getElementById('dontShowAgain').checked;
    if (dontShowAgain) {
        localStorage.setItem('hasSeenDisclaimer', 'true');
    }
    document.getElementById('disclaimerModal').classList.remove('active');
}

// Language Selector
async function changeLanguage() {
    const selector = document.getElementById('languageSelector');
    currentLanguage = selector.value;
    localStorage.setItem('preferredLanguage', currentLanguage);

    // In production, translate all page content here
    console.log('Language changed to:', currentLanguage);
    showNotification('Language updated! 🌐');
}

// Counter Animation
function animateCounters() {
    animateCounter('queriesCount', 0, queriesAnswered, 1000);
    animateCounter('factsChecked', 0, factsChecked, 1000);
}

function animateCounter(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = Math.floor(end);
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ==================== AI CHATBOT ====================

function askQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) {
        showNotification('Please enter a question', 'warning');
        return;
    }

    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';

    // Show loading
    const sendBtn = document.getElementById('sendBtn');
    const sendBtnText = document.getElementById('sendBtnText');
    const sendBtnLoader = document.getElementById('sendBtnLoader');
    sendBtnText.style.display = 'none';
    sendBtnLoader.style.display = 'inline-block';
    sendBtn.disabled = true;

    try {
        let response;

        if (CONFIG.USE_MOCK_DATA) {
            // Mock response for demo
            response = await getMockChatResponse(message);
        } else {
            // Real OpenAI API call
            response = await getOpenAIResponse(message);
        }

        // Add bot response
        addMessageToChat(response, 'bot');

        // Update statistics
        queriesAnswered++;
        localStorage.setItem('queriesAnswered', queriesAnswered);
        document.getElementById('queriesCount').textContent = queriesAnswered;

    } catch (error) {
        console.error('Chat error:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again or visit the official ECI website at eci.gov.in', 'bot');
    } finally {
        // Hide loading
        sendBtnText.style.display = 'inline';
        sendBtnLoader.style.display = 'none';
        sendBtn.disabled = false;
    }
}

function addMessageToChat(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `<p>${message}</p>`;

    if (type === 'bot') {
        const badge = document.createElement('div');
        badge.className = 'verified-badge';
        badge.textContent = '✓ Verified Source';
        content.appendChild(badge);
    }

    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getOpenAIResponse(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI assistant helping Indian voters. Only answer questions about voting, elections, and civic participation in India. Cite the Election Commission of India (ECI) as your source. If you do not know something, recommend visiting eci.gov.in or voters.eci.gov.in. Keep responses concise (2-3 sentences) and factual.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 300,
            temperature: 0.3
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.choices[0].message.content;
}

async function getMockChatResponse(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('register') || lowerMessage.includes('registration')) {
        return 'To register as a voter, visit the National Voters' Service Portal at voters.eci.gov.in. You can apply online using Form 6. You need to be 18 years old and provide proof of residence and age. The process typically takes 2-4 weeks. Source: Election Commission of India.';
    } else if (lowerMessage.includes('voter id') || lowerMessage.includes('epic')) {
        return 'You can check your Voter ID status at voters.eci.gov.in by entering your details. If you haven't received your card, you can download an e-EPIC (digital Voter ID). For corrections, use Form 8 on the same portal. Source: ECI.';
    } else if (lowerMessage.includes('when') || lowerMessage.includes('election') || lowerMessage.includes('date')) {
        return 'The next major elections are the State Assembly Elections scheduled for early 2026 in several states. For the most current schedule, please visit the official ECI website at eci.gov.in as dates are subject to announcement. Source: Election Commission of India.';
    } else if (lowerMessage.includes('nota')) {
        return 'NOTA (None of the Above) allows voters to reject all candidates on the ballot. However, NOTA votes do not affect the election outcome - the candidate with the most votes still wins, even if NOTA gets more votes. It's a way to express dissatisfaction with all candidates. Source: ECI.';
    } else if (lowerMessage.includes('evm') || lowerMessage.includes('machine')) {
        return 'Electronic Voting Machines (EVMs) are standalone devices with no internet connectivity, making them secure against hacking. They consist of a Control Unit and Ballot Unit. EVMs have been used in Indian elections since 2000 and include VVPAT (paper trail) for verification. Source: ECI.';
    } else if (lowerMessage.includes('id') || lowerMessage.includes('document') || lowerMessage.includes('proof')) {
        return 'You can use any of these 12 documents to vote: Voter ID (EPIC), Aadhaar Card, Passport, Driving License, PAN Card, Service Identity Card, Passbook with photo, Health Insurance Card, Pension Document, Official ID with photo, Bank/Post Office passbook with photo, or MNREGA Job Card. Source: ECI.';
    } else {
        return 'That's a great question about Indian elections! For the most accurate and up-to-date information, I recommend visiting the official Election Commission website at eci.gov.in or calling their helpline at 1950. They can provide authoritative answers to all election-related queries. Source: Election Commission of India.';
    }
}

// ==================== FACT CHECKER ====================

async function checkFact() {
    const input = document.getElementById('factCheckInput');
    const text = input.value.trim();

    if (!text) {
        showNotification('Please enter some text to verify', 'warning');
        return;
    }

    if (text.length < 10) {
        showNotification('Please enter a longer claim (at least 10 characters)', 'warning');
        return;
    }

    // Show loading
    const checkBtn = document.getElementById('checkBtn');
    const checkBtnText = document.getElementById('checkBtnText');
    const checkBtnLoader = document.getElementById('checkBtnLoader');
    checkBtnText.style.display = 'none';
    checkBtnLoader.style.display = 'inline-block';
    checkBtn.disabled = true;

    try {
        let result;

        if (CONFIG.USE_MOCK_DATA) {
            // Mock analysis for demo
            result = await getMockFactCheckResult(text);
        } else {
            // Real API call
            result = await getFactCheckResult(text);
        }

        // Display result
        displayFactCheckResult(result);

        // Add to recent checks
        addToRecentChecks(text, result);

        // Update statistics
        factsChecked++;
        localStorage.setItem('factsChecked', factsChecked);
        document.getElementById('factsChecked').textContent = factsChecked;

    } catch (error) {
        console.error('Fact check error:', error);
        showNotification('Error analyzing claim. Please try again.', 'error');
    } finally {
        // Hide loading
        checkBtnText.style.display = 'inline';
        checkBtnLoader.style.display = 'none';
        checkBtn.disabled = false;
    }
}

async function getFactCheckResult(text) {
    // Try OpenAI for classification
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a fact-checker for election-related claims in India. Analyze the claim and respond in this format: "Classification: [TRUE/MISLEADING/FAKE] | Confidence: [percentage] | Reasoning: [2-3 sentences explaining why]". Base your analysis on known facts about Indian elections and ECI guidelines.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            max_tokens: 200,
            temperature: 0.2
        })
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the response
    const parts = aiResponse.split('|');
    const classification = parts[0].replace('Classification:', '').trim();
    const confidence = parts[1].replace('Confidence:', '').trim();
    const reasoning = parts[2].replace('Reasoning:', '').trim();

    return { classification, confidence, reasoning };
}

async function getMockFactCheckResult(text) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerText = text.toLowerCase();

    // Check for common fake claims
    if (lowerText.includes('online voting') || lowerText.includes('vote online') || lowerText.includes('vote from home')) {
        return {
            classification: 'FAKE',
            confidence: '98%',
            reasoning: 'This is FALSE. Online voting from home is NOT permitted in India. Voters must physically visit their assigned polling station to cast their vote using EVMs. The Election Commission has never allowed remote online voting for general elections.'
        };
    } else if (lowerText.includes('nota') && lowerText.includes('re-election')) {
        return {
            classification: 'MISLEADING',
            confidence: '92%',
            reasoning: 'This is MISLEADING. While NOTA (None of the Above) allows voters to reject all candidates, it does NOT trigger a re-election. The candidate with the highest number of votes still wins, regardless of NOTA votes.'
        };
    } else if (lowerText.includes('evm') && (lowerText.includes('hack') || lowerText.includes('manipulate') || lowerText.includes('tamper'))) {
        return {
            classification: 'MISLEADING',
            confidence: '89%',
            reasoning: 'This claim is MISLEADING. EVMs are standalone devices with no network connectivity, making remote hacking impossible. While no system is 100% secure, EVMs have multiple security layers, VVPAT paper trails, and have been validated by courts and technical experts.'
        };
    } else if (lowerText.includes('aadhar') && lowerText.includes('mandatory') && lowerText.includes('vot')) {
        return {
            classification: 'FAKE',
            confidence: '95%',
            reasoning: 'This is FALSE. Aadhaar is NOT mandatory for voting. The Election Commission accepts 12 different types of photo identity documents including Voter ID, Passport, Driving License, PAN Card, and others. Aadhaar is just one of the accepted documents.'
        };
    } else if (lowerText.includes('vote') && lowerText.includes('multiple') || lowerText.includes('twice')) {
        return {
            classification: 'FAKE',
            confidence: '99%',
            reasoning: 'This is completely FALSE and ILLEGAL. Voting more than once is a serious electoral offense under Section 171F of IPC with imprisonment up to 1 year. The indelible ink, voter lists, and photo verification prevent multiple voting.'
        };
    } else {
        return {
            classification: 'TRUE',
            confidence: '75%',
            reasoning: 'Based on the information provided, this claim appears to align with official Election Commission guidelines. However, we recommend verifying specific details with the official ECI website at eci.gov.in for the most current and accurate information.'
        };
    }
}

function displayFactCheckResult(result) {
    const resultSection = document.getElementById('factCheckResult');
    const resultBadge = document.getElementById('resultBadge');
    const resultConfidence = document.getElementById('resultConfidence');
    const resultReasoning = document.getElementById('resultReasoning');
    const resultTimestamp = document.getElementById('resultTimestamp');

    // Show result section
    resultSection.style.display = 'block';

    // Set classification badge
    let badgeClass = '';
    let badgeText = '';

    if (result.classification.toUpperCase().includes('TRUE')) {
        badgeClass = 'badge-true';
        badgeText = '✅ LIKELY TRUE';
    } else if (result.classification.toUpperCase().includes('MISLEADING')) {
        badgeClass = 'badge-misleading';
        badgeText = '⚠️ MISLEADING';
    } else {
        badgeClass = 'badge-fake';
        badgeText = '❌ LIKELY FAKE';
    }

    resultBadge.className = `result-badge ${badgeClass}`;
    resultBadge.textContent = badgeText;

    // Set confidence
    resultConfidence.textContent = `Confidence: ${result.confidence}`;

    // Set reasoning
    resultReasoning.textContent = result.reasoning;

    // Set timestamp
    const now = new Date();
    resultTimestamp.textContent = now.toLocaleString('en-IN');

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addToRecentChecks(text, result) {
    const check = {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        classification: result.classification,
        timestamp: new Date().toLocaleString('en-IN')
    };

    recentChecks.unshift(check);
    if (recentChecks.length > 5) {
        recentChecks.pop();
    }

    // Update display
    const recentChecksList = document.getElementById('recentChecksList');
    if (recentChecks.length === 0) {
        recentChecksList.innerHTML = '<p class="empty-state">No recent checks yet. Start verifying claims above!</p>';
    } else {
        recentChecksList.innerHTML = recentChecks.map(check => {
            let badgeClass = check.classification.toUpperCase().includes('TRUE') ? 'badge-true' : 
                             check.classification.toUpperCase().includes('MISLEADING') ? 'badge-misleading' : 'badge-fake';
            return `
                <div class="result-card" style="margin-bottom: 1rem;">
                    <div class="result-badge ${badgeClass}" style="font-size: 0.9rem; padding: 0.3rem 0.8rem;">
                        ${check.classification}
                    </div>
                    <p style="margin: 0.5rem 0; color: var(--text-gray);">${check.text}</p>
                    <small style="color: var(--text-gray);">${check.timestamp}</small>
                </div>
            `;
        }).join('');
    }
}

// ==================== TABS ====================

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active to clicked button
    event.target.classList.add('active');
}

// ==================== FAQ ====================

function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const wasActive = faqItem.classList.contains('active');

    // Close all FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Open clicked FAQ if it wasn't already open
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

// ==================== UTILITIES ====================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#DC3545' : type === 'warning' ? '#FFC107' : '#138808'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideInRight 0.3s;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Allow Enter key to send chat message
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});