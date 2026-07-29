
// Camada fixa de contorno do Estado
export const STATE_BOUNDARY_CONFIG = {
    id: "limite_parana",
    title: "Limite Estadual do Paraná",
    url: "data/Limites.json", // Seu GeoJSON com o contorno do Estado
    style: {
        color: '#1a1a1a',       // Cor grafite escuro / preto para destaque
        weight: 2.2,            // Borda mais espessa que a dos municípios
        opacity: 0.9,
        fill: false,            // Sem preenchimento interno
        interactive: false      // IMPORTANTE: ignora eventos de mouse (pass-through)
    }
};

export const LAYERS_CONFIG = {

populacao_indigena: {
        id: "populacao_indigena",
        title: "População Indígena",
        url: "data/Popuind.json",
        type: 'choropleth',
        // Atributos do seu GeoJSON
        propValue: "PopuInd",     // Coluna numérica das faixas
        propName: "nome",         // Coluna com o nome do município (ex: 'name' ou 'NM_MUN')
        unitLabel: "Indígenas",
        
        // A sua régua de cores antiga do getColor(), estruturada em arrays
        breaks: [1, 50, 500, 1000, 1700, 2500],
        colors: ['#FFEDA0', '#FEB24C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'],
        defaultColor: '#000000',   // Cor para valores < 1
        activeByDefault: true
},


terras_indigenas_fase: {
        id: "terras_indigenas_fase",
        title: "Situação Jurídica da Terra Indígena",
        type: "categorical", // <-- Define o tipo como categórico
        url: "data/terras.json",
        propValue: "fase_ti",  // Atributo texto no GeoJSON (ex: 'Homologada')
        propName: "terrai_nom",
        unitLabel: "",
        
        // Mapeamento direto de Texto -> Cor
        categories: {
            "Regularizada": "#004a11",
            "Declarada": "#dcc008",
            "Delimitada": "#e67300",
        },
        defaultColor: '#cccccc', // Cor para categorias não mapeadas ou nulas
        activeByDefault: false
    },


Notícias_Indígenas_pr: {
        id: "Notícias",
        title: "Notícias Indígenas no Paraná",
        type: "categorical", // <-- Define o tipo como categórico
        url: "data/Notícias.json",
        propValue: "Agregado_Tema",  // Atributo texto no GeoJSON (ex: 'Homologada')
        propName: "nome",
        unitLabel: "",
        
        // Mapeamento direto de Texto -> Cor
        categories: {
            "Regularizada": "#004a11",
            "Declarada": "#dcc008",
            "Delimitada": "#e67300",
        },
        defaultColor: '#cccccc', // Cor para categorias não mapeadas ou nulas
        activeByDefault: false
    },
};