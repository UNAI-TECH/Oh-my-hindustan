import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import CustomModal from '../../components/CustomModal';

export default function NotificationScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { 
    notifications, isLoading, 
    markAsRead, markAllAsRead, deleteNotifications, 
    notificationsEnabled, setNotificationsEnabled,
    fetchNotifications 
  } = useNotifications();
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedMenu, setExpandedMenu] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; message: string; isError: boolean; primaryButtonText?: string; onPrimaryPress?: () => void; secondaryButtonText?: string; onSecondaryPress?: () => void }>({ visible: false, title: '', message: '', isError: false });

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setModalConfig({
      visible: true,
      title: 'Delete Notifications',
      message: `Delete ${selectedIds.length} notification(s)?`,
      isError: true,
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel',
      onSecondaryPress: () => setModalConfig(prev => ({ ...prev, visible: false })),
      onPrimaryPress: async () => {
        await deleteNotifications(selectedIds);
        setSelectedIds([]);
        setIsSelectionMode(false);
        setModalConfig(prev => ({ ...prev, visible: false }));
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    setExpandedMenu(false);
    await markAllAsRead();
  };

  const handleNotificationPress = async (item: any) => {
    if (isSelectionMode) {
      toggleSelection(item.id);
    } else {
      // Mark as read and navigate to the post
      if (!item.isRead) {
        markAsRead(item.id);
      }
      if (item.targetId) {
        if (item.type === 'STORY') {
          navigation.navigate('StoryFeed');
        } else {
          navigation.navigate('ArticleDetail', { id: item.targetId });
        }
      }
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    setExpandedMenu(false);
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
              if (selectedIds.length === notifications.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(notifications.map(n => n.id));
              }
            }}>
              <Text style={{ color: colors.PrimaryRed, fontWeight: 'bold' }}>
                {selectedIds.length === notifications.length && notifications.length > 0 ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 8, marginLeft: 8 }} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color={colors.PrimaryRed} />
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
              <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllAsRead}>
                <Text>Mark all as read</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />
              <TouchableOpacity style={styles.menuItem} onPress={handleToggleNotifications}>
                <Text style={{ color: notificationsEnabled ? colors.PrimaryRed : '#10B981' }}>
                  {notificationsEnabled ? "Turn Notifications OFF" : "Turn Notifications ON"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {!notificationsEnabled ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.Slate400} style={{ opacity: 0.4, marginBottom: 12 }} />
          <Text style={{ color: colors.Slate500, fontSize: 16, fontWeight: '600' }}>Notifications are paused</Text>
          <Text style={{ color: colors.Slate400, fontSize: 13, marginTop: 4 }}>Turn them back on from the menu</Text>
        </View>
      ) : notifications.length === 0 && !isLoading ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={48} color={colors.Slate400} style={{ opacity: 0.4, marginBottom: 12 }} />
          <Text style={{ color: colors.Slate500, fontSize: 16, fontWeight: '600' }}>You're all caught up!</Text>
          <Text style={{ color: colors.Slate400, fontSize: 13, marginTop: 4 }}>No new notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onRefresh={fetchNotifications}
          refreshing={isLoading}
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.id);
            const isRead = item.isRead;
            
            return (
              <TouchableOpacity 
                style={[
                  styles.card, 
                  isSelected ? { backgroundColor: colors.PrimaryRedAlpha10, borderColor: colors.PrimaryRed, borderWidth: 1 } : 
                  !isRead ? { backgroundColor: '#FFF1F2', borderColor: colors.PrimaryRedAlpha10, borderWidth: 1 } : null
                ]}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => {
                  if (!isSelectionMode) {
                    setIsSelectionMode(true);
                    setSelectedIds([item.id]);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                  {isSelectionMode && (
                    <View style={[styles.checkbox, isSelected && { backgroundColor: colors.PrimaryRed, borderColor: colors.PrimaryRed }]} />
                  )}
                  <Image source={{ uri: item.imageUrl }} style={[styles.avatar, !isRead && { borderColor: colors.PrimaryRed, borderWidth: 2 }]} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                       <Text style={{ fontWeight: 'bold', fontSize: 14, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                       <Text style={{ fontSize: 10, color: !isRead ? colors.PrimaryRed : colors.Slate500, fontWeight: !isRead ? 'bold' : 'normal', marginLeft: 8 }}>{item.time}</Text>
                     </View>
                     <Text style={{ fontSize: 14, color: colors.Slate500, marginTop: 4 }} numberOfLines={2}>{item.subtitle}</Text>
                  </View>
                  {!isRead && !isSelectionMode && <View style={styles.unreadDot} />}
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}

      <CustomModal 
        visible={modalConfig.visible} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        isError={modalConfig.isError} 
        primaryButtonText={modalConfig.primaryButtonText || 'OK'}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onPrimaryPress={modalConfig.onPrimaryPress || (() => setModalConfig(prev => ({ ...prev, visible: false })))} 
        onSecondaryPress={modalConfig.onSecondaryPress}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 16, borderColor: '#E2E8F0', borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.Slate400, marginRight: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.PrimaryRed, marginLeft: 12 },
  menuDropdown: { position: 'absolute', top: 60, right: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', width: 200, elevation: 4 },
  menuItem: { padding: 16 }
});
