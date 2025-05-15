require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createDefaultUser() {
  try {
    console.log("🧪 Verificando .env:");
    console.log("🔑 Username:", process.env.DEFAULT_USER_USERNAME);
    console.log("🔒 Password:", process.env.DEFAULT_USER_PASSWORD);
    
    if (!process.env.DEFAULT_USER_PASSWORD) {
      throw new Error("❌ DEFAULT_USER_PASSWORD no está definido. Verifica el archivo .env");
    }

    const existingUser = await User.findByUsername(process.env.DEFAULT_USER_USERNAME);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_USER_PASSWORD, 10);
      const newUser = await User.create({
        username: process.env.DEFAULT_USER_USERNAME,
        password: hashedPassword, // <-- Aquí está el cambio
        role: process.env.DEFAULT_USER_ROLE || 'receptionist',
        nombre: process.env.DEFAULT_USER_NOMBRE || 'Admin'
      });

      console.log('✅ Usuario por defecto creado:', newUser.username);
    } else {
      console.log('ℹ️ Usuario por defecto ya existe:', existingUser.username);
    }
  } catch (err) {
    console.error('❌ Error al crear usuario por defecto:', err.message);
  }
}

module.exports = createDefaultUser;
