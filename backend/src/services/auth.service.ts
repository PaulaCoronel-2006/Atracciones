import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';

export class AuthService {

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    firstName: string;
    lastName: string;
    phone?: string;
    documentId?: string;
  }) {
    // Verificar si el email ya existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existing) {
      throw new Error('El correo electronico ya esta registrado');
    }

    // Hash de la contrasena
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Crear usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        full_name: data.fullName,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Error al crear usuario: ${userError.message}`);
    }

    // Crear perfil de cliente
    const { error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
        document_id: data.documentId
      });

    if (clientError) {
      // Rollback: eliminar usuario si falla la creacion del cliente
      await supabase.from('users').delete().eq('id', user.id);
      throw new Error(`Error al crear perfil de cliente: ${clientError.message}`);
    }

    // Asignar rol de Cliente
    const { data: clientRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Client')
      .single();

    if (clientRole) {
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role_id: clientRole.id
      });
    }

    // Generar token
    const token = this.generateToken(user.id, user.email, ['Client']);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      token
    };
  }

  async login(email: string, password: string) {
    // Buscar usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single();

    if (error || !user) {
      throw new Error('Credenciales invalidas');
    }

    // Verificar bloqueo
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      throw new Error('Cuenta bloqueada temporalmente. Intente mas tarde');
    }

    // Verificar contrasena
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      // Incrementar intentos fallidos
      const newAttempts = (user.failed_attempts || 0) + 1;
      const updateData: any = { failed_attempts: newAttempts };

      // Bloquear despues de 5 intentos
      if (newAttempts >= 5) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
        updateData.lockout_until = lockoutTime.toISOString();
      }

      await supabase.from('users').update(updateData).eq('id', user.id);
      throw new Error('Credenciales invalidas');
    }

    // Resetear intentos fallidos y actualizar ultimo acceso
    await supabase
      .from('users')
      .update({
        failed_attempts: 0,
        lockout_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    // Obtener roles del usuario
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles!role_id(name)')
      .eq('user_id', user.id);

    const roles = (userRoles || []).map((ur: any) => ur.role?.name).filter(Boolean);

    // Generar token
    const token = this.generateToken(user.id, user.email, roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles
      },
      token
    };
  }

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, email, full_name, is_active, last_login, created_at,
        client:clients!user_id(id, first_name, last_name, phone_number, document_id, birth_date),
        roles:user_roles(role:roles!role_id(name))
      `)
      .eq('id', userId)
      .single();

    if (error) throw new Error('Usuario no encontrado');

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      isActive: data.is_active,
      lastLogin: data.last_login,
      createdAt: data.created_at,
      client: data.client,
      roles: (data.roles as any[] || []).map((r: any) => r.role?.name).filter(Boolean)
    };
  }

  private generateToken(userId: string, email: string, roles: string[]): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no configurado');

    return jwt.sign(
      { userId, email, roles },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}
