import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import CustomModal from '../../components/CustomModal';

export default function CreatorFeedbackScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; message: string; isError: boolean; onPrimaryPress?: () => void }>({ visible: false, title: '', message: '', isError: false });

  const handleSend = async () => {
    if (!feedback.trim()) {
      setModalConfig({ visible: true, title: 'Empty Feedback', message: 'Please write your feedback before submitting.', isError: true });
      return;
    }
    setIsSending(true);
    // Simulate sending
    setTimeout(() => {
      setIsSending(false);
      setFeedback('');
      setModalConfig({ 
        visible: true, 
        title: 'Thank You! 🙏', 
        message: 'Your feedback has been submitted successfully. We appreciate it!', 
        isError: false, 
        onPrimaryPress: () => { setModalConfig(prev => ({ ...prev, visible: false })); navigation.goBack(); } 
      });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        <Text style={styles.label}>How can we improve the Creator Studio?</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Share your thoughts, ideas, or report issues..."
          placeholderTextColor="#94A3B8"
          value={feedback}
          onChangeText={setFeedback}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!feedback.trim() || isSending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!feedback.trim() || isSending}
        >
          <Ionicons name="send" size={18} color="white" />
          <Text style={styles.sendBtnText}>{isSending ? 'Sending...' : 'Submit Feedback'}</Text>
        </TouchableOpacity>
      </View>

      <CustomModal 
        visible={modalConfig.visible} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        isError={modalConfig.isError} 
        onPrimaryPress={modalConfig.onPrimaryPress || (() => setModalConfig(prev => ({ ...prev, visible: false })))} 
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 12 },
  textarea: {
    backgroundColor: 'white', borderRadius: 16, padding: 16, fontSize: 15,
    borderWidth: 1, borderColor: '#E2E8F0', minHeight: 200, lineHeight: 24, color: '#000',
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.PrimaryRed, padding: 16, borderRadius: 16, marginTop: 24,
  },
  sendBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
