// frontend/main.js
// Usa window.API_BASE definido en index.html
const API_BASE = window.API_BASE || '/api/retos';

// Helper: safeFetch with better error messages and logging
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    // si la respuesta no es OK intentamos leer el cuerpo para más detalle
    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch (e) { body = '<no body>'; }
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${body}`);
    }
    // intenta parsear JSON (una API REST debería devolver JSON)
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (e) {
      // si no es JSON devolvemos el texto crudo
      return text;
    }
  } catch (err) {
    // log completo a consola (útil para debugging)
    console.error('safeFetch error', { url, options, err });
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('retoForm');
  const mensajeEl = document.getElementById('mensaje');
  const listaEl = document.getElementById('listaRetos');

  const f_categoria = document.getElementById('f_categoria');
  const f_dificultad = document.getElementById('f_dificultad');
  const btnFiltrar = document.getElementById('btnFiltrar');
  const btnReset = document.getElementById('btnReset');

  cargarRetos();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeEl.textContent = '';
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const categoria = document.getElementById('categoria').value.trim();
    const dificultad = document.getElementById('dificultad').value;

    try {
      const data = await safeFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, categoria, dificultad })
      });
      mensajeEl.textContent = '✅ Reto creado';
      form.reset();
      cargarRetos();
    } catch (err) {
      mensajeEl.textContent = '❌ ' + (err.message || err);
    }
  });

  btnFiltrar.addEventListener('click', () => {
    cargarRetos(f_categoria.value.trim(), f_dificultad.value);
  });
  btnReset.addEventListener('click', () => {
    f_categoria.value = '';
    f_dificultad.value = '';
    cargarRetos();
  });

  async function cargarRetos(categoria = '', dificultad = '') {
    listaEl.innerHTML = 'Cargando...';
    let url = API_BASE;
    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria);
    if (dificultad) params.append('dificultad', dificultad);
    if ([...params].length) url += '?' + params.toString();

    try {
      const data = await safeFetch(url);
      if (!data || data.length === 0) {
        listaEl.innerHTML = '<p>No hay retos.</p>';
        return;
      }
      listaEl.innerHTML = '';
      data.forEach(renderReto);
    } catch (err) {
      listaEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }
  }

  function renderReto(reto) {
    const div = document.createElement('div');
    div.className = 'reto';
    div.innerHTML = `
      <h3>${escapeHtml(reto.titulo)}</h3>
      <p>${escapeHtml(reto.descripcion)}</p>
      <p><strong>Categoria:</strong> ${escapeHtml(reto.categoria)} |
         <strong>Dificultad:</strong> ${escapeHtml(reto.dificultad)} |
         <strong>Estado:</strong> <span class="estado" data-id="${reto.id}">${escapeHtml(reto.estado)}</span>
      </p>
      <p class="acciones">
        <select class="cambiar-estado" data-id="${reto.id}">
          <option value="pendiente">pendiente</option>
          <option value="en proceso">en proceso</option>
          <option value="completado">completado</option>
        </select>
        <button class="btn-update" data-id="${reto.id}">Actualizar estado</button>
        <button class="btn-delete" data-id="${reto.id}">Eliminar</button>
      </p>
    `;
    const sel = div.querySelector('.cambiar-estado');
    sel.value = reto.estado;

    div.querySelector('.btn-update').addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const newEstado = div.querySelector('.cambiar-estado').value;
      try {
        const j = await safeFetch(`${API_BASE}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: newEstado })
        });
        div.querySelector('.estado').textContent = j.estado;
      } catch (err) {
        alert('Error: ' + (err.message || err));
      }
    });

    div.querySelector('.btn-delete').addEventListener('click', async (e) => {
      if (!confirm('¿Eliminar este reto?')) return;
      const id = e.target.dataset.id;
      try {
        await safeFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        div.remove();
      } catch (err) {
        alert('Error: ' + (err.message || err));
      }
    });

    listaEl.appendChild(div);
  }
  async function listarRetos() {
  const res = await fetch(window.API_BASE);
  const data = await res.json();

  const categoria = document.getElementById("f_categoria").value.toLowerCase();
  const dificultad = document.getElementById("f_dificultad").value.toLowerCase();

  let filtrados = data;

  if (categoria) {
    filtrados = filtrados.filter(r => r.categoria.toLowerCase().includes(categoria));
  }

  if (dificultad) {
    filtrados = filtrados.filter(r => r.dificultad.toLowerCase() === dificultad);
  }

  renderRetos(filtrados);
}

function renderRetos(retos) {
  const lista = document.getElementById("listaRetos");
  lista.innerHTML = "";

  if (retos.length === 0) {
    lista.innerHTML = `<p class="mensaje">No se encontraron retos</p>`;
    return;
  }

  retos.forEach(r => {
    const div = document.createElement("div");
    div.className = "reto";
    div.innerHTML = `
      <h3>${r.titulo}</h3>
      <p>${r.descripcion}</p>
      <p><strong>Categoría:</strong> ${r.categoria}</p>
      <p><strong>Dificultad:</strong> ${r.dificultad}</p>
      <div class="acciones">
        <a href="editar.html?id=${r.id}" class="btn-secondary">Editar</a>
        <button onclick="eliminarReto(${r.id})" class="btn-secondary">Eliminar</button>
      </div>
    `;
    lista.appendChild(div);
  });
}

async function eliminarReto(id) {
  if (!confirm("¿Eliminar este reto?")) return;
  const res = await fetch(`${window.API_BASE}/${id}`, { method: "DELETE" });
  if (res.ok) listarRetos();
}

document.getElementById("btnFiltrar").addEventListener("click", listarRetos);
document.getElementById("btnReset").addEventListener("click", () => {
  document.getElementById("f_categoria").value = "";
  document.getElementById("f_dificultad").value = "";
  listarRetos();
});

listarRetos();

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
