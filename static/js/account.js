document.addEventListener("DOMContentLoaded", function() {
    
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
  
    mostrarTitulo(result.datos.nombre_usuario);
    mostrarPuntuacion(result.datos.quiz_realizados, result.datos.puntuacion);
    mostrarFormulario(result.datos.nombre_usuario, result.datos.correo, result.datos.quiz_realizados, result.datos.puntuacion);

  })
  .catch(error => {
    console.error('Error:', error);
  });

});

function mostrarTitulo(nombre){
    const miCuenta = document.getElementById("miCuenta");
    const div = document.createElement("div");

    div.innerHTML = `<h2 class="mb-4 text-danger fw-bold">Tu cuenta, ${nombre}</h2>`
    miCuenta.appendChild(div);
}

    


function mostrarPuntuacion(n, puntuacion){
    let porcentaje = 0
    if(n != 0){
      porcentaje = (puntuacion/n).toFixed(2);;
    }
    const graficoPorcentaje = document.getElementById("graficoPorcentaje");
    const div = document.createElement("div");

    div.innerHTML =  `<div class="inner-circle" id="fill-circle"></div>
                        <span class="position-absolute text-danger fw-bold">${porcentaje}%</span>`
    
    graficoPorcentaje.appendChild(div);

    const outerSize = 150;
    const maxInnerSize = outerSize; 

    const inner = document.getElementById('fill-circle');
    const size = maxInnerSize * (porcentaje / 100);
    inner.style.width = `${size}px`;
    inner.style.height = `${size}px`;


}


function mostrarFormulario(nombre, correo, n, puntuacion){
    document.getElementById("nombre_usuario").value = nombre;
    document.getElementById("correo_electronico").value = correo;
    document.getElementById("quiz_realizados").value = n;
    document.getElementById("puntuacion").value = puntuacion;
}