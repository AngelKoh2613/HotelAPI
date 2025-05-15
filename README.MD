# Registro de Usuarios en la Aplicación

Este documento explica cómo funciona el **registro de usuarios** en la aplicación, desde el frontend hasta la creación en la base de datos.

---

## Flujo del Registro de Usuario

1. ### Formulario de Registro (Frontend)

   - El usuario completa un formulario con datos como:
     - `username` (nombre de usuario)
     - `password` (contraseña)
     - `role` (rol del usuario, ej. `admin`, `receptionist`)
     - `nombre` (nombre completo)
   
   - El formulario envía los datos mediante una petición **POST** a la API (`/api/auth/register`).

2. ### API Backend

   - El servidor recibe los datos y valida que:
     - El `username` no esté ya registrado.
     - La información esté completa y válida.
   
   - La contraseña se **hashea** usando `bcryptjs` para garantizar seguridad.
   
   - Luego, se crea un nuevo registro en la tabla `usuarios` de la base de datos con los datos recibidos:
     - El campo `password_hash` almacena la contraseña encriptada.
     - Se asigna el rol según lo recibido o un valor por defecto (`receptionist`).
     - Se guarda el nombre del usuario.
   
3. ### Base de Datos

   - La tabla `usuarios` tiene la siguiente estructura relevante para el registro:
   
     ```sql
     CREATE TABLE usuarios (
         id INT AUTO_INCREMENT PRIMARY KEY,
         username VARCHAR(50) NOT NULL UNIQUE,
         password_hash VARCHAR(255) NOT NULL,
         role ENUM('admin', 'receptionist') NOT NULL DEFAULT 'receptionist',
         nombre VARCHAR(100),
         fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         ultimo_login TIMESTAMP NULL
     );
     ```

   - El usuario queda almacenado con su contraseña segura y rol asignado.

4. ### Respuesta al Cliente

   - Si el registro es exitoso, la API responde con un mensaje de éxito o los datos mínimos del usuario creado.
   
   - En caso de error (por ejemplo, usuario duplicado o datos inválidos), se responde con un mensaje de error adecuado.

---

## Seguridad

- La contraseña nunca se almacena en texto plano, siempre se usa hashing con `bcryptjs`.
- La validación de datos evita usuarios duplicados y entradas inválidas.
- El sistema usa variables de entorno para configurar claves y conexiones sensibles.

---

## Archivos Relevantes

- `routes/authRoutes.js` — Define la ruta `/api/auth/register` para registro.
- `models/User.js` — Contiene métodos para crear usuarios en la base de datos.
- `utils/createDefaultUser.js` — Script que crea un usuario administrador por defecto al iniciar la aplicación.
- `.env` — Archivo de configuración con variables como claves, roles, y credenciales.

---

Si tienes alguna duda o quieres extender esta funcionalidad, no dudes en preguntar o contribuir.

---

**¡Gracias por usar esta aplicación!**
