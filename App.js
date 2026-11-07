import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Masukkan API Key Gemini dari Google AI Studio di sini
const API_KEY = ""; 
const genAI = new GoogleGenerativeAI(API_KEY);

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showStartPopup, setShowStartPopup] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const cameraRef = useRef(null);

  if (!permission) return <View style={styles.container} />;

  const startScan = async () => {
    if (!permission.granted) {
      await requestPermission();
    }
    setShowStartPopup(false);
    setIsScanning(true);
  };

  const processImageWithAI = async (base64Image) => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Analisis gambar ini secara detail dan jelaskan apa yang kamu temukan.";
      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
          }
        }
      ];
      const result = await model.generateContent([prompt, ...imageParts]);
      setScanResult(result.response.text());
    } catch (error) {
      setScanResult("Gagal menganalisis gambar: " + error.message);
    }
    setLoading(false);
    setShowResultPopup(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      setIsScanning(false);
      processImageWithAI(photo.base64);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tombol Utama */}
      {!isScanning && (
        <TouchableOpacity style={styles.mainButton} onPress={() => setShowStartPopup(true)}>
          <Text style={styles.buttonText}>Buka Scanner</Text>
        </TouchableOpacity>
      )}

      {/* Pop Up Mulai Scan */}
      <Modal visible={showStartPopup} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>Google AI Scanner</Text>
            <Text style={styles.popupText}>Arahkan kamera ke objek untuk dianalisis oleh AI.</Text>
            <TouchableOpacity style={styles.scanButton} onPress={startScan}>
              <Text style={styles.scanButtonText}>Mulai Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowStartPopup(false)}>
              <Text style={styles.closeButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UI Kamera / Scanner */}
      {isScanning && permission.granted && (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={cameraRef} facing="back">
            <View style={styles.overlay}>
              <View style={styles.scanBox} />
              <TouchableOpacity style={styles.checkButton} onPress={takePicture}>
                <Text style={styles.checkIcon}>✓</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {/* Pop Up Hasil Google AI */}
      <Modal visible={showResultPopup || loading} transparent={true} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.resultContainer}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#00ffcc" />
                <Text style={styles.loadingText}>Google AI sedang memproses...</Text>
              </>
            ) : (
              <>
                <Text style={styles.popupTitle}>Hasil Telusur AI</Text>
                <View style={styles.resultScroll}>
                  <Text style={styles.resultText}>{scanResult}</Text>
                </View>
                <TouchableOpacity style={styles.scanButton} onPress={() => setShowResultPopup(false)}>
                  <Text style={styles.scanButtonText}>Tutup</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  mainButton: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  buttonText: { color: '#00ffcc', fontSize: 18, fontWeight: 'bold' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  popupContainer: { backgroundColor: '#1e1e1e', padding: 30, borderRadius: 15, width: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  popupTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  popupText: { color: '#aaaaaa', fontSize: 15, marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  scanButton: { backgroundColor: '#00ffcc', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center' },
  scanButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  closeButton: { marginTop: 20 },
  closeButtonText: { color: '#ff5555', fontSize: 16, fontWeight: '600' },
  cameraContainer: { ...StyleSheet.absoluteFillObject },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 280, height: 280, borderWidth: 2, borderColor: '#00ffcc', backgroundColor: 'transparent', borderRadius: 16 },
  checkButton: { position: 'absolute', bottom: 60, backgroundColor: '#00ffcc', width: 75, height: 75, borderRadius: 37.5, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  checkIcon: { fontSize: 35, color: '#121212', fontWeight: 'bold' },
  resultContainer: { backgroundColor: '#1e1e1e', padding: 25, borderRadius: 15, width: '90%', maxHeight: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  loadingText: { color: '#00ffcc', marginTop: 15, fontSize: 16, fontWeight: '500' },
  resultScroll: { maxHeight: 400, marginVertical: 15, width: '100%' },
  resultText: { color: '#e0e0e0', fontSize: 15, lineHeight: 24 }
});
