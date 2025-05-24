



document.addEventListener("DOMContentLoaded", function() {
    
    cargarGrid();

});

function cargarGrid(){

    fetch('static/json/obras.json')
        .then(response => response.json())
        .then(data => {

            // Filtrar los objetos que coincidan con la etiqueta dada
            const params = new URLSearchParams(window.location.search);
            const etiqueta = params.get("id");
            const etiquetados = data.filter(item => item.etiquetas.includes(etiqueta));
            const grid = document.getElementById('gridObras');
            const texto = document.getElementById("Explora");

            texto.textContent = `Mostrando resultados de '${etiqueta}'`;
            
            etiquetados.forEach((item, index) => {
                const col = document.createElement('div');
                col.className = 'col-6 col-md-4 col-lg-3';
                col.innerHTML = `
                <a href="select?id=${item.id}">
                    <img src="static/src/img/${item.imagen}" class="img-fluid rounded" alt="${item.nombre}">
                </a>
                `;
                grid.appendChild(col);
            });
        })
        .catch(error => console.error('Error cargando el JSON:', error));
  
  }