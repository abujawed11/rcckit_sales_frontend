import "../../global.css";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { qcDocsAPI, getApiUrl, API_CONFIG } from '@/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Order = {
  id: string;
  project_id?: string;
  client_name?: string;
  sr?: string;
};

export default function OrderQCDocs() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const order: Order = params.order ? JSON.parse(params.order as string) : {};
  
  const [qcFiles, setQcFiles] = useState<any[]>([]);
  const [qcDocName, setQcDocName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadQCDocs();
  }, []);

  const loadQCDocs = async () => {
    try {
      if (order.sr) {
        const files = await qcDocsAPI.getBySr(order.sr);
        setQcFiles(files || []);
      }
    } catch (e) {
      console.log('QC docs fetch error:', e);
    }
  };

  const handleFileUpload = async () => {
    try {
      setUploadingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const sr = order.sr;
        if (!sr) throw new Error('No SR found for upload');
        
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name
        } as any);
        formData.append('file_name', qcDocName || file.name);
        formData.append('sr', sr);
        
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const uploaded_at_str = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        formData.append('uploaded_at_str', uploaded_at_str);

        const token = await AsyncStorage.getItem('access_token');
        const url = getApiUrl(API_CONFIG.ENDPOINTS.QC_DOCS);
        const response = await fetch(url, {
          method: 'POST',
          body: formData as any,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.ok) {
          Alert.alert('Success', 'Document uploaded successfully!');
          setQcDocName('');
          await loadQCDocs();
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDownload = async (fileUrl: string, fileName: string) => {
    try {
      if (Platform.OS === 'web') {
        Linking.openURL(fileUrl);
      } else {
        const downloadDir = FileSystem.documentDirectory + fileName;
        const { uri } = await FileSystem.downloadAsync(fileUrl, downloadDir);
        Alert.alert('Success', `File downloaded to: ${uri}`);
      }
    } catch (error) {
      console.error('File download error:', error);
      Alert.alert('Error', 'Failed to download file.');
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await qcDocsAPI.patch(String(docId), { deleted: 'Yes' });
      await loadQCDocs();
      Alert.alert('Success', 'Document deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete document');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-primary-950 px-4 py-4 flex-row justify-between items-center">
          <Pressable onPress={() => router.navigate('/(main)/confirmed-orders')}>
            <Ionicons name="arrow-back" size={24} color="#FAD90E" />
          </Pressable>
          <Text className="text-secondary text-xl font-bold">QC Documents</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            {/* Upload Section */}
            <View className="bg-white rounded-xl p-4 shadow-md">
              <Text className="text-primary-950 text-lg font-bold mb-3">Upload QC Document</Text>
              
              <View className="mb-3">
                <Text className="text-gray-700 text-sm mb-1">Document Name</Text>
                <TextInput
                  value={qcDocName}
                  onChangeText={setQcDocName}
                  placeholder="e.g., Invoice"
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <Pressable
                onPress={handleFileUpload}
                className="bg-secondary px-4 py-2 rounded-lg flex-row items-center justify-center"
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <ActivityIndicator size="small" color="#0a0a0a" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#0a0a0a" />
                    <Text className="text-primary-950 font-bold ml-2">Upload Document</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Documents List */}
            <Text className="text-primary-950 text-lg font-bold">
              QC Documents for {order.project_id}
            </Text>

            {qcFiles && qcFiles.length > 0 ? (
              qcFiles.map((doc: any) => (
                <View key={doc.id} className="bg-white rounded-xl p-4 shadow-md">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-primary-950 font-bold">{doc.file_name || doc.document_name}</Text>
                      <Text className="text-gray-600 text-sm">Uploaded: {doc.uploaded_at_str || doc.upload_date}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleFileDownload(doc.file || doc.file_url || '', doc.file_name || doc.document_name || 'document')}
                      className="bg-blue-500 px-3 py-2 rounded-lg mr-2"
                    >
                      <Ionicons name="download" size={16} color="white" />
                    </Pressable>
                  </View>
                  <View className="flex-row justify-end mt-2">
                    <Pressable
                      onPress={() => handleDeleteDoc(doc.id)}
                      className="bg-red-500 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-white">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg mt-4">No QC documents uploaded</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}