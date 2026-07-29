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
        const overlayMaps = {};

        Object.keys(LAYERS_CONFIG).forEach(key => {
            const config = LAYERS_CONFIG[key];
            
            const layerGroup = L.geoJson(null, {
                style: (feature) => getFeatureStyle(feature, config),
                onEachFeature: (feature, layer) => this.attachEvents(feature, layer, config)
            });

            this.leafletLayers[key] = layerGroup;
            overlayMaps[config.title] = layerGroup;
        });

        // Adiciona controle nativo do Leaflet
        L.control.layers(null, overlayMaps, { position: 'topleft', collapsed: false }).addTo(this.map);

        this.setupMapEvents();

        // Ativa a camada padrão do config
        Object.keys(LAYERS_CONFIG).forEach(key => {
            if (LAYERS_CONFIG[key].activeByDefault) {
                this.leafletLayers[key].addTo(this.map);
            }
        });
    }

    setupMapEvents() {
        this.map.on('overlayadd', (e) => {
            const configKey = this.findConfigKeyByTitle(e.name);
            if (configKey) this.loadLayerData(configKey);
        });

        this.map.on('overlayremove', () => {
            this.infoControl.update();
        });
    }

    async loadLayerData(key) {
        const config = LAYERS_CONFIG[key];
        const layerGroup = this.leafletLayers[key];

        if (this.loadedData[key]) return;

        try {
            const response = await fetch(config.url);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const data = await response.json();
            layerGroup.addData(data);
            this.loadedData[key] = true;
        } catch (error) {
            console.error(`Erro ao carregar camada ${config.title}:`, error);
        }
    }

    attachEvents(feature, layer, config) {
        layer.on({
            mouseover: (e) => {
                const l = e.target;
                const currentGroup = this.leafletLayers[config.id];

                // Reseta o estilo da feição anterior caso ela ainda esteja marcada
                if (this.camadaDestacada && this.camadaDestacada !== l) {
                    this.camadaDestacadaGroup?.resetStyle(this.camadaDestacada);
                }

                this.camadaDestacada = l;
                this.camadaDestacadaGroup = currentGroup;

                // Destaque nativo em SVG
                l.setStyle({
                    weight: 2.5,
                    color: '#222222',
                    fillOpacity: 0.9
                });

                // No SVG, o bringToFront traz o polígono atual para a frente da pilha
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
            click: (e) => this.map.fitBounds(e.target.getBounds())
        });
    }

    findConfigKeyByTitle(title) {
        return Object.keys(LAYERS_CONFIG).find(key => LAYERS_CONFIG[key].title === title);
    }
}