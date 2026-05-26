import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { authStore } from '../../store/authStore';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { puntosAPI } from '../../services/api';

// Llamamos directo a Supabase REST para el historial
// (no hay endpoint de historial en el backend, lo hacemos desde el cliente)
import axios from 'axios';

type RegistroResiduo = {
  id: string;
  created_at: string;
  puntos_ganados: number;
  descripcion_ia: string;
};

export default function HistorialScreen() {
  const { userId } = authStore();
  const [registros, setRegistros] = useState<RegistroResiduo[]>([]);
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!userId) return;
    try {
      // Saldo de puntos
      const saldoRes = await puntosAPI.getSaldo(userId);
      setPuntos(saldoRes.data.puntos);

      // Historial directo via Supabase REST
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const res = await axios.get(
        `${supabaseUrl}/rest/v1/registros_residuos?perfil_id=eq.${userId}&order=created_at.desc&limit=50`,
        { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }
      );
      setRegistros(res.data);
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [userId]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: RegistroResiduo }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>♻️</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion_ia}</Text>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardPoints}>+{item.puntos_ganados}</Text>
        <Text style={styles.cardPointsLabel}>pts</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con saldo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Mi historial</Text>
        <View style={styles.saldoRow}>
          <Text style={styles.saldoLabel}>Saldo total</Text>
          <View style={styles.saldoBadge}>
            <Text style={styles.saldoValue}>{puntos} pts 🏆</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : registros.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Sin registros aún</Text>
          <Text style={styles.emptyText}>Escanea tu primer residuo para comenzar a ganar puntos.</Text>
        </View>
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
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
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: { marginRight: Spacing.sm },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardDesc: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  cardDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  cardRight: { alignItems: 'center', minWidth: 44 },
  cardPoints: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  cardPointsLabel: { fontSize: 10, color: Colors.textSecondary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
