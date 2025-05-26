
const btnAR = document.getElementById('btn-ar');
const modelViewer = document.getElementById('model-viewer');
const arViewer = document.getElementById('ar-viewer');
const arImage = document.getElementById('ar-image');

let streaming = false;

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const rutaModelo = `static/src/3dmodels/model_${id}.glb`;

btnAR.addEventListener('click', () => {
  if (!streaming) {
    modelViewer.classList.add('d-none');
    arViewer.classList.remove('d-none');
    streaming = true;
    document.getElementById('divVerEscala').style.display = 'inline';
    document.getElementById('loadingScreen').style.display = 'flex'; // Mostrar loading al inicio
    requestNextImage(true); // indicamos que es la primera vez
  } else {
    streaming = false;
    modelViewer.classList.remove('d-none');
    arViewer.classList.add('d-none');
    document.getElementById('divVerEscala').style.display = 'none';
  }
});

function requestNextImage(isFirst = false) {
  if (!streaming) return;

  fetch('/next-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      ruta_modelo: rutaModelo,
      a_escala: document.getElementById('verEscala').checked
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('Error en la respuesta');
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      arImage.src = url;

      arImage.onload = () => {
        URL.revokeObjectURL(url);
        if (isFirst) {
          document.getElementById('loadingScreen').style.display = 'none'; // Ocultar loading
        }
        requestNextImage(); // continúa el ciclo
      };
    })
    .catch(err => {
      console.error('Error al cargar la imagen:', err);
      streaming = false;
      document.getElementById('loadingScreen').style.display = 'none';
      modelViewer.classList.remove('d-none');
      arViewer.classList.add('d-none');
    });
}


// Cargar modelo 3d desde json

document.addEventListener("DOMContentLoaded", function() {
   document.getElementById('loadingScreen').style.display = 'none';
  
  if (id) {
    fetch('static/json/obras.json')
      .then(response => response.json())
      .then(data => {
        const obra = data.find(item => item.id == id);

        if (obra) {
          document.getElementById('model-viewer').src = `static/src/3dmodels/${obra.modelo_3d}`;
          document.getElementById('nombre-objeto').textContent = obra.nombre;
          document.getElementById('descripcion-objeto').textContent = obra.descripcion || "Sin descripción disponible.";
          

          actualizarEtiquetas(obra.etiquetas);
          obrasSimilares(obra.etiquetas);
          recomendaciones()



          const btnFavorito = document.getElementById('btn-favorito');

          btnFavorito.addEventListener('click', () => agregarFavorito() )
        


        } else {
          alert('Obra no encontrada.');
        }


      })
      .catch(error => {
        console.error('Error al cargar el JSON:', error);
      });
  } else {
    alert('No se proporcionó ID.');
  }

});



function actualizarEtiquetas(etiquetas){
  const token = localStorage.getItem('token');
  let etiqueta;
  
  for (const indice in etiquetas) {
    etiqueta = etiquetas[indice];
    fetch('/usuarios/etiqueta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        etiqueta
      })
    })
      .then(response => response.json())
      .then(data => {
        //console.log('Respuesta del servidor:', data);
      })
      .catch(error => {
        console.error('Error al realizar la solicitud:', error);
      });
  }   
}




function obrasSimilares(etiquetas){

  const diccionario = {};

  for (const indice of etiquetas) {
    diccionario[etiquetas[indice]] = 1;
  }

  fetch('/obras_similares', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(diccionario)
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
        const grid = document.getElementById('gridObras');
        grid.innerHTML = ''; // Limpiar contenido previo
  
        recomendados.forEach(item => {
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


          // Activar flechas
          document.getElementById('scroll-left-similares').addEventListener('click', () => {
            grid.scrollBy({ left: -300, behavior: 'smooth' });
          });

          document.getElementById('scroll-right-similares').addEventListener('click', () => {
            grid.scrollBy({ left: 300, behavior: 'smooth' });
          });


      });
  })
  .catch(error => {
    console.error('Error:', error);
  });

  
}





function recomendaciones(){
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


function agregarFavorito(){
  const favorito = id;

  const token = localStorage.getItem('token');
  
    fetch('/usuarios/favoritos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization':  'Bearer ' + token
      },
      body: JSON.stringify({
        favorito
      })
    })
      .then(response => response.json())
      .then(data => {
        
        if(data.usuario.accion == 'agregado'){
          mostrarBanner('¡Obra agregada a tus favoritos!');
        }
        else{
          mostrarBanner('¡Obra removida de tus favoritos!');
        }

      })
      .catch(error => {
        console.error('Error al realizar la solicitud:', error);
      });
  
}

 

//Alerta Favorito


function mostrarBanner(mensaje) {
  const banner = document.getElementById('welcome-banner');
  
  // Limpiar contenido anterior
  banner.innerHTML = '';

  // Crear nuevo div con el mensaje
  const div = document.createElement('div');
  div.innerHTML = mensaje;
  banner.appendChild(div);

  // Asegurarse de que esté visible
  banner.style.display = 'block';
  banner.classList.add('show');

  // Ocultar después de 3 segundos
  setTimeout(() => {
    banner.classList.remove('show');

    // Esperar a que termine la transición (opcional)
    setTimeout(() => {
      banner.style.display = 'none';
      banner.innerHTML = ''; // limpiar después de ocultar
    }, 500); // tiempo para animación CSS, ajusta si usas transition
  }, 3000);
}