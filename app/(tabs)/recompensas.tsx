import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { puntosAPI, Recompensa } from '../../services/api';
import { authStore } from '../../store/authStore';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function RecompensasScreen() {
  const { userId } = authStore();
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!userId) return;
    try {
      const [saldoRes, recompRes] = await Promise.all([
        puntosAPI.getSaldo(userId),
        puntosAPI.getRecompensas(),
      ]);
      setPuntos(saldoRes.data.puntos);
      setRecompensas(recompRes.data.recompensas);
    } catch (e) {
      console.error('Error cargando recompensas:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [userId]));

  const handleCanjear = (recompensa: Recompensa) => {
    if (puntos < recompensa.costo_puntos) {
      Alert.alert(
        'Puntos insuficientes',
        `Necesitas ${recompensa.costo_puntos} pts. Te faltan ${recompensa.costo_puntos - puntos} pts.`
      );
      return;
    }
    Alert.alert(
      `¿Canjear ${recompensa.titulo}?`,
      `Gastarás ${recompensa.costo_puntos} puntos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Canjear ✅', onPress: () => ejecutarCanje(recompensa) },
      ]
    );
  };

  const ejecutarCanje = async (recompensa: Recompensa) => {
    setCanjeando(recompensa.id);
    try {
      const res = await puntosAPI.canjear(userId!, recompensa.id);
      const { saldo_restante, message } = res.data;
      setPuntos(saldo_restante);
      Alert.alert('¡Canjeado! 🎉', message);
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Error al canjear.';
      Alert.alert('Error', msg);
    } finally {
      setCanjeando(null);
    }
  };

  const renderItem = ({ item }: { item: Recompensa }) => {
    const puedeComprar = puntos >= item.costo_puntos;
    return (
      <View style={[styles.card, !puedeComprar && styles.cardDisabled]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardEmoji}>🎁</Text>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{item.stock} disponibles</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        {item.descripcion && (
          <Text style={styles.cardDesc}>{item.descripcion}</Text>
        )}
        <View style={styles.cardBottom}>
          <View style={styles.costoBadge}>
            <Text style={styles.costoText}>{item.costo_puntos} pts</Text>
          </View>
          <TouchableOpacity
            style={[styles.canjearButton, !puedeComprar && styles.canjearDisabled]}
            onPress={() => handleCanjear(item)}
            disabled={!!canjeando || !puedeComprar}
          >
            {canjeando === item.id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.canjearText}>
                  {puedeComprar ? 'Canjear' : 'Sin puntos'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎁 Tienda de premios</Text>
        <View style={styles.saldoRow}>
          <Text style={styles.saldoLabel}>Mis puntos</Text>
          <View style={styles.saldoBadge}>
            <Text style={styles.saldoValue}>{puntos} pts 🏆</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : recompensas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏪</Text>
          <Text style={styles.emptyTitle}>Sin recompensas por ahora</Text>
          <Text style={styles.emptyText}>Próximamente habrá premios para canjear.</Text>
        </View>
      ) : (
        <FlatList
          data={recompensas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: Spacing.md },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saldoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  saldoBadge: {
    backgroundColor: Colors.accentYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  saldoValue: { fontSize: 15, fontWeight: '800', color: '#7A5700' },
  list: { padding: Spacing.md },
  columnWrapper: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDisabled: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardEmoji: { fontSize: 28 },
  stockBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  stockText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 16 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  costoBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  costoText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  canjearButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  canjearDisabled: { backgroundColor: Colors.textSecondary },
  canjearText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
