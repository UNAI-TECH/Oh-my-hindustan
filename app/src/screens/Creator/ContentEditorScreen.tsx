import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { CreatorApi } from '../../api/services';
import CustomModal from '../../components/CustomModal';

const CATEGORIES = [
  'Politics', 'Economy', 'Digital India', 'Policy', 'Viksit Bharat',
  'Sports', 'Entertainment', 'Technology', 'Health', 'Education', 'General'
];

export default function ContentEditorScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const contentType: string = route.params?.contentType || 'BLOG';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; message: string; isError: boolean; onPrimaryPress?: () => void }>({ visible: false, title: '', message: '', isError: false });

  const typeLabel = contentType === 'BLOG' ? 'Blog' : contentType === 'NEWS' ? 'News' : 'Video';
  const typeIcon = contentType === 'BLOG' ? 'document-text' : contentType === 'NEWS' ? 'newspaper' : 'videocam';
  const typeColor = contentType === 'BLOG' ? '#8B5CF6' : contentType === 'NEWS' ? '#0EA5E9' : '#EF4444';

  const handlePublish = async () => {
    if (!title.trim()) {
      setModalConfig({ visible: true, title: 'Missing Title', message: 'Please enter a title for your content.', isError: true });
      return;
    }
    if (!content.trim()) {
      setModalConfig({ visible: true, title: 'Missing Content', message: 'Please enter the content body.', isError: true });
      return;
    }
    if (!category) {
      setModalConfig({ visible: true, title: 'Missing Category', message: 'Please select a category.', isError: true });
      return;
    }

    setIsPublishing(true);
    try {
      await CreatorApi.createPost({
        title: title.trim(),
        content: content.trim(),
        type: contentType,
        category,
        thumbnail: thumbnail.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        video_duration: contentType === 'VIDEO' ? videoDuration.trim() || undefined : undefined,
      });

      setModalConfig({
        visible: true,
        title: '🎉 Published!',
        message: `Your ${typeLabel.toLowerCase()} has been published successfully and is now live!`,
        isError: false,
        onPrimaryPress: () => {
          setModalConfig(prev => ({ ...prev, visible: false }));
          navigation.goBack();
        }
      });
    } catch (error: any) {
      console.error('Publish error:', error);
      setModalConfig({ visible: true, title: 'Publish Failed', message: error.message || 'Something went wrong. Please try again.', isError: true });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '1A' }]}>
            <Ionicons name={typeIcon as any} size={16} color={typeColor} />
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>New {typeLabel}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.publishBtn, (!title.trim() || !content.trim() || !category) && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={isPublishing || !title.trim() || !content.trim() || !category}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.publishBtnText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder={`Enter ${typeLabel.toLowerCase()} title...`}
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            multiline
          />

          {/* Category Selector */}
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Ionicons name="folder-outline" size={18} color={colors.Slate500} />
            <Text style={[styles.categorySelectorText, category ? { color: '#000' } : {}]}>
              {category || 'Select Category'}
            </Text>
            <Ionicons name={showCategories ? 'chevron-up' : 'chevron-down'} size={18} color={colors.Slate500} />
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => { setCategory(cat); setShowCategories(false); }}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Content Body */}
          <TextInput
            style={styles.contentInput}
            placeholder={`Write your ${typeLabel.toLowerCase()} content here...`}
            placeholderTextColor="#94A3B8"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Optional Fields */}
          <Text style={styles.sectionTitle}>Optional Details</Text>

          <View style={styles.inputRow}>
            <Ionicons name="image-outline" size={18} color={colors.Slate500} />
            <TextInput
              style={styles.optionalInput}
              placeholder="Thumbnail URL (optional)"
              placeholderTextColor="#94A3B8"
              value={thumbnail}
              onChangeText={setThumbnail}
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="text-outline" size={18} color={colors.Slate500} />
            <TextInput
              style={styles.optionalInput}
              placeholder="Subtitle (optional)"
              placeholderTextColor="#94A3B8"
              value={subtitle}
              onChangeText={setSubtitle}
            />
          </View>

          {contentType === 'VIDEO' && (
            <View style={styles.inputRow}>
              <Ionicons name="time-outline" size={18} color={colors.Slate500} />
              <TextInput
                style={styles.optionalInput}
                placeholder="Video duration (e.g., 12:30)"
                placeholderTextColor="#94A3B8"
                value={videoDuration}
                onChangeText={setVideoDuration}
              />
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  typeBadgeText: { fontSize: 13, fontWeight: '700' },
  publishBtn: {
    backgroundColor: colors.PrimaryRed, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  publishBtnDisabled: { opacity: 0.4 },
  publishBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  form: { padding: 20 },
  titleInput: {
    fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 16,
    minHeight: 48, lineHeight: 32,
  },
  categorySelector: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
  },
  categorySelectorText: { flex: 1, fontSize: 14, color: '#94A3B8' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  categoryChipActive: { backgroundColor: colors.PrimaryRed + '1A', borderColor: colors.PrimaryRed },
  categoryChipText: { fontSize: 13, color: colors.Slate500, fontWeight: '600' },
  categoryChipTextActive: { color: colors.PrimaryRed },
  contentInput: {
    fontSize: 16, lineHeight: 24, color: '#000', minHeight: 200,
    padding: 16, borderRadius: 12, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.Slate500, marginBottom: 12, letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10,
  },
  optionalInput: { flex: 1, fontSize: 14, color: '#000' },
});
