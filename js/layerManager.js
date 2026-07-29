// js/layerManager.js
import { LAYERS_CONFIG } from './config.js';
import { getFeatureStyle } from './styleEngine.js';

export class LayerManager {
    constructor(map, infoControl) {
        this.map = map;
        this.infoControl = infoControl;
        this.leafletLayers = {};
        this.loadedData = {};
        this.camadaDestacada = null;
        this.camadaDestacadaGroup = null;
    }

   init() {
        const baseMaps = {}; // Mudamos de overlay para base (força escolha única)

        Object.keys(LAYERS_CONFIG).forEach(key => {
            const config = LAYERS_CONFIG[key];
            
            const layerGroup = L.geoJson(null, {
                style: (feature) => getFeatureStyle(feature, config),
                onEachFeature: (feature, layer) => this.attachEvents(feature, layer, config)
            });

            this.leafletLayers[key] = layerGroup;
            baseMaps[config.title] = layerGroup; // Registra como camada base
        });

        // MÁGICA AQUI: baseMaps vai no primeiro argumento. Isso cria os Radio Buttons (bolinhas)
        L.control.layers(baseMaps, null, { position: 'topleft', collapsed: false }).addTo(this.map);

        this.setupMapEvents();

        // Ativa a camada padrão do config E carrega os dados dela
        Object.keys(LAYERS_CONFIG).forEach(key => {
            if (LAYERS_CONFIG[key].activeByDefault) {
                this.leafletLayers[key].addTo(this.map);
                this.loadLayerData(key); // <--- A correção que faz a caixinha funcionar no início
            }
        });
    }

    setupMapEvents() {
        this.map.on('baselayerchange', (e) => {
            const configKey = this.findConfigKeyByTitle(e.name);
            if (configKey) {
                this.loadLayerData(configKey);
            }
            this.infoControl.update();
        });

        // Captura a abertura do Popup para gerenciar a interatividade dos botões de blocos
        this.map.on('popupopen', (e) => {
            const popupNode = e.popup.getElement();
            if (!popupNode) return;

            const buttons = popupNode.querySelectorAll('.popup-tab-btn');
            const blocks = popupNode.querySelectorAll('.popup-block');

            if (buttons.length === 0) return;

            buttons.forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    const targetBlock = ev.target.getAttribute('data-block');
                    
                    // Alterna o estilo visual dos botões (Aba ativa vs inativa)
                    buttons.forEach(b => {
                        b.style.background = '#f8f9fa';
                        b.style.color = '#333';
                        b.style.borderColor = '#ccc';
                    });
                    ev.target.style.background = '#d9534f';
                    ev.target.style.color = 'white';
                    ev.target.style.borderColor = '#d9534f';

                    // Mostra apenas o bloco correspondente ao botão clicado
                    blocks.forEach(block => {
                        if (block.getAttribute('data-block-content') === targetBlock) {
                            block.style.display = 'block';
                        } else {
                            block.style.display = 'none';
                        }
                    });
                });
            });
        });
    }

    async loadLayerData(key) {
        const config = LAYERS_CONFIG[key];
        const layerGroup = this.leafletLayers[key];

        // 1. Se já carregou ou ESTÁ no meio do processo de carregar, cancela imediatamente
        if (this.loadedData[key]) return;

        // 2. TRAVA IMEDIATA: Registra que iniciou o carregamento ANTES do fetch
        // Isso impede a duplicação dos polígonos (que causava a opacidade)
        this.loadedData[key] = 'loading';

        try {
            const response = await fetch(config.url);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const data = await response.json();
            layerGroup.addData(data);
            
            // 3. Marca como totalmente concluído
            this.loadedData[key] = 'loaded';
        } catch (error) {
            console.error(`Erro ao carregar camada ${config.title}:`, error);
            // Se der erro de internet, destrava para permitir que o sistema tente de novo depois
            this.loadedData[key] = false; 
        }
    }

    // js/layerManager.js (Trecho atualizado)

    attachEvents(feature, layer, config) {
        layer.on({
            mouseover: (e) => {
                const l = e.target;
                const currentGroup = this.leafletLayers[config.id];

                if (this.camadaDestacada && this.camadaDestacada !== l) {
                    this.camadaDestacadaGroup?.resetStyle(this.camadaDestacada);
                }

                this.camadaDestacada = l;
                this.camadaDestacadaGroup = currentGroup;

                l.setStyle({
                    weight: 2.5,
                    color: '#222222',
                    fillOpacity: 0.9
                });

                l.bringToFront();
                this.infoControl.update(l.feature.properties, config);
            },
            mouseout: (e) => {
                const l = e.target;
                const currentGroup = this.leafletLayers[config.id];

                if (currentGroup) {
                    currentGroup.resetStyle(l);
                }

                if (this.camadaDestacada === l) {
                    this.camadaDestacada = null;
                    this.camadaDestacadaGroup = null;
                }
                
                this.infoControl.update();
            },
            click: (e) => {
                const l = e.target;
                
                // 1. Dá zoom/centraliza no polígono clicado
                this.map.fitBounds(l.getBounds());

                // 2. Gera o HTML dinâmico baseado nos "fields" do config.js
                const htmlConteudo = this.gerarHtmlPopup(l.feature.properties, config);

                // 3. Abre o Popup do Leaflet na posição do clique
                l.bindPopup(htmlConteudo, { maxHeight: 300 }).openPopup();
            }
        });
    }

 // Método auxiliar que processa os 'fields' para o Popup
    gerarHtmlPopup(props, config) {
        let blocksData = [];

        // 1. Se você definiu blocos manuais estruturados no config.js
        if (config.blocks && Array.isArray(config.blocks)) {
            blocksData = config.blocks.map(blockConfig => {
                let items = [];
                blockConfig.keys.forEach(key => {
                    const valor = props[key];
                    if (valor !== undefined && valor !== null && valor !== '') {
                        let label = key;
                        let unit = '';
                        if (config.fields) {
                            const foundField = config.fields.find(f => f.key === key);
                            if (foundField) {
                                label = foundField.label;
                                unit = foundField.unitLabel ? ` ${foundField.unitLabel}` : '';
                            }
                        } else {
                            label = key.replace(/_/g, ' ');
                            label = label.charAt(0).toUpperCase() + label.slice(1);
                        }
                        const valorFormatado = typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor;
                        items.push({ label, valor: `${valorFormatado}${unit}` });
                    }
                });
                return { title: blockConfig.title, items };
            }).filter(b => b.items.length > 0);
        } 
        // 2. Fallback automático: Se não houver blocos manuais, agrupa os campos de 3 em 3 em blocos separados
        else {
            const colunasIgnoradas = ['OBJECTID', 'FID', 'SHAPE_AREA', 'SHAPE_LEN', 'Shape_Length', 'Shape_Area', 'id'];
            let allValidItems = [];

            for (let chave in props) {
                let valor = props[chave];
                if (!colunasIgnoradas.includes(chave) && valor !== null && valor !== undefined && valor !== '') {
                    let rotulo = chave.replace(/_/g, ' ');
                    rotulo = rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
                    const valorFormatado = typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor;
                    allValidItems.push({ label: rotulo, valor: valorFormatado });
                }
            }

            // Divide automaticamente a lista em pedaços (blocos) de 3 variáveis
            const chunkSize = 3;
            for (let i = 0; i < allValidItems.length; i += chunkSize) {
                const chunk = allValidItems.slice(i, i + chunkSize);
                blocksData.push({
                    title: `Parte ${Math.floor(i / chunkSize) + 1}`,
                    items: chunk
                });
            }
        }

        if (blocksData.length === 0) {
            return `<div style="font-family: sans-serif; padding: 5px;"><h4>${config.title}</h4><p>Sem informações disponíveis.</p></div>`;
        }

        // Montagem do HTML final do Popup com os botões de navegação
        let html = `<div class="popup-container" style="font-family: sans-serif; min-width: 220px; max-width: 300px;">`;
        html += `<h4 style="margin: 0 0 8px 0; color: #d9534f; border-bottom: 1px solid #ddd; padding-bottom: 4px; font-size: 14px;">${config.title}</h4>`;

        // Cria os botões de navegação (abas) caso exista mais de um bloco
        if (blocksData.length > 1) {
            html += `<div class="popup-tabs" style="display: flex; gap: 4px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">`;
            blocksData.forEach((block, idx) => {
                const activeStyle = idx === 0 
                    ? 'background: #d9534f; color: white; border-color: #d9534f;' 
                    : 'background: #f8f9fa; color: #333; border-color: #ccc;';
                html += `<button class="popup-tab-btn" data-block="${idx}" style="cursor: pointer; padding: 3px 8px; font-size: 11px; border-radius: 3px; border: 1px solid; font-weight: 500; ${activeStyle}">${block.title}</button>`;
            });
            html += `</div>`;
        }

        blocksData.forEach((block, idx) => {
            const displayStyle = idx === 0 ? 'display: block;' : 'display: none;';
            html += `<div class="popup-block" data-block-content="${idx}" style="${displayStyle}">`;
            
            if (blocksData.length === 1) {
                html += `<div style="font-weight: bold; font-size: 12px; margin-bottom: 6px; color: #555;">${block.title}</div>`;
            }

          // js/layerManager.js (Substitua o bloco que lida com o <br>)

            block.items.forEach(item => {
                const valorStr = String(item.valor || '').toLowerCase();
                
                // Se o texto contiver quebras de linha (<br>), transforma cada uma em um "bloquinho/card" separado
                if (valorStr.includes('<br')) {
                    html += `<div style="margin: 6px 0; font-size: 12px;">`;
                    html += `<strong style="display: block; margin-bottom: 5px; color: #333;">${item.label}:</strong>`;
                    
                    // Caixa contenedora com rolagem caso haja muitas notícias
                    html += `<div style="max-height: 160px; overflow-y: auto; padding-right: 2px;">`;
                    
                    // Pega o texto bruto e o divide em um array usando o <br> como separador
                    const noticiasArray = item.valor.split(/<br\s*[\/]?>/gi).map(s => s.trim()).filter(Boolean);
                    
                    noticiasArray.forEach((noticia) => {
                        // Cada notícia vira um card individual (bloquinho)
                        html += `<div style="background: #ffffff; border: 1px solid #e0e0e0; border-left: 3px solid #d9534f; padding: 6px 8px; margin-bottom: 6px; border-radius: 3px; font-size: 11px; line-height: 1.35; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">`;
                        html += noticia;
                        html += `</div>`;
                    });

                    html += `</div></div>`;
                    return;
                }

                // Renderização padrão para os demais campos (números, textos curtos)
                html += `<p style="margin: 4px 0; font-size: 12px; line-height: 1.4;"><strong>${item.label}:</strong> ${item.valor}</p>`;
            });

            html += `</div>`;
        });

        html += `</div>`;
        
        return html; // <--- O RETORNO QUE FALTAVA E FAZIA O POPUP SAIR VAZIO!
    }
    
    findConfigKeyByTitle(title) {
        return Object.keys(LAYERS_CONFIG).find(key => LAYERS_CONFIG[key].title === title);
    }
}