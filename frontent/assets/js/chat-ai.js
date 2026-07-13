class ChatAI {
    constructor() {
        this.isOpen = false;
        this.isLoading = false;
        // OBTENER EL TOKEN REAL DEL localStorage (igual que en todos los admin)
        const token = localStorage.getItem("jwtToken");
        this.token = token || null; // ← TOKEN REAL O NULL
        
        this.init();
    }

    init() {
        // Crear y agregar el widget al body
        this.createWidget();
        this.bindEvents();
    }

    createWidget() {
        // El HTML del widget se carga desde el archivo externo
        // Solo nos aseguramos de que esté en el DOM
        if (!document.getElementById('chatAIWidget')) {
            console.warn('Chat AI Widget HTML no encontrado en el DOM');
        }
    }

    bindEvents() {
        // Toggle del chat
        document.getElementById('chatToggle')?.addEventListener('click', () => {
            this.toggleChat();
        });

        // Cerrar chat
        document.getElementById('chatClose')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Enviar mensaje con Enter
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.sendMessage();
            }
        });

        // Enviar mensaje con botón
        document.getElementById('sendMessage')?.addEventListener('click', () => {
            if (!this.isLoading) {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            chatWindow.classList.add('active');
            document.getElementById('chatInput').focus();
        } else {
            chatWindow.classList.remove('active');
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('chatWindow').classList.remove('active');
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message || this.isLoading) return;

        // Limpiar input
        input.value = '';

        // Agregar mensaje del usuario
        this.addMessage(message, 'user');

        // Mostrar loading
        this.showLoading();

        try {
            // Llamar a la API
            const response = await this.callChatAPI(message);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error en chat:', error);
            this.addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.', 'bot');
        } finally {
            this.hideLoading();
        }
    }

    async callChatAPI(message) {
        const response = await fetch((window.API_BASE_URL || 'http://127.0.0.1:8081') + '/api/chat-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        return data.response;
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll al final
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showLoading() {
        this.isLoading = true;
        const messagesContainer = document.getElementById('chatMessages');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingMessage';
        loadingDiv.className = 'message bot-message';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <span>Escribiendo...</span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideLoading() {
        this.isLoading = false;
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }
}

// Inicializar el chat cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    new ChatAI();
});