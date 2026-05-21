// APLICACIÓN PRINCIPAL - ATRACCIONES CORONEL
const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

// 1. CONFIGURACIÓN DEL PINIA STORE
const useMainStore = Pinia.defineStore('main', {
    state: () => ({
        // Configuración Global
        isLiveMode: true,
        gatewayUrl: 'https://gateway-api.purpleriver-a05782b6.centralus.azurecontainerapps.io',
        backendUrls: {
            identify: 'https://gateway-api.purpleriver-a05782b6.centralus.azurecontainerapps.io/api/v1/coronel_paula',
            catalog:  'https://gateway-api.purpleriver-a05782b6.centralus.azurecontainerapps.io/api/v1/coronel_paula/catalog',
            booking:  'https://gateway-api.purpleriver-a05782b6.centralus.azurecontainerapps.io/api/v1/coronel_paula/booking',
            billing:  'https://gateway-api.purpleriver-a05782b6.centralus.azurecontainerapps.io/api/v1/coronel_paula/billing'
        },
        
        // Autenticación
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,

        // Carrito / Checkout Temporal (Persistencia)
        checkoutData: JSON.parse(localStorage.getItem('checkoutData')) || {
            passengers: [{ fullName: '', documentNumber: '', age: '' }],
            tourType: 'shared', // shared / private
            selectedDate: '',
            selectedTimeSlot: '',
            attractionId: null
        },

        // Portal de Reservas (Historial de Clientes)
        reservations: JSON.parse(localStorage.getItem('reservations')) || [
            {
                pnr: 'AC-78923',
                attractionName: 'Tour al Cotopaxi & Laguna de Limpiopungo',
                date: '2026-06-15',
                timeSlot: '08:00 AM',
                tourType: 'Compartido',
                passengersCount: 2,
                amount: 98.00,
                status: 'Confirmada',
                paymentStatus: 'Pagado'
            },
            {
                pnr: 'AC-10293',
                attractionName: 'Aventura en Baños de Agua Santa',
                date: '2026-05-10',
                timeSlot: '09:30 AM',
                tourType: 'Privado',
                passengersCount: 1,
                amount: 150.00,
                status: 'Cancelada',
                paymentStatus: 'Reembolsado'
            }
        ],

        // Catálogos Globales (Para Admin y Checkout)
        locations: [
            { id: 1, country: 'Ecuador', state: 'Pichincha', city: 'Quito' },
            { id: 2, country: 'Ecuador', state: 'Tungurahua', city: 'Baños' },
            { id: 3, country: 'Ecuador', state: 'Galápagos', city: 'Puerto Ayora' },
            { id: 4, country: 'Ecuador', state: 'Imbabura', city: 'Otavalo' }
        ],

        categories: ['Aventura', 'Naturaleza', 'Cultural', 'Familiar', 'Gastronomía'],
        
        inclusionsList: [
            { id: 1, name: 'Guía Profesional Certificado', type: 'included' },
            { id: 2, name: 'Transporte Ida y Vuelta en MiniBus', type: 'included' },
            { id: 3, name: 'Almuerzo Típico de la Región', type: 'included' },
            { id: 4, name: 'Tickets de Ingreso al Parque Nacional', type: 'included' },
            { id: 5, name: 'Equipo de Seguridad Completo', type: 'included' },
            { id: 6, name: 'Propinas para los Guías Locales', type: 'optional' },
            { id: 7, name: 'Bebidas Alcohólicas Especiales', type: 'optional' },
            { id: 8, name: 'Fotos y Videos en Alta Resolución', type: 'optional' }
        ],

        // Atracciones en Memoria (Fallback Mock)
        attractions: [
            {
                id: 1,
                name: 'Tour al Cotopaxi & Laguna de Limpiopungo',
                slug: 'tour-cotopaxi-limpiopungo',
                description: 'Explora uno de los volcanes activos más altos del mundo. Un itinerario diseñado para amantes del senderismo y la fotografía andina.',
                price: 49.00,
                rating: 4.8,
                reviewsCount: 124,
                imageUrl: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=800&q=80',
                gallery: [
                    'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1568230315894-1edd16d248b7?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=800&q=80'
                ],
                locationId: 1,
                category: 'Naturaleza',
                isFeatured: true,
                isPublished: true, // Dual state
                isActive: true,     // Dual state
                coordinates: [-0.6833, -78.4333], // Cotopaxi exact coordinate
                itinerary: [
                    { stop: 1, name: 'Punto de Encuentro (Quito)', duration: '30 min', description: 'Salida en transporte turístico desde Plaza Foch en Quito.', access: 'included' },
                    { stop: 2, name: 'Desayuno en Machachi', duration: '45 min', description: 'Desayuno tradicional andino para calentar motores.', access: 'optional' },
                    { stop: 3, name: 'Ingreso al Parque Nacional Cotopaxi', duration: '20 min', description: 'Registro y control con guardaparques.', access: 'included' },
                    { stop: 4, name: 'Senderismo en Laguna de Limpiopungo', duration: '1.5 horas', description: 'Caminata alrededor de la laguna, avistamiento de aves andinas.', access: 'included' },
                    { stop: 5, name: 'Ascenso al Refugio José Rivas (4,860m)', duration: '2.5 horas', description: 'Caminata de altura opcional para los más aventureros.', access: 'optional' }
                ],
                inclusions: [1, 2, 4, 5],
                exclusions: [6, 7, 8],
                schedules: [
                    { time: '07:30 AM', capacity: 15, sold: 12 },
                    { time: '09:00 AM', capacity: 15, sold: 4 }
                ]
            },
            {
                id: 2,
                name: 'Aventura Completa en Baños de Agua Santa',
                slug: 'aventura-banos-agua-santa',
                description: 'Experimenta la adrenalina pura en la capital de los deportes extremos del Ecuador. Columpio del Fin del Mundo y Pailón del Diablo.',
                price: 59.00,
                rating: 4.9,
                reviewsCount: 210,
                imageUrl: 'https://images.unsplash.com/photo-1596120233075-81d0685c7c7c?auto=format&fit=crop&w=800&q=80',
                gallery: [
                    'https://images.unsplash.com/photo-1596120233075-81d0685c7c7c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=800&q=80'
                ],
                locationId: 2,
                category: 'Aventura',
                isFeatured: true,
                isPublished: true,
                isActive: true,
                coordinates: [-1.3964, -78.4247],
                itinerary: [
                    { stop: 1, name: 'La Casa del Árbol', duration: '1 hora', description: 'Súbete al columpio gigante con vista al Volcán Tungurahua.', access: 'included' },
                    { stop: 2, name: 'Pailón del Diablo', duration: '2 horas', description: 'Caminata por los puentes colgantes frente a la inmensa cascada.', access: 'included' },
                    { stop: 3, name: 'Canopy sobre el cañón del Pastaza', duration: '30 min', description: 'Cruza el cañón volando a gran velocidad.', access: 'optional' }
                ],
                inclusions: [1, 2, 3],
                exclusions: [6, 8],
                schedules: [
                    { time: '08:30 AM', capacity: 20, sold: 20 }, // Agotado
                    { time: '11:00 AM', capacity: 20, sold: 8 }
                ]
            },
            {
                id: 3,
                name: 'Crucero de un Día en Islas Galápagos',
                slug: 'crucero-dia-galapagos',
                description: 'Navega hacia islas deshabitadas y haz snorkel con tortugas marinas, iguanas y lobos marinos en un entorno exclusivo de conservación.',
                price: 180.00,
                rating: 5.0,
                reviewsCount: 88,
                imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
                gallery: [
                    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80'
                ],
                locationId: 3,
                category: 'Naturaleza',
                isFeatured: false,
                isPublished: true,
                isActive: true,
                coordinates: [-0.7402, -90.3121],
                itinerary: [
                    { stop: 1, name: 'Abordaje en Puerto Ayora', duration: '30 min', description: 'Bienvenida del Capitán y el Guía Naturalista a bordo.', access: 'included' },
                    { stop: 2, name: 'Snorkel en Bahía Sullivan', duration: '2 horas', description: 'Avistamiento de rayas, tiburones tintoreras y tortugas.', access: 'included' },
                    { stop: 3, name: 'Caminata Volcánica', duration: '1.5 horas', description: 'Exploración geológica de senderos de lava.', access: 'included' }
                ],
                inclusions: [1, 3, 4, 5],
                exclusions: [6, 7, 8],
                schedules: [
                    { time: '08:00 AM', capacity: 12, sold: 9 }
                ]
            }
        ]
    }),

    actions: {
        // Guardar persistencia del checkout
        saveCheckoutData() {
            localStorage.setItem('checkoutData', JSON.stringify(this.checkoutData));
        },

        // Inicio de sesión
        loginUser(username, password) {
            // Mock authentication
            let role = 'client';
            if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'paula') {
                role = 'admin';
            }
            
            this.user = {
                id: Date.now(),
                fullName: username === 'admin' ? 'Administrador del Sistema' : 'Paula Coronel',
                username: username,
                role: role
            };
            this.token = "mock_jwt_token_" + Date.now();
            localStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('token', this.token);
            return true;
        },

        // Cerrar sesión
        logoutUser() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },

        // Crear una nueva reserva transaccional
        addReservation(reservation) {
            this.reservations.unshift(reservation);
            localStorage.setItem('reservations', JSON.stringify(this.reservations));
        },

        // Cancelar una reserva y liberar cupos
        cancelReservation(pnr, reason) {
            const index = this.reservations.findIndex(r => r.pnr === pnr);
            if (index !== -1) {
                this.reservations[index].status = 'Cancelada';
                this.reservations[index].cancelReason = reason;
                localStorage.setItem('reservations', JSON.stringify(this.reservations));
                return true;
            }
            return false;
        }
    }
});

// 2. APLICACIÓN VUE
const app = createApp({
    setup() {
        const store = useMainStore();
        
        // Vista activa
        const currentView = ref('home'); // home, detail, checkout, portal, admin-dashboard, admin-edit, admin-schedule, admin-pos, admin-bookings
        const selectedAttraction = ref(null);
        const searchQuery = ref('');
        const selectedCategory = ref('Todos');
        
        // Leaflet Map instance
        let mapInstance = null;

        // Variables para el Editor de Atracciones
        const activeEditorTab = ref('general'); // general, location, tags, inclusions, itinerary
        const editingAttraction = ref({
            id: null,
            name: '',
            slug: '',
            description: '',
            price: 0,
            imageUrl: '',
            locationId: 1,
            category: 'Naturaleza',
            isFeatured: false,
            isPublished: false,
            isActive: true,
            coordinates: [-0.1807, -78.4678],
            inclusions: [],
            exclusions: [],
            itinerary: []
        });

        // Variables para el Gestor de Horarios e Inventario
        const selectedScheduleAttractionId = ref(1);
        const newScheduleTime = ref('');
        const newScheduleCapacity = ref(20);
        const bulkStartDate = ref('');
        const bulkEndDate = ref('');
        const bulkDays = ref([1,2,3,4,5,6,7]); // Días de la semana

        // Variables para el POS Terminal
        const posClientId = ref(null);
        const posClientDoc = ref('');
        const posClientName = ref('');
        const posAttractionId = ref(1);
        const posDate = ref('');
        const posTime = ref('');
        const posQuantity = ref(1);
        const posAvailabilityForecast = ref([]);

        // Variables para el Panel de Gestión Administrativa de Reservas
        const adminSearchPnr = ref('');

        // Toggles y persistencia
        onMounted(() => {
            // Cargar por defecto la primera atracción destacada en mocks
            selectedAttraction.value = store.attractions[0];
            generatePosForecast();
        });

        // Filtrado dinámico de atracciones
        const filteredAttractions = computed(() => {
            return store.attractions.filter(attraction => {
                const matchesSearch = attraction.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                                      attraction.description.toLowerCase().includes(searchQuery.value.toLowerCase());
                const matchesCategory = selectedCategory.value === 'Todos' || attraction.category === selectedCategory.value;
                return matchesSearch && matchesCategory;
            });
        });

        // Ver detalle de una atracción
        const viewDetail = (attraction) => {
            selectedAttraction.value = attraction;
            currentView.value = 'detail';
            
            // Destruir mapa anterior si existiese
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
            }

            // Inicializar Leaflet con pequeño retraso para asegurar que el DOM cargó
            nextTick(() => {
                initLeafletMap(attraction);
            });
        };

        // Inicializar Leaflet Map
        const initLeafletMap = (attraction) => {
            const coords = attraction.coordinates || [-0.6833, -78.4333];
            mapInstance = L.map('attraction-map').setView(coords, 12);
            
            // Usar un mapa oscuro/moderno y elegante de CartoDB
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance);

            // Agregar un marcador personalizado glow-blue
            L.marker(coords).addTo(mapInstance)
                .bindPopup(`<strong class="text-slate-900">${attraction.name}</strong><br><span class="text-slate-700">Punto de encuentro exacto</span>`)
                .openPopup();
        };

        // Iniciar Checkout
        const startCheckout = () => {
            store.checkoutData.attractionId = selectedAttraction.value.id;
            store.saveCheckoutData();
            currentView.value = 'checkout';
        };

        // Administrar Pasajeros en el Checkout (Paso 1)
        const addPassengerField = () => {
            store.checkoutData.passengers.push({ fullName: '', documentNumber: '', age: '' });
            store.saveCheckoutData();
        };

        const removePassengerField = (index) => {
            if (store.checkoutData.passengers.length > 1) {
                store.checkoutData.passengers.splice(index, 1);
                store.saveCheckoutData();
            }
        };

        // Procesar simulación de pago del Checkout (Paso 2)
        const submitCheckout = () => {
            // Validaciones estrictas con SweetAlert2
            const data = store.checkoutData;
            if (!data.selectedDate || !data.selectedTimeSlot) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Incompletos',
                    text: 'Por favor selecciona la fecha y el horario de tu preferencia.',
                    background: '#131a26',
                    color: '#f3f4f6',
                    confirmButtonColor: '#6366f1'
                });
                return;
            }

            for (let i = 0; i < data.passengers.length; i++) {
                const p = data.passengers[i];
                if (!p.fullName || !p.documentNumber || !p.age) {
                    Swal.fire({
                        icon: 'warning',
                        title: `Pasajero ${i + 1} incompleto`,
                        text: 'Todos los campos de los pasajeros son obligatorios para la simulación del seguro.',
                        background: '#131a26',
                        color: '#f3f4f6',
                        confirmButtonColor: '#6366f1'
                    });
                    return;
                }
            }

            // Simulación exitosa con SweetAlert2
            Swal.fire({
                title: 'Simulando Pago...',
                text: 'Conectando de forma segura con la pasarela de pagos integrada de Billing Service.',
                allowOutsideClick: false,
                background: '#131a26',
                color: '#f3f4f6',
                didOpen: () => {
                    Swal.showLoading();
                    setTimeout(() => {
                        // Generar código PNR
                        const newPnr = 'AC-' + Math.floor(10000 + Math.random() * 90000);
                        const newRes = {
                            pnr: newPnr,
                            attractionName: selectedAttraction.value.name,
                            date: data.selectedDate,
                            timeSlot: data.selectedTimeSlot,
                            tourType: data.tourType === 'shared' ? 'Compartido' : 'Privado',
                            passengersCount: data.passengers.length,
                            amount: selectedAttraction.value.price * data.passengers.length * (data.tourType === 'private' ? 1.5 : 1),
                            status: 'Confirmada',
                            paymentStatus: 'Pagado'
                        };

                        store.addReservation(newRes);
                        
                        // Limpiar checkout
                        store.checkoutData = {
                            passengers: [{ fullName: '', documentNumber: '', age: '' }],
                            tourType: 'shared',
                            selectedDate: '',
                            selectedTimeSlot: '',
                            attractionId: null
                        };
                        store.saveCheckoutData();

                        Swal.fire({
                            icon: 'success',
                            title: '¡Reserva Completada!',
                            html: `Tu pago se acreditó correctamente.<br>Código PNR: <strong>${newPnr}</strong><br>Se ha generado tu factura y orden de abordaje digital.`,
                            background: '#131a26',
                            color: '#f3f4f6',
                            confirmButtonColor: '#10b981'
                        }).then(() => {
                            currentView.value = 'portal';
                        });
                    }, 2000);
                }
            });
        };

        // Cancelación de Reserva Cliente
        const cancelUserReservation = (pnr) => {
            Swal.fire({
                title: '¿Confirmas la cancelación?',
                text: "Esta acción liberará de inmediato tus cupos reservados para otros viajeros.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No',
                background: '#131a26',
                color: '#f3f4f6'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Escribe el motivo de la cancelación:',
                        input: 'text',
                        inputPlaceholder: 'Ej: Cambio de planes de vuelo...',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        background: '#131a26',
                        color: '#f3f4f6',
                        inputValidator: (value) => {
                            if (!value) {
                                return '¡Es obligatorio indicar el motivo!';
                            }
                        }
                    }).then((inputResult) => {
                        if (inputResult.isConfirmed) {
                            store.cancelReservation(pnr, inputResult.value);
                            Swal.fire({
                                icon: 'success',
                                title: 'Reserva Cancelada',
                                text: 'Tus cupos se liberaron y se programó tu reembolso automático.',
                                background: '#131a26',
                                color: '#f3f4f6',
                                confirmButtonColor: '#10b981'
                            });
                        }
                    });
                }
            });
        };

        // Autenticación (Login)
        const usernameInput = ref('');
        const passwordInput = ref('');
        
        const login = () => {
            if (!usernameInput.value || !passwordInput.value) return;
            const success = store.loginUser(usernameInput.value, passwordInput.value);
            if (success) {
                usernameInput.value = '';
                passwordInput.value = '';
                Swal.fire({
                    icon: 'success',
                    title: '¡Sesión Iniciada!',
                    text: `Bienvenido de vuelta, ${store.user.fullName}.`,
                    background: '#131a26',
                    color: '#f3f4f6',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    if (store.user.role === 'admin') {
                        currentView.value = 'admin-dashboard';
                    } else {
                        currentView.value = 'home';
                    }
                });
            }
        };

        const logout = () => {
            store.logoutUser();
            currentView.value = 'home';
            Swal.fire({
                icon: 'info',
                title: 'Sesión Cerrada',
                background: '#131a26',
                color: '#f3f4f6',
                showConfirmButton: false,
                timer: 1000
            });
        };

        // --- GESTIÓN DE ATRACCIONES (ADMIN) ---
        const startEditAttraction = (attraction = null) => {
            if (attraction) {
                // Clonar la atracción para la edición
                editingAttraction.value = JSON.parse(JSON.stringify(attraction));
            } else {
                // Nueva atracción
                editingAttraction.value = {
                    id: Date.now(),
                    name: '',
                    slug: '',
                    description: '',
                    price: 25.00,
                    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
                    locationId: 1,
                    category: 'Aventura',
                    isFeatured: false,
                    isPublished: false,
                    isActive: true,
                    coordinates: [-0.1807, -78.4678],
                    inclusions: [],
                    exclusions: [],
                    itinerary: []
                };
            }
            activeEditorTab.value = 'general';
            currentView.value = 'admin-edit';
        };

        const saveAttraction = () => {
            if (!editingAttraction.value.name || !editingAttraction.value.description) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    text: 'El nombre y descripción son requeridos.',
                    background: '#131a26',
                    color: '#f3f4f6'
                });
                return;
            }

            editingAttraction.value.slug = editingAttraction.value.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            const index = store.attractions.findIndex(a => a.id === editingAttraction.value.id);
            if (index !== -1) {
                store.attractions[index] = { ...editingAttraction.value };
            } else {
                store.attractions.push({ ...editingAttraction.value });
            }

            Swal.fire({
                icon: 'success',
                title: '¡Guardado!',
                text: 'Los detalles de la atracción se actualizaron con éxito.',
                background: '#131a26',
                color: '#f3f4f6',
                confirmButtonColor: '#10b981'
            }).then(() => {
                currentView.value = 'admin-dashboard';
            });
        };

        // Agregar paradas al itinerario en el editor
        const addItineraryStop = () => {
            const nextStop = editingAttraction.value.itinerary.length + 1;
            editingAttraction.value.itinerary.push({
                stop: nextStop,
                name: '',
                duration: '1 hora',
                description: '',
                access: 'included'
            });
        };

        const removeItineraryStop = (index) => {
            editingAttraction.value.itinerary.splice(index, 1);
            // Re-indexar las paradas
            editingAttraction.value.itinerary.forEach((item, i) => {
                item.stop = i + 1;
            });
        };

        // --- GESTIÓN DE HORARIOS (ADMIN) ---
        const activeScheduleAttraction = computed(() => {
            return store.attractions.find(a => a.id === selectedScheduleAttractionId.value) || store.attractions[0];
        });

        const addIndividualSchedule = () => {
            if (!newScheduleTime.value) return;
            const attraction = store.attractions.find(a => a.id === selectedScheduleAttractionId.value);
            if (attraction) {
                attraction.schedules.push({
                    time: newScheduleTime.value,
                    capacity: newScheduleCapacity.value,
                    sold: 0
                });
                newScheduleTime.value = '';
                Swal.fire({
                    icon: 'success',
                    title: 'Horario Agregado',
                    text: 'Se añadió el horario exitosamente a la atracción.',
                    background: '#131a26',
                    color: '#f3f4f6'
                });
            }
        };

        const removeSchedule = (index) => {
            const attraction = store.attractions.find(a => a.id === selectedScheduleAttractionId.value);
            if (attraction) {
                attraction.schedules.splice(index, 1);
            }
        };

        const bulkGenerateSchedules = () => {
            if (!bulkStartDate.value || !bulkEndDate.value || !newScheduleTime.value) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Debes definir rango de fechas y la hora del bloque para generar de forma masiva.',
                    background: '#131a26',
                    color: '#f3f4f6'
                });
                return;
            }

            const attraction = store.attractions.find(a => a.id === selectedScheduleAttractionId.value);
            if (attraction) {
                // Agregar simulando la generación masiva
                attraction.schedules.push({
                    time: `${newScheduleTime.value} (Masivo)`,
                    capacity: newScheduleCapacity.value,
                    sold: 0
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Generación Masiva Exitosa',
                    text: 'Se ha creado el patrón de horarios en el inventario para el rango seleccionado.',
                    background: '#131a26',
                    color: '#f3f4f6'
                });
            }
        };

        const bulkDeleteSchedules = () => {
            const attraction = store.attractions.find(a => a.id === selectedScheduleAttractionId.value);
            if (attraction) {
                attraction.schedules = [];
                Swal.fire({
                    icon: 'success',
                    title: 'Limpieza Completada',
                    text: 'Se eliminaron todos los bloques de horarios del rango indicado.',
                    background: '#131a26',
                    color: '#f3f4f6'
                });
            }
        };

        // --- PUNTO DE VENTA (POS TERMINAL) ---
        const generatePosForecast = () => {
            // Predicción automática de las próximas 5 fechas con cupos libres
            const today = new Date();
            const forecast = [];
            let count = 0;
            while(count < 5) {
                today.setDate(today.getDate() + 1);
                // Evitar algunos días aleatoriamente para simular inventario variado
                if (Math.random() > 0.3) {
                    const formatted = today.toISOString().split('T')[0];
                    forecast.push({
                        date: formatted,
                        availableSeats: Math.floor(5 + Math.random() * 15)
                    });
                    count++;
                }
            }
            posAvailabilityForecast.value = forecast;
        };

        const selectForecastDate = (date) => {
            posDate.value = date;
        };

        const submitPosSale = () => {
            if (!posClientDoc.value || !posClientName.value || !posDate.value || !posTime.value) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error POS',
                    text: 'Todos los campos son obligatorios para emitir la venta en taquilla.',
                    background: '#131a26',
                    color: '#f3f4f6'
                });
                return;
            }

            const attraction = store.attractions.find(a => a.id === posAttractionId.value);
            const price = attraction ? attraction.price : 49;
            const newPnr = 'POS-' + Math.floor(10000 + Math.random() * 90000);
            
            const newRes = {
                pnr: newPnr,
                attractionName: attraction ? attraction.name : 'Venta POS',
                date: posDate.value,
                timeSlot: posTime.value,
                tourType: 'Compartido (Taquilla)',
                passengersCount: posQuantity.value,
                amount: price * posQuantity.value,
                status: 'Confirmada',
                paymentStatus: 'Pagado'
            };

            store.addReservation(newRes);

            Swal.fire({
                icon: 'success',
                title: '¡Venta Emitida!',
                html: `Venta registrada de manera exitosa.<br>Código PNR: <strong>${newPnr}</strong><br>Imprimiendo ticket térmico...`,
                background: '#131a26',
                color: '#f3f4f6'
            });

            // Limpiar POS
            posClientDoc.value = '';
            posClientName.value = '';
            posQuantity.value = 1;
            generatePosForecast();
        };

        // --- GESTIÓN ADMINISTRATIVA DE RESERVAS ---
        const filteredReservations = computed(() => {
            if (!adminSearchPnr.value) return store.reservations;
            return store.reservations.filter(r => r.pnr.toLowerCase().includes(adminSearchPnr.value.toLowerCase()));
        });

        const cancelAdminReservation = (pnr) => {
            Swal.fire({
                title: '¿Confirmas la cancelación de la reserva?',
                text: "Esta operación liberará los cupos del inventario inmediatamente.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                background: '#131a26',
                color: '#f3f4f6',
                input: 'text',
                inputPlaceholder: 'Escribe el motivo oficial del partner...',
                inputValidator: (value) => {
                    if (!value) {
                        return '¡Es obligatorio indicar el motivo de la cancelación!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    store.cancelReservation(pnr, result.value);
                    Swal.fire({
                        icon: 'success',
                        title: 'Reserva Anulada',
                        text: 'El estado se actualizó a Cancelada y los cupos fueron devueltos.',
                        background: '#131a26',
                        color: '#f3f4f6'
                    });
                }
            });
        };

        // --- CATÁLOGOS ---
        const newCatalogLocation = ref({ country: '', state: '', city: '' });
        const addCatalogLocation = () => {
            if (!newCatalogLocation.value.country || !newCatalogLocation.value.state || !newCatalogLocation.value.city) return;
            store.locations.push({
                id: Date.now(),
                ...newCatalogLocation.value
            });
            newCatalogLocation.value = { country: '', state: '', city: '' };
            Swal.fire({
                icon: 'success',
                title: 'Ubicación Jerárquica Registrada',
                background: '#131a26',
                color: '#f3f4f6'
            });
        };

        return {
            store,
            currentView,
            selectedAttraction,
            searchQuery,
            selectedCategory,
            filteredAttractions,
            viewDetail,
            startCheckout,
            addPassengerField,
            removePassengerField,
            submitCheckout,
            cancelUserReservation,
            
            // Autenticación
            usernameInput,
            passwordInput,
            login,
            logout,

            // Editor
            activeEditorTab,
            editingAttraction,
            startEditAttraction,
            saveAttraction,
            addItineraryStop,
            removeItineraryStop,

            // Horarios
            selectedScheduleAttractionId,
            activeScheduleAttraction,
            newScheduleTime,
            newScheduleCapacity,
            bulkStartDate,
            bulkEndDate,
            bulkDays,
            addIndividualSchedule,
            removeSchedule,
            bulkGenerateSchedules,
            bulkDeleteSchedules,

            // POS
            posClientId,
            posClientDoc,
            posClientName,
            posAttractionId,
            posDate,
            posTime,
            posQuantity,
            posAvailabilityForecast,
            selectForecastDate,
            submitPosSale,

            // Reservas admin
            adminSearchPnr,
            filteredReservations,
            cancelAdminReservation,

            // Catálogos
            newCatalogLocation,
            addCatalogLocation
        };
    }
});

// Registrar Pinia en la aplicación
app.use(Pinia.createPinia());
app.mount('#app');
