// --- Configurações ---
const limitTimeMs = 70 * 1000;
// Atualiza a cada 500ms (2 vezes por segundo). Antes era 10ms (100 vezes por segundo).
const updateIntervalMs = 500;
const formatTime = num => String(num).padStart(2, '0');

// Estilos para o cronômetro e número da conversa
const runningBgColor = 'rgba(255, 255, 255, 0.9)';
const runningTextColor = 'black';
const runningBorderColor = '#ccc';
const runningBoxShadow = '0 1px 3px rgba(0,0,0,0.1)';

const timerFontSize = '12px';
const timerPadding = '2px 5px';
const timerBorderRadius = '3px';

const pausedBgColor = 'rgba(255, 255, 255, 0.9)';
const pausedTextColor = 'red';
const pausedBorderColor = '#ccc';
const pausedBoxShadow = '0 1px 3px rgba(0,0,0,0.1)';

const completedBgColor = 'rgba(0, 0, 0, 1)'; // Fundo preto sólido
const completedTextColor = 'lime'; // Cor verde para o checkmark
const completedText = '✓';
const completedFontSize = '20px';
const completedPadding = '0px';
const completedBorderRadius = '5px';

const numberBgColor = runningBgColor;
const numberTextColor = runningTextColor;
const numberBorderColor = runningBorderColor;
const numberBoxShadow = runningBoxShadow;
const numberFontSize = '12px';
const numberPadding = '2px 5px';
const numberBorderRadius = '3px';

// Ajusta a posição à direita para alinhar com o cronômetro
const numberRightPosition = '5px';
const numberTopPosition = '2px';

const conversationTimers = new Map();
let currentActiveConversationEl = null;

// --- Funções de Controle de Cronômetro Individual ---
function renderTime(timerDiv, elapsedTime) {
    let totalSeconds = Math.floor(elapsedTime / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    timerDiv.textContent = `${formatTime(minutes)}:${formatTime(seconds)}`;
}

function pauseTimer(conversationEl) {
    const timerData = conversationTimers.get(conversationEl);
    if (timerData && !timerData.isPaused) {
        clearInterval(timerData.timerIntervalId);
        timerData.pausedAt = Date.now();
        timerData.isPaused = true;
        if (!timerData.timerDiv.classList.contains('timer-completed')) {
            timerData.timerDiv.style.backgroundColor = pausedBgColor;
            timerData.timerDiv.style.color = pausedTextColor;
            timerData.timerDiv.style.borderColor = pausedBorderColor;
            timerData.timerDiv.style.boxShadow = pausedBoxShadow;
        }
    }
}

function resumeTimer(conversationEl) {
    const timerData = conversationTimers.get(conversationEl);
    if (timerData && timerData.isPaused && !timerData.timerDiv.classList.contains('timer-completed')) {
        timerData.startTime += (Date.now() - timerData.pausedAt);
        timerData.isPaused = false;
        timerData.timerIntervalId = setInterval(() => updateIndividualTimer(conversationEl), updateIntervalMs);
        timerData.timerDiv.style.backgroundColor = runningBgColor;
        timerData.timerDiv.style.color = runningTextColor;
        timerData.timerDiv.style.borderColor = runningBorderColor;
        timerData.timerDiv.style.boxShadow = runningBoxShadow;
    }
}

function removeTimer(conversationEl) {
    const timerData = conversationTimers.get(conversationEl);
    if (timerData) {
        clearInterval(timerData.timerIntervalId);
        if (timerData.timerDiv && timerData.timerDiv.parentNode) {
            timerData.timerDiv.remove();
        }
        if (timerData.numberDiv && timerData.numberDiv.parentNode) {
            timerData.numberDiv.remove();
        }
        conversationTimers.delete(conversationEl);
    }
}

function updateIndividualTimer(conversationEl) {
    const timerData = conversationTimers.get(conversationEl);
    if (!timerData || timerData.isPaused) return;

    let elapsedTime = Date.now() - timerData.startTime;

    if (elapsedTime >= limitTimeMs) {
        clearInterval(timerData.timerIntervalId);
        timerData.timerDiv.textContent = completedText;
        timerData.timerDiv.style.backgroundColor = completedBgColor;
        timerData.timerDiv.style.color = completedTextColor;
        timerData.timerDiv.style.fontSize = completedFontSize;
        timerData.timerDiv.style.borderColor = 'transparent';
        timerData.timerDiv.style.boxShadow = 'none';
        timerData.isPaused = true;
        timerData.timerDiv.classList.add('timer-completed');

        timerData.timerDiv.style.top = '50%';
        timerData.timerDiv.style.right = '5px';
        timerData.timerDiv.style.left = 'auto';
        timerData.timerDiv.style.transform = 'translateY(-50%)';
        timerData.timerDiv.style.width = 'fit-content';
        timerData.timerDiv.style.textAlign = 'center';
        timerData.timerDiv.style.padding = completedPadding;
        timerData.timerDiv.style.borderRadius = completedBorderRadius;

        console.log(`Cronômetro da conversa (ID: ${conversationEl.id || 'N/A'}) concluído: ✓`);
        return;
    }
    renderTime(timerData.timerDiv, elapsedTime);
}

function createTimerAndNumberForConversation(conversationEl) {
    let existingTimerDivInDOM = conversationEl.querySelector('.injected-conversation-timer');
    let existingNumberDivInDOM = conversationEl.querySelector('.injected-conversation-number');

    if (existingTimerDivInDOM || existingNumberDivInDOM) {
        if (conversationTimers.has(conversationEl)) {
            const existingTimerData = conversationTimers.get(conversationEl);
            if (existingTimerData.timerDiv.classList.contains('timer-completed')) {
                clearInterval(existingTimerData.timerIntervalId);
                existingTimerData.startTime = Date.now();
                existingTimerData.pausedAt = Date.now();
                existingTimerData.isPaused = true;
                renderTime(existingTimerData.timerDiv, 0);
                existingTimerData.timerDiv.style.backgroundColor = pausedBgColor;
                existingTimerData.timerDiv.style.color = pausedTextColor;
                existingTimerData.timerDiv.style.fontSize = timerFontSize;
                existingTimerData.timerDiv.style.borderColor = pausedBorderColor;
                existingTimerData.timerDiv.style.boxShadow = pausedBoxShadow;
                existingTimerData.timerDiv.classList.remove('timer-completed');
                existingTimerData.timerDiv.style.padding = timerPadding;
                existingTimerData.timerDiv.style.borderRadius = timerBorderRadius;

                existingTimerData.timerDiv.style.top = '50%';
                existingTimerData.timerDiv.style.right = '5px';
                existingTimerData.timerDiv.style.left = 'auto';
                existingTimerData.timerDiv.style.transform = 'translateY(-50%)';
                existingTimerData.timerDiv.style.width = 'fit-content';
                existingTimerData.timerDiv.style.textAlign = 'center';
                existingTimerData.timerDiv.style.minWidth = '45px';

                if (existingTimerData.numberDiv) {
                    existingTimerData.numberDiv.style.display = 'block';
                    existingTimerData.numberDiv.style.top = numberTopPosition;
                    existingTimerData.numberDiv.style.right = numberRightPosition;
                    existingTimerData.numberDiv.style.left = 'auto';
                    existingTimerData.numberDiv.style.transform = 'none';
                }
            }
            return existingTimerData;
        } else {
            console.warn("Script: Encontrado timer/número injetado 'órfão' no DOM para uma conversa. Removendo para recriar.");
            if (existingTimerDivInDOM) existingTimerDivInDOM.remove();
            if (existingNumberDivInDOM) existingNumberDivInDOM.remove();
        }
    }
    if (conversationTimers.has(conversationEl)) {
         return conversationTimers.get(conversationEl);
    }

    conversationEl.style.position = 'relative';

    let timerDiv = document.createElement('div');
    timerDiv.className = 'injected-conversation-timer';
    timerDiv.style.position = 'absolute';
    timerDiv.style.top = '50%';
    timerDiv.style.right = '5px';
    timerDiv.style.left = 'auto';
    timerDiv.style.transform = 'translateY(-50%)';
    timerDiv.style.backgroundColor = pausedBgColor;
    timerDiv.style.color = pausedTextColor;
    timerDiv.style.padding = timerPadding;
    timerDiv.style.borderRadius = timerBorderRadius;
    timerDiv.style.fontSize = timerFontSize;
    timerDiv.style.fontFamily = 'monospace';
    timerDiv.style.zIndex = '9999';
    timerDiv.style.width = 'fit-content';
    timerDiv.style.textAlign = 'center';
    timerDiv.style.border = `1px solid ${pausedBorderColor}`;
    timerDiv.style.boxShadow = pausedBoxShadow;
    timerDiv.style.fontWeight = 'bold';
    timerDiv.style.minWidth = '45px';
    conversationEl.appendChild(timerDiv);

    let numberDiv = document.createElement('div');
    numberDiv.className = 'injected-conversation-number';
    numberDiv.style.position = 'absolute';
    numberDiv.style.top = numberTopPosition;
    numberDiv.style.right = numberRightPosition;
    numberDiv.style.left = 'auto';
    numberDiv.style.transform = 'none';
    numberDiv.style.backgroundColor = numberBgColor;
    numberDiv.style.color = numberTextColor;
    numberDiv.style.padding = numberPadding;
    numberDiv.style.borderRadius = numberBorderRadius;
    numberDiv.style.fontSize = numberFontSize;
    numberDiv.style.fontFamily = 'sans-serif';
    numberDiv.style.fontWeight = 'bold';
    numberDiv.style.zIndex = '99999';
    numberDiv.style.width = 'fit-content';
    numberDiv.style.textAlign = 'center';
    numberDiv.style.minWidth = '20px';
    numberDiv.style.border = `1px solid ${numberBorderColor}`;
    numberDiv.style.boxShadow = numberBoxShadow;
    numberDiv.style.display = 'block';
    conversationEl.appendChild(numberDiv);

    const startTime = Date.now();
    const timerData = {
        timerDiv: timerDiv,
        numberDiv: numberDiv,
        startTime: startTime,
        pausedAt: Date.now(),
        timerIntervalId: null,
        isPaused: true
    };
    conversationTimers.set(conversationEl, timerData);

    renderTime(timerDiv, 0);
    return timerData;
}

function updateConversationNumbers() {
    const existingConversations = Array.from(document.querySelectorAll('div.interaction-group'))
        .filter(el => conversationTimers.has(el));

    existingConversations.sort((a, b) => b.offsetTop - a.offsetTop);

    existingConversations.forEach((conversationEl, index) => {
        const timerData = conversationTimers.get(conversationEl);
        if (timerData && timerData.numberDiv) {
            timerData.numberDiv.textContent = (index + 1).toString();
            timerData.numberDiv.style.backgroundColor = numberBgColor;
            timerData.numberDiv.style.color = numberTextColor;
            timerData.numberDiv.style.fontSize = numberFontSize;
            timerData.numberDiv.style.display = 'block';
            timerData.numberDiv.style.border = `1px solid ${numberBorderColor}`;
            timerData.numberDiv.style.boxShadow = numberBoxShadow;
            timerData.numberDiv.style.right = numberRightPosition;
        }
    });

    // Limpa timers de conversas que não estão mais no DOM
    conversationTimers.forEach((timerData, conversationEl) => {
        if (!document.body.contains(conversationEl)) {
            if (timerData.numberDiv) {
                timerData.numberDiv.remove();
            }
            clearInterval(timerData.timerIntervalId);
            conversationTimers.delete(conversationEl);
        }
    });
}

function manageActiveTimers() {
    const currentlySelectedConversation = document.querySelector('div.interaction-group.is-selected');

    conversationTimers.forEach((timerData, conversationEl) => {
        if (conversationEl !== currentlySelectedConversation && !timerData.isPaused && !timerData.timerDiv.classList.contains('timer-completed')) {
            pauseTimer(conversationEl);
        }
    });

    if (currentlySelectedConversation) {
        if (!conversationTimers.has(currentlySelectedConversation)) {
            createTimerAndNumberForConversation(currentlySelectedConversation);
        }
        if (!conversationTimers.get(currentlySelectedConversation).timerDiv.classList.contains('timer-completed')) {
             resumeTimer(currentlySelectedConversation);
        }
        currentActiveConversationEl = currentlySelectedConversation;
    } else {
        currentActiveConversationEl = null;
    }
}

// --- Lógica de Inicialização e Eventos ---
document.querySelectorAll('.injected-conversation-timer, .injected-conversation-number').forEach(el => el.remove());
conversationTimers.clear();

setTimeout(() => {
    const initialConversationElements = document.querySelectorAll('div.interaction-group');
    if (initialConversationElements.length === 0) {
        console.warn("Nenhum elemento de conversa com a classe 'interaction-group' encontrado na carga inicial. O script continuará monitorando.");
    } else {
        initialConversationElements.forEach(createTimerAndNumberForConversation);
        console.log(`Encontrados ${initialConversationElements.length} conversas existentes ao iniciar.`);
    }
    updateConversationNumbers();
    manageActiveTimers();
}, 500);

const conversationsListContainer = document.body;
const observer = new MutationObserver((mutationsList, observer) => {
    let shouldUpdateNumbers = false;
    let shouldManageTimers = false;

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.matches('div.interaction-group')) {
                            createTimerAndNumberForConversation(node);
                            shouldUpdateNumbers = true;
                            shouldManageTimers = true;
                        }
                        const newConversationElements = node.querySelectorAll('div.interaction-group');
                        newConversationElements.forEach(newConvEl => {
                            if (!conversationTimers.has(newConvEl)) {
                                createTimerAndNumberForConversation(newConvEl);
                                shouldUpdateNumbers = true;
                                shouldManageTimers = true;
                            }
                        });
                    }
                }
            }
            if (mutation.removedNodes.length > 0) {
                for (const node of mutation.removedNodes) {
                    if (node.nodeType === 1 && node.matches('div.interaction-group')) {
                        removeTimer(node);
                        shouldUpdateNumbers = true;
                        shouldManageTimers = true;
                    }
                }
            }
        }

        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const changedElement = mutation.target;
            if (changedElement.matches('div.interaction-group')) {
                shouldManageTimers = true;
            }
        }
    }
    if (shouldUpdateNumbers) {
        updateConversationNumbers();
    }
    if (shouldManageTimers) {
        manageActiveTimers();
    }
});

observer.observe(conversationsListContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

console.log("✅ Script de gerenciamento de cronômetros e numeração de conversas injetado.");



// ✅ Constante com o CSS atualizado para fade-in / fade-out
const texto_copiado = `
    .copiado_style {
        background-color: rgba(0, 255, 0, 0.5);
        opacity: 1;
        transition: background-color 0.2s ease, opacity 0.5s ease;
    }
`;

// ✅ Injeta o CSS no documento
(function() {
    const css = document.createElement("style");
    css.textContent = texto_copiado;
    document.head.appendChild(css);
})();

function aplicarCopiadoStyle(el) {
    if (!el) return;

    // começa invisível
    el.style.opacity = "0";

    // força o reflow para aplicar a animação corretamente
    void el.offsetWidth;

    // aplica a classe
    el.classList.add("copiado_style");

    // faz o fade-in
    el.style.opacity = "1";

    // depois de 500ms começa o fade-out
    setTimeout(() => {
        el.style.opacity = "0";
    }, 500);

    // remove a classe após a transição completa
    setTimeout(() => {
        el.classList.remove("copiado_style");
        el.style.opacity = ""; // limpa inline style
    }, 1000);
}

document.addEventListener("keydown", async function (event) {
    if (event.key === "F2") {
        try {
            // 1. Pegar o nome do participante
            const nomeElemento = document.querySelector("#interaction-header-participant-name.participant-name");
            if (!nomeElemento) {
                console.error("❌ Elemento de nome não encontrado");
                return;
            }
            const nome = nomeElemento.innerText.trim();
            aplicarCopiadoStyle(nomeElemento); // aplica destaque com fade

            // 2. Clicar no botão de copiar link
            const botao = document.querySelector(".copy-action-button");
            if (!botao) {
                console.error("❌ Botão de cópia não encontrado");
                return;
            }

            botao.click();
            aplicarCopiadoStyle(botao); // aplica destaque com fade

            // 3. Aguardar um pouco para o link ser copiado
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Ler o conteúdo atual da área de transferência (o link copiado)
            const link = await navigator.clipboard.readText();

            if (!link.startsWith("http")) {
                console.error("❌ Link não encontrado na área de transferência:", link);
                return;
            }

            // 5. Concatenar nome e link
            const resultado = `${nome} - ${link}`;

            // 6. Copiar de volta para a área de transferência
            await navigator.clipboard.writeText(resultado);

            console.log("✅ Copiado:", resultado);
        } catch (err) {
            console.error("❌ Erro:", err);
        }
    }
});
