import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useNotifications, NotificationItem } from '../../context/NotificationContext';

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const { notifications, isLoading } = useNotifications();
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedMenu, setExpandedMenu] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  // Fallback to local data matching Kotlin
  const displayNotifications = notifications.length > 0 ? notifications : [
    { id: "1", title: "News Tamil Reports posted a new update", subtitle: "CM MK Stalin announces Rs. 1000 crore relief package...", time: "1h ago", imageUrl: "https://images.unsplash.com/photo-1533727101791-0309197c11f7?", targetId: "p1", isRead: false },
    { id: "2", title: "Times Now uploaded a new video", subtitle: "Exclusive Interview with EAM S. Jaishankar", time: "3h ago", imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?", targetId: "p2", isRead: false },
  ] as NotificationItem[];

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isSelectionMode ? (
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedIds([]); }} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedIds.length} Selected</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {
              if (selectedIds.length === displayNotifications.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(displayNotifications.map(n => n.id));
              }
            }}>
              <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold' }}>
                {selectedIds.length === displayNotifications.length && displayNotifications.length > 0 ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 8, marginLeft: 8 }} onPress={() => { setIsSelectionMode(false); setSelectedIds([]); }}>
              <Ionicons name="trash-outline" size={24} color={Colors.PrimaryRed} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => setExpandedMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}

      {expandedMenu && (
        <Modal transparent animationType="fade" visible={expandedMenu} onRequestClose={() => setExpandedMenu(false)}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setExpandedMenu(false)}>
            <View style={styles.menuDropdown}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSelectionMode(true); setExpandedMenu(false); }}>
                <Text>Select to Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => setExpandedMenu(false)}>
                <Text>Mark all as read</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsNotificationsEnabled(!isNotificationsEnabled); setExpandedMenu(false); }}>
                <Text style={{ color: isNotificationsEnabled ? Colors.PrimaryRed : 'black' }}>
                  {isNotificationsEnabled ? "Turn Notifications OFF" : "Turn Notifications ON"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {!isNotificationsEnabled ? (
        <View style={styles.center}><Text style={{ color: Colors.Slate500 }}>Notifications are paused.</Text></View>
      ) : displayNotifications.length === 0 && !isLoading ? (
        <View style={styles.center}><Text style={{ color: Colors.Slate500 }}>You're all caught up!</Text></View>
      ) : (
        <FlatList
          data={displayNotifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.id);
            const isRead = item.isRead;
            
            return (
              <TouchableOpacity 
                style={[
                  styles.card, 
                  isSelected ? { backgroundColor: Colors.PrimaryRedAlpha10, borderColor: Colors.PrimaryRed, borderWidth: 1 } : 
                  !isRead ? { backgroundColor: '#FFF1F2', borderColor: Colors.PrimaryRedAlpha10, borderWidth: 1 } : null
                ]}
                onPress={() => {
                  if (isSelectionMode) toggleSelection(item.id);
                  else navigation.navigate('ArticleDetail', { id: item.targetId });
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                  {isSelectionMode && (
                    <View style={[styles.checkbox, isSelected && { backgroundColor: Colors.PrimaryRed, borderColor: Colors.PrimaryRed }]} />
                  )}
                  <Image source={{ uri: item.imageUrl }} style={[styles.avatar, !isRead && { borderColor: Colors.PrimaryRed, borderWidth: 2 }]} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                       <Text style={{ fontWeight: 'bold', fontSize: 14, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                       <Text style={{ fontSize: 10, color: !isRead ? Colors.PrimaryRed : Colors.Slate500, fontWeight: !isRead ? 'bold' : 'normal', marginLeft: 8 }}>{item.time}</Text>
                     </View>
                     <Text style={{ fontSize: 14, color: Colors.Slate500, marginTop: 4 }} numberOfLines={2}>{item.subtitle}</Text>
                  </View>
                  {!isRead && !isSelectionMode && <View style={styles.unreadDot} />}
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 16, borderColor: '#E2E8F0', borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.Slate400, marginRight: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.PrimaryRed, marginLeft: 12 },
  menuDropdown: { position: 'absolute', top: 60, right: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', width: 200, elevation: 4 },
  menuItem: { padding: 16 }
});
