document.addEventListener('DOMContentLoaded', function () {
    const calendarioEl = document.querySelector('.fechas'); 

    const calendar = new FullCalendar.Calendar(calendarioEl, {
        initialView: 'dayGridMonth', 
        locale: 'es', 
        
        // Propiedades de Interactividad y Ocultamiento
        allDaySlot: false, // Oculta la fila "all-day"
        selectable: true,  // Habilita la selección y el clic en los cuadros
        
        // ====================================================
        // 🚀 PROPIEDADES CLAVE PARA VISTA SEMANA/DÍA
        // ====================================================
        
        height: '100%', // Usa 100% para que el CSS pueda estirar el calendario
        
        // 1. RANGO DE HORAS (8 AM a 8 PM)
        slotMinTime: '07:00:00', // Empieza a mostrar a las 8 AM
        slotMaxTime: '23:00:00', // Termina de mostrar a las 8 PM (20:00)
        
        // 2. UNA SOLA FILA POR HORA (para que se vea más limpio)
        slotDuration: '01:00:00', 
        
        // 3. FORMATO AM/PM (8 AM, 9 AM, etc.)
        slotLabelFormat: {
            hour: 'numeric',   // Muestra el número (8, 9, 10)
            minute: '2-digit', // Muestra minutos (aunque estarán ocultos por omitZeroMinute)
            omitZeroMinute: true, // Oculta :00
            meridiem: 'short'  // Muestra 'a. m.' o 'p. m.'
        },
        
        // Asegura que la etiqueta de hora se muestre exactamente cada hora
        slotLabelInterval: '01:00:00', 


        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        }
    });

    calendar.render(); 
});