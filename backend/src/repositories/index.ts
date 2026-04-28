import { GenericRepository } from './generic.repository';
import supabase from '../config/supabase';

export class AttractionRepository extends GenericRepository<any> {
  constructor() {
    super('attractions');
  }

  async findWithDetails(id: string) {
    const { data, error } = await supabase
      .from('attractions')
      .select(`
        *,
        city:cities!city_id(id, name, country:countries!country_id(id, name, iso_code)),
        subcategory:subcategories!subcategory_id(id, name, category:categories!category_id(id, name)),
        media:attraction_media(*),
        product_options(
          *,
          price_tiers(*),
          availability_slots(*)
        )
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al buscar atraccion: ${error.message}`);
    }

    return data;
  }

  async findAllWithRelations(options: {
    page?: number;
    pageSize?: number;
    cityId?: string;
    subcategoryId?: string;
    categoryId?: string;
    searchTerm?: string;
    sortBy?: string;
    ascending?: boolean;
  } = {}) {
    const {
      page = 1,
      pageSize = 10,
      cityId,
      subcategoryId,
      searchTerm,
      sortBy = 'created_at',
      ascending = false
    } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('attractions')
      .select(`
        *,
        city:cities!city_id(id, name),
        subcategory:subcategories!subcategory_id(id, name, category:categories!category_id(id, name)),
        media:attraction_media(id, url, media_type, is_main, display_order)
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .eq('is_active', true);

    if (cityId) query = query.eq('city_id', cityId);
    if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);
    if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);

    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Error al listar atracciones: ${error.message}`);
    }

    const totalCount = count || 0;

    return {
      items: data || [],
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: page < Math.ceil(totalCount / pageSize),
      hasPrevious: page > 1
    };
  }

  async updateRating(attractionId: string, averageRating: number, totalReviews: number) {
    const { error } = await supabase
      .from('attractions')
      .update({
        rating_average: averageRating,
        total_reviews: totalReviews,
        updated_at: new Date().toISOString()
      })
      .eq('id', attractionId);

    if (error) {
      throw new Error(`Error al actualizar calificacion: ${error.message}`);
    }
  }
}

export class CountryRepository extends GenericRepository<any> {
  constructor() { super('countries'); }
}

export class CityRepository extends GenericRepository<any> {
  constructor() { super('cities'); }

  async findByCountry(countryId: string) {
    const { data, error } = await supabase
      .from('cities')
      .select('*, country:countries!country_id(id, name, iso_code)')
      .eq('country_id', countryId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) throw new Error(`Error al buscar ciudades: ${error.message}`);
    return data || [];
  }
}

export class CategoryRepository extends GenericRepository<any> {
  constructor() { super('categories'); }

  async findAllWithSubcategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(*)')
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) throw new Error(`Error al buscar categorias: ${error.message}`);
    return data || [];
  }
}

export class SubcategoryRepository extends GenericRepository<any> {
  constructor() { super('subcategories'); }
}

export class ProductOptionRepository extends GenericRepository<any> {
  constructor() { super('product_options'); }

  async findByAttraction(attractionId: string) {
    const { data, error } = await supabase
      .from('product_options')
      .select('*, price_tiers(*), availability_slots(*)')
      .eq('attraction_id', attractionId)
      .eq('is_deleted', false);

    if (error) throw new Error(`Error al buscar modalidades: ${error.message}`);
    return data || [];
  }
}

export class AvailabilitySlotRepository extends GenericRepository<any> {
  constructor() { super('availability_slots'); }

  // Override: availability_slots may not have is_deleted column
  async findSlotById(slotId: string) {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('id', slotId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al buscar slot: ${error.message}`);
    }
    return data;
  }

  async findAvailable(productId: string, date: string) {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('product_id', productId)
      .eq('slot_date', date)
      .eq('is_active', true)
      .gt('capacity_available', 0)
      .order('start_time', { ascending: true });

    if (error) throw new Error(`Error al buscar disponibilidad: ${error.message}`);
    return data || [];
  }

  async decreaseCapacity(slotId: string, quantity: number) {
    const slot = await this.findSlotById(slotId);
    if (!slot) throw new Error('Slot no encontrado');
    if (slot.capacity_available < quantity) {
      throw new Error('No hay suficientes cupos disponibles');
    }

    const { error } = await supabase
      .from('availability_slots')
      .update({
        capacity_available: slot.capacity_available - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId);

    if (error) throw new Error(`Error al actualizar capacidad: ${error.message}`);
  }

  async increaseCapacity(slotId: string, quantity: number) {
    const slot = await this.findSlotById(slotId);
    if (!slot) throw new Error('Slot no encontrado');

    const newCapacity = Math.min(slot.capacity_available + quantity, slot.capacity_total);

    const { error } = await supabase
      .from('availability_slots')
      .update({
        capacity_available: newCapacity,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId);

    if (error) throw new Error(`Error al restaurar capacidad: ${error.message}`);
  }
}

export class BookingRepository extends GenericRepository<any> {
  constructor() { super('bookings'); }

  async findWithDetails(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients!client_id(id, first_name, last_name, phone_number, user:users!user_id(email)),
        slot:availability_slots!slot_id(
          *,
          product:product_options!product_id(
            *,
            attraction:attractions!attraction_id(id, name, address)
          )
        ),
        details:booking_details(*, price_tier:price_tiers!price_tier_id(label, price)),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al buscar reserva: ${error.message}`);
    }

    return data;
  }

  async findByClient(clientId: string, page = 1, pageSize = 10) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('bookings')
      .select(`
        *,
        slot:availability_slots!slot_id(
          slot_date,
          start_time,
          product:product_options!product_id(
            title,
            attraction:attractions!attraction_id(id, name)
          )
        ),
        details:booking_details(id)
      `, { count: 'exact' })
      .eq('client_id', clientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Error al buscar reservas del cliente: ${error.message}`);

    const totalCount = count || 0;
    return {
      items: data || [],
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: page < Math.ceil(totalCount / pageSize),
      hasPrevious: page > 1
    };
  }
}

export class BookingDetailRepository extends GenericRepository<any> {
  constructor() { super('booking_details'); }
}

export class PaymentRepository extends GenericRepository<any> {
  constructor() { super('payments'); }
}

export class PriceTierRepository extends GenericRepository<any> {
  constructor() { super('price_tiers'); }
}

export class ReviewRepository extends GenericRepository<any> {
  constructor() { super('reviews'); }

  async findByAttraction(attractionId: string, page = 1, pageSize = 10) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('reviews')
      .select(`
        *,
        client:clients!client_id(first_name, last_name),
        ratings:review_ratings(criteria_name, score),
        booking:bookings!booking_id(
          slot:availability_slots!slot_id(
            product:product_options!product_id(
              attraction_id
            )
          )
        )
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Error al buscar resenas: ${error.message}`);

    // Filtrar solo las del attraction_id dado
    const filtered = (data || []).filter((r: any) =>
      r.booking?.slot?.product?.attraction_id === attractionId
    );

    const totalCount = count || 0;
    return {
      items: filtered,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: page < Math.ceil(totalCount / pageSize),
      hasPrevious: page > 1
    };
  }
}

export class ReviewRatingRepository extends GenericRepository<any> {
  constructor() { super('review_ratings'); }
}

export class MediaRepository extends GenericRepository<any> {
  constructor() { super('attraction_media'); }
}

export class ClientRepository extends GenericRepository<any> {
  constructor() { super('clients'); }

  async findByUserId(userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al buscar cliente: ${error.message}`);
    }
    return data;
  }
}

export class AuditRepository extends GenericRepository<any> {
  constructor() { super('audit_logs'); }

  async findByEntity(entityName: string, entityId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_name', entityName)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(`Error al buscar auditoria: ${error.message}`);
    return data || [];
  }
}
