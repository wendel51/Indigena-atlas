
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

   Noticias: {
        id: "Noticias",
        title: "Notícias Indígenas no Paraná",
        type: "categorical", // <-- Define o tipo como categórico
        url: "data/Noticias.json",
        fields: [
            { key: 'nome', label: 'Município' },
            { key: 'etnia_nome', label: 'Povo / Etnia' },
            { key: 'fase_ti',    label: 'Fase de Demarcação' },
            { key: 'modalidade', label: 'Modalidade' },
            { key: 'municipio',     label: 'Município' }
        ],
        propValue: "Noticias por municipio",  // Atributo texto no GeoJSON (ex: 'Homologada')
        categories: {
            "1": "#0059e7",
            "2": "#00e7e7",
            "3": "#0cae75",
            "4": "#f2e205",
            "5": "#f28f05",
            "6": "#f20505",
        },
        defaultColor: '#7977779b', // Cor para categorias não mapeadas ou nulas
        blocks: [
             { title: 'Principais Temas', keys: ['Tema'] },
            { title: 'Principais Notícias', keys: ['Titulo'] },
        ],
        activeByDefault: true
    },




populacao_indigena: {
        id: "populacao_indigena",
        title: "População Indígena",
        url: "data/Popuind.json",
        type: 'choropleth',
        // Atributos do seu GeoJSON
        propValue: "PopuInd",     // Coluna numérica das faixas
        // A sua régua de cores antiga do getColor(), estruturada em arrays
        breaks: [1, 50, 500, 1000, 1700, 2500],
        colors: ['#FFEDA0', '#FEB24C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'],
        
          fields: [
            { key: 'nome', label: 'Município' },
            { key: 'etnia_nome', label: 'Povo / Etnia' },
            { key: 'fase_ti',    label: 'Fase de Demarcação' },
            { key: 'PopuInd', label: 'População Indígena' },
            { key: 'municipio',     label: 'Município' }
        ],
         blocks: [
             { title: 'População Indígena', keys: ['PopuInd'] },
            { title: 'Principais Notícias', keys: ['Titulo'] },
        ],
        defaultColor: '#000000',   // Cor para valores < 1
        activeByDefault: false
},


terras_indigenas_fase: {
        id: "terras_indigenas_fase",
        title: "Situação Jurídica da Terra Indígena",
        type: "categorical", // <-- Define o tipo como categórico
        url: "data/terras.json",
        fields: [
            { key: 'terrai_nom', label: 'Nome da TI' },
            { key: 'etnia_nome', label: 'Povo / Etnia' },
            { key: 'fase_ti',    label: 'Fase de Demarcação' },
            { key: 'modalidade', label: 'Modalidade' },
            { key: 'municipio',     label: 'Município' }
        ],
        propValue: "fase_ti",  // Atributo texto no GeoJSON (ex: 'Homologada')
        categories: {
            "Regularizada": "#004a11",
            "Declarada": "#dcc008",
            "Delimitada": "#e67300",
        },
        defaultColor: '#cccccc', // Cor para categorias não mapeadas ou nulas
        activeByDefault: false
    },
};