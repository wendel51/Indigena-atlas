// js/main.js
import { STATE_BOUNDARY_CONFIG } from './config.js';
import { LayerManager } from './layerManager.js';

// 1. Inicializa o Mapa
const map = L.map('map').setView([-24.757, -51.761], 8);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 2. Cria um "Pane" personalizado no Leaflet para o Limite Estadual
// Isso garante que a linha do estado fique SEMPRE por cima de outras camadas vetoriais
map.createPane('stateBoundaryPane');
map.getPane('stateBoundaryPane').style.zIndex = 650; // Fica acima do zIndex padrão das camadas (400)
map.getPane('stateBoundaryPane').style.pointerEvents = 'none'; // Não bloqueia cliques

// 3. Carrega o Limite do Estado de forma fixa/crônica
function carregarLimiteEstadual() {
    fetch(STATE_BOUNDARY_CONFIG.url)
        .then(res => res.json())
        .then(data => {
            L.geoJson(data, {
                style: STATE_BOUNDARY_CONFIG.style,
                pane: 'stateBoundaryPane' // Associa ao pane com zIndex elevado
            }).addTo(map);
        })
        .catch(err => console.error("Erro ao carregar o limite estadual:", err));
}

carregarLimiteEstadual();

// 4. Painel de Informações
const info = L.control({ position: 'topright' });

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props, config) {
    // Se não tiver dados no mouse, exibe a mensagem padrão
    if (!props || !config) {
        this._div.innerHTML = '<h4>Atlas Indígena do Paraná</h4><p style="font-size: 13px;">Passe o cursor sobre um território</p>';
        return;
    }

    let html = `<h4>${config.title}</h4>`;

    // Lista de colunas do QGIS/ArcGIS que devem ser escondidas do usuário
    const colunasIgnoradas = ['OBJECTID', 'FID', 'SHAPE_AREA', 'SHAPE_LEN', 'Shape_Length', 'Shape_Area', 'id'];

    // Se no config.js você definiu "fields" na mão, usa eles:
    if (config.fields && Array.isArray(config.fields)) {
        config.fields.forEach(field => {
            const valor = props[field.key];
            if (valor !== undefined && valor !== null && valor !== '') {
                html += `<b>${field.label}:</b> ${valor}<br />`;
            }
        });
    } 
    // Se não definiu "fields", lê TODAS as colunas que existirem no .json:
    else {
        for (let chave in props) {
            let valor = props[chave];
            
            // Só exibe se a coluna não for ignorada e não for vazia
            if (!colunasIgnoradas.includes(chave) && valor !== null && valor !== undefined && valor !== '') {
                // Tira os "anderlines" e deixa a primeira letra bonita
                let rotulo = chave.replace(/_/g, ' ');
                rotulo = rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
                
                html += `<b>${rotulo}:</b> ${valor}<br />`;
            }
        }
    }

    this._div.innerHTML = html;
};

info.addTo(map);

// 5. Gerenciador de Camadas Alternáveis
const layerManager = new LayerManager(map, info);
layerManager.init();