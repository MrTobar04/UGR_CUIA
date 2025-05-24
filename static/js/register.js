
// -------------------- VARIABLES GLOBALES --------------------
let faceEncodingStr = ""; // Aquí se almacenará el encoding facial como string


// -------------------- FORMULARIO DE REGISTRO --------------------
const form = document.querySelector('form');
const nombreInput = document.getElementById('nombre');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const apiUrl = '/usuarios'; // Ajusta la URL a tu servidor

// Obtener la variable faceEncodingStr del servidor al capturar la imagen

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = nombreInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!password || password.length < 6) {
    mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'danger'); 
    return;
  }


  let faceEncoding = [];
  try {
    if (faceEncodingStr) {
      faceEncoding = JSON.parse(faceEncodingStr);
    }
  } catch (error) {
    console.error('Error al parsear el face encoding:', error);
    mostrarAlerta('Error al reconocer tu cara, intentalo nuevamente.', 'danger'); 
    return;
  }

  if (faceEncoding.length === 0) {
    mostrarAlerta('Por favor, registre su cara.', 'danger'); 
    return;
  }

  const datosUsuario = {
    nombre_usuario: nombre,
    correo: email,
    password: password,
    face_encoding: faceEncoding
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosUsuario)
    });

    if (response.ok) {
      mostrarAlerta('Usuario registrado con éxito.', 'success'); 
      form.reset();
      faceEncodingStr = "";
      setTimeout(() => {
        window.location = '/';
      }, 1000);
    } else {
      const errorData = await response.json();
      console.error('Error al registrar el usuario:', errorData.error || 'Error desconocido');
      mostrarAlerta('El usuario o correo ya existen, intentalo nuevamente.', 'danger'); 
    }
  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    mostrarAlerta('No se pudo crear tu usuario, intentalo nuevamente.', 'danger'); 

  }
});

// -------------------- RECONOCIMIENTO FACIAL --------------------
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const captureButton = document.getElementById('capture');
const btnFacial = document.getElementById('btnFacial');
const iconFacial = document.getElementById('iconFacial');

let videoStream = null;

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      videoStream = stream;
    })
    .catch(err => {
      mostrarAlerta('No se pudo acceder a su cámara, intentalo nuevamente.', 'danger'); 
      console.error('Error al acceder a la cámara:', err);
    });
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    videoStream = null;
  }
}

const modalEl = document.getElementById('modalFacial');
modalEl.addEventListener('show.bs.modal', startCamera);
modalEl.addEventListener('hidden.bs.modal', stopCamera);

captureButton.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const dataURL = canvas.toDataURL('image/png');
  preview.src = dataURL;
  preview.style.display = 'block';

  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'captura.png');

    fetch('/register-face', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
      if (status === 200 && body.face_encoding) {
        // Guardar encoding como string para el registro
        faceEncodingStr = body.face_encoding;

        // Cambiar botón a estado de éxito
        iconFacial.classList.remove('bi-camera');
        iconFacial.classList.add('bi-check-circle-fill');
        btnFacial.classList.remove('btn-outline-light');
        btnFacial.classList.add('btn-success');
        btnFacial.innerHTML = '<i id="iconFacial" class="bi bi-check-circle-fill me-2"></i> Rostro registrado';

        stopCamera();
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      } else {
        mostrarAlerta('No se pudo reconocer su rostro, intentalo nuevamente.', 'danger'); 
        console.error('Error al registrar rostro:', body.error);
      }
    })
    .catch(err =>{
      console.error('Error al enviar imagen:', err)
      mostrarAlerta('No se pudo reconocer su rostro, intentalo nuevamente.', 'danger'); 
    });
  }, 'image/png');
});





// Mensajes de alerta

function mostrarAlerta(mensaje, tipo = 'danger') {
  const contenedor = document.getElementById('alert-container');
  const alerta = document.createElement('div');
  
  alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
  alerta.setAttribute('role', 'alert');
  alerta.innerHTML = `
    <strong>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}:</strong> ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
  `;

  contenedor.appendChild(alerta);

  // Opcional: cerrar automáticamente después de 5 segundos
  setTimeout(() => {
    alerta.classList.remove('show');
    alerta.classList.add('hide');
    alerta.addEventListener('transitionend', () => alerta.remove());
  }, 5000);
}