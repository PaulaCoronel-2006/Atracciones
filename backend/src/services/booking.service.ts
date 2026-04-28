import {
  BookingRepository,
  BookingDetailRepository,
  PaymentRepository,
  AvailabilitySlotRepository,
  ClientRepository,
  PriceTierRepository
} from '../repositories';

export class BookingService {
  private bookingRepo = new BookingRepository();
  private detailRepo = new BookingDetailRepository();
  private paymentRepo = new PaymentRepository();
  private slotRepo = new AvailabilitySlotRepository();
  private clientRepo = new ClientRepository();
  private priceTierRepo = new PriceTierRepository();

  async createBooking(data: {
    clientId: string;
    slotId: string;
    specialRequirements?: string;
    travelers: Array<{
      name: string;
      document?: string;
      age?: number;
      priceTierId: string;
    }>;
    paymentMethod?: string;
  }) {
    // Verificar que el slot existe y tiene disponibilidad
    const slot = await this.slotRepo.findById(data.slotId);
    if (!slot) throw new Error('Horario no encontrado');
    if (!slot.is_active) throw new Error('Horario no disponible');

    const totalTravelers = data.travelers.length;
    if (slot.capacity_available < totalTravelers) {
      throw new Error(`No hay suficientes cupos. Disponibles: ${slot.capacity_available}`);
    }

    // Calcular monto total
    let totalAmount = 0;
    const detailsToCreate = [];

    for (const traveler of data.travelers) {
      const tier = await this.priceTierRepo.findById(traveler.priceTierId);
      if (!tier) throw new Error(`Tarifa no encontrada: ${traveler.priceTierId}`);

      totalAmount += Number(tier.price);
      detailsToCreate.push({
        traveler_name: traveler.name,
        traveler_document: traveler.document,
        traveler_age: traveler.age,
        price_tier_id: traveler.priceTierId,
        unit_price: tier.price
      });
    }

    // Generar codigo PNR unico
    const pnrCode = this.generatePNR();

    // Crear la reserva
    const booking = await this.bookingRepo.create({
      pnr_code: pnrCode,
      client_id: data.clientId,
      slot_id: data.slotId,
      status: data.paymentMethod ? 'confirmed' : 'pending',
      total_amount: totalAmount,
      total_paid: 0,
      special_requirements: data.specialRequirements
    });

    // Crear detalles de pasajeros
    for (const detail of detailsToCreate) {
      await this.detailRepo.create({
        ...detail,
        booking_id: booking.id
      });
    }

    // Disminuir capacidad del slot
    await this.slotRepo.decreaseCapacity(data.slotId, totalTravelers);

    // Si se indico metodo de pago, registrar pago
    if (data.paymentMethod) {
      await this.paymentRepo.create({
        booking_id: booking.id,
        payment_method: data.paymentMethod,
        amount: totalAmount,
        status: 'succeeded'
      });

      await this.bookingRepo.update(booking.id, {
        total_paid: totalAmount,
        status: 'confirmed'
      });
    }

    return await this.bookingRepo.findWithDetails(booking.id);
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const booking = await this.bookingRepo.findWithDetails(bookingId);
    if (!booking) throw new Error('Reserva no encontrada');

    if (booking.status === 'cancelled') {
      throw new Error('La reserva ya fue cancelada');
    }
    if (booking.status === 'completed') {
      throw new Error('No se puede cancelar una reserva completada');
    }

    // Contar pasajeros para restaurar capacidad
    const travelerCount = booking.details?.length || 0;

    // Cambiar estado
    await this.bookingRepo.update(bookingId, {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    });

    // Restaurar capacidad del slot
    if (booking.slot_id) {
      await this.slotRepo.increaseCapacity(booking.slot_id, travelerCount);
    }

    return { message: 'Reserva cancelada exitosamente', pnrCode: booking.pnr_code };
  }

  async getBooking(bookingId: string) {
    return await this.bookingRepo.findWithDetails(bookingId);
  }

  async getBookingsByClient(clientId: string, page = 1, pageSize = 10) {
    return await this.bookingRepo.findByClient(clientId, page, pageSize);
  }

  async findByPnr(pnrCode: string) {
    const { data, error } = await (await import('../config/supabase')).default
      .from('bookings')
      .select('*')
      .eq('pnr_code', pnrCode.toUpperCase())
      .single();

    if (error || !data) return null;
    return await this.bookingRepo.findWithDetails(data.id);
  }

  async registerPayment(bookingId: string, paymentData: {
    paymentMethod: string;
    amount: number;
    transactionExternalId?: string;
  }) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new Error('Reserva no encontrada');

    const payment = await this.paymentRepo.create({
      booking_id: bookingId,
      payment_method: paymentData.paymentMethod,
      amount: paymentData.amount,
      transaction_external_id: paymentData.transactionExternalId,
      status: 'succeeded'
    });

    const newTotalPaid = Number(booking.total_paid || 0) + paymentData.amount;

    await this.bookingRepo.update(bookingId, {
      total_paid: newTotalPaid,
      status: newTotalPaid >= Number(booking.total_amount) ? 'confirmed' : 'pending'
    });

    return payment;
  }

  private generatePNR(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
