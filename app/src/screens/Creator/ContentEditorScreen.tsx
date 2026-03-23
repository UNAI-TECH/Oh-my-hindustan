import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import StudioBottomNavBar from '../../components/StudioBottomNavBar';

export default function ContentEditorScreen() {
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState("Expert Briefing");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jan Samvad Forum</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 8 }}>
             <Text style={{ color: Colors.Slate500, fontWeight: 'bold' }}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn}>
             <Text style={{ color: 'white', fontWeight: 'bold' }}>Publish</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {['Expert Briefing', 'Policy Analysis'].map(tab => (
           <TouchableOpacity 
             key={tab} 
             onPress={() => setSelectedTab(tab)}
             style={[styles.tab, selectedTab === tab && styles.tabActive]}
           >
             <Text style={{ color: Colors.PrimaryRed, fontWeight: selectedTab === tab ? 'bold' : 'normal', fontSize: 14 }}>{tab}</Text>
           </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {selectedTab === "Expert Briefing" ? <VideoUploadSection /> : <BlogEditorSection />}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <StudioBottomNavBar 
          currentRoute="ContentEditor" 
          onNavigate={(route) => navigation.navigate(route)}
          onExit={() => navigation.navigate('Home')} 
        />
      </View>
    </SafeAreaView>
  );
}

const VideoUploadSection = () => (
  <View>
    <View style={styles.uploadZone}>
      <View style={styles.uploadCircle}>
        <Ionicons name="cloud-upload-outline" size={32} color={Colors.PrimaryRed} />
      </View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Select briefing video to upload</Text>
      <Text style={{ fontSize: 12, color: Colors.Slate500, marginTop: 4 }}>MP4, WebM or OGG. Up to 2GB.</Text>
    </View>

    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, color: Colors.Slate500 }}>Uploading...</Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.PrimaryRed }}>65%</Text>
      </View>
      <View style={{ width: '100%', height: 10, borderRadius: 5, backgroundColor: Colors.PrimaryRedAlpha10, overflow: 'hidden' }}>
        <View style={{ width: '65%', height: '100%', backgroundColor: Colors.PrimaryRed }} />
      </View>
    </View>

    <Text style={{ fontSize: 16, fontWeight: '900', marginTop: 32, marginBottom: 16 }}>Video Metadata</Text>
    
    <TextInput
      style={styles.input}
      placeholder="Briefing Headline - Enter the main topic"
      placeholderTextColor={Colors.Slate400}
    />
    <TextInput
      style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
      placeholder="Briefing Summary - Provide context for this political briefing"
      placeholderTextColor={Colors.Slate400}
      multiline
    />
  </View>
);

const BlogEditorSection = () => (
  <View>
    <TouchableOpacity style={styles.heroUpload}>
      <Ionicons name="image-outline" size={48} color="lightgray" />
      <Text style={{ color: 'gray', fontSize: 14, marginTop: 8 }}>Add Cover Image</Text>
    </TouchableOpacity>

    <TextInput
      style={styles.titleInput}
      placeholder="Policy Analysis Title..."
      placeholderTextColor="lightgray"
    />

    <View style={styles.toolbar}>
      {[
        { id: 'bold', name: 'text' },
        { id: 'italic', name: 'text-outline' },
        { id: 'quote', name: 'chatbox-outline' },
        { id: 'link', name: 'link-outline' },
        { id: 'code', name: 'code-outline' }
      ].map(icon => (
        <Ionicons key={icon.id} name={icon.name as any} size={20} color="gray" />
      ))}
    </View>

    <TextInput
      style={styles.bodyInput}
      placeholder="Draft your political analysis here..."
      placeholderTextColor="lightgray"
      multiline
      textAlignVertical="top"
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  publishBtn: { backgroundColor: Colors.PrimaryRed, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  tabsRow: { flexDirection: 'row', backgroundColor: 'white' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabActive: { borderBottomColor: Colors.PrimaryRed, borderBottomWidth: 2 },
  uploadZone: { width: '100%', height: 200, backgroundColor: Colors.PrimaryRedAlpha5, borderRadius: 20, borderWidth: 2, borderColor: Colors.PrimaryRedAlpha10, justifyContent: 'center', alignItems: 'center' },
  uploadCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', elevation: 2, justifyContent: 'center', alignItems: 'center' },
  input: { width: '100%', height: 56, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  heroUpload: { width: '100%', height: 180, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  titleInput: { width: '100%', backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', padding: 16, fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  toolbar: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 10, gap: 20, marginBottom: 16 },
  bodyInput: { width: '100%', height: 350, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', padding: 16, fontSize: 16 }
});
