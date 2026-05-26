import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { residuosAPI, AnalysisResult } from '../../services/api';
import { authStore } from '../../store/authStore';
import { Colors, Spacing, Radius } from '../../constants/theme';

const CLASIFICACION_CONFIG = {
  'Reciclable':       { color: Colors.reciclable,      emoji: '♻️',  bg: '#E8F5E9' },
  'Orgánico':         { color: Colors.organico,         emoji: '🌱',  bg: '#FFF8E1' },
  'No Aprovechable':  { color: Colors.noAprovechable,   emoji: '🗑️',  bg: '#FFEBEE' },
};

export default function ScannerScreen() {
  const { userId } = authStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
        <Text style={styles.permissionText}>
          EcoCycle necesita la cámara para analizar tus residuos con IA.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Permitir acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || loading) return;

    setLoading(true);
    try {
      // 1. Capturar foto
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('No se pudo capturar la imagen.');

      // 2. Comprimir a máx 800px para no exceder el límite de Vercel (4.5MB)
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!compressed.base64) throw new Error('Error al convertir imagen.');

      // 3. Enviar al backend → Gemini → Supabase
      const res = await residuosAPI.analizar(compressed.base64, userId!);
      setResult(res.data.resultado);
      setShowModal(true);

    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'No se pudo analizar la imagen.';
      Alert.alert('Error al analizar', msg);
    } finally {
      setLoading(false);
    }
  };

  const config = result
    ? CLASIFICACION_CONFIG[result.clasificacion] ?? CLASIFICACION_CONFIG['No Aprovechable']
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>♻️ Escanear residuo</Text>
        <Text style={styles.headerSubtitle}>Apunta al objeto y captura</Text>
      </View>

      {/* Camera */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Guía visual */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Centra el residuo dentro del marco</Text>
        </View>
      </CameraView>

      {/* Capture button */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureButton, loading && styles.captureDisabled]}
          onPress={handleCapture}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.captureInner}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.analyzingText}>Analizando con IA...</Text>
            </View>
          ) : (
            <View style={styles.captureInner}>
              <Text style={styles.captureEmoji}>📸</Text>
              <Text style={styles.captureText}>Analizar residuo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {result && config && (
                <>
                  {/* Clasificación badge */}
                  <View style={[styles.badge, { backgroundColor: config.bg }]}>
                    <Text style={styles.badgeEmoji}>{config.emoji}</Text>
                    <Text style={[styles.badgeText, { color: config.color }]}>
                      {result.clasificacion}
                    </Text>
                  </View>

                  {/* Objeto detectado */}
                  <Text style={styles.objectName}>{result.objeto}</Text>
                  <Text style={styles.materialText}>Material: {result.material}</Text>

                  {/* Puntos ganados */}
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsLabel}>Puntos ganados</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsValue}>+{result.puntos_ganados} pts</Text>
                    </View>
                  </View>
                  <Text style={styles.saldoText}>
                    Saldo nuevo: <Text style={styles.saldoBold}>{result.saldo_nuevo} puntos</Text>
                  </Text>

                  {/* Instrucción */}
                  <View style={styles.instruccionCard}>
                    <Text style={styles.instruccionTitle}>📌 ¿Cómo disponerlo?</Text>
                    <Text style={styles.instruccionText}>{result.instruccion}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => { setShowModal(false); setResult(null); }}
                  >
                    <Text style={styles.closeButtonText}>Escanear otro ♻️</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: Radius.md,
  },
  scanHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  controls: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingBottom: 32,
  },
  captureButton: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  captureDisabled: { opacity: 0.7 },
  captureInner: { alignItems: 'center', gap: 4 },
  captureEmoji: { fontSize: 28 },
  captureText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  analyzingText: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    gap: 6,
  },
  badgeEmoji: { fontSize: 18 },
  badgeText: { fontSize: 14, fontWeight: '700' },
  objectName: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  materialText: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  pointsBadge: {
    backgroundColor: Colors.accentYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pointsValue: { fontSize: 15, fontWeight: '800', color: '#7A5700' },
  saldoText: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.lg },
  saldoBold: { fontWeight: '700', color: Colors.primary },
  instruccionCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryLight,
  },
  instruccionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  instruccionText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Permissions
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  permissionEmoji: { fontSize: 64, marginBottom: Spacing.md },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  permissionText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  permissionButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
