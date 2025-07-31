document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const conversationsList = document.querySelector('.conversations');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const activeChatName = document.getElementById('active-chat-name');
    const activeChatAvatar = document.getElementById('active-chat-avatar');
    
    let currentChatId = null;
    let pollInterval = null;
    
    // Load conversations
    function loadConversations() {
        fetch('/api/chat/conversations')
            .then(response => response.json())
            .then(data => {
                conversationsList.innerHTML = '';
                
                if (data.length === 0) {
                    conversationsList.innerHTML = '<p class="no-conversations">No conversations yet</p>';
                    return;
                }
                
                data.forEach(conversation => {
                    const conversationElement = document.createElement('div');
                    conversationElement.className = 'conversation';
                    conversationElement.dataset.userId = conversation.other_user_id;
                    
                    conversationElement.innerHTML = `
                        <img src="${conversation.other_avatar || '../static/images/default-avatar.png'}" 
                             class="conversation-avatar" alt="${conversation.other_username}">
                        <div class="conversation-info">
                            <h4 class="conversation-name">${conversation.other_username}</h4>
                            <p class="conversation-preview">${conversation.last_message || 'No messages yet'}</p>
                            <p class="conversation-time">${formatTime(conversation.timestamp)}</p>
                        </div>
                        ${!conversation.is_read ? '<div class="unread-badge"></div>' : ''}
                    `;
                    
                    conversationElement.addEventListener('click', () => {
                        openChat(conversation.other_user_id, conversation.other_username, conversation.other_avatar);
                    });
                    
                    conversationsList.appendChild(conversationElement);
                });
            })
            .catch(error => {
                console.error('Error loading conversations:', error);
            });
    }
    
    // Open chat with a user
    function openChat(userId, username, avatarUrl) {
        currentChatId = userId;
        activeChatName.textContent = username;
        activeChatAvatar.src = avatarUrl || '../static/images/default-avatar.png';
        
        // Enable message input
        messageInput.disabled = false;
        sendButton.disabled = false;
        
        // Highlight active conversation
        document.querySelectorAll('.conversation').forEach(conv => {
            conv.classList.toggle('active', conv.dataset.userId === userId.toString());
        });
        
        loadMessages(userId);
        
        // Start polling for new messages
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => loadMessages(userId, true), 3000);
    }
    
    // Load messages for a chat
    function loadMessages(userId, silent = false) {
        fetch(`/api/chat/messages/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (!silent) {
                    messagesContainer.innerHTML = '';
                    
                    if (data.messages.length === 0) {
                        messagesContainer.innerHTML = `
                            <div class="no-messages">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        `;
                        return;
                    }
                    
                    data.messages.forEach(message => {
                        const messageElement = document.createElement('div');
                        messageElement.className = `message ${message.sender_id === userId ? 'message-incoming' : 'message-outgoing'}`;
                        
                        messageElement.innerHTML = `
                            <div class="message-content">${message.message_body}</div>
                            <div class="message-time">${formatTime(message.timestamp)}</div>
                        `;
                        
                        messagesContainer.appendChild(messageElement);
                    });
                    
                    // Scroll to bottom
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                } else {
                    // Silent update - just check for new messages
                    const lastMessage = data.messages[data.messages.length - 1];
                    if (lastMessage && lastMessage.sender_id === userId && !lastMessage.is_read) {
                        // New message from other user - reload
                        loadMessages(userId);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading messages:', error);
            });
    }
    
    // Send message
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || !currentChatId) return;
        
        fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                receiver_id: currentChatId,
                message_body: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message_id) {
                messageInput.value = '';
                loadMessages(currentChatId);
            }
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
    }
    
    // Helper function to format time
    function formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initial load
    loadConversations();
    
    // Poll for new conversations every 10 seconds
    setInterval(loadConversations, 10000);
});