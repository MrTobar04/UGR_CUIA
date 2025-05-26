



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
            
            etiquetados.forEach(item => {
              const col = document.createElement('div');
              col.className = 'art-grid-card-container-mini'; // Nuevo contenedor

              col.innerHTML = `
                <a href="select?id=${item.id}">
                  <div class="art-grid-card" style="background-image: url('static/src/img/${item.imagen}')">
                    <div class="overlay-title">${item.nombre}</div>
                  </div>
                </a>
              `;
              grid.appendChild(col);
            });
        })
        .catch(error => console.error('Error cargando el JSON:', error));
  
  }