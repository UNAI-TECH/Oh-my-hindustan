import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function MainHeader() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session?.user?.id) {
          const { data } = await supabase.from('User').select('profileImage').eq('id', session.user.id).single();
          if (data?.profileImage) setProfilePic(data.profileImage);
       }
    };
    fetchUser();
  }, []);

  return (
    <View style={[styles.header, { backgroundColor: colors.SurfaceWhite, borderBottomColor: colors.Slate200 }]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.headerTitle, { color: colors.PrimaryRed }]}>{t('common.brand_name')}</Text>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.iconBtn}>
          <Ionicons name="search-outline" size={24} color={colors.DarkText} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.DarkText} />
          <View style={[styles.notificationBadge, { backgroundColor: colors.PrimaryRed }]} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.profileBtn}>
          {profilePic ? (
             <Image source={{ uri: profilePic }} style={styles.profileAvatar} />
          ) : (
             <View style={[styles.profileAvatar, { backgroundColor: colors.Slate200, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={16} color={colors.Slate500} />
             </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  }
});
