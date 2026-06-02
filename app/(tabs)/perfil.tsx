import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Modal, 
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { authStore } from '../../store/authStore';
import { puntosAPI } from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios'; 

export default function PerfilScreen() {
  const { userId, email, clearAuth, token } = authStore(); 
  const router = useRouter();
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- ESTADO GLOBAL PARA RECORDAR LOS DATOS DE LA DB ---
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    barrio: '',
    celular: '',
    foto_perfil: null as string | null
  });

  // --- ESTADOS PARA LOS MODALES ---
  const [modalVisible, setModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false); // <-- NUEVO: Modal de Términos
  const [guardando, setGuardando] = useState(false); 
  const [nombreEdit, setNombreEdit] = useState('');
  const [usuarioEdit, setUsuarioEdit] = useState('');
  const [celularEdit, setCelularEdit] = useState('');
  const [barrioEdit, setBarrioEdit] = useState('');
  const [fotoEdit, setFotoEdit] = useState<string | null>(null);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  useFocusEffect(useCallback(() => {
    if (!userId || !token) return;
    
    const cargarDatos = async () => {
      try {
        const resPuntos = await puntosAPI.getSaldo(userId);
        setPuntos(resPuntos.data.puntos);

        const resPerfil = await axios.get(
          `${supabaseUrl}/rest/v1/perfiles?id=eq.${userId}&select=*`,
          { headers: { apikey: supabaseKey!, Authorization: `Bearer ${token}` } }
        );
        
        if (resPerfil.data && resPerfil.data.length > 0) {
          const dbData = resPerfil.data[0];
          setPerfilData({
            nombre: dbData.nombre || '',
            barrio: dbData.barrio || '',
            celular: dbData.celular ? String(dbData.celular) : '',
            foto_perfil: dbData.foto_perfil || null
          });
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [userId, token]));

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const seleccionarFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1],
      quality: 0.2, 
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      setFotoEdit(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const guardarCambiosPerfil = async () => {
    if (!userId || !token) return;
    setGuardando(true);

    try {
      const payload = {
        nombre: nombreEdit.trim() === '' ? null : nombreEdit.trim(),
        barrio: barrioEdit.trim() === '' ? null : barrioEdit.trim(),
        celular: celularEdit.trim() === '' ? null : celularEdit.trim(),
        foto_perfil: fotoEdit 
      };

      await axios.patch(
        `${supabaseUrl}/rest/v1/perfiles?id=eq.${userId}`, 
        payload,
        {
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          }
        }
      );

      setPerfilData({
        nombre: nombreEdit,
        barrio: barrioEdit,
        celular: celularEdit,
        foto_perfil: fotoEdit
      });

      Alert.alert('¡Éxito!', 'Tu perfil ha sido actualizado correctamente.');
      setModalVisible(false);
    } catch (err: any) {
      console.error('Error al actualizar:', err?.response?.data || err.message);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = () => {
    const nombreInicial = perfilData.nombre || email?.split('@')[0] || '';
    setNombreEdit(nombreInicial);
    setUsuarioEdit(nombreInicial);
    setCelularEdit(perfilData.celular);
    setBarrioEdit(perfilData.barrio);
    setFotoEdit(perfilData.foto_perfil);
    setModalVisible(true);
  };

  const getNivel = (pts: number) => {
    if (pts >= 500) return { label: 'Eco Maestro 🌳', color: '#1B5E20' };
    if (pts >= 200) return { label: 'Eco Héroe 🌿', color: Colors.primary };
    if (pts >= 50)  return { label: 'Eco Aprendiz 🌱', color: Colors.primaryLight };
    return { label: 'Eco Novato 🌾', color: Colors.textSecondary };
  };

  const nivel = getNivel(puntos);
  const nombreDisplay = perfilData.nombre || email?.split('@')[0] || 'Usuario';

  return (
    <View style={styles.container}>
      
      {/* ============================================== */}
      {/* VISTA PRINCIPAL DEL PERFIL                     */}
      {/* ============================================== */}
      <LinearGradient colors={['#0D5C3A', '#1A8C58']} style={styles.headerGradient}>
        <View style={styles.avatar}>
          {perfilData.foto_perfil ? (
            <Image source={{ uri: perfilData.foto_perfil }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{nombreDisplay[0].toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.nombre}>{nombreDisplay}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={[styles.nivelBadge, { borderColor: nivel.color }]}>
          <Text style={[styles.nivelText, { color: '#fff' }]}>{nivel.label}</Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsCard}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{puntos}</Text>
              <Text style={styles.statLabel}>Puntos totales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.floor(puntos / 10)}</Text>
              <Text style={styles.statLabel}>Residuos reciclados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(puntos * 0.05).toFixed(1)}kg</Text>
              <Text style={styles.statLabel}>CO₂ reducido</Text>
            </View>
          </View>
        )}
      </View>

      {/* Menú de Opciones */}
      <View style={styles.menu}>
        
        <TouchableOpacity style={styles.menuItem} onPress={abrirModalEditar}>
          <Text style={styles.menuEmoji}>👤</Text>
          <Text style={styles.menuText}>Editar Perfil</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => setFaqModalVisible(true)}>
          <Text style={styles.menuEmoji}>❓</Text>
          <Text style={styles.menuText}>Preguntas Frecuentes</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* --- NUEVO BOTÓN CONECTADO A TÉRMINOS Y CONDICIONES --- */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setTermsModalVisible(true)}>
          <Text style={styles.menuEmoji}>📄</Text>
          <Text style={styles.menuText}>Términos y Condiciones</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>


      {/* ============================================== */}
      {/* 1. MODAL DE EDITAR PERFIL                      */}
      {/* ============================================== */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          >
            
            <LinearGradient colors={['#0D5C3A', '#1A8C58']} style={styles.modalHeaderGradient}>
              <TouchableOpacity style={styles.backButton} onPress={() => setModalVisible(false)}>
                <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.modalAvatarContainer}>
                <View style={styles.modalAvatar}>
                  {fotoEdit ? (
                    <Image source={{ uri: fotoEdit }} style={styles.modalAvatarImage} />
                  ) : (
                    <Text style={styles.modalAvatarText}>{nombreDisplay[0].toUpperCase()}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.editIconBadge} onPress={seleccionarFoto}>
                  <Text style={{ fontSize: 16 }}>📷</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalHeaderTitle}>Editar Perfil</Text>
            </LinearGradient>

            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Identidad</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de usuario</Text>
                <TextInput style={styles.input} value={nombreEdit} onChangeText={setNombreEdit} placeholder="Ej: Miguel Angel" placeholderTextColor={Colors.textSecondary} />
              </View>
              <Text style={styles.sectionTitle}>Contacto y Ubicación</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Celular (Para redimir puntos)</Text>
                <TextInput style={styles.input} value={celularEdit} onChangeText={setCelularEdit} placeholder="300 000 0000" keyboardType="phone-pad" placeholderTextColor={Colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Barrio o Zona</Text>
                <TextInput style={styles.input} value={barrioEdit} onChangeText={setBarrioEdit} placeholder="Ej: Laureles, Robledo, El Poblado..." placeholderTextColor={Colors.textSecondary} />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, guardando && { opacity: 0.7 }]} 
              onPress={guardarCambiosPerfil}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>


      {/* ============================================== */}
      {/* 2. MODAL DE PREGUNTAS FRECUENTES (FAQ)         */}
      {/* ============================================== */}
      <Modal visible={faqModalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          
          <LinearGradient colors={['#0D5C3A', '#1A8C58']} style={styles.infoModalHeaderGradient}>
            <TouchableOpacity style={styles.backButton} onPress={() => setFaqModalVisible(false)}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.infoModalHeaderTitle}>Preguntas Frecuentes ❓</Text>
          </LinearGradient>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
          >
            <Text style={styles.infoModalIntro}>Todo lo que necesitas saber para empezar a reciclar y ganar con EcoCycle.</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>♻️ ¿Cómo funciona EcoCycle?</Text>
              <Text style={styles.infoCardText}>Ve a la pestaña de "Escanear" y apunta tu cámara al residuo. Nuestra Inteligencia Artificial detectará el material y te indicará cómo clasificarlo correctamente.</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>🏆 ¿Cómo gano puntos?</Text>
              <Text style={styles.infoCardText}>Cada vez que escanees un residuo y sigas las instrucciones de clasificación, recibirás puntos automáticamente en tu saldo por tu buena labor ambiental.</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>💳 ¿En qué puedo usar mis puntos?</Text>
              <Text style={styles.infoCardText}>En el apartado de "Saldo" puedes redimir tus puntos acumulados por bolsas de basura, bolsas para el perro, obtener prioridad en reservas de espacios sociales y mas benficios.</Text>
            </View>

            <TouchableOpacity 
              style={styles.infoCloseButton} 
              onPress={() => setFaqModalVisible(false)}
            >
              <Text style={styles.infoCloseButtonText}>Entendido 👍</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ============================================== */}
      {/* 3. MODAL DE TÉRMINOS Y CONDICIONES             */}
      {/* ============================================== */}
      <Modal visible={termsModalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          
          <LinearGradient colors={['#0D5C3A', '#1A8C58']} style={styles.infoModalHeaderGradient}>
            <TouchableOpacity style={styles.backButton} onPress={() => setTermsModalVisible(false)}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.infoModalHeaderTitle}>Términos y Condiciones 📄</Text>
          </LinearGradient>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
          >
            <Text style={styles.infoModalIntro}>Última actualización: Mayo de 2026</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>1. Privacidad y Uso de la Cámara 📷</Text>
              <Text style={styles.infoCardText}>EcoCycle solicita acceso a la cámara exclusivamente para el análisis de residuos mediante Inteligencia Artificial. Las fotografías capturadas <Text style={{fontWeight: '700'}}>NO son almacenadas</Text> en nuestros servidores de forma permanente; se procesan en tiempo real para otorgar la clasificación y luego son descartadas.</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>2. Sistema de Puntos y Recompensas 🎁</Text>
              <Text style={styles.infoCardText}>Los "Puntos EcoCycle" son una moneda virtual promocional dentro de la aplicación. Pueden ser canjeados por beneficios específicos, como bolsas para la basura, bolsas para el perro, prioridad en reservas de espacios sociales. Estos puntos no tienen valor comercial fuera de la app y no pueden ser canjeados por dinero en efectivo directamente (por ahora).</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>3. Uso Adecuado de la Plataforma ⚖️</Text>
              <Text style={styles.infoCardText}>El usuario se compromete a usar la aplicación para su propósito educativo y ambiental. El abuso del sistema de escaneo (como escanear objetos no válidos repetidamente para farmear puntos) resultará en la invalidación del saldo o la suspensión temporal de la cuenta.</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>4. Tratamiento de Datos Personales 🔒</Text>
              <Text style={styles.infoCardText}>Los datos proporcionados en el perfil (Nombre, Celular y Barrio) son utilizados únicamente para la correcta gestión de tu cuenta y para poder hacer efectivos los beneficios y canjes asociados a tu número celular.</Text>
            </View>

            <TouchableOpacity 
              style={styles.infoCloseButton} 
              onPress={() => setTermsModalVisible(false)}
            >
              <Text style={styles.infoCloseButtonText}>Aceptar y Cerrar ✅</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

// ==========================================
// ESTILOS ESTÁTICOS
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingTop: 52, paddingBottom: Spacing.xl, alignItems: 'center', paddingHorizontal: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  nombre: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing.md },
  nivelBadge: { borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  nivelText: { fontSize: 13, fontWeight: '700' },
  statsCard: { backgroundColor: Colors.card, marginHorizontal: Spacing.md, marginTop: -Spacing.md, borderRadius: Radius.md, padding: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  menu: { backgroundColor: Colors.card, marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.md, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  menuEmoji: { fontSize: 20 },
  menuText: { flex: 1, fontSize: 15, color: Colors.text },
  menuArrow: { fontSize: 20, color: Colors.textSecondary },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 },
  logoutButton: { margin: Spacing.lg, borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },

  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeaderGradient: { paddingTop: 60, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, position: 'relative' },
  backButton: { position: 'absolute', top: 50, left: 20, padding: 10, zIndex: 10 },
  modalAvatarContainer: { position: 'relative' },
  modalAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden' },
  modalAvatarImage: { width: '100%', height: '100%' },
  modalAvatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.card, borderRadius: 20, padding: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  modalHeaderTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 15 },
  formContainer: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: -20, borderRadius: 15, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 15, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 16, color: Colors.text },
  saveButton: { backgroundColor: Colors.primary, marginHorizontal: 16, marginVertical: 25, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // --- ESTILOS REUTILIZABLES PARA MODALES INFORMATIVOS (FAQ Y T&C) ---
  infoModalHeaderGradient: { paddingTop: 60, paddingBottom: 25, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, position: 'relative' },
  infoModalHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 10 },
  infoModalIntro: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  infoCard: { backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  infoCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  infoCardText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  infoCloseButton: { backgroundColor: Colors.primaryLight, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  infoCloseButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});