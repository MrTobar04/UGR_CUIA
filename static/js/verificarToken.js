// Función que se ejecuta al cargar el script
(async () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      console.warn('No hay token en localStorage. Redirigiendo al login.');
      window.location.href = '/';
      return;
    }
  
    try {
      const response = await fetch('/verificar-token', {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.warn('Token inválido o expirado. Mensaje del servidor:', data.mensaje);
        window.location.href = '/';
      } else {
        console.log('Token válido. Mensaje del servidor:', data.mensaje);
      }
    } catch (error) {
      console.error('Error al verificar el token:', error);
      window.location.href = '/';
    }
  })();

  