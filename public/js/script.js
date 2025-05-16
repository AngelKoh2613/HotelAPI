document.addEventListener('DOMContentLoaded', function() {
  // Variables globales
  const API_BASE_URL = '/api';
  let currentRoomId = null;
  let guestImageBase64 = null;

  // Elementos del DOM
  const roomsGrid = document.getElementById('roomsGrid');
  const roomDetails = document.getElementById('roomDetails');
  const detailsPlaceholder = document.querySelector('.details-placeholder');
  const detailsContent = document.getElementById('detailsContent');
  const closeDetails = document.getElementById('closeDetails');
  const addRoomBtn = document.getElementById('addRoomBtn');
  const roomModal = document.getElementById('roomModal');
  const nightsModal = document.getElementById('nightsModal');
  const guestModal = document.getElementById('guestModal');
  const closeModals = document.querySelectorAll('.close-modal');
  const roomForm = document.getElementById('roomForm');
  const guestForm = document.getElementById('guestForm');
  const searchInput = document.getElementById('searchInput');
  const addPaymentBtn = document.getElementById('addPaymentBtn');
  const paymentAmount = document.getElementById('paymentAmount');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const occupyBtn = document.getElementById('occupyBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const editBtn = document.getElementById('editBtn');
  const nightsInput = document.getElementById('nightsInput');
  const confirmOccupyBtn = document.getElementById('confirmOccupyBtn');
  const addGuestBtn = document.getElementById('addGuestBtn');
  const addProductBtn = document.getElementById('addProductBtn');
  const productName = document.getElementById('productName');
  const productPrice = document.getElementById('productPrice');
  const addExtraBtn = document.getElementById('addExtraBtn');
  const extraDescription = document.getElementById('extraDescription');
  const extraAmount = document.getElementById('extraAmount');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const userAvatar = document.getElementById('userAvatar');
  
  // Inicializar la aplicación
  init();

  function init() {
      checkAuth();
      fetchRooms();
      setupEventListeners();
      setupImagePreview();
      loadUserData();
  }

  // Verificar autenticación
  async function checkAuth() {
      try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
              credentials: 'include'
          });
          
          if (!response.ok) {
              window.location.href = 'login.html';
              return;
          }
          
          const userData = await response.json();
          usernameDisplay.textContent = userData.username;
          userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`;
      } catch (error) {
          window.location.href = 'login.html';
      }
  }

  // Cargar datos del usuario
  async function loadUserData() {
      try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
              credentials: 'include'
          });
          
          if (response.ok) {
              const userData = await response.json();
              usernameDisplay.textContent = userData.username;
              userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`;
          }
      } catch (error) {
          console.error('Error loading user data:', error);
      }
  }

  // Configurar event listeners
  function setupEventListeners() {
      closeDetails.addEventListener('click', closeRoomDetails);
      addRoomBtn.addEventListener('click', () => showRoomModal(false));
      
      closeModals.forEach(btn => {
          btn.addEventListener('click', () => {
              roomModal.style.display = 'none';
              nightsModal.style.display = 'none';
              guestModal.style.display = 'none';
          });
      });
      
      roomForm.addEventListener('submit', saveRoom);
      guestForm.addEventListener('submit', saveGuest);
      searchInput.addEventListener('input', filterRooms);
      deleteBtn.addEventListener('click', deleteRoom);
      editBtn.addEventListener('click', () => {
          if (currentRoomId) showRoomModal(true, currentRoomId);
      });
      addPaymentBtn.addEventListener('click', addPayment);
      checkOutBtn.addEventListener('click', checkOutRoom);
      occupyBtn.addEventListener('click', showNightsModal);
      confirmOccupyBtn.addEventListener('click', occupyRoom);
      addGuestBtn.addEventListener('click', showGuestModal);
      addProductBtn.addEventListener('click', addProduct);
      addExtraBtn.addEventListener('click', addExtra);
      logoutBtn.addEventListener('click', logoutUser);
      
      window.addEventListener('click', (event) => {
          if (event.target === roomModal || event.target === nightsModal || event.target === guestModal) {
              roomModal.style.display = 'none';
              nightsModal.style.display = 'none';
              guestModal.style.display = 'none';
          }
      });
  }

  // Configurar vista previa de imagen
  function setupImagePreview() {
      const guestImageInput = document.getElementById('guestImageInput');
      const imagePreview = document.getElementById('imagePreview');
      const imagePreviewContainer = document.getElementById('imagePreviewContainer');
      
      guestImageInput.addEventListener('change', function(event) {
          const file = event.target.files[0];
          if (file) {
              const reader = new FileReader();
              
              reader.onload = function(e) {
                  imagePreview.src = e.target.result;
                  imagePreviewContainer.style.display = 'block';
                  guestImageBase64 = e.target.result;
              }
              
              reader.readAsDataURL(file);
          }
      });
  }

  // Obtener habitaciones desde la API
  async function fetchRooms() {
      try {
          roomsGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando habitaciones...</div>';
          
          const response = await fetch(`${API_BASE_URL}/rooms`, {
              credentials: 'include'
          });
          
          if (!response.ok) throw new Error('Error al cargar las habitaciones');
          
          const rooms = await response.json();
          renderRooms(rooms);
      } catch (error) {
          showNotification(error.message, 'error');
          roomsGrid.innerHTML = '<p class="error-msg">Error al cargar las habitaciones</p>';
      }
  }

  // Renderizar habitaciones
  function renderRooms(rooms = []) {
    roomsGrid.innerHTML = '';
    
    if (rooms.length === 0) {
        roomsGrid.innerHTML = '<p class="no-rooms">No se encontraron cuartos</p>';
        return;
    }
    
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.dataset.id = room.id; // <--- Cambia _id por id

        let statusClass = '';
        if (room.status === 'Disponible') statusClass = 'status-available';
        else if (room.status === 'Ocupado') statusClass = 'status-occupied';
        else if (room.status === 'Mantenimiento') statusClass = 'status-maintenance';
        
        roomCard.innerHTML = `
            <div class="room-image" style="background-image: url('${room.image}')">
                <span class="room-badge ${statusClass}">${room.status}</span>
            </div>
            <div class="room-info">
                <h3>Cuarto ${room.number}</h3>
                <p><i class="fas fa-tag"></i> ${room.type}</p>
                <p><i class="fas fa-user-friends"></i> ${room.capacity} persona${room.capacity > 1 ? 's' : ''}</p>
                <p class="room-price"><i class="fas fa-money-bill-wave"></i> $${(room.price ?? 0).toFixed(2)}/noche</p>
            </div>
        `;
        
        roomCard.addEventListener('click', () => showRoomDetails(Number(room.id))); // <--- Cambia _id por id
        roomsGrid.appendChild(roomCard);
    });
}

  // Filtrar habitaciones
  function filterRooms() {
      const searchTerm = searchInput.value.toLowerCase();
      const roomCards = document.querySelectorAll('.room-card');
      
      roomCards.forEach(card => {
          const roomText = card.textContent.toLowerCase();
          card.style.display = roomText.includes(searchTerm) ? 'flex' : 'none';
      });
  }

  // Mostrar detalles de habitación
  async function showRoomDetails(roomId) {
      if (!isValidRoomId(roomId)) {
        showNotification('ID de cuarto inválido', 'error');
        return;
      }
      try {
          const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
              credentials: 'include'
          });
          
          if (!response.ok) throw new Error('Error al cargar los detalles de la habitación');
          
          const room = await response.json();
          currentRoomId = Number(room.id);
          detailsPlaceholder.style.display = 'none';
          detailsContent.style.display = 'flex';
          
          document.getElementById('detailTitle').textContent = `Cuarto ${room.number}`;
          document.getElementById('detailNumber').textContent = room.number;
          document.getElementById('detailType').textContent = room.type;
          document.getElementById('detailCapacity').textContent = `${room.capacity} persona${room.capacity > 1 ? 's' : ''}`;
          document.getElementById('detailPrice').textContent = `$${room.price.toFixed(2)}/noche`;
          
          const statusElement = document.getElementById('detailStatus');
          statusElement.textContent = room.status;
          statusElement.className = 'detail-value';
          
          if (room.status === 'Disponible') {
              statusElement.classList.add('status-available');
          } else if (room.status === 'Ocupado') {
              statusElement.classList.add('status-occupied');
          } else if (room.status === 'Mantenimiento') {
              statusElement.classList.add('status-maintenance');
          }
          
          const servicesList = document.getElementById('detailServices');
          servicesList.innerHTML = '';
          room.services.forEach(service => {
              const li = document.createElement('li');
              li.textContent = service;
              servicesList.appendChild(li);
          });
          
          updateGuestInfo(room);
          updateAccountInfo(room);
          updateProductsList(room);
          updateExtrasList(room);
          updatePaymentsList(room);
          updateActionButtons(room.status);
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Actualizar información del huésped
  function updateGuestInfo(room) {
      const guestPlaceholder = document.getElementById('guestPlaceholder');
      const guestContent = document.getElementById('guestContent');
      
      if (room.guest) {
          guestPlaceholder.style.display = 'none';
          guestContent.style.display = 'block';
          const guestImage = document.getElementById('guestImage');
          guestImage.src = room.guest.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.guest.name)}&background=random`;
          guestImage.onclick = function() {
              showFullImage(guestImage.src);
          };
          guestImage.style.cursor = 'pointer';
          document.getElementById('guestName').textContent = room.guest.name;
          document.getElementById('guestId').textContent = room.guest.idNumber;
      } else {
          guestPlaceholder.style.display = 'flex';
          guestContent.style.display = 'none';
      }
  }

  // Mostrar imagen en pantalla completa
  function showFullImage(imageSrc) {
      const modal = document.createElement('div');
      modal.className = 'image-modal';
      
      const img = document.createElement('img');
      img.src = imageSrc;
      
      modal.appendChild(img);
      document.body.appendChild(modal);
      
      modal.onclick = function() {
          document.body.removeChild(modal);
      };
  }

  // Actualizar lista de productos
  function updateProductsList(room) {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';
    
    room.products.forEach((product, index) => {
        const price = Number(product.price) || 0;
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${product.name}</span>
            <span>$${price.toFixed(2)}</span>
            <button class="btn btn-icon btn-sm remove-product" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        productsList.appendChild(li);
    });
    
    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.remove-product').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeProduct(index);
        });
    });
}

  // Actualizar lista de extras
  function updateExtrasList(room) {
    const extrasList = document.getElementById('extrasList');
    extrasList.innerHTML = '';
    
    room.extras.forEach((extra, index) => {
        const amount = Number(extra.amount) || 0;
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${extra.description}</span>
            <span>$${amount.toFixed(2)}</span>
            <button class="btn btn-icon btn-sm remove-extra" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        extrasList.appendChild(li);
    });
    
    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.remove-extra').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeExtra(index);
        });
    });
  }

  // Actualizar lista de pagos
  function updatePaymentsList(room) {
      const paymentsList = document.getElementById('paymentsList');
      paymentsList.innerHTML = '';
      
      room.payments.forEach((payment, index) => {
          const amount = Number(payment.amount) || 0;
          const li = document.createElement('li');
          li.innerHTML = `
              <span>${new Date(payment.date).toLocaleDateString()}</span>
              <span>$${amount.toFixed(2)}</span>
              <button class="btn btn-icon btn-sm remove-payment" data-index="${index}">
                  <i class="fas fa-times"></i>
              </button>
          `;
          paymentsList.appendChild(li);
      });
      
      // Agregar event listeners a los botones de eliminar
      document.querySelectorAll('.remove-payment').forEach(btn => {
          btn.addEventListener('click', function() {
              const index = parseInt(this.dataset.index);
              removePayment(index);
          });
      });
  }

  // Eliminar producto
  async function removeProduct(index) {
      try {
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/products`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ index }),
              credentials: 'include'
          });
          
          if (!response.ok) throw new Error('Error al eliminar el producto');
          
          const room = await response.json();
          updateProductsList(room);
          updateAccountInfo(room);
          showNotification('Producto eliminado');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Eliminar extra
  async function removeExtra(index) {
      try {
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/extras`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ index }),
              credentials: 'include'
          });
          
          if (!response.ok) throw new Error('Error al eliminar el cargo extra');
          
          const room = await response.json();
          updateExtrasList(room);
          updateAccountInfo(room);
          showNotification('Cargo extra eliminado');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Eliminar pago
  async function removePayment(index) {
      try {
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/payments`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ index }),
              credentials: 'include'
          });
          
          if (!response.ok) throw new Error('Error al eliminar el pago');
          
          const room = await response.json();
          updatePaymentsList(room);
          updateAccountInfo(room);
          showNotification('Pago eliminado');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Actualizar botones de acción según estado
  function updateActionButtons(status) {
      checkOutBtn.style.display = 'none';
      occupyBtn.style.display = 'none';
      
      if (status === 'Ocupado') {
          checkOutBtn.style.display = 'inline-flex';
      } else if (status === 'Disponible') {
          occupyBtn.style.display = 'inline-flex';
      }
  }

  // Mostrar modal de noches
  function showNightsModal() {
      if (!currentRoomId) return;
      nightsInput.value = 1; // Valor por defecto
      nightsModal.style.display = 'block';
  }

  // Mostrar modal de huésped
  function showGuestModal() {
      if (!currentRoomId) return;
      guestModal.style.display = 'block';
  }

  // Ocupar habitación
  async function occupyRoom() {
      if (!isValidRoomId(currentRoomId)) {
          showNotification('ID de cuarto inválido', 'error');
          return;
      }
      try {
          const nights = parseInt(nightsInput.value);
          if (isNaN(nights) || nights < 1) {
              throw new Error('Ingrese un número válido de noches');
          }

          // No pedir guestId, solo enviar nights
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/occupy`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ nights }), // Solo nights
              credentials: 'include'
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al ocupar la habitación');
          }

          const room = await response.json();
          nightsModal.style.display = 'none';
          fetchRooms();
          showRoomDetails(currentRoomId);
          showNotification(`Cuarto ocupado por ${nights} noche(s)`);
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Desocupar habitación
  async function checkOutRoom() {
    if (!isValidRoomId(currentRoomId)) {
        showNotification('ID de cuarto inválido', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/checkout`, {
            method: 'PUT',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            showNotification(errorData.message || 'Error al desocupar la habitación', 'error');
            return; // <-- Detiene la ejecución si hay error
        }

        const room = await response.json();
        fetchRooms();
        showRoomDetails(currentRoomId);
        showNotification('Habitación desocupada correctamente');
    } catch (error) {
        showNotification(error.message, 'error');
    }
  }

  // Actualizar información de cuenta
  function updateAccountInfo(room) {
      const accountSection = document.getElementById('accountSection');
      const nightsElement = document.getElementById('detailNights');
      const stayTotalElement = document.getElementById('detailStayTotal');
      const productsElement = document.getElementById('detailProducts');
      const extrasElement = document.getElementById('detailExtras');
      const totalElement = document.getElementById('detailTotal');
      const paymentsElement = document.getElementById('detailPayments');
      const balanceElement = document.getElementById('detailBalance');
      
      if (room.status === 'Ocupado') {
          accountSection.style.display = 'block';
          
          const stayTotal = Number(room.nights) * Number(room.price);
          const productsTotal = Array.isArray(room.products)
              ? room.products.reduce((sum, product) => sum + (Number(product.price) || 0), 0)
              : 0;
          const extrasTotal = Array.isArray(room.extras)
              ? room.extras.reduce((sum, extra) => sum + (Number(extra.amount) || 0), 0)
              : 0;
          const paymentsTotal = Array.isArray(room.payments)
              ? room.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
              : 0;
          const total = stayTotal + productsTotal + extrasTotal;
          const balance = Math.max(0, total - paymentsTotal);
          
          nightsElement.textContent = room.nights;
          stayTotalElement.textContent = `$${stayTotal.toFixed(2)}`;
          productsElement.textContent = `$${productsTotal.toFixed(2)}`;
          extrasElement.textContent = `$${extrasTotal.toFixed(2)}`;
          totalElement.textContent = `$${total.toFixed(2)}`;
          paymentsElement.textContent = `$${paymentsTotal.toFixed(2)}`;
          balanceElement.textContent = `$${balance.toFixed(2)}`;
          
          if (balance > 0) {
              balanceElement.style.color = 'var(--danger)';
              balanceElement.style.fontWeight = 'bold';
          } else {
              balanceElement.style.color = 'var(--success)';
          }
      } else {
          accountSection.style.display = 'none';
      }
  }

  // Agregar pago
  async function addPayment() {
      try {
          const amount = parseFloat(paymentAmount.value);
          if (isNaN(amount)) {
              throw new Error('Ingrese un monto válido');
          }
          
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/payments`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ amount }),
              credentials: 'include'
          });
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al registrar el pago');
          }
          
          const room = await response.json();
          paymentAmount.value = '';
          updateAccountInfo(room);
          updatePaymentsList(room);
          showNotification(`Abono de $${amount.toFixed(2)} registrado`);
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Agregar producto
  async function addProduct() {
      try {
          const name = productName.value.trim();
          const price = parseFloat(productPrice.value);
          
          if (!name || isNaN(price) || price <= 0) {
              throw new Error('Ingrese un nombre y precio válido');
          }
          
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/products`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name, price }),
              credentials: 'include'
          });
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al agregar el producto');
          }
          
          const room = await response.json();
          productName.value = '';
          productPrice.value = '';
          updateProductsList(room);
          updateAccountInfo(room);
          showNotification('Producto agregado');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Agregar extra
  async function addExtra() {
      try {
          const description = extraDescription.value.trim();
          const amount = parseFloat(extraAmount.value);
          
          if (!description || isNaN(amount) || amount <= 0) {
              throw new Error('Ingrese una descripción y monto válido');
          }
          
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}/extras`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ description, amount }),
              credentials: 'include'
          });
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al agregar el cargo extra');
          }
          
          const room = await response.json();
          extraDescription.value = '';
          extraAmount.value = '';
          updateExtrasList(room);
          updateAccountInfo(room);
          showNotification('Cargo extra agregado');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Guardar huésped
  async function saveGuest(event) {
      event.preventDefault();
      
      try {
          const name = document.getElementById('guestNameInput').value.trim();
          const idNumber = document.getElementById('guestIdInput').value.trim();
          
          if (!name || !idNumber) {
              throw new Error('Complete todos los campos requeridos');
          }
          
          // Primero creamos el huésped
          const guestResponse = await fetch(`${API_BASE_URL}/guests`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                  name, 
                  idNumber,
                  image: guestImageBase64 
              }),
              credentials: 'include'
          });
          
          if (!guestResponse.ok) {
              const errorData = await guestResponse.json();
              throw new Error(errorData.message || 'Error al registrar el huésped');
          }
          
          const guest = await guestResponse.json();
          
          // Luego asignamos el huésped a la habitación
          const roomResponse = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ guest: guest._id }),
              credentials: 'include'
          });
          
          if (!roomResponse.ok) {
              const errorData = await roomResponse.json();
              throw new Error(errorData.message || 'Error al asignar el huésped a la habitación');
          }
          
          const room = await roomResponse.json();
          
          // Resetear el formulario
          document.getElementById('guestImageInput').value = '';
          document.getElementById('imagePreviewContainer').style.display = 'none';
          guestImageBase64 = null;
          guestForm.reset();
          
          guestModal.style.display = 'none';
          updateGuestInfo(room);
          showNotification('Huésped registrado correctamente');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Mostrar modal de habitación
  async function showRoomModal(edit = false, roomId = null) {
      isEditing = edit;
      const modalTitle = document.getElementById('modalTitle');
      
      if (edit && roomId) {
          modalTitle.textContent = 'Editar Cuarto';
          
          try {
              const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
                  credentials: 'include'
              });
              
              if (!response.ok) throw new Error('Error al cargar los datos de la habitación');
              
              const room = await response.json();
              
              document.getElementById('roomId').value = room.id;
              document.getElementById('roomNumber').value = room.number;
              document.getElementById('roomType').value = room.type;
              document.getElementById('roomCapacity').value = room.capacity;
              document.getElementById('roomPrice').value = room.price;
              document.getElementById('roomStatus').value = room.status;
              
              document.querySelectorAll('input[name="services"]').forEach(checkbox => {
                  checkbox.checked = room.services.includes(checkbox.value);
              });
          } catch (error) {
              showNotification(error.message, 'error');
              return;
          }
      } else {
          modalTitle.textContent = 'Agregar Nuevo Cuarto';
          roomForm.reset();
          document.getElementById('roomId').value = '';
      }
      
      roomModal.style.display = 'block';
  }

  // Guardar habitación
  async function saveRoom(event) {
      event.preventDefault();
      
      try {
          const id = document.getElementById('roomId').value;
          const number = document.getElementById('roomNumber').value;
          const type = document.getElementById('roomType').value;
          const capacity = parseInt(document.getElementById('roomCapacity').value);
          const price = parseFloat(document.getElementById('roomPrice').value);
          const status = document.getElementById('roomStatus').value;
          const services = Array.from(document.querySelectorAll('input[name="services"]:checked'))
                              .map(cb => cb.value);
          
          const roomData = {
              number,
              type,
              capacity,
              price,
              services,
              status
          };
          
          let response;
          if (id) {
              // Actualizar habitación existente
              response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
                  method: 'PUT',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(roomData),
                  credentials: 'include'
              });
          } else {
              // Crear nueva habitación
              response = await fetch(`${API_BASE_URL}/rooms`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(roomData),
                  credentials: 'include'
              });
          }
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al guardar la habitación');
          }
          
          const room = await response.json();
          roomModal.style.display = 'none';
          fetchRooms();
          
          if (id === currentRoomId) {
              showRoomDetails(currentRoomId);
          }
          
          showNotification(`Habitación ${id ? 'actualizada' : 'agregada'} correctamente`);
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Eliminar habitación
  async function deleteRoom() {
    if (!isValidRoomId(currentRoomId)) {
        showNotification('ID de cuarto inválido', 'error');
        return;
    }
      if (!currentRoomId) return;
      
      if (!confirm('¿Está seguro de eliminar este cuarto? Esta acción no se puede deshacer.')) {
          return;
      }
      
      try {
          const response = await fetch(`${API_BASE_URL}/rooms/${currentRoomId}`, {
              method: 'DELETE',
              credentials: 'include'
          });
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al eliminar la habitación');
          }
          
          fetchRooms();
          closeRoomDetails();
          showNotification('Cuarto eliminado correctamente');
      } catch (error) {
          showNotification(error.message, 'error');
      }
  }

  // Cerrar detalles de habitación
  function closeRoomDetails() {
      detailsPlaceholder.style.display = 'flex';
      detailsContent.style.display = 'none';
      currentRoomId = null;
  }

  // Cerrar sesión
  async function logoutUser() {
      try {
          const response = await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              credentials: 'include'
          });
          
          window.location.href = 'login.html';
      } catch (error) {
          console.error('Error al cerrar sesión:', error);
          window.location.href = 'login.html';
      }
  }

  // Mostrar notificación
  function showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
          <div class="notification-content">
              <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
              <span>${message}</span>
          </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
          notification.classList.add('show');
      }, 10);
      
      setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
      }, 3000);
  }

  // Validar ID de cuarto
  function validateRoomId() {
      if (!currentRoomId || isNaN(Number(currentRoomId))) {
          showNotification('ID de cuarto inválido', 'error');
          return;
      }
  }

  function isValidRoomId(id) {
    const num = Number(id);
    return Number.isInteger(num) && num > 0;
}
});