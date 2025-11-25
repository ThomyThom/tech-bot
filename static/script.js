document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatBox = document.getElementById('chat-box');

    function scrollToBottom() {
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    function formatMessageText(text) {
        let formattedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // IMPORTANTE: Processar blocos de código multi-linhas PRIMEIRO
        formattedText = formattedText.replace(/```(.*?)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const cleanedCode = code.trim();
            // Adiciona um invólucro para poder anexar o botão de copiar facilmente
            return `<div class="code-block-wrapper"><pre><code class="language-${lang || ''}">${cleanedCode}</code></pre></div>`;
        });

        formattedText = formattedText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<b>$1$2</b>');
        formattedText = formattedText.replace(/\*(.*?)\*|_(.*?)_/g, '<i>$1$2</i>');
        formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');
        formattedText = formattedText.replace(/\n/g, '<br>');

        return formattedText;
    }

    // NOVA FUNÇÃO: Adiciona botão de copiar a um elemento <pre>
    function addCopyButtonToCodeBlock(codeWrapperElement) {
        const preElement = codeWrapperElement.querySelector('pre');
        if (!preElement) return;

        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.textContent = 'Copiar';

        const feedbackSpan = document.createElement('span');
        feedbackSpan.classList.add('copy-feedback');
        feedbackSpan.textContent = 'Copiado!';
        feedbackSpan.style.opacity = 0; // Inicia invisível

        // Adiciona o botão ANTES do <pre> para ficar acima do bloco de código
        codeWrapperElement.insertBefore(copyButton, preElement);
        codeWrapperElement.appendChild(feedbackSpan);

        copyButton.addEventListener('click', async () => {
            const codeElement = preElement.querySelector('code');
            if (!codeElement) return;
            const htmlToCopy = `<pre>${codeElement.outerHTML}</pre>`;
            const textToCopy = codeElement.textContent;

            try {
                // Usa a API ClipboardItem se disponível (permite copiar HTML)
                if (navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            "text/html": new Blob([htmlToCopy], { type: "text/html" }),
                            "text/plain": new Blob([textToCopy], { type: "text/plain" })
                        })
                    ]);
                } else {
                    // Fallback: copia apenas texto puro
                    await navigator.clipboard.writeText(textToCopy);
                }
                feedbackSpan.style.opacity = 1;
                setTimeout(() => {
                    feedbackSpan.style.opacity = 0;
                }, 1500);
            } catch (err) {
                console.error('Erro ao copiar texto:', err);
                alert('Falha ao copiar. Por favor, copie manualmente: ' + textToCopy);
            }
        });
    }


    function typeMessage(element, rawText, delay = 10) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formatMessageText(rawText);

        let currentHtml = '';
        let typingPromise = Promise.resolve();

        const cursor = document.createElement('span');
        cursor.classList.add('typing-cursor');

        return new Promise(resolve => {
            const nodesToType = [];

            tempDiv.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    for (let char of node.textContent) {
                        nodesToType.push({ type: 'char', value: char });
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Se for um wrapper de código, trate de forma especial para o botão
                    if (node.classList.contains('code-block-wrapper')) {
                        nodesToType.push({ type: 'full_html_block', value: node.outerHTML });
                    } else {
                        nodesToType.push({ type: 'start_tag', value: `<${node.tagName.toLowerCase()}${node.className ? ` class="${node.className}"` : ''}>` });
                        if (node.tagName.toLowerCase() === 'pre') {
                            const codeElement = node.querySelector('code');
                            if (codeElement) {
                                nodesToType.push({ type: 'full_content', value: codeElement.outerHTML });
                            }
                        } else {
                            for (let char of node.textContent) {
                                 nodesToType.push({ type: 'char', value: char });
                            }
                        }
                        nodesToType.push({ type: 'end_tag', value: `</${node.tagName.toLowerCase()}>` });
                    }
                }
            });

            const typeNextNode = () => {
                if (nodesToType.length === 0) {
                    cursor.remove();
                    resolve();
                    return;
                }

                const next = nodesToType.shift();

                typingPromise = typingPromise.then(() => {
                    return new Promise(charResolve => {
                        if (next.type === 'char') {
                            currentHtml += next.value;
                            element.innerHTML = currentHtml;
                            element.appendChild(cursor);
                            scrollToBottom();
                            setTimeout(charResolve, delay);
                        } else if (next.type === 'start_tag' || next.type === 'end_tag') {
                            currentHtml += next.value;
                            element.innerHTML = currentHtml;
                            element.appendChild(cursor);
                            scrollToBottom();
                            charResolve();
                        } else if (next.type === 'full_content' || next.type === 'full_html_block') { // Inclui o novo tipo aqui
                            currentHtml += next.value;
                            element.innerHTML = currentHtml;
                            element.appendChild(cursor);
                            scrollToBottom();
                            charResolve();
                        }
                    });
                }).then(() => {
                    typeNextNode();
                });
            };

            typeNextNode();
        });
    }

    async function appendMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const avatarImg = document.createElement('img');
        avatarImg.classList.add('avatar');
        avatarImg.alt = `${sender} Avatar`;

        const messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('message-content');

        if (sender === 'user') {
            avatarImg.src = '/static/user_avatar.png';
            messageContentDiv.innerHTML = formatMessageText(message);
            messageDiv.appendChild(messageContentDiv);
            messageDiv.appendChild(avatarImg);
            chatBox.appendChild(messageDiv);
            scrollToBottom();
            // Para o usuário, adiciona os botões de copiar imediatamente
            messageContentDiv.querySelectorAll('.code-block-wrapper').forEach(addCopyButtonToCodeBlock);
        } else {
            avatarImg.src = '/static/bot_avatar.png';
            messageDiv.appendChild(avatarImg);
            messageDiv.appendChild(messageContentDiv);
            chatBox.appendChild(messageDiv);
            scrollToBottom();

            userInput.disabled = true;
            sendBtn.disabled = true;
            await typeMessage(messageContentDiv, message, 10);
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            // Após o bot "digitar", adiciona os botões de copiar
            messageContentDiv.querySelectorAll('.code-block-wrapper').forEach(addCopyButtonToCodeBlock);
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            const data = await response.json();
            appendMessage('bot', data.response);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            appendMessage('bot', 'Desculpe, houve um erro ao processar sua solicitação.');
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            sendMessage();
        }
    });

    setTimeout(() => {
        appendMessage('bot', 'Olá! Sou seu **assistente de IA** especializado em *tecnologia*. Posso te explicar sobre `Python`, `HTML`, `JavaScript` ou qualquer outro assunto. Como posso ajudar você hoje?');
    }, 100);
});