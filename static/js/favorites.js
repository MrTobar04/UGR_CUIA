


document.addEventListener("DOMContentLoaded", function() {
    
    cargarGrid();

});

function cargarGrid() {
  const token = localStorage.getItem('token');

  fetch('/datos_usuario', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  })
    .then(response => response.json())
    .then(result => {
      if (result.datos.favoritos) {
        const ids = result.datos.favoritos.map(id => id); 

        fetch('static/json/obras.json')
          .then(response => response.json())
          .then(data => {
            const favoritos = data.filter(item => ids.includes(item.id.toString()));

            const grid = document.getElementById('gridObras');

            favoritos.forEach(item => {
              const col = document.createElement('div');
              col.className = 'art-grid-card-container'; // Nuevo contenedor

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
      } else {
        console.log('Respuesta del servidor sin favoritos:', result);
      }
    })
    .catch(error => {
      console.error('Error al obtener favoritos:', error);
    });
}
