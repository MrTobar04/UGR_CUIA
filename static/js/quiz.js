let preguntas = [];
let preguntaActual = 0;
let puntaje = 0;

document.addEventListener("DOMContentLoaded", cargarQuiz);

function cargarQuiz() {
  const token = localStorage.getItem('token');

  fetch('/generate_quiz', {
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

      return fetch('static/json/preguntas.json')
        .then(response => response.json())
        .then(data => {
          // Filtrar las preguntas recomendadas por ID
          preguntas = data.filter(item => recomendaciones.includes(item.id));
          mostrarPregunta();
        });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function mostrarPregunta() {
  if (preguntaActual >= preguntas.length) {
    mostrarResultadoFinal();
    return;
  }

  const form = document.getElementById("quiz-form");
  form.innerHTML = "";

  const pregunta = preguntas[preguntaActual];
  const opciones = pregunta.opciones;

  const titulo = document.createElement("h4");
  titulo.textContent = pregunta.pregunta;
  titulo.classList.add("mb-3");
  form.appendChild(titulo);

  opciones.forEach((opcion, index) => {
    const div = document.createElement("div");
    div.classList.add("form-check");

    div.innerHTML = `
      <input class="form-check-input" type="radio" name="respuesta" id="opcion${index}" value="${index}">
      <label class="form-check-label" for="opcion${index}">
        ${opcion}
      </label>
    `;
    form.appendChild(div);
  });

  // Botones sin contador (el contador es independiente)
  form.innerHTML += `
    <div class="d-flex justify-content-between align-items-center mt-4">
      <button type="button" class="btn btn-secondary" onclick="irAtras()" ${preguntaActual === 0 ? "disabled" : ""}>Atrás</button>
      <button type="submit" class="btn btn-danger">Responder</button>
    </div>
  `;

  form.onsubmit = function (e) {
    e.preventDefault();
    const seleccionada = form.querySelector("input[name='respuesta']:checked");
    if (!seleccionada) return;

    const respuestaUsuario = pregunta.opciones[parseInt(seleccionada.value)];
    if (respuestaUsuario === pregunta.respuesta) {
      puntaje++;
    }

    preguntaActual++;
    mostrarPregunta();
    actualizarContador();
    actualizarBarraProgreso();
  };

  actualizarContador();
  actualizarBarraProgreso();
}

function irAtras() {
  if (preguntaActual > 0) {
    preguntaActual--;
    mostrarPregunta();
  }
}

function actualizarContador() {
  const contador = document.getElementById("pregunta-contador");
  contador.textContent = `Pregunta ${preguntaActual + 1} / ${preguntas.length}`;
}

function actualizarBarraProgreso() {
  const progreso = Math.round((preguntaActual / preguntas.length) * 100);
  const barra = document.getElementById("quiz-progress");
  barra.style.width = `${progreso}%`;
  barra.setAttribute("aria-valuenow", progreso);
  barra.textContent = `${progreso}%`;
}


function mostrarResultadoFinal() {
  const token = localStorage.getItem('token');
  const calificacion = (100*puntaje/preguntas.length).toFixed(2);
  const form = document.getElementById("quiz-form");
  form.innerHTML = `
    <div class="alert alert-info">
      ¡Cuestionario completado! Tu puntaje es ${calificacion}.
    </div>
    <a href="/home" class="btn btn-outline-light mt-3">Volver al inicio</a>
  `;

  fetch('/actualizar_puntuacion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token
  },
  body: JSON.stringify({
    puntuacion: parseFloat(calificacion)
  })
})
  .catch(error => {
    console.error('Error:', error);
  });
}