import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onExit: () => void;
}

export default function StudioBottomNavBar({ currentRoute, onNavigate, onExit }: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const items = [
    { label: 'Dashboard', route: 'CreatorDashboard', icon: 'stats-chart' },
    { label: 'Analytics', route: 'CreatorAnalytics', icon: 'trending-up' },
    { label: 'Drafts', route: 'ContentEditor', icon: 'create' },
    { label: 'Exit', route: 'Exit', icon: 'log-out' }
  ];

  return (
    <>
      {showExitDialog && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.dialogContainer}>
              <Text style={styles.dialogTitle}>Exit Studio?</Text>
              <Text style={styles.dialogMessage}>Are you sure you want to exit the Analyst Studio and return to the main feed?</Text>
              
              <View style={styles.dialogActions}>
                <TouchableOpacity onPress={() => setShowExitDialog(false)} style={styles.actionButton}>
                  <Text style={{ color: 'gray', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowExitDialog(false); onExit(); }} style={styles.actionButton}>
                  <Text style={{ color: colors.PrimaryRed, fontWeight: 'bold' }}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.container}>
        {items.map((item) => {
          const isSelected = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                isSelected ? styles.selectedNavItemBg : null
              ]}
              onPress={() => {
                if (item.route === 'Exit') {
                  setShowExitDialog(true);
                } else if (currentRoute !== item.route) {
                  onNavigate(item.route);
                }
              }}
            >
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={isSelected ? colors.PrimaryRed : colors.Slate500} 
              />
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? colors.PrimaryRed : colors.SlateText, opacity: isSelected ? 1 : 0.4 }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20, 
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  selectedNavItemBg: {
    backgroundColor: 'rgba(191, 58, 43, 0.10)', // PrimaryRed with 10% opacity indicator
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  }
});
