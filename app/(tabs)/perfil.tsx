import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { authStore } from '../../store/authStore';
import { puntosAPI } from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function PerfilScreen() {
  const { userId, email, clearAuth } = authStore();
  const router = useRouter();
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    puntosAPI.getSaldo(userId)
      .then(res => setPuntos(res.data.puntos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]));

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

  const getNivel = (pts: number) => {
    if (pts >= 500) return { label: 'Eco Maestro 🌳', color: '#1B5E20' };
    if (pts >= 200) return { label: 'Eco Héroe 🌿', color: Colors.primary };
    if (pts >= 50)  return { label: 'Eco Aprendiz 🌱', color: Colors.primaryLight };
    return { label: 'Eco Novato 🌾', color: Colors.textSecondary };
  };

  const nivel = getNivel(puntos);
  const nombre = email?.split('@')[0] ?? 'Usuario';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C3A', '#1A8C58']} style={styles.headerGradient}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{nombre[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.nombre}>{nombre}</Text>
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

      {/* Menú */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuEmoji}>🔔</Text>
          <Text style={styles.menuText}>Notificaciones</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuEmoji}>📍</Text>
          <Text style={styles.menuText}>Puntos de reciclaje cercanos</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuEmoji}>❓</Text>
          <Text style={styles.menuText}>Ayuda y soporte</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    paddingTop: 52,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  nombre: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing.md },
  nivelBadge: {
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  nivelText: { fontSize: 13, fontWeight: '700' },
  statsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginTop: -Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  menu: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  menuEmoji: { fontSize: 20 },
  menuText: { flex: 1, fontSize: 15, color: Colors.text },
  menuArrow: { fontSize: 20, color: Colors.textSecondary },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 },
  logoutButton: {
    margin: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});
