

//Cargar json

document.addEventListener("DOMContentLoaded", function() {
    
    mostrarBanner();

    cargarCarrusel();

    cargarEtiquetas();
        
    cargarRecomendaciones();

    cargarGrid();

});


function mostrarBanner(){
    const banner = document.getElementById('welcome-banner');
    const shouldShow = localStorage.getItem('showWelcomeBanner');
    const token = localStorage.getItem('token');

  fetch('/datos_usuario', {
    method: 'GET',
    headers: {
      'Authorization': token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la solicitud');
    }
    return response.json();
  })
  .then(result => {
    const nombre_usuario = result.datos.nombre_usuario;
  
    if (shouldShow === 'true') {

      const div = document.createElement('div');


      div.innerHTML = `🎉 ¡Bienvenido de nuevo ${nombre_usuario}!`;
      banner.appendChild(div);

      banner.classList.add('show');

      // Ocultar después de 3 segundos
      setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => banner.style.display = 'none', 500);
      }, 3000);

      // Limpiar bandera
      localStorage.removeItem('showWelcomeBanner');
    }

  })
  .catch(error => {
    console.error('Error:', error);
  });
    

    
}





function cargarCarrusel(){

  fetch('/recomendaciones', {
    method: 'GET'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la solicitud');
    }
    return response.json();
  })
  .then(result => {
    const recomendaciones = result.recomendaciones;
  
    // Paso 2: Cargar el archivo JSON local con todos los elementos
    return fetch('static/json/obras.json')
      .then(response => response.json())
      .then(data => {
        // Filtrar los objetos que coincidan con los IDs recomendados
        const recomendados = data.filter(item => recomendaciones.includes(item.id));
  
          // Carrusel
          const carouselInner = document.getElementById('carouselInner');
          recomendados.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'carousel-item' + (index === 0 ? ' active' : '');
            div.innerHTML = `
              <a href="select?id=${item.id}">
                <img src="static/src/img/${item.imagen}" class="d-block w-100" alt="${item.nombre}">
              </a>
              <div class="carousel-caption d-none d-md-block">
                <h5>${item.nombre}</h5>
              </div>
            `;
            carouselInner.appendChild(div);
          });


      });
  })
  .catch(error => {
    console.error('Error:', error);
  });


}


function cargarRecomendaciones(){
  const token = localStorage.getItem('token');

  fetch('/recomendaciones', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la solicitud');
    }
    return response.json();
  })
  .then(result => {
    const recomendaciones = result.recomendaciones;
  
    // Paso 2: Cargar el archivo JSON local con todos los elementos
    return fetch('static/json/obras.json')
      .then(response => response.json())
      .then(data => {
        // Filtrar los objetos que coincidan con los IDs recomendados
        const recomendados = data.filter(item => recomendaciones.includes(item.id));
  
        // Mostrar los resultados en el grid
        const grid = document.getElementById('gridRecomendaciones');
        grid.innerHTML = ''; // Limpiar contenido previo
  
        recomendados.forEach(item => {
          const col = document.createElement('div');
          col.className = 'col-6 col-md-4 col-lg-3';
          col.innerHTML = `
            <a href="select?id=${item.id}">
              <img src="static/src/img/${item.imagen}" class="img-fluid rounded" alt="${item.nombre}">
            </a>
          `;
          grid.appendChild(col);
        });


          // Activar flechas
          document.getElementById('scroll-left-recomendaciones').addEventListener('click', () => {
            grid.scrollBy({ left: -300, behavior: 'smooth' });
          });

          document.getElementById('scroll-right-recomendaciones').addEventListener('click', () => {
            grid.scrollBy({ left: 300, behavior: 'smooth' });
          });


      });
  })
  .catch(error => {
    console.error('Error:', error);
  });
}



function cargarGrid(){

  fetch('static/json/obras.json')
      .then(response => response.json())
      .then(data => {
        const grid = document.getElementById('gridObras');
        data.forEach((item, index) => {
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


function cargarEtiquetas() {
  const obras = [
    { nombre: "Mesopotamia", etiqueta: "Mesopotamia"},
    { nombre: "Histórico", etiqueta: "histórico"},
    { nombre: "Escritura", etiqueta: "escritura"},
    { nombre: "Escultura", etiqueta: "escultura"},
    { nombre: "Religioso", etiqueta: "religioso"},
    { nombre: "Egipto", etiqueta: "Egipto"}
  ];

  const grid = document.getElementById('gridEtiquetas');
  
  obras.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <a href="search?id=${item.etiqueta}">
      <div class="card-body">
        <h5 class="card-title">${item.nombre}</h5>
      </div>
      </a>
    `;
    grid.appendChild(card);
  });
}




