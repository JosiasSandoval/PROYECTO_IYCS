let chartParroquia = null;
let chartCargo = null;

document.addEventListener("DOMContentLoaded", function () {

    const btnFiltrar = document.getElementById("btn-filtrar");
    const tablaBody = document.getElementById("tabla-body");

    const kpiTotal = document.getElementById("kpi-total");
    const kpiActivo = document.getElementById("kpi-activo");
    const kpiMasFrecuente = document.getElementById("kpi-mas-frecuente");

    const filtroParroquia = document.getElementById("filtro-parroquia");
    const filtroCargo = document.getElementById("filtro-cargo");
    const filtroVigencia = document.getElementById("filtro-vigencia");

    // ============================================================
    // CARGAR PARROQUIAS
    // ============================================================
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

    // ============================================================
    // CARGAR CARGOS
    // ============================================================
    const cargarCargos = async () => {
        try {
            const res = await fetch("/api/reportes/personal/cargos");
            const data = await res.json();
            if (!data.ok) return;

            filtroCargo.innerHTML = '<option value="">Todos</option>';
            data.datos.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.idCargo;
                opt.textContent = c.nombCargo;
                filtroCargo.appendChild(opt);
            });
        } catch (err) {
            console.error("Error cargando cargos:", err);
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
    // GRÁFICO: PERSONAL POR PARROQUIA
    // ============================================================
    const actualizarGraficoParroquia = (labels, data) => {
        const canvas = document.getElementById("graf-parroquia");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (chartParroquia) chartParroquia.destroy();

        chartParroquia = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cantidad de personal",
                    data: data,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
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
    // GRÁFICO: PERSONAL POR CARGO
    // ============================================================
    const actualizarGraficoCargo = (labels, data) => {
        const canvas = document.getElementById("graf-cargo");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (chartCargo) chartCargo.destroy();

        chartCargo = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cantidad de personal",
                    data: data,
                    backgroundColor: "rgba(255, 159, 64, 0.6)",
                    borderColor: "rgba(255, 159, 64, 1)",
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
    // APLICAR FILTROS
    // ============================================================
    const aplicarFiltros = async () => {
        const payload = {
            idParroquia: filtroParroquia.value || '',
            idCargo: filtroCargo.value || '',
            vigencia: filtroVigencia.value || ''
        };

        try {
            const query = construirQuery(payload);

            tablaBody.innerHTML =
                '<tr><td colspan="8" class="text-center">Cargando datos...</td></tr>';

            const resPersonal = await fetch(`/api/reportes/personal${query}`);
            const resEstadisticas = await fetch(`/api/reportes/personal/estadisticas${query}`);

            const dataPersonal = await resPersonal.json();
            const dataEst = await resEstadisticas.json();

            if (!dataPersonal.ok || !dataEst.ok) {
                tablaBody.innerHTML =
                    '<tr><td colspan="8" class="text-center text-danger">Error al cargar datos</td></tr>';
                return;
            }

            if (dataPersonal.datos.length === 0) {
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            No se encontraron registros.
                        </td>
                    </tr>
                `;
                kpiTotal.textContent = "0";
                kpiActivo.textContent = "0";
                kpiMasFrecuente.textContent = "---";
                actualizarGraficoParroquia([], []);
                actualizarGraficoCargo([], []);
                return;
            }

            // =============== TABLA ===============
            tablaBody.innerHTML = "";
            dataPersonal.datos.forEach(p => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.nombre || '---'}</td>
                    <td>${p.sexo || '---'}</td>
                    <td>${p.documento || '---'}</td>
                    <td>${p.direccion || '---'}</td>
                    <td>${p.telefono || '---'}</td>
                    <td>${p.cargo || '---'}</td>
                    <td>${p.parroquia || '---'}</td>
                    <td>${p.vigencia ? 'Activo' : 'Inactivo'}</td>
                `;
                tablaBody.appendChild(tr);
            });

            // =============== KPIs ===============
            kpiTotal.textContent = dataEst.total_personal || "0";
            kpiActivo.textContent = dataEst.total_activo || "0";
            kpiMasFrecuente.textContent = dataEst.cargo_mas_frecuente || "---";

            // =============== GRÁFICOS ===============
            actualizarGraficoParroquia(
                dataEst.grafico_parroquias.labels,
                dataEst.grafico_parroquias.data
            );
            actualizarGraficoCargo(
                dataEst.grafico_cargos.labels,
                dataEst.grafico_cargos.data
            );

        } catch (error) {
            console.error("Error en filtros personal:", error);
            tablaBody.innerHTML =
                '<tr><td colspan="8" class="text-center text-danger">Error de conexión</td></tr>';
        }
    };

    btnFiltrar.addEventListener("click", aplicarFiltros);

    // Inicialización
    (async function init() {
        await cargarParroquias();
        await cargarCargos();
        await aplicarFiltros();
        console.log("Reporte de personal cargado correctamente");
    })();

});
