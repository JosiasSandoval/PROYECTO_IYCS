let chartUsuarios = null;
document.addEventListener("DOMContentLoaded", function () {

    const btnFiltrar = document.getElementById("btn-filtrar");
    const tablaBody = document.getElementById("tabla-body-usuarios");

    const kpiTotalUsuarios = document.getElementById("kpi-total-usuarios");
    const kpiTotalReservas = document.getElementById("kpi-total-reservas");
    const kpiMasUsuario = document.getElementById("kpi-mas-usuario");

    const filtroParroquia = document.getElementById("filtro-parroquia");
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
    // GRÁFICO: USUARIOS MÁS FRECUENTES
    // ============================================================
    const actualizarGraficoUsuarios = (labels, data) => {
        const canvas = document.getElementById("graf-usuarios");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (chartUsuarios) chartUsuarios.destroy();

        chartUsuarios = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Número de reservas",
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
    // APLICAR FILTROS
    // ============================================================
    const aplicarFiltros = async () => {
        const payload = {
            idParroquia: filtroParroquia.value || '',
            fecha_inicio: filtroInicio.value || '',
            fecha_fin: filtroFin.value || ''
        };

        try {
            const query = construirQuery(payload);

            tablaBody.innerHTML =
                '<tr><td colspan="3" class="text-center">Cargando datos...</td></tr>';

            const resUsuarios = await fetch(`/api/reportes/usuarios${query}`);
            const resEstadisticas = await fetch(`/api/reportes/usuarios/estadisticas${query}`);

            const dataUsuarios = await resUsuarios.json();
            const dataEst = await resEstadisticas.json();

            if (!dataUsuarios.ok || !dataEst.ok) {
                tablaBody.innerHTML =
                    '<tr><td colspan="3" class="text-center text-danger">Error al cargar datos</td></tr>';
                return;
            }

            if (dataUsuarios.datos.length === 0) {
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            No se encontraron usuarios.
                        </td>
                    </tr>
                `;
                kpiTotalUsuarios.textContent = "0";
                kpiTotalReservas.textContent = "0";
                kpiMasUsuario.textContent = "---";
                actualizarGraficoUsuarios([], []);
                return;
            }

            // =============== TABLA ===============
            tablaBody.innerHTML = "";
            dataUsuarios.datos.forEach(u => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${u.usuario || '---'}</td>
                    <td>${u.parroquia || '---'}</td>
                    <td>${u.totalReservas || 0}</td>
                `;
                tablaBody.appendChild(tr);
            });

            // =============== KPIs ===============
            kpiTotalUsuarios.textContent = dataEst.total_usuarios;
            kpiTotalReservas.textContent = dataEst.total_reservas;
            kpiMasUsuario.textContent = dataEst.usuario_mas_activo || "---";

            // =============== GRÁFICO ===============
            actualizarGraficoUsuarios(
                dataEst.grafico_usuarios.labels,
                dataEst.grafico_usuarios.data
            );

        } catch (error) {
            console.error("Error en filtros usuarios:", error);
            tablaBody.innerHTML =
                '<tr><td colspan="3" class="text-center text-danger">Error de conexión</td></tr>';
        }
    };

    btnFiltrar.addEventListener("click", aplicarFiltros);

    // Inicialización
    (async function init() {
        await cargarParroquias();
        await aplicarFiltros();
        console.log("Reporte de usuarios cargado correctamente");
    })();

});
