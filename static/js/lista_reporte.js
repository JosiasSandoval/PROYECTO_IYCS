// === FUNCIONES SIMULADAS PARA GENERAR REPORTES ===
function generarReporteReservas() {
    mostrarReporte("Reporte de Reservas generado");
}

function generarReporteActosLiturgicos() {
    mostrarReporte("Reporte de Actos Litúrgicos generado");
}

function generarReporteUsuariosFrecuentes() {
    mostrarReporte("Reporte de Usuarios Frecuentes generado");
}

function generarReporteRequisitos() {
    mostrarReporte("Reporte de Requisitos Entregados/Incompletos generado");
}

function generarReportePagos() {
    mostrarReporte("Reporte de Pagos generado");
}

// Función para descargar PDF (simulada)
function descargarPDF(tipo) {
    alert("Descargando PDF: " + tipo);
}

// Función para mostrar un reporte seleccionado (resaltando en la lista)
function mostrarReporte(mensaje) {
    // Resaltar el item activo
    const lista = document.querySelectorAll(".lista-reportes li");
    lista.forEach(li => li.classList.remove("activo"));

    // Buscar el li cuyo span contiene el mensaje
    lista.forEach(li => {
        if (mensaje.toLowerCase().includes(li.querySelector("span").textContent.toLowerCase())) {
            li.classList.add("activo");
        }
    });

    // Aquí podrías cargar la tabla o gráfico correspondiente
    console.log(mensaje);
    alert(mensaje);
}

// ===== ESTILOS DINÁMICOS PARA EL ITEM ACTIVO =====
const style = document.createElement('style');
style.innerHTML = `
.lista-reportes li.activo {
    background-color: #cce5ff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
`;
document.head.appendChild(style);
