document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const errorMsg = document.getElementById("error");
  const submitBtn = form.querySelector('button[type="submit"]');
  
  // Datos del formulario
  const credentials = {
    username: form.username.value.trim(),
    password: form.password.value
  };

  // Validación en cliente
  if (!credentials.username || !credentials.password) {
    errorMsg.textContent = 'Por favor complete ambos campos';
    errorMsg.style.display = 'block';
    return;
  }

  // Estado de carga
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la autenticación');
    }

    // Redirección después de login exitoso
    window.location.href = "/";
    
  } catch (error) {
    errorMsg.textContent = error.message.includes('Credenciales inválidas') 
      ? 'Usuario o contraseña incorrectos' 
      : 'Error al iniciar sesión';
    errorMsg.style.display = 'block';
    console.error('Error en login:', error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
  }
});