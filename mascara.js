(async function() {
  class ModernSupportUI {
    constructor() {
      this.data = [];
      this.currentIndex = 0;
      this.elements = {};
      this.userManuallySetAguardar = false;
      this.originalMessage = '';
      this.isEditingMessage = false;
    }

    async init() {
      try {
        this.data = await this.fetchJsonData();
        this.createStyles();
        this.createUI();
        this.attachEventListeners();
        console.log("Modern Support UI initialized successfully (with original automation logic).");
      } catch (error) {
        console.error("Failed to initialize the Modern Support UI:", error);
      }
    }

    async fetchJsonData() {
      const url = 'https://raw.githubusercontent.com/ianvictor/brisa/refs/heads/main/atendimento.js';
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
        const data = await response.json();
        
        const itemsWithId = data.filter(item => item.id != null && item.id !== '');
        const itemsWithoutId = data.filter(item => !(item.id != null && item.id !== ''));
        
        itemsWithId.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
        
        return itemsWithId.concat(itemsWithoutId);
      } catch (error) {
        console.error("Falha ao buscar ou processar os dados JSON:", error);
        return [];
      }
    }

    createStyles() {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --primary-color: #007BFF;
          --primary-hover-color: #0056b3;
          --secondary-color-rgb: 248, 249, 250;
          --text-color: #212529;
          --text-light-color: #f8f9fa;
          --border-color-rgb: 255, 255, 255;
          --shadow-color: rgba(0, 0, 0, 0.15);
          --bg-color-rgb: 255, 255, 255;
          --input-text-color: #495057;
        }
        
        .support-ui-container {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          padding: 20px; z-index: 9999; width: 340px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          box-shadow: 0 4px 20px var(--shadow-color); color: var(--text-color);
          display: none; flex-direction: column; gap: 12px;
          background: rgba(var(--bg-color-rgb), 0.65); backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(var(--border-color-rgb), 0.2);
          border-radius: 16px;
        }
        
        .support-ui-container p { margin: 0; text-align: center; font-size: 16px; font-weight: 500; }
        
        .support-ui-container input[type="text"], .search-input, .observacao-textarea {
          width: 100%; padding: 8px 12px; border-radius: 6px; color: var(--input-text-color);
          box-sizing: border-box; font-size: 15px; transition: border-color 0.2s, box-shadow 0.2s;
          background-color: rgba(var(--secondary-color-rgb), 0.7); border: 1px solid rgba(var(--border-color-rgb), 0.4);
        }
        
        .support-ui-container input::placeholder, .observacao-textarea::placeholder { color: #6c757d; }
        
        .support-ui-container input[type="text"]:focus, .observacao-textarea:focus {
          outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
        }
        
        .support-ui-container input[type="text"]:disabled {
          background-color: rgba(233, 236, 239, 0.5); cursor: not-allowed;
        }
        
        .toggle-container { display: flex; justify-content: center; align-items: center; gap: 8px; }
        .toggle-label { font-size: 14px; color: #6c757d; font-weight: 500; }
        
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        
        .slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc; transition: .4s; border-radius: 24px;
        }
        
        .slider:before {
          position: absolute; content: ""; height: 20px; width: 20px; left: 2px; bottom: 2px;
          background-color: white; transition: .4s; border-radius: 50%;
        }
        
        input:checked + .slider { background-color: var(--primary-color); }
        input:checked + .slider:before { transform: translateX(20px); }
        
        .message-content, .info-item {
          background-color: rgba(var(--secondary-color-rgb), 0.6);
          border: 1px solid rgba(var(--border-color-rgb), 0.3); padding: 10px; border-radius: 8px;
        }
        
        .message-content {
          min-height: 100px; max-height: 150px; overflow-y: auto; font-size: 14px;
          line-height: 1.5; position: relative;
        }
        
        .message-content[contenteditable="true"] {
          background-color: rgba(255, 255, 255, 0.9); border: 1px solid var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
        }
        
        .message-controls { display: none; justify-content: space-between; margin-top: 8px; }
        .message-controls.active { display: flex; }
        
        .btn-small { padding: 6px 12px; border-radius: 4px; font-size: 14px; cursor: pointer; border: none; transition: background-color 0.2s; }
        .btn-save { background-color: var(--primary-color); color: white; }
        .btn-save:hover { background-color: var(--primary-hover-color); }
        .btn-cancel { background-color: #6c757d; color: white; }
        .btn-cancel:hover { background-color: #5a6268; }
        
        .btn-edit {
          position: absolute; top: 5px; right: 5px; background-color: rgba(0, 0, 0, 0.1);
          border: none; border-radius: 4px; padding: 4px 8px; font-size: 12px;
          cursor: pointer; color: #6c757d; transition: background-color 0.2s;
        }
        
        .btn-edit:hover { background-color: rgba(0, 0, 0, 0.2); }
        .btn-edit.hidden { display: none; }
        
        .info-container { display: flex; flex-direction: column; gap: 8px; }
        .info-item { font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
        .info-item .etiqueta-title { font-weight: 600; color: #6c757d; }
        .info-item .etiqueta-value { font-weight: 600; color: var(--primary-color); }
        
        .dropdown { position: relative; width: 100%; }
        .dropdown-content {
          display: none; position: absolute; background-color: rgba(var(--bg-color-rgb), 0.8);
          backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); width: 100%;
          max-height: 200px; overflow-y: auto; border: 1px solid rgba(var(--border-color-rgb), 0.3);
          border-radius: 6px; z-index: 10; box-shadow: 0 4px 8px var(--shadow-color);
        }
        
        .dropdown-content div {
          padding: 10px 12px; cursor: pointer; font-size: 14px; transition: background-color 0.2s;
        }
        
        .dropdown-content div:hover { background-color: rgba(0, 123, 255, 0.1); color: var(--primary-color); }
        .show { display: block; }
        
        .observacao-textarea { min-height: 60px; resize: vertical; font-family: inherit; }
        
        .open-button {
          position: fixed; top: 50%; transform: translateY(-50%); right: 0; z-index: 1000;
          cursor: pointer; width: 32px; height: 60px; background-color: var(--primary-color);
          border: none; border-top-left-radius: 30px; border-bottom-left-radius: 30px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: -2px 2px 10px var(--shadow-color); transition: background-color 0.3s;
        }
        
        .open-button:hover { background-color: var(--primary-hover-color); }
        .open-button-icon { color: white; font-size: 24px; font-weight: bold; transform: rotate(180deg); transition: transform 0.3s ease; }
        .open-button.flipped .open-button-icon { transform: rotate(0deg); }
        
        .finalize-button {
          background-color: var(--primary-color); color: var(--text-light-color); border: none;
          padding: 12px 15px; border-radius: 6px; cursor: pointer; font-size: 16px;
          font-weight: bold; transition: background-color 0.3s ease; width: 100%;
        }
        
        .finalize-button:hover { background-color: var(--primary-hover-color); }
      `;
      document.head.appendChild(style);
    }

    createUI() {
      const container = document.createElement('div');
      container.className = 'support-ui-container';
      container.innerHTML = `
        <p>Detalhes do Atendimento</p>
        <div class="toggle-container">
          <span class="toggle-label">Terceiro</span>
          <label class="toggle-switch"><input type="checkbox" id="titularToggle" checked><span class="slider"></span></label>
          <span class="toggle-label">Titular</span>
        </div>
        <input type="text" id="nomeDoContato" placeholder="Nome do contato" autocomplete="off" disabled>
        <div class="dropdown">
          <input type="text" class="search-input" placeholder="Pesquisar motivo do contato...">
          <div class="dropdown-content" id="titleDropdown"></div>
        </div>
        <div class="message-container">
          <div class="message-content" id="MensagemDoProtocolo"></div>
          <button class="btn-edit" id="editMessageBtn">Editar</button>
          <div class="message-controls" id="messageControls">
            <button class="btn-small btn-save" id="saveMessageBtn">Salvar</button>
            <button class="btn-small btn-cancel" id="cancelMessageBtn">Cancelar</button>
          </div>
        </div>
        <div class="info-container">
          <div class="info-item"><span class="etiqueta-title">Etiqueta:</span><span id="etiquetaValor" class="etiqueta-value"></span></div>
          <div class="info-item"><span>Encaminhar Externo?</span> <span id="externoValue"></span></div>
          <div class="info-item">
            <span>Aguardar Retorno?</span>
            <label class="toggle-switch">
              <input type="checkbox" id="aguardarToggle">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <textarea id="observacaoInput" class="observacao-textarea" placeholder="Observação (opcional)..."></textarea>
        <button id="finalizeButton" class="finalize-button">Finalizar e Registrar</button>
      `;
      document.body.appendChild(container);
      
      const toggleButton = document.createElement('button');
      toggleButton.className = 'open-button';
      toggleButton.innerHTML = '<span class="open-button-icon">❮</span>';
      document.body.appendChild(toggleButton);
      
      this.elements = {
        container,
        toggleButton,
        nomeDoContato: document.getElementById('nomeDoContato'),
        mensagemDoProtocolo: document.getElementById('MensagemDoProtocolo'),
        titularToggle: document.getElementById('titularToggle'),
        aguardarToggle: document.getElementById('aguardarToggle'),
        externoValue: document.getElementById('externoValue'),
        etiquetaValor: document.getElementById('etiquetaValor'),
        searchInput: container.querySelector('.search-input'),
        dropdown: document.getElementById('titleDropdown'),
        finalizeButton: document.getElementById('finalizeButton'),
        observacaoInput: document.getElementById('observacaoInput'),
        editMessageBtn: document.getElementById('editMessageBtn'),
        saveMessageBtn: document.getElementById('saveMessageBtn'),
        cancelMessageBtn: document.getElementById('cancelMessageBtn'),
        messageControls: document.getElementById('messageControls'),
      };
    }

    attachEventListeners() {
      this.elements.toggleButton.addEventListener('click', () => this.toggleUIVisibility());
      document.addEventListener('mousedown', (e) => e.button === 3 && this.toggleUIVisibility());
      
      this.elements.titularToggle.addEventListener('change', () => {
        this.elements.nomeDoContato.disabled = this.elements.titularToggle.checked;
        this.updateMessage();
      });
      
      this.elements.nomeDoContato.addEventListener('input', () => this.updateMessage());
      this.elements.observacaoInput.addEventListener('input', () => this.updateMessage());
      
      this.elements.searchInput.addEventListener('focus', () => {
        this.populateDropdown();
        this.elements.dropdown.classList.add('show');
      });
      
      this.elements.searchInput.addEventListener('input', () => {
        this.populateDropdown(this.elements.searchInput.value);
        this.elements.dropdown.classList.add('show');
      });
      
      document.addEventListener('click', (e) => {
        if (!this.elements.container.contains(e.target) && !this.elements.toggleButton.contains(e.target)) {
          this.elements.dropdown.classList.remove('show');
        }
      });
      
      this.elements.finalizeButton.addEventListener('click', () => this.finalizeAttendance());
      
      this.elements.aguardarToggle.addEventListener('change', () => {
        if (!this.elements.aguardarToggle.disabled) {
          this.userManuallySetAguardar = this.elements.aguardarToggle.checked;
        }
        this.updateMessage();
      });
      
      this.elements.editMessageBtn.addEventListener('click', () => this.startMessageEdit());
      this.elements.saveMessageBtn.addEventListener('click', () => this.saveMessageEdit());
      this.elements.cancelMessageBtn.addEventListener('click', () => this.cancelMessageEdit());
      
      if (this.data.length > 0) this.updateMessage();
    }

    toggleUIVisibility() {
      const isVisible = this.elements.container.style.display !== 'none';
      this.elements.container.style.display = isVisible ? 'none' : 'flex';
      this.elements.toggleButton.classList.toggle('flipped', !isVisible);
    }

    populateDropdown(filter = '') {
      this.elements.dropdown.innerHTML = '';
      this.data.forEach((item, index) => {
        if (item.titulo.toLowerCase().includes(filter.toLowerCase())) {
          const option = document.createElement('div');
          option.textContent = item.titulo;
          option.onclick = () => {
            this.elements.searchInput.value = item.titulo;
            this.elements.dropdown.classList.remove('show');
            this.currentIndex = index;
            
            if (item.aguardar) this.userManuallySetAguardar = false;
            if (this.isEditingMessage) this.cancelMessageEdit();
            
            this.updateMessage();
          };
          this.elements.dropdown.appendChild(option);
        }
      });
    }

    updateMessage() {
      if (this.data.length === 0) return;
      
      const selectedItem = this.data[this.currentIndex];
      this.elements.externoValue.textContent = selectedItem.externo ? 'Sim' : 'Não';
      this.elements.etiquetaValor.textContent = selectedItem.etiqueta;
      
      if (selectedItem.aguardar) {
        this.elements.aguardarToggle.checked = true;
        this.elements.aguardarToggle.disabled = true;
        this.userManuallySetAguardar = false;
      } else {
        this.elements.aguardarToggle.checked = this.userManuallySetAguardar;
        this.elements.aguardarToggle.disabled = false;
      }
      
      const contactPerson = this.elements.titularToggle.checked ? 'Titular' : this.elements.nomeDoContato.value.trim();
      let baseMessage = `${contactPerson ? '<b>' + contactPerson + '</b> entrou em contato e ' : ''}${selectedItem.mensagem}`;
      const observacaoText = this.elements.observacaoInput.value.trim();
      
      if (observacaoText) {
        baseMessage += `<br><br><b>Observação:</b><br>${observacaoText.replace(/\n/g, '<br>')}`;
      }
      
      if (!this.isEditingMessage) {
        this.originalMessage = baseMessage;
        this.elements.mensagemDoProtocolo.innerHTML = baseMessage;
      }
    }

    startMessageEdit() {
      if (this.isEditingMessage) return;
      
      this.isEditingMessage = true;
      this.elements.mensagemDoProtocolo.contentEditable = true;
      this.elements.mensagemDoProtocolo.focus();
      
      const range = document.createRange();
      range.selectNodeContents(this.elements.mensagemDoProtocolo);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.elements.messageControls.classList.add('active');
      this.elements.editMessageBtn.classList.add('hidden');
    }

    saveMessageEdit() {
      if (!this.isEditingMessage) return;
      
      this.isEditingMessage = false;
      this.elements.mensagemDoProtocolo.contentEditable = false;
      this.originalMessage = this.elements.mensagemDoProtocolo.innerHTML;
      this.elements.messageControls.classList.remove('active');
      this.elements.editMessageBtn.classList.remove('hidden');
    }

    cancelMessageEdit() {
      if (!this.isEditingMessage) return;
      
      this.isEditingMessage = false;
      this.elements.mensagemDoProtocolo.contentEditable = false;
      this.elements.mensagemDoProtocolo.innerHTML = this.originalMessage;
      this.elements.messageControls.classList.remove('active');
      this.elements.editMessageBtn.classList.remove('hidden');
    }

    finalizeAttendance() {
      const selectedItem = this.data[this.currentIndex];
      
      if (this.isEditingMessage) this.saveMessageEdit();
      
      const messageText = this.elements.mensagemDoProtocolo.innerText;
      const etiqueta = selectedItem.etiqueta.toLowerCase();
      const aguardar = this.elements.aguardarToggle.checked ? 'Sim' : 'Não';
      
      this.elements.searchInput.value = '';
      this.elements.observacaoInput.value = '';
      this.populateDropdown();
      this.toggleUIVisibility();
      
      const textarea = document.querySelector('textarea.text-area');
      if (textarea) {
        textarea.value = messageText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const botao = document.querySelector('button#send_button');
      if (botao && !botao.hasAttribute('disabled')) botao.click();
      
      const campoInputEtiqueta = "//*[@id='tags']/div/div/ul/li/input";
      const tempoEncontrarEtiqueta = setInterval(() => {
        const inserirEtiqueta = document.evaluate(campoInputEtiqueta, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (inserirEtiqueta) {
          inserirEtiqueta.focus();
          inserirEtiqueta.click();
          inserirEtiqueta.value = etiqueta;
          inserirEtiqueta.dispatchEvent(new Event('input', { bubbles: true }));
          clearInterval(tempoEncontrarEtiqueta);
        }
      }, 600);
      
      const adicionarEtiqueta = document.querySelector('.anticon.anticon-plus');
      if (adicionarEtiqueta) adicionarEtiqueta.click();
      else console.error("Elemento 'anticon anticon-plus' não encontrado.");

      let clicado = false;
      const seletorDeEtiqueta = setInterval(() => {
        if (clicado) return;

        const elementos = document.querySelectorAll('.ant-select-dropdown-menu-item');
        const selecionados = document.querySelectorAll('.ant-select-selection__choice__content');

        if ([...selecionados].some(selecionado => selecionado.textContent.trim().toLowerCase() === etiqueta)) {
          clearInterval(seletorDeEtiqueta);
          return;
        }

        const alvo = [...elementos].find(
          elemento => elemento.textContent.trim().toLowerCase() === etiqueta
        );

        if (alvo) {
          clicado = true;
          alvo.click();

          const concludeElement = Array.from(document.querySelectorAll('span.ng-star-inserted'))
            .find(el => el.textContent.trim() === "Concluir");
          if (concludeElement) concludeElement.click();

          if (selectedItem.externo) this._encaminharExterno(selectedItem, aguardar);

          clearInterval(seletorDeEtiqueta);
        }
      }, 600);
    }

    async _encaminharExterno(selectedItem, aguardar) {
      console.log("--- Executando _encaminharExterno ---");
      console.log("Dados recebidos:", selectedItem);
      
      const clickElement = async (selector, text) => {
        const element = Array.from(document.querySelectorAll(selector))
          .find(el => text ? el.textContent.trim().toLowerCase() === text.toLowerCase() : el);
        if (element) {
          element.click();
          console.log(`Clicado: ${text || selector}`);
          return true;
        }
        return false;
      };
      
      const TentarNovamenteExterno = async (selector, text) => {
        for (let tentativas = 0; tentativas < 25; tentativas++) {
          console.log(`Tentativa ${tentativas + 1}: Procurando por "${text || selector}"`);
          if (await clickElement(selector, text)) return;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        throw new Error(`Elemento não foi encontrado: ${text || selector}`);
      };
      
      try {
        const tipoReparo = selectedItem.servico ?? '';
        const tipoProblema = selectedItem.etiqueta_externo ?? '';
        console.log(`Valores: Reparo='${tipoReparo}', Problema='${tipoProblema}', Aguardar='${aguardar}'`);
        
        if (!tipoReparo || !tipoProblema) {
          console.error("Informações de serviço ou etiqueta externa estão faltando. Abortando.");
          return;
        }
        
        const passos = [['.icon-label', 'Enviar']];
        if (aguardar.toLowerCase() === 'sim') {
          console.log("Condição 'Aguardar = Sim' detectada. Adicionando passo do switch.");
          passos.push(['nz-switch#blocking button.ant-switch', null]);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const passosAdicionais = [
          ['.ant-select-selection__placeholder', 'Pesquisar...'],
          ['.ant-select-dropdown-menu-item', 'Suporte Externo'],
          ['.ant-select-selection__placeholder', 'Selecione os problemas'],
          ['.ant-select-dropdown-menu-item', tipoProblema],
          ['.ant-select-selection__placeholder', 'Selecione um serviço'],
          ['.ant-select-dropdown-menu-item', tipoReparo],
          ['span.ng-star-inserted', 'Continuar']
        ];
        
        const todosOsPassos = [...passos, ...passosAdicionais];
        
        for (const passo of todosOsPassos) {
          if (['pesquisar...', 'suporte externo'].includes((passo[1] || '').toLowerCase())) {
            console.log(`Pausa de 1s antes de: ${passo[1]}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          if ((passo[1] || '').toLowerCase() === 'selecione os problemas') {
            await TentarNovamenteExterno(passo[0], passo[1]);
            
            const inputInserirProblema = document.querySelector('.ant-select-search__field');
            if (inputInserirProblema) {
              inputInserirProblema.value = tipoProblema;
              inputInserirProblema.dispatchEvent(new Event('input', { bubbles: true }));
              console.log(`Digitado no campo de busca: ${tipoProblema}`);
              await new Promise(resolve => setTimeout(resolve, 800));
            } else {
              console.warn('Campo de input para problema não encontrado, tentando clicar diretamente.');
            }
            
            continue;
          }
          
          if (passo[0] === '.ant-select-dropdown-menu-item' && passo[1] === tipoProblema) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const items = document.querySelectorAll('.ant-select-dropdown-menu-item');
            console.log(`Total de itens encontrados no dropdown: ${items.length}`);
            
            let encontrado = false;
            for (const item of items) {
              const textoItem = item.textContent.trim();
              const buscaProblema = tipoProblema.trim();
              console.log(`Verificando item: "${textoItem}"`);
              
              if (textoItem.toLowerCase().includes(buscaProblema.toLowerCase())) {
                console.log(`✅ Correspondência encontrada: "${textoItem}" contém "${tipoProblema}"`);
                item.click();
                encontrado = true;
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
              }
            }
            
            if (!encontrado) {
              console.warn(`Nenhuma correspondência encontrada para: ${tipoProblema}`);
              await TentarNovamenteExterno(passo[0], passo[1]);
            }
            
            continue;
          }
          
          if (passo[0] === '.ant-select-selection__placeholder' && (passo[1] || '').toLowerCase() === 'selecione um serviço') {
            console.log('Procurando "Selecione um serviço"...');
            let clicouComSucesso = false;
            
            for (let tentativa = 1; tentativa <= 10; tentativa++) {
              console.log(`Tentativa ${tentativa} de clicar em "Selecione um serviço"`);
              
              const servicoPlaceholder = [...document.querySelectorAll('.ant-select-selection__placeholder')]
                .find(el => el.textContent.trim() === 'Selecione um serviço');
                
              if (servicoPlaceholder) {
                servicoPlaceholder.click();
                console.log('Clicou em "Selecione um serviço", aguardando dropdown...');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const dropdownItems = document.querySelectorAll('.ant-select-dropdown-menu-item');
                if (dropdownItems.length > 0) {
                  console.log(`✅ Dropdown carregado com ${dropdownItems.length} itens`);
                  clicouComSucesso = true;
                  break;
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            if (!clicouComSucesso) {
              console.warn('"Selecione um serviço" não respondeu após várias tentativas');
            }
            
            continue;
          }
          
          if (passo[0] === '.ant-select-dropdown-menu-item' && passo[1] === tipoReparo) {
            const buscaReparo = tipoReparo.trim();
            let encontrado = false;
            
            for (let tentativa = 1; tentativa <= 15; tentativa++) {
              console.log(`Tentativa ${tentativa} de encontrar "${tipoReparo}"`);
              
              if (tentativa > 1) {
                const servicoPlaceholder = [...document.querySelectorAll('.ant-select-selection__placeholder')]
                  .find(el => el.textContent.trim() === 'Selecione um serviço');
                  
                if (servicoPlaceholder) {
                  console.log('Clicando novamente em "Selecione um serviço"...');
                  servicoPlaceholder.click();
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const items = document.querySelectorAll('.ant-select-dropdown-menu-item');
              console.log(`Total de itens encontrados no dropdown: ${items.length}`);
              
              for (const item of items) {
                const textoItem = item.textContent.trim();
                console.log(`Verificando item: "${textoItem}"`);
                
                if (textoItem.toLowerCase() === buscaReparo.toLowerCase()) {
                  console.log(`✅ Correspondência EXATA encontrada: "${textoItem}" = "${tipoReparo}"`);
                  item.click();
                  encontrado = true;
                  await new Promise(resolve => setTimeout(resolve, 500));
                  break;
                }
              }
              
              if (encontrado) break;
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            if (!encontrado) {
              console.warn(`Nenhuma correspondência EXATA encontrada para: ${tipoReparo} após 15 tentativas`);
              console.log('Tentando com a função TentarNovamenteExterno...');
              await TentarNovamenteExterno(passo[0], passo[1]);
            }
            
            continue;
          }
          
          await TentarNovamenteExterno(passo[0], passo[1]);
        }
        
        console.log("✅ Processo de encaminhamento externo CONCLUÍDO com sucesso!");
      } catch (error) {
        console.error("❌ Ocorreu um erro durante o encaminhamento:", error.message);
      }
    }
  }

  const supportUI = new ModernSupportUI();
  supportUI.init();
})();
