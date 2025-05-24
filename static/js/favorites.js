


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
      } else {
        console.log('Respuesta del servidor sin favoritos:', result);
      }
    })
    .catch(error => {
      console.error('Error al obtener favoritos:', error);
    });
}
