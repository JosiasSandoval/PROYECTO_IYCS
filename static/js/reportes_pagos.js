let chartTiposPago = null;
let chartParroquiasPago = null;

document.addEventListener("DOMContentLoaded", function () {

    const btnFiltrar = document.getElementById("btn-filtrar");
    const tablaBody = document.getElementById("tabla-body");

    const kpiTotal = document.getElementById("kpi-total");
    const kpiIngresos = document.getElementById("kpi-ingresos");
    const kpiMas = document.getElementById("kpi-mas");

    const filtroParroquia = document.getElementById("filtro-parroquia");
    const filtroTipo = document.getElementById("filtro-tipo");
    const filtroInicio = document.getElementById("filtro-inicio");
    const filtroFin = document.getElementById("filtro-fin");

    // ============================================================
    // CARGAR PARROQUIAS
    // ============================================================
    const cargarParroquias = async () => {
        try {
            const res = await fetch("/api/reportes/parroquias");
            const data = await res.json();
            if (!data.ok) return;

            filtroParroquia.innerHTML = '<option value="">Todos</option>';
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

    // ============================================================
    // CARGAR TIPOS DE PAGO
    // ============================================================
    const cargarTiposPago = async () => {
        try {
            const res = await fetch("/api/reportes/pagos/tipos_pago");
            const data = await res.json();
            if (!data.ok) return;

            filtroTipo.innerHTML = '<option value="">Todos</option>';

            // backend devuelve: ["Efectivo","Tarjeta","Transferencia",...]
            data.datos.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.nombreTipo; // enviamos el nombre al backend
                opt.textContent = t.nombreTipo;
                filtroTipo.appendChild(opt);
            });


        } catch (err) {
            console.error("Error cargando tipos de pago:", err);
        }
    };

    // ============================================================
    // CONSTRUIR QUERY STRING
    // ============================================================
    const construirQuery = (params) => {
        const esc = encodeURIComponent;
        const query = Object.keys(params)
            .filter(k => params[k] !== null && params[k] !== '' && params[k] !== undefined)
            .map(k => esc(k) + '=' + esc(params[k]))
            .join('&');

        return query ? `?${query}` : '';
    };

    // ============================================================
    // GRÁFICO: PAGOS POR TIPO
    // ============================================================
    const actualizarGraficoTipos = (labels, data) => {
        const canvas = document.getElementById("graf-tipo"); // ← CORREGIDO
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (chartTiposPago) chartTiposPago.destroy();

        chartTiposPago = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cantidad de Pagos",
                    data: data,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    };


    // ============================================================
    // GRÁFICO: PAGOS POR PARROQUIA
    // ============================================================
    const actualizarGraficoParroquias = (labels, data) => {
        const canvas = document.getElementById("graf-parroquia");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (chartParroquiasPago) chartParroquiasPago.destroy();

        chartParroquiasPago = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    label: "Pagos por Parroquia",
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
                plugins: { legend: { display: true, position: "bottom" } }
            }
        });
    };

    // ============================================================
    // APLICAR FILTROS
    // ============================================================
    const aplicarFiltros = async () => {
        const payload = {
            idParroquia: filtroParroquia.value || '',
            tipo: filtroTipo.value || '',
            fecha_inicio: filtroInicio.value || '',
            fecha_fin: filtroFin.value || ''
        };

        try {
            const query = construirQuery(payload);

            tablaBody.innerHTML =
                '<tr><td colspan="5" class="text-center">Cargando datos...</td></tr>';

            const resPagos = await fetch(`/api/reportes/pagos${query}`);
            const resEstadisticas = await fetch(`/api/reportes/pagos/estadisticas${query}`);

            const dataPagos = await resPagos.json();
            const dataEst = await resEstadisticas.json();

            if (!dataPagos.ok || !dataEst.ok) {
                tablaBody.innerHTML =
                    '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos</td></tr>';
                return;
            }

            if (dataPagos.datos.length === 0) {
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            No se encontraron pagos.
                        </td>
                    </tr>
                `;
                kpiTotal.textContent = "0";
                kpiIngresos.textContent = "S/ 0.00";
                kpiMas.textContent = "---";
                actualizarGraficoTipos([], []);
                actualizarGraficoParroquias([], []);
                return;
            }

            // =============== TABLA ===============
            tablaBody.innerHTML = "";
            dataPagos.datos.forEach(p => {
                const fecha = p.fechaPago || '---'; // <<-- CORREGIDO
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${fecha}</td>
                    <td>${p.parroquia || ''}</td>
                    <td>${p.feligres || '---'}</td>
                    <td>${p.tipoPago || '---'}</td>
                    <td>S/ ${parseFloat(p.monto || 0).toFixed(2)}</td>
                `;

                tablaBody.appendChild(tr);
            });

            // =============== KPIs ===============
            kpiTotal.textContent = dataEst.total_pagos;
            kpiIngresos.textContent = `S/ ${parseFloat(dataEst.total_recaudado).toFixed(2)}`;
            kpiMas.textContent = dataEst.tipo_mas_frecuente || "---";

            // =============== GRÁFICOS ===============
            actualizarGraficoTipos(
                dataEst.grafico_tipo.labels,
                dataEst.grafico_tipo.data
            );

            actualizarGraficoParroquias(
                dataEst.grafico_parroquias.labels,
                dataEst.grafico_parroquias.data
            );

        } catch (error) {
            console.error("Error en filtros pagos:", error);
            tablaBody.innerHTML =
                '<tr><td colspan="5" class="text-center text-danger">Error de conexión</td></tr>';
        }
    };

    btnFiltrar.addEventListener("click", aplicarFiltros);

    // Inicialización
    (async function init() {
        await cargarParroquias();
        await cargarTiposPago();
        await aplicarFiltros();
        console.log("Reporte de pagos cargado correctamente");
    })();

});
