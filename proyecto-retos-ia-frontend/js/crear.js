document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5000';
    const formCrearReto = document.getElementById('form-crear-reto');

    formCrearReto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoReto = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
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

            alert('¡Reto creado exitosamente!');
            window.location.href = 'index.html'; // Redirigir a la página principal

        } catch (error) {
            console.error('Error:', error);
            alert(`Error al crear el reto: ${error.message}`);
        }
    });
});