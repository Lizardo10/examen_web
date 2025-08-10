document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://127.0.0.1:5000';
    const formActualizarReto = document.getElementById('form-actualizar-reto');
    
    // Obtener el ID del reto desde la URL (ej: actualizar.html?id=5)
    const params = new URLSearchParams(window.location.search);
    const retoId = params.get('id');

    if (!retoId) {
        alert('No se especificó un ID de reto.');
        window.location.href = 'index.html';
        return;
    }

    // --- Cargar los datos del reto en el formulario ---
    try {
        const response = await fetch(`${API_URL}/retos`);
        const retos = await response.json();
        const reto = retos.find(r => r.id == retoId);

        if (!reto) {
            throw new Error('Reto no encontrado');
        }

        // Poblar el formulario con los datos del reto
        document.getElementById('reto-id').value = reto.id;
        document.getElementById('titulo').value = reto.titulo;
        document.getElementById('descripcion').value = reto.descripcion;
        document.getElementById('categoria').value = reto.categoria;
        document.getElementById('dificultad').value = reto.dificultad;
        document.getElementById('estado').value = reto.estado;

    } catch (error) {
        console.error('Error:', error);
        alert(`Error al cargar el reto: ${error.message}`);
        window.location.href = 'index.html';
    }

    // --- Enviar el formulario actualizado ---
    formActualizarReto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const datosActualizados = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            dificultad: document.getElementById('dificultad').value,
            estado: document.getElementById('estado').value,
        };

        try {
            const response = await fetch(`${API_URL}/retos/${retoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosActualizados),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al actualizar el reto');
            }

            alert('¡Reto actualizado exitosamente!');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Error:', error);
            alert(`Error al actualizar: ${error.message}`);
        }
    });
});