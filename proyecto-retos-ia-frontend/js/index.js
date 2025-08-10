document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5000';
    const listaRetos = document.getElementById('lista-retos');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

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
                        <a href="actualizar.html?id=${reto.id}" class="btn-editar">Editar</a>
                        <button class="btn-eliminar">Eliminar</button>
                    </div>
                `;
                listaRetos.appendChild(retoCard);
            });
        } catch (error) {
            console.error('Error:', error);
            listaRetos.innerHTML = '<p>Hubo un error al cargar los retos.</p>';
        }
    };

    listaRetos.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-eliminar')) {
            const retoCard = e.target.closest('.reto-card');
            const idReto = retoCard.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este reto?')) {
                try {
                    const response = await fetch(`${API_URL}/retos/${idReto}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Error al eliminar');
                    cargarRetos();
                } catch (error) { console.error('Error:', error); }
            }
        }
    });

    listaRetos.addEventListener('change', async (e) => {
        if (e.target.classList.contains('select-estado')) {
            const retoCard = e.target.closest('.reto-card');
            const idReto = retoCard.dataset.id;
            const nuevoEstado = e.target.value;
            try {
                await fetch(`${API_URL}/retos/${idReto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: nuevoEstado }),
                });
            } catch (error) { console.error('Error:', error); }
        }
    });

    btnFiltrar.addEventListener('click', () => {
        const categoria = document.getElementById('filtro-categoria').value;
        const dificultad = document.getElementById('filtro-dificultad').value;
        const params = new URLSearchParams();
        if (categoria) params.append('categoria', categoria);
        if (dificultad) params.append('dificultad', dificultad);
        cargarRetos(`${API_URL}/retos/filtrar?${params.toString()}`);
    });

    btnLimpiarFiltros.addEventListener('click', () => {
        document.getElementById('filtro-categoria').value = '';
        document.getElementById('filtro-dificultad').value = '';
        cargarRetos();
    });

    cargarRetos();
});