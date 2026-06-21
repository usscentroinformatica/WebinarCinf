// src/services/authService.ts
import { db } from '../firebase/config';
import { ref, get, set, remove } from 'firebase/database';

// ============================================================
// TIPOS
// ============================================================
export interface AdminUser {
  email: string;
  hasPassword: boolean;
}

export interface WebinarConfig {
  scriptUrl: string;
  spreadsheetId: string;
}

// ============================================================
// VERIFICAR ADMINISTRADOR (SIN CONTRASEÑA)
// ============================================================
export const esAdmin = async (email: string): Promise<boolean> => {
  try {
    // 🔥 Usar webinar-config para webinar
    const adminsRef = ref(db, 'webinar-config/admins');
    const snapshot = await get(adminsRef);
    
    if (snapshot.exists()) {
      const admins = snapshot.val();
      for (const key in admins) {
        if (admins[key] === email.toLowerCase()) {
          console.log('✅ Admin encontrado:', email);
          return true;
        }
      }
    }
    console.log('❌ No es admin:', email);
    return false;
  } catch (error) {
    console.error('Error verificando admin:', error);
    return false;
  }
};

// ============================================================
// CONFIGURACIÓN DEL WEBINAR
// ============================================================
export const getConfigCompleta = async (): Promise<{ scriptUrl: string; spreadsheetId: string }> => {
  try {
    // 🔥 Usar webinar-config para webinar
    const configRef = ref(db, 'webinar-config/config');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      const config = snapshot.val();
      console.log('📦 Config completa cargada:', {
        scriptUrl: config.googleScriptUrl ? '✅' : '❌',
        spreadsheetId: config.spreadsheetId ? '✅' : '❌'
      });
      return {
        scriptUrl: config.googleScriptUrl || "",
        spreadsheetId: config.spreadsheetId || ""
      };
    }
    console.error('❌ No hay configuración en Firebase (webinar-config)');
    return { scriptUrl: "", spreadsheetId: "" };
  } catch (error) {
    console.error('Error cargando config completa:', error);
    return { scriptUrl: "", spreadsheetId: "" };
  }
};

export const getPeriodoActual = async (): Promise<string> => {
  try {
    // 🔥 Usar webinar-config para webinar
    const configRef = ref(db, 'webinar-config/config');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      const config = snapshot.val();
      return config.periodo || "WEBINAR NO CONFIGURADO";
    }
    return "WEBINAR NO CONFIGURADO";
  } catch (error) {
    console.error('Error cargando período:', error);
    return "WEBINAR NO CONFIGURADO";
  }
};

// ============================================================
// FUNCIONES PARA EL PANEL ADMIN
// ============================================================

export const verificarAdminWebinar = async (nombreUsuario: string): Promise<boolean> => {
  try {
    const adminsRef = ref(db, 'webinar-config/admins');
    const snapshot = await get(adminsRef);
    
    if (snapshot.exists()) {
      const admins = snapshot.val();
      for (const key in admins) {
        if (admins[key] === nombreUsuario.toLowerCase()) {
          console.log('✅ Administrador encontrado:', nombreUsuario);
          return true;
        }
      }
    }
    console.log('❌ No es administrador:', nombreUsuario);
    return false;
  } catch (error) {
    console.error('Error verificando admin:', error);
    return false;
  }
};

export const agregarAdminWebinar = async (nombreUsuario: string): Promise<boolean> => {
  try {
    const nombreLimpio = nombreUsuario.toLowerCase().trim();
    const key = nombreLimpio.replace(/[^a-zA-Z0-9]/g, '_');
    
    await set(ref(db, `webinar-config/admins/${key}`), nombreLimpio);
    console.log('✅ Admin agregado:', nombreLimpio);
    return true;
  } catch (error) {
    console.error('Error agregando admin:', error);
    return false;
  }
};

export const eliminarAdminWebinar = async (nombreUsuario: string): Promise<boolean> => {
  try {
    const nombreLimpio = nombreUsuario.toLowerCase().trim();
    const key = nombreLimpio.replace(/[^a-zA-Z0-9]/g, '_');
    
    await remove(ref(db, `webinar-config/admins/${key}`));
    console.log('✅ Admin eliminado:', nombreLimpio);
    return true;
  } catch (error) {
    console.error('Error eliminando admin:', error);
    return false;
  }
};

export const getAdminUsersWebinar = async (): Promise<AdminUser[]> => {
  try {
    const adminsRef = ref(db, 'webinar-config/admins');
    const snapshot = await get(adminsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const admins = snapshot.val();
    const adminUsers = Object.values(admins) as string[];
    
    return adminUsers.map(nombre => ({
      email: nombre,
      hasPassword: true
    }));
  } catch (error) {
    console.error('Error obteniendo admins:', error);
    return [];
  }
};

export const guardarConfigWebinar = async (config: {
  googleScriptUrl: string;
  periodo: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}): Promise<boolean> => {
  try {
    const configRef = ref(db, 'webinar-config/config');
    await set(configRef, {
      googleScriptUrl: config.googleScriptUrl,
      periodo: config.periodo,
      spreadsheetId: config.spreadsheetId || '',
      spreadsheetUrl: config.spreadsheetUrl || '',
      fechaActualizacion: new Date().toISOString()
    });
    console.log('✅ Configuración guardada en Firebase');
    return true;
  } catch (error) {
    console.error('Error guardando configuración:', error);
    return false;
  }
};