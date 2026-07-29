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
    if (props && config) {
        const nome = props[config.propName] || 'Não identificado';
        const valor = props[config.propValue] !== undefined ? props[config.propValue] : 'S/D';
        const valorFormatado = typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor;
        
        this._div.innerHTML = `<h4>${config.title}</h4>` +
            `<b>${nome}</b><br />${valorFormatado} ${config.unitLabel || ''}`;
    } else {
        this._div.innerHTML = '<h4>Atlas Indígena do Paraná</h4>Passe o cursor sobre uma feição';
    }
};
info.addTo(map);

// 5. Gerenciador de Camadas Alternáveis
const layerManager = new LayerManager(map, info);
layerManager.init();