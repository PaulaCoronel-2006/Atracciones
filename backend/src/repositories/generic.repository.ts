import supabase from '../config/supabase';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  ascending?: boolean;
  searchTerm?: string;
  searchColumn?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class GenericRepository<T extends Record<string, any>> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      ascending = false,
      searchTerm,
      searchColumn,
      filters
    } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    // Aplicar filtros adicionales
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      }
    }

    // Aplicar busqueda por texto
    if (searchTerm && searchColumn) {
      query = query.ilike(searchColumn, `%${searchTerm}%`);
    }

    // Aplicar ordenamiento y paginacion
    query = query
      .order(sortBy, { ascending })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Error al consultar ${this.tableName}: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      items: (data || []) as T[],
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async findById(id: string, select?: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(select || '*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al buscar en ${this.tableName}: ${error.message}`);
    }

    return data as T;
  }

  async create(entity: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(entity)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear en ${this.tableName}: ${error.message}`);
    }

    return data as T;
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    const updateData = { ...entity, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar en ${this.tableName}: ${error.message}`);
    }

    return data as T;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar en ${this.tableName}: ${error.message}`);
    }
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar en ${this.tableName}: ${error.message}`);
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Error al contar en ${this.tableName}: ${error.message}`);
    }

    return count || 0;
  }
}
