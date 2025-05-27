
const etiquetasObras = [
  "escultura",
  "religioso",
  "Egipto",
  "mitología",
  "Mesopotamia",
  "histórico",
  "escritura",
  "transporte",
  "modelo",
  "cartografía",
  "astronomía",
  "ciencia antigua",
  "utilitario",
  "cerámica"
];

const numerosEscritos = {
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
  13: "trece",
  14: "catorce",
  15: "quince",
  16: "dieciséis",
  17: "diecisiete",
  18: "dieciocho",
  19: "diecinueve",
  20: "veinte",
  21: "veintiuno",
  22: "veintidós",
  23: "veintitrés",
  24: "veinticuatro",
  25: "veinticinco",
  26: "veintiséis",
  27: "veintisiete",
  28: "veintiocho",
  29: "veintinueve",
  30: "treinta",
  31: "treinta y uno",
  32: "treinta y dos",
  33: "treinta y tres",
  34: "treinta y cuatro",
  35: "treinta y cinco",
  36: "treinta y seis",
  37: "treinta y siete",
  38: "treinta y ocho",
  39: "treinta y nueve",
  40: "cuarenta",
  41: "cuarenta y uno",
  42: "cuarenta y dos"
};


//NavBar 

document.addEventListener("DOMContentLoaded", async function () {
  sessionStorage.clear();
  const asistenteActivado = await cargarAsistente();
  mostrarNavBar(asistenteActivado);
  cargarEventoBusqueda();




  activarAudio();

  if (localStorage.getItem('showWelcomeBanner') && asistenteActivado) {
    mostrarBienvenida();
  }

  if (window.location.pathname == "/quiz" && asistenteActivado) {

    document.addEventListener("preguntaMostrada", (e) => {
      leerPregunta()
    });
  }
});



function mostrarNavBar(asistenteActivado){
  const navBar = document.getElementById("navbar");
  const div = document.createElement("div");

  div.innerHTML=
`<nav class="navbar navbar-expand-lg navbar-dark fixed-top bg-dark">
  <div class="container-fluid">
    <a class="navbar-brand fw-bold text-danger" style="font-size: 1.8rem;" href="/home">MuseoVirtual</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item me-3">
          <a class="nav-link" href="/home"><i class="bi bi-house fs-4 text-white" title="Inicio"></i></a>
        </li>
        <li class="nav-item me-3">
          <a class="nav-link" href="/favorites"><i class="bi bi-heart fs-4 text-white" title="Favoritos"></i></a>
        </li>
        <li class="nav-item me-3">
          <a class="nav-link" href="/quiz" title="Cuestionario">
            <i class="bi bi-pencil-square fs-4 text-white"></i>
          </a>
        </li>
        <li class="nav-item d-flex align-items-center me-3">
          <a class="nav-link" href="#" onclick="activarBusqueda(event)">
            <i class="bi bi-search fs-4 text-white" title="Buscar"></i>
          </a>
          <input id="searchInput" class="form-control form-control-sm ms-2 d-none" type="search" placeholder="Buscar" aria-label="Buscar">
        </li>
      </ul>

      
      <div class="d-flex align-items-center">
       <ul class="navbar-nav me-auto mb-2 mb-lg-0">
       <!-- Checkbox con estilo de botón -->
         <li class="nav-item me-3 d-flex align-items-center">
          <i id="iconoMicrofonoActivado" ${asistenteActivado ? 'class="bi bi-mic fs-5 text-secondary me-2"' : 'class="bi bi-mic-mute fs-5 text-secondary me-2"'}  title="Activar audio"></i>
            <div class="form-check form-switch m-0" >
              <input class="form-check-input custom-danger-switch" type="checkbox" id="btnActivarAudio" ${asistenteActivado ? 'checked' : ''} style=" background-color: #dc3545;">
            </div>
          </li>
        <li class="nav-item me-3">
          <a class="nav-link" href="/account" title="Cuenta">
             <i class="bi bi-person-circle fs-3 text-white"></i>
          </a>
        </li>
        <li class="nav-item me-3">
          <a class="nav-link" href="/" title="Cerrar Sesion">
            <i id="logout" class="bi bi-box-arrow-right fs-3 text-white" title="Cerrar sesión" onclick="cerrarSesion(event)"></i>
          </a>
        </li>
      </ul>
      </div>
    </div>
  </div>
</nav>`

navBar.appendChild(div);

}









function activarBusqueda(event) {
    event.preventDefault();
    const input = document.getElementById("searchInput");
    input.classList.toggle("d-none");
    input.focus();
  }

function cargarEventoBusqueda(){
  const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Evita que el formulario se recargue
        const query = searchInput.value.trim();

        if (query) {
          // Redirigir a una página de resultados o aplicar búsqueda local
          window.location.href = `search?id=${query}`;
        }
      }
    });
}



function cerrarSesion(){
  window.location.href = `/`;
  localStorage.clear();
}


















// Audio











const threshold = 0.05; // Nivel de volumen mínimo para activar grabación
const silenceDelay = 2000; // Tiempo en ms de silencio para detener grabación

const btnMicrofono = document.getElementById("btn-microfono");
const iconoMicrofono = document.getElementById("icono-microfono");

let audioContext;
let analyser;
let dataArray;
let mediaRecorder;
let silenceTimeout;
let recording = false;
let chunks = [];
let numPregunta = 0;
let intervaloMonitoreo;

let monitoreoActivado = false;










//cargar asistente
async function cargarAsistente() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('/datos_usuario', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });

    const result = await response.json();
    return result?.datos?.asistente_voz === true;

  } catch (error) {
    console.error('Error al obtener asistente:', error);
    return false; // Devuelve false en caso de error
  }
}



//Actualizar estado del asistente de voz
function actualizaAsistente(forzarDesactivado = false){
  const btnActivar = document.getElementById("btnActivarAudio");


  asistente_voz = false;

  if(!forzarDesactivado)
  {
    asistente_voz = btnActivar.checked;
  }
  
    

  const token = localStorage.getItem('token');
  
    fetch('/usuarios/asistente_voz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization':  'Bearer ' + token
      },
      body: JSON.stringify({
        asistente_voz
      })
    })
      .then(response => response.json())
      .then(data => {
        if(btnActivar.checked)
          console.log("✅Asistente activado correctamente");
        else
          console.log("🔁Asistente desactivado correctamente");
      })
      .catch(error => {
        console.error('Error al realizar la solicitud:', error);
      });
  
}

 
















function activarAudio() {
  const btnActivar = document.getElementById("btnActivarAudio");

  // Función para iniciar la grabación y el intervalo
  function iniciarGrabacion() {
    monitoreoActivado = true;
    flujoGrabacion();
    btnActivar.style.backgroundColor = "#dc3545";
    btnMicrofono.style.display = "inline";
  }

  // Función para detener el intervalo
  function detenerGrabacion() {
    monitoreoActivado = false;
    if (intervaloMonitoreo) {
      clearInterval(intervaloMonitoreo);
      intervaloMonitoreo = null;
    }
    btnActivar.style.backgroundColor = "rgb(255, 255, 255)";
    btnMicrofono.style.display = "none";
  }

  // Estado inicial
  if (btnActivar.checked) {
    iniciarGrabacion();
  } else {
    detenerGrabacion();
  }

  // Evento al hacer clic en el botón
  btnActivar.addEventListener("click", function () {
    const iconoActivado = document.getElementById("iconoMicrofonoActivado");

    if (btnActivar.checked) {
      iconoActivado.classList.remove("bi-mic-mute");
      iconoActivado.classList.add("bi-mic");
      iniciarGrabacion();
    } else {
      iconoActivado.classList.remove("bi-mic");
      iconoActivado.classList.add("bi-mic-mute");
      detenerGrabacion();
    }
    actualizaAsistente(); // Llama a esta función siempre después del cambio
  });
}


async function flujoGrabacion() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      chunks = [];
      // 🎯 Aquí puedes hacer algo con el audio, por ejemplo:
      await procesarAudio(audioBlob)
    };

    monitorVolume();

  } catch (err) {
    console.error("Error al acceder al micrófono:", err);
  }
}




function getVolume() {
  analyser.getByteFrequencyData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  return sum / dataArray.length / 255; // Normalizado entre 0 y 1
}




function monitorVolume() {
  intervaloMonitoreo = setInterval(() => {

    const volume = getVolume();

    if (volume > threshold) {
      if (!recording) {
        mediaRecorder.start();
        recording = true;
        console.log("🎤 Grabación iniciada...");
      }

      clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(async () => {
        if (recording) {
          await mediaRecorder.stop();
          recording = false;
          console.log("🛑 Grabación detenida por silencio.");
        }
      }, silenceDelay);
    }
  }, 75); // Mayor frecuencia para mejor respuesta
}






async function procesarAudio(audio) {
  clearInterval(intervaloMonitoreo)
  botonMuteado();

  await procesamientoInteligente(audio);
  
  botonActivado();
  if (monitoreoActivado) monitorVolume();
}



async function procesamientoNormal(audio_blob) {
  const formData = new FormData();
  formData.append('audio', audio_blob, 'grabacion.webm');

  const response = await fetch('/upload_audio', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  const texto = data.texto;

  if (texto) {
    botonMuteado();
    hablando = true;
    const entendido = await comandosPorVoz(texto);
    if (!entendido) {
      await respuestaVoz("Perdona, no te entendí, inténtalo nuevamente.");
    }
  }


}



async function procesamientoInteligente(audio_blob) {
  const formData = new FormData();

  

  formData.append('audio', audio_blob, 'grabacion.webm');
  formData.append('historial', JSON.stringify(crearJsonHistorial()));

  if (window.location.pathname == "/select") {
    const obra = document.getElementById('nombre-objeto').textContent
    formData.append('obra', obra);
  }

  if (window.location.pathname == "/quiz") {
    const pregunta_quiz = textoPregunta();
    formData.append('obra', pregunta_quiz);
  }


  const token = localStorage.getItem("token");


  const response = await fetch('/pregunta_inteligente', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: formData
  });

  const data = await response.json();
  const pregunta = data.pregunta;
  const respuesta = data.respuesta;
  const comando = data.comando;

  if (respuesta) {
    botonMuteado();
    hablando = true;

    sessionStorage.setItem(`Pregunta ${numPregunta}`, pregunta);
    sessionStorage.setItem(`Respuesta ${numPregunta}`, respuesta);

    numPregunta++;

 
    await respuestaVoz(respuesta);
    if(comando)
      comandosPorVoz(comando)
  }
}




function crearJsonHistorial() {
  let historial = [];

  // Recorrer las preguntas y respuestas del sessionStorage
  let i = 0;
  while (true) {
    let pregunta = sessionStorage.getItem(`Pregunta ${i}`);
    let respuesta = sessionStorage.getItem(`Respuesta ${i}`);

    if (pregunta === null || respuesta === null) break;

    historial.push({
      role: "user",
      content: pregunta
    });

    historial.push({
      role: "assistant",
      content: respuesta
    });

    i++;
  }

  return historial;
}




// Comandos por voz

async function comandosPorVoz(comando) {
  let condicionesCumplidas = 0;
  let accion = null;

  // Contadores y acciones

  if (comando.includes("desactivar") || comando.includes("apagar")) {
    condicionesCumplidas++;
    accion = () => document.getElementById("btnActivarAudio").click();
  }

  if (comando.includes("sesión") || comando.includes("cerrar")) {
    condicionesCumplidas++;
    accion = () => cerrarSesion();
  }

  if (comando.includes("inicio") || comando.includes("página principal")) {
    condicionesCumplidas++;
    accion = () => window.location.href = `/home`;
  }

  if (comando.includes("favoritos")) {
    condicionesCumplidas++;
    accion = () => window.location.href = `/favorites`;
  }

  if (comando.includes("cuenta")) {
    condicionesCumplidas++;
    accion = () => window.location.href = `/account`;
  }

  if (comando.includes("cuestionario")) {
    condicionesCumplidas++;
    accion = () => window.location.href = `/quiz`;
  }

  if (comando.includes("obra")) {
    for (let i = 42; i >= 1; i--) {
      const palabra = numerosEscritos[i];
      if (comando.includes(palabra) || comando.includes(i.toString())) {
        condicionesCumplidas++;
        accion = () => window.location.href = `/select?id=${i}`;
        break;
      }
    }
  }

  for (const element of etiquetasObras) {
    if (comando.includes(element)) {
      condicionesCumplidas++;
      accion = () => window.location.href = `search?id=${element}`;
      break;
    }
  }

  if (comando.includes("opción")) {
    const numeros = ["1", "2", "3", "4"];
    numeros.forEach(numero => {
      if(numero == comando.charAt(comando.length - 1)){
        condicionesCumplidas++;
        accion = () => seleccionarOpcion(numeros.indexOf(numero));
      }
    });
  }


  // Ejecutar solo si hay exactamente una coincidencia
  if (condicionesCumplidas === 1) {
    accion();
    return true;
  }

  // Si no se cumple ninguna o se cumple más de una condición
  return false;
}



function botonActivado(){

  iconoMicrofono.classList.remove("bi-mic-mute-fill");
  iconoMicrofono.classList.add("bi-mic-fill");
  btnMicrofono.classList.replace("btn-danger", "btn-success");
  btnMicrofono.title = "Escuchando...";
}

function botonMuteado(){

  iconoMicrofono.classList.remove("bi-mic-fill");
  iconoMicrofono.classList.add("bi-mic-mute-fill");
  btnMicrofono.classList.replace("btn-success", "btn-danger");
  btnMicrofono.title = "Escuchando...";
}

function respuestaVoz(texto){
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = resolve; // Se resuelve cuando termina de hablar
    utterance.onerror = resolve; // También resuelve en caso de error para no bloquear

    window.speechSynthesis.speak(utterance);
  });
}





//Bienvenida

function mostrarBienvenida(){
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
  .then(async result => {
    const nombre_usuario = result.datos.nombre_usuario;
  
    if (shouldShow === 'true') {


      await respuestaVoz(`¡Bienvenido de nuevo ${nombre_usuario}!`);

    }

  })
  .catch(error => {
    console.error('Error:', error);
  });
    

    
}









//Interfaz Quizz











async function leerPregunta(){

  clearInterval(intervaloMonitoreo);
  hablando = true;
  botonMuteado();
  document.getElementById("btnAtras").disabled = true;
  document.getElementById("btnResponder").disabled = true;

  await respuestaVoz(textoPregunta());

  document.getElementById("btnAtras").disabled = false;
  document.getElementById("btnResponder").disabled = false;  
  botonActivado();
  if (monitoreoActivado) monitorVolume(); hablando = false;
}



function textoPregunta() {

  const form = document.getElementById("quiz-form");
  let texto = "";

  // Obtener el texto de la pregunta (asumiendo que es el único <h4> dentro del form)
  const titulo = form.querySelector("h4");
  if (titulo) {
    texto += titulo.textContent + "\n";
  }

  // Obtener las opciones por ID (opcion0, opcion1, etc.)
  texto += "Las opciones son:" + "\n";
  let index = 0;
  while (true) {
    const label = form.querySelector(`label[for="opcion${index}"]`);
    if (!label) break; // No hay más opciones

    texto += label.textContent.trim() + "\n";
    index++;
  }

  return texto.trim();
}




function seleccionarOpcion(index) {
  if (index === -1) {
    console.warn(`Letra inválida: ${letra}`);
    return;
  }

  const radio = document.getElementById(`opcion${index}`);
  if (radio) {
    radio.click();

    setTimeout(() => {document.getElementById("btnResponder").click();}, 2000);


  } else {
    console.warn(`No se encontró la opción con id opcion${index}`);
  }
}