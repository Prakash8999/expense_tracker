import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { addDocument, deleteDocument } from '@/db/queries';

export default function DocumentVaultScreen() {
  const { documents, loadDocuments } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  // New Document State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('receipt');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSaveDocument = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    let expiryDate = undefined;
    if (expiryDays) {
      const days = parseInt(expiryDays);
      if (!isNaN(days)) {
        expiryDate = Date.now() + days * 24 * 60 * 60 * 1000;
      }
    }

    await addDocument({
      title: title.trim(),
      type,
      imagePath: imageUri || undefined,
      expiryDate,
    });
    
    setModalVisible(false);
    setTitle('');
    setImageUri(null);
    setExpiryDays('');
    await loadDocuments();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDocument(id);
        await loadDocuments();
      }}
    ]);
  };

  const renderExpiryStatus = (expiryDate: number | null) => {
    if (!expiryDate) return null;
    const now = Date.now();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Text style={[styles.expiryText, { color: '#EF5350' }]}>Expired</Text>;
    } else if (diffDays <= 30) {
      return <Text style={[styles.expiryText, { color: '#F59E0B' }]}>Expires in {diffDays}d</Text>;
    } else {
      return <Text style={[styles.expiryText, { color: '#22C55E' }]}>Valid for {diffDays}d</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Vault</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {documents.map(doc => (
            <TouchableOpacity key={doc.id} style={styles.docCard} onPress={() => setSelectedDoc(doc)}>
              <View style={styles.imageContainer}>
                {doc.imagePath ? (
                  <Image source={{ uri: doc.imagePath }} style={styles.docImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="document-text" size={32} color="#CBD5E1" />
                  </View>
                )}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                {renderExpiryStatus(doc.expiryDate)}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {documents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Vault is empty. Add receipts or warranties!</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedDoc} transparent animationType="fade" onRequestClose={() => setSelectedDoc(null)}>
        <View style={styles.viewerOverlay}>
          <SafeAreaView edges={['top']} style={styles.viewerHeaderSafeArea}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity onPress={() => setSelectedDoc(null)} style={styles.viewerHeaderBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                  const id = selectedDoc?.id;
                  setSelectedDoc(null);
                  if (id) handleDelete(id);
                }} 
                style={styles.viewerHeaderBtn}
              >
                <Ionicons name="trash-outline" size={24} color="#EF5350" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {selectedDoc?.imagePath ? (
            <Image source={{ uri: selectedDoc.imagePath }} style={styles.viewerImage} resizeMode="contain" />
          ) : (
            <View style={styles.viewerPlaceholder}>
               <Ionicons name="document-text" size={64} color="#CBD5E1" />
               <Text style={styles.viewerPlaceholderText}>No image attached</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Document Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Document</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color="#6366F1" />
                    <Text style={styles.imagePickerText}>Tap to add photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <TextInput 
                style={styles.input} 
                placeholder="Title (e.g., MacBook Receipt)"
                placeholderTextColor="#94A3B8"
                value={title} 
                onChangeText={setTitle} 
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="Warranty length in days (Optional)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={expiryDays} 
                onChangeText={setExpiryDays} 
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDocument}>
                <Text style={styles.saveBtnText}>Save to Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  docCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC' },
  docImage: { width: '100%', height: '100%' },
  placeholderImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  docInfo: { padding: 12 },
  docTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  expiryText: { fontSize: 11, fontWeight: '700' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#94A3B8', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  
  imagePickerBtn: { width: '100%', height: 160, backgroundColor: '#EEF2FF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#6366F1', overflow: 'hidden' },
  imagePickerText: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#6366F1' },
  previewImage: { width: '100%', height: '100%' },

  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 16 },
  
  saveBtn: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  
  viewerOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  viewerHeaderSafeArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  viewerHeaderBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  viewerImage: { width: '100%', height: '100%' },
  viewerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  viewerPlaceholderText: { color: '#CBD5E1', marginTop: 12, fontSize: 16 },
});
