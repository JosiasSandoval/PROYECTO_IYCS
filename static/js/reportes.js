let chartActos = null;
let chartParroquias = null;

document.addEventListener("DOMContentLoaded", function () {

    const btnFiltrar = document.getElementById("btn-filtrar");
    const tablaBody = document.getElementById("tabla-body");
    const kpiTotal = document.getElementById("kpi-total");
    const kpiIngresos = document.getElementById("kpi-ingresos");
    const kpiMas = document.getElementById("kpi-mas");

    const filtroParroquia = document.getElementById("filtro-parroquia");
    const filtroActo = document.getElementById("filtro-acto");
    const filtroEstado = document.getElementById("filtro-estado");
    const filtroInicio = document.getElementById("filtro-inicio");
    const filtroFin = document.getElementById("filtro-fin");

    const cargarParroquias = async () => {
        try {
            const res = await fetch("/api/reportes/parroquias");
            const data = await res.json();
            if (!data.ok) return;
         
            filtroParroquia.innerHTML = '<option value="">Todas</option>';
            data.datos.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.idParroquia;
                opt.textContent = p.nombParroquia;
                filtroParroquia.appendChild(opt);
            });
        } catch (err) {
            console.error("Error cargando parroquias:", err);
        }
    };

    const cargarActos = async () => {
        try {
            const res = await fetch("/api/reportes/actos");
            const data = await res.json();
            if (!data.ok) return;
            filtroActo.innerHTML = '<option value="">Todos</option>';
            data.datos.forEach(a => {
                const opt = document.createElement("option");
                opt.value = a.idActo;
                opt.textContent = a.nombActo;
                filtroActo.appendChild(opt);
            });
        } catch (err) {
            console.error("Error cargando actos:", err);
        }
    };

    const construirQuery = (params) => {
        const esc = encodeURIComponent;
        const query = Object.keys(params)
            .filter(k => params[k] !== null && params[k] !== '' && params[k] !== undefined)
            .map(k => esc(k) + '=' + esc(params[k]))
            .join('&');
        return query ? `?${query}` : '';
    };

    const actualizarGraficoActos = (labels, data) => {
        const canvasActos = document.getElementById("graf-actos");
        if (!canvasActos) return;

        const ctx = canvasActos.getContext("2d");

        if (chartActos) {
            chartActos.destroy();
        }

        chartActos = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cantidad de Reservas",
                    data: data,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: "top" }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    };

    const actualizarGraficoParroquias = (labels, data) => {
        const canvasParroquias = document.getElementById("graf-parroquia");
        if (!canvasParroquias) return;

        const ctx = canvasParroquias.getContext("2d");

        if (chartParroquias) {
            chartParroquias.destroy();
        }

        chartParroquias = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    label: "Reservas por Parroquia",
                    data: data,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.6)",
                        "rgba(54, 162, 235, 0.6)",
                        "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)",
                        "rgba(153, 102, 255, 0.6)",
                        "rgba(255, 159, 64, 0.6)"
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                        "rgba(255, 159, 64, 1)"
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: "bottom" }
                }
            }
        });
    };

    const aplicarFiltros = async () => {
        const payload = {
            idParroquia: filtroParroquia.value || '',
            idActo: filtroActo.value || '',
            estado: filtroEstado.value || '',
            fecha_inicio: filtroInicio.value || '',
            fecha_fin: filtroFin.value || ''
        };

        try {
            const query = construirQuery(payload);

            const resReservas = await fetch(`/api/reportes/reservas${query}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const resEstadisticas = await fetch(`/api/reportes/estadisticas${query}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const dataReservas = await resReservas.json();
            const dataEstadisticas = await resEstadisticas.json();

            if (!dataReservas.ok || !dataEstadisticas.ok) {
                console.error("Error en respuesta del servidor");
                alert("Error al obtener los datos del servidor.");
                return;
            }

            tablaBody.innerHTML = "";

            dataReservas.datos.forEach(r => {
                const fecha = r.fechaReserva || r.f_reserva || '';
                const hora = r.horaReserva || r.hora || '';

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${fecha} ${hora ? (' ' + hora) : ''}</td>
                    <td>${r.parroquia || ''}</td>
                    <td>${r.feligres || '---'}</td>
                    <td>${r.acto || '---'}</td>
                    <td>S/ ${parseFloat(r.monto || 0).toFixed(2)}</td>
                    <td>${r.estado || r.estadoReserva || '---'}</td>
                `;
                tablaBody.appendChild(tr);
            });

            kpiTotal.textContent = dataEstadisticas.total_reservas;
            kpiIngresos.textContent = `S/ ${parseFloat(dataEstadisticas.ingresos_totales).toFixed(2)}`;
            kpiMas.textContent = dataEstadisticas.acto_mas_solicitado;

            actualizarGraficoActos(
                dataEstadisticas.grafico_actos.labels,
                dataEstadisticas.grafico_actos.data
            );

            actualizarGraficoParroquias(
                dataEstadisticas.grafico_parroquias.labels,
                dataEstadisticas.grafico_parroquias.data
            );

        } catch (error) {
            console.error("Error al llamar al endpoint de reportes:", error);
            alert("Error de conexión al servidor.");
        }
    };

    btnFiltrar.addEventListener("click", aplicarFiltros);
    filtroParroquia.addEventListener("change", () => {
    });

    (async function init() {
        await cargarParroquias();
        await cargarActos();
        console.log(" Reportes inicializados. Haz click en 'Aplicar filtros' para ver datos.");
    })();

});
