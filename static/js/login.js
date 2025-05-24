    let video = null;
    let canvas = null;

    // Seleccionar el formulario y los campos de entrada
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Agregar el listener para el evento submit del formulario
    loginForm.addEventListener('submit', async function(event) {
      // Prevenir el comportamiento predeterminado de envío del formulario
      event.preventDefault();

      // Obtener los valores del correo electrónico y la contraseña
      const email = emailInput.value;
      const password = passwordInput.value;

      try {
        // Enviar los datos al servidor usando fetch
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            correo: email,
            contraseña: password
          })
        });

        const data = await response.json();

        if (response.status === 200) {
          // Si el login es exitoso, guardar el token en localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('showWelcomeBanner', 'true');
          window.location.href = "/home";

        } else {
          // Si el login falla
          mostrarAlerta('No se pudo iniciar sesión, intentalo nuevamente.', 'danger'); 
          console.error('Error al iniciar sesión');
        }
      } catch (error) {
        // Manejar cualquier error de red o problemas al realizar la solicitud
        mostrarAlerta('No se pudo iniciar sesión, intentalo nuevamente.', 'danger'); 
        console.error('Error:', error);
      }
    });


    async function startFaceRecognition() {
      const btnFacial = document.getElementById('btnFacial');
      btnFacial.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Detectando...
      `;
      btnFacial.disabled = true;

      // Obtener acceso a la cámara
      try {
        if (!video) video = document.getElementById('video');
        if (!canvas) canvas = document.getElementById('canvas');

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        // Esperar a que la cámara esté lista
        await new Promise(resolve => {
          video.onloadedmetadata = () => resolve();
        });

        // Esperar un pequeño tiempo para estabilizar la imagen
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Capturar imagen
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detener la cámara
        stream.getTracks().forEach(track => track.stop());

        // Convertir a blob
        canvas.toBlob(async function(blob) {
          const formData = new FormData();
          formData.append('image', blob, 'captura.png');

          try {
            const response = await fetch('/detect-face', {
              method: 'POST',
              body: formData
            });

            const result = await response.json();

            if (response.status == 200) {

              if (result.usuario.length > 1) {
                const popup = document.getElementById("cuentas-popup");
                const lista = document.getElementById("lista-cuentas");

                result.usuario.forEach(elemento => {
                  const btn = document.createElement("button");
                  btn.className = "list-group-item list-group-item-action";
                  btn.textContent = elemento.nombre_usuario;
                  btn.onclick = () => {
                    localStorage.setItem('token', elemento.token);
                    popup.style.display = "none";
                    window.location.href = "/home";;
                  };

                  document.getElementById("btnClosePopup").onclick = () => {
                    const popup = document.getElementById('cuentas-popup');
                    popup.style.display = 'none';
                  }
                  lista.appendChild(btn);
                });
                // Mostrar pop-up
                popup.style.display = "block";
              }
              else {
                localStorage.setItem('token', result.usuario[0].token);
                window.location.href = "/home";;
              }
              
              localStorage.setItem('showWelcomeBanner', 'true');
              

            } 
            else if(response.status == 422){
              mostrarAlerta('Múltiples caras detectadas, intentalo nuevamente.', 'danger'); 
              console.error('Múltiples caras detectadas.');
            }
            else {
              mostrarAlerta('No se pudo iniciar sesión, intentalo nuevamente.', 'danger'); 
              console.error('No hay resultados de la detección.');
            }
          } catch (e) {
            mostrarAlerta('No se pudo iniciar sesión, intentalo nuevamente.', 'danger'); 
            console.error("Error al enviar la imagen: " + e);
          } finally {
            btnFacial.innerHTML = `<i id="iconFacial" class="bi bi-camera"></i> Reconocimiento facial`;
            btnFacial.disabled = false;
          }
        }, 'image/png');

      } catch (err) {
        mostrarAlerta('No se pudo iniciar sesión, intentalo nuevamente.', 'danger'); 
        console.error("Error al acceder a la cámara: " + err);
        btnFacial.innerHTML = `<i id="iconFacial" class="bi bi-camera"></i> Reconocimiento facial`;
        btnFacial.disabled = false;
      }
    }

    // Ejecutar automáticamente al cargar
    document.addEventListener('DOMContentLoaded', startFaceRecognition);








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