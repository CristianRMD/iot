document.addEventListener("DOMContentLoaded", async () => {
    const movimientos = ["DERECHA", "IZQUIERDA", "ADELANTE", "ATRAS"];
    const cantidadBloques = 5;
    let seleccionados = {};

    // 📌 Lista de mensajes únicos para cada movimiento
    const mensajes = {
        DERECHA: ["Giro rápido", "Desviación leve", "Movimiento largo", "Curva cerrada", "Desplazamiento brusco"],
        IZQUIERDA: ["Giro suave", "Corrección menor", "Esquiva", "Curva controlada", "Frenado lateral"],
        ADELANTE: ["Paso 1", "Marcha controlada", "Avance sostenido", "Aceleración media", "Sprint máximo"],
        ATRAS: ["Retroceso seguro", "Deslizamiento", "Corrección atrás", "Paso de emergencia", "Reversa total"]
    };

    // 📌 Cargar la selección previa desde la BD
    try {
        const respuesta = await fetch("/api/seleccion");
        const datos = await respuesta.json();
        datos.forEach(d => {
            seleccionados[d.Movimiento] = { index: d.indexSeleccionado, mensaje: d.mensaje };
        });
    } catch (error) {
        console.error("Error al cargar la selección previa:", error);
    }

    // 📌 Generar los bloques para cada movimiento
    movimientos.forEach(movimiento => {
        const contenedor = document.getElementById(movimiento);
        for (let i = 0; i < cantidadBloques; i++) {
            const bloque = document.createElement("div");
            bloque.classList.add("bloque");
            bloque.textContent = mensajes[movimiento][i];
            bloque.dataset.movimiento = movimiento;
            bloque.dataset.index = i;

            // 📌 Marcar como seleccionado si está en la BD
            if (seleccionados[movimiento] && seleccionados[movimiento].index === i) {
                bloque.classList.add("seleccionado");
            }

            // 📌 Evento de selección
            bloque.addEventListener("click", () => {
                document.querySelectorAll(`.bloque[data-movimiento="${movimiento}"]`).forEach(b => 
                    b.classList.remove("seleccionado")
                );
                bloque.classList.add("seleccionado");
                seleccionados[movimiento] = { index: i, mensaje: mensajes[movimiento][i] };
            });

            contenedor.appendChild(bloque);
        }
    });

    // 📌 Guardar selección en la BD
    document.getElementById("guardar").addEventListener("click", async () => {
        const seleccionArray = Object.entries(seleccionados).map(([Movimiento, { index, mensaje }]) => ({
            Movimiento,
            indexSeleccionado: index,
            mensaje,
        }));

        try {
            const respuesta = await fetch("/api/guardar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seleccionados: seleccionArray }),
            });
            const resultado = await respuesta.json();
            alert(resultado.message);
        } catch (error) {
            console.error("Error al guardar selección:", error);
        }
    });
});
