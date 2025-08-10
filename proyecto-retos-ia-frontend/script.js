document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5000';

    const formCrearReto = document.getElementById('form-crear-reto');
    const listaRetos = document.getElementById('lista-retos');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

    // --- FUNCIÓN PARA CARGAR Y MOSTRAR LOS RETOS ---
    const cargarRetos = async (url = `${API_URL}/retos`) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar los retos');
            const retos = await response.json();

            listaRetos.innerHTML = '';

            if (retos.length === 0) {
                listaRetos.innerHTML = '<p>No hay retos para mostrar.</p>';
                return;
            }

            retos.forEach(reto => {
                const retoCard = document.createElement('div');
                retoCard.classList.add('reto-card');
                retoCard.dataset.id = reto.id;

                // CORRECCIÓN: Usamos reto.dificultad en lugar de reto.nivel_dificultad
                retoCard.innerHTML = `
                    <h3>${reto.titulo}</h3>
                    <div class="reto-meta">
                        <span class="categoria">${reto.categoria}</span>
                        <span class="dificultad-${reto.dificultad}">${reto.dificultad}</span>
                    </div>
                    <p>${reto.descripcion}</p>
                    <div class="reto-estado">
                        <label for="estado-${reto.id}">Estado: </label>
                        <select id="estado-${reto.id}" class="select-estado">
                            <option value="pendiente" ${reto.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="en proceso" ${reto.estado === 'en proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="completado" ${reto.estado === 'completado' ? 'selected' : ''}>Completado</option>
                        </select>
                    </div>
                    <div class="reto-acciones">
                        <button class="btn-eliminar">Eliminar</button>
                    </div>
                `;
                listaRetos.appendChild(retoCard);
            });

        } catch (error) {
            console.error('Error:', error);
            listaRetos.innerHTML = '<p>Hubo un error al cargar los retos. Intenta de nuevo más tarde.</p>';
        }
    };

    // --- EVENT LISTENERS ---

    // 1. Crear un nuevo reto
    formCrearReto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoReto = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            // CORRECCIÓN: Usamos el id 'dificultad' y la clave 'dificultad'
            dificultad: document.getElementById('dificultad').value, 
        };

        try {
            const response = await fetch(`${API_URL}/retos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoReto),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al crear el reto');
            }

            formCrearReto.reset();
            cargarRetos();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message); // Muestra el error al usuario
        }
    });

    // El resto del archivo (eliminar, actualizar estado, filtrar) no necesita cambios
    // ... (pega aquí el resto de tu código de script.js) ...
    // 2. Delegación de eventos para botones de eliminar y cambiar estado
    listaRetos.addEventListener('click', async (e) => {
        const retoCard = e.target.closest('.reto-card');
        if (!retoCard) return;
        const idReto = retoCard.dataset.id;

        // Eliminar reto
        if (e.target.classList.contains('btn-eliminar')) {
            if (confirm('¿Estás seguro de que quieres eliminar este reto?')) {
                try {
                    const response = await fetch(`${API_URL}/retos/${idReto}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Error al eliminar el reto');
                    cargarRetos(); // Recargar la lista
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
    });
    
    listaRetos.addEventListener('change', async (e) => {
        const retoCard = e.target.closest('.reto-card');
        if (!retoCard) return;
        const idReto = retoCard.dataset.id;

        // Actualizar estado
        if (e.target.classList.contains('select-estado')) {
            const nuevoEstado = e.target.value;
            try {
                const response = await fetch(`${API_URL}/retos/${idReto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: nuevoEstado }),
                });
                if (!response.ok) throw new Error('Error al actualizar el estado');
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });

    // 3. Filtrar retos
    btnFiltrar.addEventListener('click', () => {
        const categoria = document.getElementById('filtro-categoria').value;
        const dificultad = document.getElementById('filtro-dificultad').value;
        
        const params = new URLSearchParams();
        if (categoria) params.append('categoria', categoria);
        if (dificultad) params.append('dificultad', dificultad);

        const url = `${API_URL}/retos/filtrar?${params.toString()}`;
        cargarRetos(url);
    });

    // 4. Limpiar filtros
    btnLimpiarFiltros.addEventListener('click', () => {
        document.getElementById('filtro-categoria').value = '';
        document.getElementById('filtro-dificultad').value = '';
        cargarRetos();
    });


    // --- Carga Inicial de Retos ---
    cargarRetos();
});